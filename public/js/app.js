// js/app.js — نقطة التشغيل

// حقن HTML components عند تحميل الصفحة
async function initApp() {
  try {
    const [sidebarRes, pagesRes] = await Promise.all([
      fetch('/components/sidebar.html'),
      fetch('/components/pages.html')
    ]);
    const sidebarHTML = await sidebarRes.text();
    const pagesHTML = await pagesRes.text();

    const sidebarEl = document.getElementById('sidebar-container');
    const pagesEl = document.getElementById('pages-container');
    if (sidebarEl) sidebarEl.innerHTML = sidebarHTML;
    if (pagesEl) pagesEl.innerHTML = pagesHTML;

    // init inputs
    if (typeof initNumInputs === 'function') initNumInputs();
    if (typeof showPage === 'function') showPage('dashboard');
  } catch(e) {
    console.error('initApp error:', e);
  }
}

// State + Auth + Init
let bpContext = "";

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let STATE = {
  currentReport: null,
  savedReports: JSON.parse(localStorage.getItem('tw_reports') || '[]'),
  chartInstance: null,
  chartMode: '6m',
};

// ══════════════════════════════════════════
// BENCHMARKS DATA
// ══════════════════════════════════════════
const BENCHMARKS = {
  restaurant: {
    label: 'مطعم',
    netMargin:   { min: 10, max: 18, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 70, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 6,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 22, max: 35, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 28, max: 40, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  cafe: {
    label: 'مقهى / كافيه',
    netMargin:   { min: 18, max: 32, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 8,  max: 15, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 18, max: 28, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  juice_kiosk: {
    label: 'كيوسك عصائر',
    netMargin:   { min: 20, max: 35, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  bakery: {
    label: 'مخبز / حلويات',
    netMargin:   { min: 12, max: 22, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 72, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 20, max: 30, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  food_truck: {
    label: 'فود ترك',
    netMargin:   { min: 15, max: 25, label: 'هامش الربح الصافي' },
    grossMargin: { min: 60, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 5,  label: 'نسبة الإيجار / موقع', lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  retail: {
    label: 'متجر تجزئة',
    netMargin:   { min: 10, max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 50, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 20, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 50, max: 70, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 5,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  services: {
    label: 'خدمات',
    netMargin:   { min: 20, max: 40, label: 'هامش الربح الصافي' },
    grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 3,  max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 30, max: 50, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 20, max: 40, label: 'تكلفة الخدمة',        lowerIsBetter: true },
    mktPct:      { min: 5,  max: 12, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  barber: {
    label: 'حلاقة وتجميل',
    netMargin:   { min: 18, max: 30, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 10, max: 18, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 25, max: 40, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 15, max: 30, label: 'تكلفة اللوازم',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  ecom: {
    label: 'تجارة إلكترونية',
    netMargin:   { min: 8,  max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 55, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 3,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 45, max: 65, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 10, max: 20, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
};

// ══════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════
const parseNum = v => parseFloat(String(v||'').replace(/[,،\s]/g,'')) || 0;
const getN = id => parseNum(document.getElementById(id)?.value);
const fmt = n => {
  const a = Math.abs(n);
  if(a>=1e6) return (n/1e6).toFixed(1)+'م';
  if(a>=1e3) return (n/1e3).toFixed(1)+'ك';
  return Math.round(n).toLocaleString('ar-SA');
};
const pct = (a,b) => b>0 ? ((a/b)*100).toFixed(1) : 0;
const delay = ms => new Promise(r=>setTimeout(r,ms));

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}

function showMsg(id, msg, type='error') {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = `msg ${type}`; el.style.display = 'block';
  setTimeout(()=>el.style.display='none', 4000);
}

// ── numeric inputs ──
document.addEventListener('DOMContentLoaded', () => {
  initNumInputs();
  initChart();
  renderBenchmarkPage();
  updateDashboard();
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('ar-SA', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
});

function initNumInputs() {
  document.querySelectorAll('.num-input').forEach(el => {
    el.addEventListener('input', function() {
      const raw = this.value.replace(/[^0-9]/g,'');
      if(!raw){this.value='';return;}
      const cursor = this.selectionStart;
      this.value = parseInt(raw,10).toLocaleString('en');
    });
  });
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('page-'+name);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{
    if(n.getAttribute('onclick')?.includes(`'${name}'`)) n.classList.add('active');
  });
  if(name==='dashboard')    updateDashboard();
  if(name==='reports')      renderSavedReports();
  if(name==='benchmark')    renderBenchmarkPage();
  if(name==='scenarios' && STATE.currentReport) renderScenariosPage();
  if(name==='compare')      renderComparePage();
  if(name==='actionplan' && STATE.currentReport) generateActionPlan();
  if(name==='cashflow')     prefillCashFlowFromReport();
  if(name==='pricing')      renderPricingPage();
  if(name==='forecast' && STATE.currentReport) renderSmartForecast();
  if(name==='healthadvisor' && STATE.currentReport) renderHealthAdvisor();
  if(name==='profile') loadBusinessProfile();
  loadReportsFromDB();
  window.scrollTo(0,0);
}

// ══════════════════════════════════════════
// LIVE CALCULATOR
// ══════════════════════════════════════════
<script src="/js/dashboard.js"></script>
<script src="/js/reports.js"></script>
<script src="/js/ai-request.js"></script>
<script src="/js/ai-analysis.js"></script>
<script src="/js/ai-ui.js"></script>
<script src="/js/ai-tools.js"></script>
<script>
// ── Auth Guard — يمنع الدخول بدون تسجيل ──
(async function() {
  // انتظر config.js يحمّل المتغيرات
  await new Promise(r => setTimeout(r, 300));

  const url  = window.__SUPABASE_URL__  || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url || !anon) return; // لو Supabase مش مهيّأ، اشتغل بدون auth

  const sb = window.supabase.createClient(url, anon);
  window.sb = sb; // expose for global use

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

window.signOut = signOut;

// تشغيل بعد تحميل الـ DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
