// api/analyze.js — نسخة ChatGPT + Supabase

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user)
    return res.status(401).json({ error: 'جلسة منتهية، سجّل دخولك مجدداً' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('analyses_used, analyses_limit, plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan === 'free' && profile?.analyses_used >= profile?.analyses_limit) {
    return res.status(403).json({ error: 'وصلت للحد المجاني', limit_reached: true });
  }

  try {

    const body = req.body;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },

      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini',
        messages: body.messages,
        max_tokens: body.max_tokens || 1000,
        temperature: 0.3
      })

    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      return res.status(openaiRes.status).json({
        error: err.error?.message || 'خطأ في التحليل'
      });
    }

    const data = await openaiRes.json();

    const result = data.choices?.[0]?.message?.content || 'لم يتم إرجاع تحليل';

    if (body.report_data) {

      const r = body.report_data;

      await supabase.from('reports').insert({
        user_id: user.id,
        biz_name: r.bizName,
        biz_type: r.bizType,
        period: r.period,
        revenue: r.revenue,
        total_expenses: r.totalExpenses,
        net_profit: r.netProfit,
        net_margin: r.netMargin,
        health_score: r.healthScore,
        report_json: r
      });

      await supabase
        .from('profiles')
        .update({ analyses_used: (profile?.analyses_used || 0) + 1 })
        .eq('id', user.id);

    }

    return res.status(200).json({ result });

  } catch (err) {

    return res.status(500).json({ error: 'خطأ في الخادم' });

  }
}
