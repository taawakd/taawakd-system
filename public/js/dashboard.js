// dashboard.js — إدارة الجلسة، التنقل، تحميل البيانات

// Supabase config — injected by server or set here as fallback
window.__SUPABASE_URL__  = window.__SUPABASE_URL__  || '';
window.__SUPABASE_ANON__ = window.__SUPABASE_ANON__ || '';

// ── Auth Guard — يمنع الدخول بدون تسجيل ──
(async function() {
  // انتظر config.js يحمّل المتغيرات
  await new Promise(r => setTimeout(r, 300));

  const url  = window.__SUPABASE_URL__  || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url || !anon) return; // لو Supabase مش مهيّأ، اشتغل بدون auth

  const sb = window.supabase.createClient(url, anon);
  sb = sb; // expose for global use

  // استرداد الـ token عند تحميل الصفحة
  sb.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      window.__AUTH_TOKEN__ = session.access_token;
      window.__USER__ = session.user.id;
    }
  });
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    // مافي جلسة — حوّل لصفحة الدخول
    window.location.href = '/auth.html';
    return;
  }

  // ✅ جلسة موجودة — خزّن التوكن للاستخدام في API calls
  window.__AUTH_TOKEN__ = session.access_token;
  window.__USER__ = session.user;

  // تحديث التوكن تلقائياً عند انتهائه
  // تتبع المستخدم الحالي لكشف تبديل الحسابات
  const prevUserId = localStorage.getItem('tw_user_id');
  const currUserId = session.user.id;

  if (prevUserId && prevUserId !== currUserId) {
    // مستخدم مختلف — امسح بيانات المستخدم السابق
    const keysToKeep = ['tw_user_id'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => {
      if (!keysToKeep.includes(k)) localStorage.removeItem(k);
    });
  }
  // حفظ ID المستخدم الحالي
  localStorage.setItem('tw_user_id', currUserId);

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('tw_user_id');
      window.__USER__ = null;
      window.__AUTH_TOKEN__ = null;
      window.bpContext = '';
      window.CFO_HISTORY = [];
      window.location.href = '/auth.html';
    } else if (event === 'SIGNED_IN' && session) {
      const prev = localStorage.getItem('tw_user_id');
      if (prev && prev !== session.user.id) {
        // حساب مختلف — امسح البيانات القديمة
        Object.keys(localStorage).forEach(k => {
          if (k !== 'tw_user_id') localStorage.removeItem(k);
        });
      }
      localStorage.setItem('tw_user_id', session.user.id);
      window.__AUTH_TOKEN__ = session.access_token;
      // تصفير بيانات المستخدم السابق
      window.bpContext = '';
      window.CFO_HISTORY = [];
      // مسح التقارير المحفوظة من المستخدم السابق وإعادة جلبها من Supabase
      localStorage.removeItem('tw_reports');
      STATE.savedReports = [];
      loadReportsFromDB();
    }
  });

  // إظهار اسم المستخدم في الواجهة
  const name = session.user?.user_metadata?.full_name
    || session.user?.email?.split('@')[0]
    || 'مستخدم';
  const greetEl = document.getElementById('userName');
  if (greetEl) greetEl.textContent = name;
})();

// ── تسجيل الخروج ──
function signOut() {
  const url  = window.__SUPABASE_URL__  || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url) { window.location.href = '/auth.html'; return; }
  const sb = window.supabase.createClient(url, anon);
  sb.auth.signOut().then(() => window.location.href = '/auth.html');
}