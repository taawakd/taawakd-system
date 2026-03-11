// api/admin.js — Admin Dashboard API for Tawakkad
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. تحقق من التوكن ─────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'جلسة منتهية، سجّل دخولك مجدداً' });

  // ── 2. تحقق من صلاحية الأدمن ─────────────────────────────
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return res.status(403).json({ error: 'غير مسموح' });

  // ── 3. نفّذ العملية المطلوبة ──────────────────────────────
  const { action, payload = {} } = req.body || {};

  try {
    switch (action) {

      // ── Overview Stats ──────────────────────────────────────
      case 'getStats': {
        const [
          { count: totalUsers },
          { count: totalReports },
          { count: todayReports },
          { count: aiUsage }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]),
          supabase.from('reports').select('*', { count: 'exact', head: true })
            .eq('ai_used', true)
        ]);
        return res.json({ totalUsers, totalReports, todayReports, aiUsage });
      }

      // ── Users List ──────────────────────────────────────────
      case 'getUsers': {
        const { page = 1, search = '' } = payload;
        const limit = 20;
        const offset = (page - 1) * limit;

        // جلب المستخدمين من auth.users عبر Admin API
        const { data: authData, error: listErr } = await supabase.auth.admin.listUsers({
          page, perPage: limit
        });
        if (listErr) return res.status(500).json({ error: listErr.message });

        const authUsers = authData?.users || [];
        const ids = authUsers.map(u => u.id);

        // جلب profiles مع عدد التقارير
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, plan, analyses_used, analyses_limit, is_admin, is_suspended, created_at')
          .in('id', ids);

        // جلب عدد التقارير لكل مستخدم
        const { data: reportCounts } = await supabase
          .from('reports')
          .select('user_id')
          .in('user_id', ids);

        const countMap = {};
        (reportCounts || []).forEach(r => {
          countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
        });

        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        let users = authUsers.map(u => ({
          id: u.id,
          email: u.email,
          full_name: profileMap[u.id]?.full_name || '',
          plan: profileMap[u.id]?.plan || 'free',
          analyses_used: profileMap[u.id]?.analyses_used || 0,
          analyses_limit: profileMap[u.id]?.analyses_limit || 2,
          is_admin: profileMap[u.id]?.is_admin || false,
          is_suspended: profileMap[u.id]?.is_suspended || false,
          reports_count: countMap[u.id] || 0,
          created_at: u.created_at
        }));

        // فلتر بحث محلي
        if (search) {
          const q = search.toLowerCase();
          users = users.filter(u =>
            u.email?.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q)
          );
        }

        return res.json({ users, total: authData?.total || users.length, page });
      }

      // ── Suspend / Unsuspend User ────────────────────────────
      case 'suspendUser': {
        const { userId, suspend } = payload;
        if (!userId) return res.status(400).json({ error: 'userId مطلوب' });
        await supabase.from('profiles').update({ is_suspended: !!suspend }).eq('id', userId);
        return res.json({ ok: true });
      }

      // ── Assign Plan ─────────────────────────────────────────
      case 'assignPlan': {
        const { userId, planId } = payload;
        if (!userId || !planId) return res.status(400).json({ error: 'userId و planId مطلوبان' });

        const { data: plan } = await supabase.from('plans').select('analyses_limit').eq('id', planId).single();
        if (!plan) return res.status(404).json({ error: 'الخطة غير موجودة' });

        await supabase.from('profiles').update({
          plan: planId,
          analyses_limit: plan.analyses_limit,
          analyses_used: 0
        }).eq('id', userId);
        return res.json({ ok: true });
      }

      // ── Delete User ─────────────────────────────────────────
      case 'deleteUser': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId مطلوب' });
        // لا يُسمح بحذف الأدمن
        const { data: targetProfile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
        if (targetProfile?.is_admin) return res.status(403).json({ error: 'لا يمكن حذف حساب أدمن' });

        // حذف التقارير أولاً ثم Profile ثم auth.user
        await supabase.from('reports').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        return res.json({ ok: true });
      }

      // ── Reports List ────────────────────────────────────────
      case 'getReports': {
        const { page = 1, userId = null } = payload;
        const limit = 20;
        const offset = (page - 1) * limit;

        let query = supabase
          .from('reports')
          .select('id, user_id, title, biz_type, created_at, ai_used', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (userId) query = query.eq('user_id', userId);

        const { data: reports, count } = await query;

        // جلب إيميلات المستخدمين للتقارير
        const userIds = [...new Set((reports || []).map(r => r.user_id))];
        let emailMap = {};
        if (userIds.length) {
          const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          (authData?.users || []).forEach(u => { emailMap[u.id] = u.email; });
        }

        const enriched = (reports || []).map(r => ({
          ...r,
          user_email: emailMap[r.user_id] || r.user_id
        }));

        return res.json({ reports: enriched, total: count || 0, page });
      }

      // ── Get Single Report ───────────────────────────────────
      case 'getReport': {
        const { reportId } = payload;
        if (!reportId) return res.status(400).json({ error: 'reportId مطلوب' });
        const { data: report, error } = await supabase
          .from('reports').select('*').eq('id', reportId).single();
        if (error || !report) return res.status(404).json({ error: 'التقرير غير موجود' });
        return res.json({ report });
      }

      // ── Usage Stats ─────────────────────────────────────────
      case 'getUsage': {
        // آخر 30 يوم
        const since = new Date();
        since.setDate(since.getDate() - 29);
        const sinceStr = since.toISOString().split('T')[0];

        const { data: rows } = await supabase
          .from('reports')
          .select('created_at, ai_used')
          .gte('created_at', sinceStr)
          .order('created_at', { ascending: true });

        // تجميع يومي
        const dayMap = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          dayMap[d.toISOString().split('T')[0]] = { reports: 0, ai: 0 };
        }
        (rows || []).forEach(r => {
          const day = r.created_at.split('T')[0];
          if (dayMap[day]) {
            dayMap[day].reports++;
            if (r.ai_used) dayMap[day].ai++;
          }
        });

        const labels = Object.keys(dayMap);
        const reports = labels.map(d => dayMap[d].reports);
        const ai = labels.map(d => dayMap[d].ai);

        const { count: totalAI } = await supabase
          .from('reports').select('*', { count: 'exact', head: true }).eq('ai_used', true);
        const { count: totalReports } = await supabase
          .from('reports').select('*', { count: 'exact', head: true });

        return res.json({ labels, reports, ai, totalAI, totalReports });
      }

      // ── Plans ───────────────────────────────────────────────
      case 'getPlans': {
        const { data: plans } = await supabase
          .from('plans').select('*').order('price_monthly', { ascending: true });
        return res.json({ plans: plans || [] });
      }

      case 'savePlan': {
        const { id, name, name_ar, analyses_limit, price_monthly, is_active } = payload;
        if (!id || !name || !name_ar) return res.status(400).json({ error: 'الحقول المطلوبة ناقصة' });

        const planData = {
          id, name, name_ar,
          analyses_limit: parseInt(analyses_limit) || 2,
          price_monthly: parseFloat(price_monthly) || 0,
          is_active: !!is_active
        };

        const { error } = await supabase.from('plans').upsert(planData, { onConflict: 'id' });
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `إجراء غير معروف: ${action}` });
    }
  } catch (err) {
    console.error('[admin]', err);
    return res.status(500).json({ error: 'خطأ في الخادم: ' + err.message });
  }
}
