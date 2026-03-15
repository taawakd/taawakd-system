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

const ALLOWED_ORIGINS = [
  'https://towkd.com',
  'https://www.towkd.com',
  'https://app.towkd.com',
  'https://admin.towkd.com',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  // فحص حد الاستخدام بناءً على الخطة
  const { data: profile } = await supabase
    .from('profiles').select('analyses_used, analyses_limit, plan, analyses_reset_at').eq('id', user.id).single();

  const plan = profile?.plan || 'free';
  const isCFOReq = req.body?._type === 'cfo';

  // حدود التحليلات لكل خطة — يجب أن تتطابق مع قيم لوحة الادارة
  const PLAN_LIMITS = { free: 2, pro: 8, enterprise: 30 };
  const planLimit   = PLAN_LIMITS[plan] ?? 2;

  // إعادة تعيين عداد الخطط المدفوعة شهرياً (pro و enterprise)
  if ((plan === 'pro' || plan === 'enterprise') && !isCFOReq) {
    const resetAt = profile?.analyses_reset_at ? new Date(profile.analyses_reset_at) : null;
    const now     = new Date();
    if (!resetAt || (now - resetAt) >= 30 * 24 * 60 * 60 * 1000) {
      await supabase.from('profiles')
        .update({ analyses_used: 0, analyses_reset_at: now.toISOString() })
        .eq('id', user.id);
      profile.analyses_used = 0;
    }
  }

  // فحص الحد لجميع الخطط (بما فيها enterprise) ما عدا طلبات CFO
  if (!isCFOReq && (profile?.analyses_used || 0) >= planLimit) {
    const planLabels = { free: 'المجانية', pro: 'الاحترافية', enterprise: 'المؤسسية' };
    const planLabel  = planLabels[plan] || plan;
    const msg = plan === 'free'
      ? `وصلت لحد ${planLimit} تحليلات في الخطة ${planLabel} — قم بالترقية للاستمرار`
      : `وصلت لحد ${planLimit} تحليل شهري في الخطة ${planLabel} — يُعاد التعيين كل 30 يوماً`;
    return res.status(403).json({
      error: msg,
      limit_reached: true,
      used: profile?.analyses_used || 0,
      limit: planLimit,
      plan,
    });
  }

  // فحص حد أسئلة CFO للخطة المجانية (يُتحقق منه في الـ frontend أيضاً)
  if (isCFOReq && plan === 'free') {
    const cfoUsed = profile?.cfo_questions_used || 0;
    if (cfoUsed >= 3) {
      return res.status(403).json({
        error: 'وصلت لحد 3 أسئلة لـ AI CFO في الخطة المجانية — قم بالترقية للحصول على وصول كامل',
        limit_reached: true,
        cfo_limit: true,
        used: cfoUsed,
        limit: 3,
      });
    }
    // زيادة عداد CFO
    await supabase.from('profiles')
      .update({ cfo_questions_used: cfoUsed + 1 })
      .eq('id', user.id);
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
        }

        // زيادة عداد التحليلات حتى عند cache hit (فقط non-CFO)
        const isCFO_cache = body._type === 'cfo';
        if (!isCFO_cache) {
          await supabase.from('profiles')
            .update({ analyses_used: (profile?.analyses_used || 0) + 1 }).eq('id', user.id);
        }

        return res.status(200).json({
          content: [{ type: 'text', text: cached.result_text }],
          from_cache: true,
          analyses_used: (profile?.analyses_used || 0) + 1,
          analyses_limit: planLimit
        });
      }
    }

    // بناء messages لـ OpenAI
    // Supports two approaches:
    //   (a) body.system (legacy) → prepended as { role:'system' }
    //   (b) body.messages[0].role === 'system' (CFO / new style) → used as-is
    const isCFO = body._type === 'cfo';
    const messages = [];
    if (body.system) {
      // legacy: system passed as separate top-level field
      messages.push({ role: 'system', content: body.system });
    }
    if (body.messages && Array.isArray(body.messages)) {
      messages.push(...body.messages);
    }

    // CFO calls: concise answers, same limit as regular analysis
    const maxTokens = isCFO ? 600 : 600;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: maxTokens,
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
    }

    // زيادة عداد التحليلات (فقط للتحليلات العادية — ليس CFO)
    if (!isCFO) {
      await supabase.from('profiles')
        .update({ analyses_used: (profile?.analyses_used || 0) + 1 }).eq('id', user.id);
    }

    // الرد بنفس شكل Anthropic للتوافق مع الـ frontend
    return res.status(200).json({
      content: [{ type: 'text', text: resultText }],
      from_cache: false,
      analyses_used: (profile?.analyses_used || 0) + 1,
      analyses_limit: planLimit
    });

  } catch (e) {
    console.error('analyze error:', e);
    return res.status(500).json({ error: e.message || 'خطأ داخلي' });
  }
}
