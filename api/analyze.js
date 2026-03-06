// api/analyze.js — مع نظام Cache ذكي
// ─────────────────────────────────────────────
// ✅ Cache: نفس الأرقام → نتيجة فورية بدون استدعاء Claude
// ✅ Auth: يتحقق من هوية المستخدم
// ✅ Limit: يراقب حد الاستخدام المجاني
// ✅ Save: يحفظ التقرير في قاعدة البيانات
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── توليد Cache Key من أرقام التحليل ──
function buildCacheKey(body) {
  // نأخذ فقط الأرقام الأساسية + نوع النشاط
  // اسم المشروع والملاحظات لا تدخل في الـ hash
  const r = body.report_data;
  if (!r) return null;

  const keyData = {
    type:     r.bizType     || '',
    rev:      Math.round((r.revenue        || 0) / 100) * 100,  // نقرّب لأقرب 100
    cogs:     Math.round((r.cogs           || 0) / 100) * 100,
    rent:     Math.round((r.rent           || 0) / 100) * 100,
    salaries: Math.round((r.salaries       || 0) / 100) * 100,
    mkt:      Math.round((r.marketing      || 0) / 100) * 100,
    other:    Math.round((r.other          || 0) / 100) * 100,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(keyData))
    .digest('hex')
    .substring(0, 16); // 16 حرف يكفي
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── تحقق من التوكن ──
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'جلسة منتهية، سجّل دخولك مجدداً' });

  // ── فحص حد الاستخدام ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('analyses_used, analyses_limit, plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan === 'free' && profile?.analyses_used >= profile?.analyses_limit) {
    return res.status(403).json({
      error: 'وصلت للحد المجاني — 3 تحليلات شهرياً',
      limit_reached: true,
      used: profile.analyses_used,
      limit: profile.analyses_limit
    });
  }

  try {
    const body = req.body;

    // ── بحث في الـ Cache ──
    const cacheKey = buildCacheKey(body);
    let cachedResult = null;

    if (cacheKey) {
      const { data: cached } = await supabase
        .from('analysis_cache')
        .select('result_text, hit_count')
        .eq('cache_key', cacheKey)
        .single();

      if (cached) {
        // ✅ Cache Hit — نتيجة فورية
        console.log(`Cache HIT: ${cacheKey} (استُخدم ${cached.hit_count + 1} مرة)`);

        // تحديث عداد الاستخدام في الـ background
        supabase
          .from('analysis_cache')
          .update({ hit_count: cached.hit_count + 1, last_used_at: new Date().toISOString() })
          .eq('cache_key', cacheKey)
          .then(() => {});

        // حفظ التقرير في قاعدة البيانات مع علامة cache
        if (body.report_data) {
          const r = body.report_data;
          await supabase.from('reports').insert({
            user_id:        user.id,
            biz_name:       r.bizName,
            biz_type:       r.bizType,
            period:         r.period,
            revenue:        r.revenue,
            total_expenses: r.totalExpenses,
            net_profit:     r.netProfit,
            net_margin:     r.netMargin,
            health_score:   r.healthScore,
            report_json:    r
          });

          await supabase
            .from('profiles')
            .update({ analyses_used: (profile?.analyses_used || 0) + 1 })
            .eq('id', user.id);
        }

        // إرجاع النتيجة المخزنة بنفس شكل Claude API
        return res.status(200).json({
          content: [{ type: 'text', text: cached.result_text }],
          from_cache: true  // علامة للـ Frontend يعرف منها أنها من الـ Cache
        });
      }
    }

    // ── Cache Miss — استدعاء Claude ──
    console.log(`Cache MISS: ${cacheKey} — استدعاء Claude`);

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      body.model      || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        system:     body.system     || '',
        messages:   body.messages
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      return res.status(claudeRes.status).json({ error: err.error?.message || 'خطأ في التحليل' });
    }

    const data = await claudeRes.json();
    const resultText = data.content?.map(i => i.text || '').join('') || '';

    // ── حفظ في Cache ──
    if (cacheKey && resultText) {
      await supabase.from('analysis_cache').upsert({
        cache_key:    cacheKey,
        biz_type:     body.report_data?.bizType || '',
        result_text:  resultText,
        hit_count:    1,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });
    }

    // ── حفظ التقرير في قاعدة البيانات ──
    if (body.report_data) {
      const r = body.report_data;
      await supabase.from('reports').insert({
        user_id:        user.id,
        biz_name:       r.bizName,
        biz_type:       r.bizType,
        period:         r.period,
        revenue:        r.revenue,
        total_expenses: r.totalExpenses,
        net_profit:     r.netProfit,
        net_margin:     r.netMargin,
        health_score:   r.healthScore,
        report_json:    r
      });

      await supabase
        .from('profiles')
        .update({ analyses_used: (profile?.analyses_used || 0) + 1 })
        .eq('id', user.id);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'خطأ في الخادم' });
  }
}
