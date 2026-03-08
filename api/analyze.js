// api/analyze.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function buildCacheKey(body) {
  const r = body.report_data;
  if (!r) return null;
  const keyData = {
    type:     r.bizType     || '',
    rev:      Math.round((r.revenue     || 0) / 100) * 100,
    cogs:     Math.round((r.cogs        || 0) / 100) * 100,
    rent:     Math.round((r.rent        || 0) / 100) * 100,
    salaries: Math.round((r.salaries    || 0) / 100) * 100,
    mkt:      Math.round((r.marketing   || 0) / 100) * 100,
    other:    Math.round((r.other       || 0) / 100) * 100,
  };
  return crypto.createHash('sha256').update(JSON.stringify(keyData)).digest('hex').substring(0, 16);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // تحقق من التوكن
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'جلسة منتهية، سجّل دخولك مجدداً' });

  // فحص حد الاستخدام
  const { data: profile } = await supabase
    .from('profiles').select('analyses_used, analyses_limit, plan').eq('id', user.id).single();

  if (profile?.plan === 'free' && profile?.analyses_used >= profile?.analyses_limit) {
    return res.status(403).json({
      error: 'وصلت لحد 3 تحليلات شهرياً',
      limit_reached: true,
      used: profile.analyses_used,
      limit: profile.analyses_limit
    });
  }

  try {
    const body = req.body;

    // Cache
    const cacheKey = buildCacheKey(body);
    if (cacheKey) {
      const { data: cached } = await supabase
        .from('analysis_cache').select('result_text, hit_count').eq('cache_key', cacheKey).single();

      if (cached) {
        supabase.from('analysis_cache')
          .update({ hit_count: cached.hit_count + 1, last_used_at: new Date().toISOString() })
          .eq('cache_key', cacheKey).then(() => {});

        if (body.report_data) {
          const r = body.report_data;
          await supabase.from('reports').insert({
            user_id: user.id, biz_name: r.bizName, biz_type: r.bizType,
            period: r.period, revenue: r.revenue, total_expenses: r.totalExpenses,
            net_profit: r.netProfit, net_margin: r.netMargin,
            health_score: r.healthScore, report_json: r
          });
          await supabase.from('profiles')
            .update({ analyses_used: (profile?.analyses_used || 0) + 1 }).eq('id', user.id);
        }

        return res.status(200).json({
          content: [{ type: 'text', text: cached.result_text }],
          from_cache: true
        });
      }
    }

    // بناء messages لـ OpenAI — يدعم system كحقل منفصل أو ضمن messages
    const messages = [];
    if (body.system) {
      messages.push({ role: 'system', content: body.system });
    }
    if (body.messages && Array.isArray(body.messages)) {
      messages.push(...body.messages);
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 600,
        messages: messages,
      })
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      return res.status(openaiRes.status).json({ error: err.error?.message || 'خطأ في التحليل' });
    }

    const data = await openaiRes.json();
    const resultText = data.choices?.[0]?.message?.content || '';

    // حفظ في Cache
    if (cacheKey && resultText) {
      await supabase.from('analysis_cache').upsert({
        cache_key: cacheKey, biz_type: body.report_data?.bizType || '',
        result_text: resultText, hit_count: 1, last_used_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });
    }

    // حفظ التقرير
    if (body.report_data) {
      const r = body.report_data;
      await supabase.from('reports').insert({
        user_id: user.id, biz_name: r.bizName, biz_type: r.bizType,
        period: r.period, revenue: r.revenue, total_expenses: r.totalExpenses,
        net_profit: r.netProfit, net_margin: r.netMargin,
        health_score: r.healthScore, report_json: r
      });
      await supabase.from('profiles')
        .update({ analyses_used: (profile?.analyses_used || 0) + 1 }).eq('id', user.id);
    }

    // الرد بنفس شكل Anthropic للتوافق مع الـ frontend
    return res.status(200).json({
      content: [{ type: 'text', text: resultText }],
      from_cache: false
    });

  } catch (e) {
    console.error('analyze error:', e);
    return res.status(500).json({ error: e.message || 'خطأ داخلي' });
  }
}
