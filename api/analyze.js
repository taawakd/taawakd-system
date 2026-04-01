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

// ── ثوابت الخطط (مصدر الحقيقة الوحيد على الـ backend) ──────────────────────
const TRIAL_DAYS               = 7;   // أيام التجربة المجانية
const TRIAL_ANALYSES_PER_DAY   = 1;   // تحليل / يوم خلال التجربة
const TRIAL_CFO_PER_DAY        = 3;   // رسائل CFO / يوم خلال فترة التجربة
const PAID_ANALYSES_PER_MONTH  = 8;   // تحليل / شهر للمشتركين
const PAID_CFO_PER_DAY         = 5;   // رسائل CFO / يوم للمشتركين
const ONE_TIME_PRICE_PAID      = 19;  // ريال — تحليل إضافي للمشترك
const ONE_TIME_PRICE_FREE      = 29;  // ريال — تحليل واحد لغير المشترك
const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const MS_1_DAY   =      24 * 60 * 60 * 1000;

function normalizePlan(rawPlan) {
  if (rawPlan === 'paid' || rawPlan === 'pro' || rawPlan === 'enterprise') return 'paid';
  return 'free';
}

function checkTrialActive(trialStartedAt) {
  if (!trialStartedAt) return false;
  const elapsedDays = (Date.now() - new Date(trialStartedAt).getTime()) / (1000 * 60 * 60 * 24);
  return elapsedDays <= TRIAL_DAYS;
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

  // ── قراءة الخطة والعدّادات من قاعدة البيانات ──────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('analyses_used, plan, analyses_reset_at, cfo_daily_used, cfo_daily_reset_at, trial_started_at, trial_daily_used, trial_daily_reset_at, is_admin')
    .eq('id', user.id).single();

  const isAdmin     = !!profile?.is_admin;  // مشرف النظام — يتجاوز جميع الفحوصات
  const plan        = normalizePlan(profile?.plan || 'free');
  const isPaid      = plan === 'paid';
  const isCFOReq    = req.body?._type === 'cfo';

  // ── إدارة التجربة المجانية ─────────────────────────────────────────────────
  let trialStartedAt = profile?.trial_started_at || null;
  let isTrialActive  = checkTrialActive(trialStartedAt);

  // إذا لم تبدأ التجربة بعد → ابدأها الآن (أول تفاعل مع API)
  if (!isPaid && !trialStartedAt) {
    const now = new Date().toISOString();
    await supabase.from('profiles')
      .update({ trial_started_at: now })
      .eq('id', user.id);
    trialStartedAt = now;
    isTrialActive  = true;
  }

  // ── حماية عامة: منع الوصول إذا لم يكن مشتركاً ولا في تجربة نشطة ──────────
  if (!isAdmin && !isPaid && !isTrialActive) {
    return res.status(403).json({
      error: 'انتهت فترة التجربة المجانية — اشترك في الخطة المدفوعة للمتابعة',
      trial_expired: true,
      plan: profile?.plan || 'free',
      trial_started_at: trialStartedAt,
      one_time_price: ONE_TIME_PRICE_FREE,  // 29 ريال لغير المشترك
    });
  }

  // ── حد التحليلات اليومي لمستخدمي التجربة (1 تحليل / يوم) ────────────────
  if (!isAdmin && !isPaid && isTrialActive && !isCFOReq) {
    const trialDailyResetAt = profile?.trial_daily_reset_at
      ? new Date(profile.trial_daily_reset_at) : null;
    const now = new Date();
    let trialDailyUsed = profile?.trial_daily_used || 0;

    // إعادة تعيين العداد إذا مضى أكثر من 24 ساعة
    if (!trialDailyResetAt || (now - trialDailyResetAt) >= MS_1_DAY) {
      await supabase.from('profiles')
        .update({ trial_daily_used: 0, trial_daily_reset_at: now.toISOString() })
        .eq('id', user.id);
      trialDailyUsed = 0;
    }

    if (trialDailyUsed >= TRIAL_ANALYSES_PER_DAY) {
      return res.status(403).json({
        error: `وصلت لحد ${TRIAL_ANALYSES_PER_DAY} تحليل يومي خلال فترة التجربة — يتجدد الغد`,
        trial_daily_limit: true,
        used: trialDailyUsed,
        limit: TRIAL_ANALYSES_PER_DAY,
        plan: profile?.plan || 'free',
      });
    }

    // زيادة عداد التحليلات اليومي للتجربة
    await supabase.from('profiles')
      .update({ trial_daily_used: trialDailyUsed + 1 })
      .eq('id', user.id);
  }

  // ── حد التحليلات الإجمالي للخطة المجانية (1 تحليل فقط) ─────────────────
  // يُطبَّق على مستخدمي التجربة والخطة المجانية — يمنع أي تحليل ثانٍ
  if (!isAdmin && !isPaid && !isCFOReq && (profile?.analyses_used || 0) >= 1) {
    return res.status(403).json({
      error: 'limit_reached',
      limit_reached: true,
      free_limit: true,
      used: profile?.analyses_used || 0,
      limit: 1,
      plan: profile?.plan || 'free',
      trial_started_at: trialStartedAt,
      one_time_price: ONE_TIME_PRICE_FREE,
    });
  }

  // ── إعادة تعيين عداد التحليلات الشهري (مشتركون فقط) ─────────────────────
  if (!isAdmin && isPaid && !isCFOReq) {
    const resetAt = profile?.analyses_reset_at ? new Date(profile.analyses_reset_at) : null;
    const now     = new Date();
    if (!resetAt || (now - resetAt) >= MS_30_DAYS) {
      await supabase.from('profiles')
        .update({ analyses_used: 0, analyses_reset_at: now.toISOString() })
        .eq('id', user.id);
      profile.analyses_used = 0;
    }
  }

  // ── فحص حد التحليلات الشهري (مشتركون فقط — 8/شهر) ──────────────────────
  // مستخدمو التجربة والأدمن لا يخضعون لحد شهري
  if (!isAdmin && !isCFOReq && isPaid && (profile?.analyses_used || 0) >= PAID_ANALYSES_PER_MONTH) {
    return res.status(403).json({
      error: `وصلت لحد ${PAID_ANALYSES_PER_MONTH} تحليلات هذا الشهر — يتجدد في بداية دورة اشتراكك أو أضف تحليلاً إضافياً بـ ${ONE_TIME_PRICE_PAID} ريال`,
      limit_reached: true,
      used: profile?.analyses_used || 0,
      limit: PAID_ANALYSES_PER_MONTH,
      plan: profile?.plan || 'free',
      one_time_price: ONE_TIME_PRICE_PAID,  // 19 ريال للمشترك
    });
  }

  // ── منطق AI CFO ──────────────────────────────────────────────────────────
  if (isCFOReq && !isAdmin) {
    // مشتركون: 5 رسائل / يوم | تجربة مجانية: 3 رسائل / يوم | أدمن: بلا حدود
    const cfoDayLimit = isPaid ? PAID_CFO_PER_DAY : TRIAL_CFO_PER_DAY;

    // إعادة تعيين عداد CFO اليومي إذا مضى أكثر من 24 ساعة
    const cfoResetAt = profile?.cfo_daily_reset_at ? new Date(profile.cfo_daily_reset_at) : null;
    const now        = new Date();
    let cfoUsedToday = profile?.cfo_daily_used || 0;

    if (!cfoResetAt || (now - cfoResetAt) >= MS_1_DAY) {
      await supabase.from('profiles')
        .update({ cfo_daily_used: 0, cfo_daily_reset_at: now.toISOString() })
        .eq('id', user.id);
      cfoUsedToday = 0;
    }

    if (cfoUsedToday >= cfoDayLimit) {
      return res.status(403).json({
        error: `وصلت لحد ${cfoDayLimit} رسائل AI CFO اليوم — يتجدد الغد`,
        limit_reached: true,
        cfo_limit: true,
        used: cfoUsedToday,
        limit: cfoDayLimit,
        plan: profile?.plan || 'free',
      });
    }

    // زيادة عداد CFO اليومي (مشتركون + تجربة مجانية)
    await supabase.from('profiles')
      .update({ cfo_daily_used: cfoUsedToday + 1 })
      .eq('id', user.id);
  }

  // حد التحليلات للعرض في الـ frontend (مشتركون فقط)
  const planLimit = isPaid ? PAID_ANALYSES_PER_MONTH : Infinity;

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
          plan: profile?.plan || 'free',
          trial_started_at: trialStartedAt,
          analyses_used: (profile?.analyses_used || 0) + 1,
          analyses_limit: planLimit,
        });
      }
    }

    // بناء messages لـ Anthropic Claude
    // Supports two approaches:
    //   (a) body.system (legacy) → top-level system field
    //   (b) body.messages[0].role === 'system' (CFO / new style) → extracted to top-level system
    // Note: Anthropic requires system as top-level field, not inside messages array
    const isCFO = body._type === 'cfo';
    const rawMessages = [];
    if (body.system) {
      // legacy: system passed as separate top-level field
      rawMessages.push({ role: 'system', content: body.system });
    }
    if (body.messages && Array.isArray(body.messages)) {
      rawMessages.push(...body.messages);
    }

    // Anthropic: extract system messages → top-level system field
    const systemParts = rawMessages
      .filter(m => m.role === 'system')
      .map(m => (Array.isArray(m.content)
        ? m.content.map(c => c.text || c.content || '').join('\n')
        : String(m.content || '')));
    const systemContent = systemParts.join('\n\n');
    const messages = rawMessages.filter(m => m.role !== 'system');

    // Ensure at least one user message
    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'ابدأ التحليل' });
    }

    // فحص وجود مفتاح Anthropic قبل الاستدعاء
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY غير مضبوط في متغيرات البيئة — أضفه في Vercel Dashboard' });
    }

    // CFO calls: 4000 tokens — full analysis with tables + 3 detailed actions needs room
    const maxTokens = isCFO ? 4000 : 1024;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        ...(systemContent ? { system: systemContent } : {}),
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json().catch(() => ({}));
      const errMsg = err.error?.message || JSON.stringify(err) || 'خطأ في التحليل';
      console.error('Anthropic API error:', claudeRes.status, errMsg);
      // أرجع status 502 دائماً حتى لا يتشابك مع auth errors الخاصة بالتطبيق
      return res.status(502).json({ error: `Anthropic ${claudeRes.status}: ${errMsg}` });
    }

    const data = await claudeRes.json();
    const resultText = data.content?.[0]?.text || '';

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
      plan: profile?.plan || 'free',
      trial_started_at: trialStartedAt,
      analyses_used: (profile?.analyses_used || 0) + 1,
      analyses_limit: planLimit,
    });

  } catch (e) {
    console.error('analyze error:', e);
    return res.status(500).json({ error: e.message || 'خطأ داخلي' });
  }
}
