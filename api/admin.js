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
        const today = new Date().toISOString().split('T')[0];
        const [
          { count: totalUsers },
          { count: totalReports },
          { count: todayReports },
          { count: activeUsers },
          { count: paidSubs }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', today),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('analyses_used', 0),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).not('plan', 'in', '("free")')
        ]);

        // مستخدمون جدد اليوم
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const todayUsers = (authData?.users || []).filter(u => (u.created_at || '').startsWith(today)).length;

        // الإيراد الشهري
        const { data: paidProfiles } = await supabase.from('profiles').select('plan').not('plan', 'in', '("free")');
        const { data: plans } = await supabase.from('plans').select('id, price_monthly');
        const planPriceMap = {};
        (plans || []).forEach(p => { planPriceMap[p.id] = p.price_monthly || 0; });
        const monthlyRevenue = (paidProfiles || []).reduce((s, p) => s + (planPriceMap[p.plan] || 0), 0);

        return res.json({ totalUsers, totalReports, todayReports, activeUsers, todayUsers, paidSubs, monthlyRevenue });
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
          .select('id, user_id, biz_name, biz_type, created_at, health_score', { count: 'exact' })
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
          .select('created_at')
          .gte('created_at', sinceStr)
          .order('created_at', { ascending: true });

        // تجميع يومي
        const dayMap = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          dayMap[d.toISOString().split('T')[0]] = { reports: 0 };
        }
        (rows || []).forEach(r => {
          const day = r.created_at.split('T')[0];
          if (dayMap[day]) dayMap[day].reports++;
        });

        const labels = Object.keys(dayMap);
        const reports = labels.map(d => dayMap[d].reports);

        const { count: totalReports } = await supabase
          .from('reports').select('*', { count: 'exact', head: true });

        return res.json({ labels, reports, totalReports });
      }

      // ── Plans ───────────────────────────────────────────────
      case 'getPlans': {
        const { data: plans } = await supabase
          .from('plans').select('*').order('price_monthly', { ascending: true });
        return res.json({ plans: plans || [] });
      }

      // ── User Profile ────────────────────────────────────────
      case 'getUserProfile': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId مطلوب' });

        const [{ data: profile }, { data: authUser }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.auth.admin.getUserById(userId)
        ]);

        const { data: reports, count: reportsCount } = await supabase
          .from('reports')
          .select('id, biz_name, biz_type, created_at, health_score', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        // جلب سعر الخطة الحالية
        const { data: planData } = await supabase.from('plans').select('name_ar, price_monthly').eq('id', profile?.plan || 'free').single();

        return res.json({
          profile: { ...profile, email: authUser?.user?.email, auth_created_at: authUser?.user?.created_at },
          plan: planData,
          reports: reports || [],
          reportsCount: reportsCount || 0
        });
      }

      // ── Logs ────────────────────────────────────────────────
      case 'getLogs': {
        const { type = 'all', page = 1 } = payload;
        const limit = 50;
        const offset = (page - 1) * limit;

        let query = supabase
          .from('admin_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (type !== 'all') query = query.eq('type', type);

        const { data: logs, count, error: logsErr } = await query;
        if (logsErr) return res.status(500).json({ error: logsErr.message });
        return res.json({ logs: logs || [], total: count || 0, page });
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

      // ── Dashboard Analytics ─────────────────────────────────
      case 'getDashboardData': {
        const today = new Date().toISOString().split('T')[0];
        const since30 = new Date();
        since30.setDate(since30.getDate() - 29);
        const since30Str = since30.toISOString().split('T')[0];

        // 1. Basic counts
        const [
          { count: totalUsers },
          { count: totalReports },
          { count: todayReports },
          { count: activeUsers },
          { count: paidSubs }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', today),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('analyses_used', 0),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).not('plan', 'in', '("free")')
        ]);

        // 2. Auth users
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const allUsers = authData?.users || [];
        const todayUsers = allUsers.filter(u => (u.created_at || '').startsWith(today)).length;

        // 3. Monthly revenue
        const { data: paidProfiles } = await supabase.from('profiles').select('plan').not('plan', 'in', '("free")');
        const { data: plans } = await supabase.from('plans').select('id, price_monthly');
        const planPriceMap = {};
        (plans || []).forEach(p => { planPriceMap[p.id] = p.price_monthly || 0; });
        const monthlyRevenue = (paidProfiles || []).reduce((s, p) => s + (planPriceMap[p.plan] || 0), 0);

        // 4. Plan distribution
        const { data: planProfiles } = await supabase.from('profiles').select('plan');
        const planDist = { free: 0, pro: 0, enterprise: 0 };
        (planProfiles || []).forEach(p => {
          if (p.plan === 'pro') planDist.pro++;
          else if (p.plan === 'enterprise') planDist.enterprise++;
          else planDist.free++;
        });

        // 5. Reports last 30 days — daily trend + heatmap
        const { data: recentReports } = await supabase
          .from('reports').select('created_at, biz_name')
          .gte('created_at', since30Str).order('created_at', { ascending: false });

        const dayMap = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(since30); d.setDate(since30.getDate() + i);
          dayMap[d.toISOString().split('T')[0]] = 0;
        }
        const heatmap = [0, 0, 0, 0, 0, 0, 0];
        (recentReports || []).forEach(r => {
          const ds = r.created_at.split('T')[0];
          if (dayMap[ds] !== undefined) dayMap[ds]++;
          heatmap[new Date(r.created_at).getDay()]++;
        });
        const dailyReports = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

        // 6. User growth — cumulative signups
        const userDayMap = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(since30); d.setDate(since30.getDate() + i);
          userDayMap[d.toISOString().split('T')[0]] = 0;
        }
        allUsers.forEach(u => {
          const ds = (u.created_at || '').split('T')[0];
          if (userDayMap[ds] !== undefined) userDayMap[ds]++;
        });
        const newIn30 = Object.values(userDayMap).reduce((s, c) => s + c, 0);
        let cumulative = (totalUsers || 0) - newIn30;
        const userGrowth = Object.entries(userDayMap).map(([date, count]) => {
          cumulative += count; return { date, count: cumulative };
        });

        // 7. Retention rate
        const { data: allUserReports } = await supabase.from('reports').select('user_id');
        const userReportMap = {};
        (allUserReports || []).forEach(r => { userReportMap[r.user_id] = (userReportMap[r.user_id] || 0) + 1; });
        const usersWithReports = Object.keys(userReportMap).length;
        const returningUsers = Object.values(userReportMap).filter(c => c >= 2).length;
        const retentionRate = usersWithReports > 0 ? Math.round(returningUsers / usersWithReports * 100) : 0;

        // 8. Activity feed
        const recentSignups = allUsers
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
          .map(u => ({ type: 'signup', label: u.email || 'مستخدم', time: u.created_at }));
        const recentReportAct = (recentReports || []).slice(0, 5)
          .map(r => ({ type: 'report', label: r.biz_name || 'مشروع بدون اسم', time: r.created_at }));
        const activity = [...recentSignups, ...recentReportAct]
          .sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // 9. Funnel
        const funnel = { signups: totalUsers || 0, active: activeUsers || 0, paid: paidSubs || 0 };

        // 10. Smart alerts
        const alerts = [];
        if (todayUsers >= 3) alerts.push({ icon: '🟢', text: `${todayUsers} مستخدم جديد اليوم` });
        if (todayReports === 0) alerts.push({ icon: '🟡', text: 'لا توجد تقارير اليوم' });
        else if (todayReports >= 5) alerts.push({ icon: '🔥', text: `نشاط مرتفع: ${todayReports} تقارير اليوم` });
        if (paidSubs > 0) alerts.push({ icon: '💰', text: `${paidSubs} اشتراك مدفوع نشط` });
        if (retentionRate >= 50) alerts.push({ icon: '🎯', text: `معدل احتفاظ ممتاز: ${retentionRate}%` });
        if (alerts.length === 0) alerts.push({ icon: '✅', text: 'المنصة تعمل بشكل طبيعي' });
        if (todayUsers === 0) alerts.push({ icon: '🔵', text: 'لا تسجيلات جديدة اليوم' });

        return res.json({
          stats: { totalUsers, totalReports, todayReports, activeUsers, todayUsers, paidSubs, monthlyRevenue },
          userGrowth, dailyReports, planDist, activity, retentionRate, heatmap, funnel, alerts
        });
      }

      default:
        return res.status(400).json({ error: `إجراء غير معروف: ${action}` });
    }
  } catch (err) {
    console.error('[admin]', err);
    return res.status(500).json({ error: 'خطأ في الخادم: ' + err.message });
  }
}
