// utils/helpers.js — أدوات مشتركة

// ══════════════════════════════════════════
// SHARED UTILS — تعريف مرة واحدة هنا فقط
// ══════════════════════════════════════════

// تحويل قيمة نصية إلى رقم (يتعامل مع الفواصل العربية والإنجليزية)
const parseNum = v => parseFloat(String(v||'').replace(/[,،\s]/g,'')) || 0;
window.parseNum = parseNum;

// قراءة قيمة input بالـ id وتحويلها لرقم
const getN = id => parseNum(document.getElementById(id)?.value);
window.getN = getN;

// تنسيق الأرقام الكبيرة (مليون = م، ألف = ك)
const fmt = n => {
  const a = Math.abs(n);
  if(a >= 1e6) return (n/1e6).toFixed(1)+'م';
  if(a >= 1e3) return (n/1e3).toFixed(1)+'ك';
  return Math.round(n).toLocaleString('ar-SA');
};
window.fmt = fmt;

// حساب النسبة المئوية
function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}
window.pct = pct;

// إظهار رسالة toast مؤقتة
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}
window.toast = toast;

// إظهار رسالة خطأ/نجاح تحت حقل معين
function showMsg(id, msg, type='error') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `msg ${type}`;
  el.style.display = 'block';
  setTimeout(()=>el.style.display='none', 4000);
}
window.showMsg = showMsg;

// تهيئة حقول الأرقام (تنسيق تلقائي بالفواصل)
function initNumInputs() {
  document.querySelectorAll('.num-input').forEach(el => {
    el.addEventListener('input', function() {
      const raw = this.value.replace(/[^0-9]/g,'');
      if(!raw){this.value='';return;}
      this.value = parseInt(raw,10).toLocaleString('en');
    });
  });
}
window.initNumInputs = initNumInputs;

// التنقل بين الصفحات
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('page-'+name);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{
    if(n.getAttribute('onclick')?.includes(`'${name}'`)) n.classList.add('active');
  });
  if(name==='dashboard') updateDashboard();
  if(name==='reports') renderSavedReports();
  if(name==='benchmark') renderBenchmarkPage();
  if(name==='scenarios' && STATE.currentReport) renderScenariosPage();
  if(name==='compare') renderComparePage();
  if(name==='actionplan' && STATE.currentReport) generateActionPlan();
  if(name==='cashflow') prefillCashFlowFromReport();
  if(name==='pricing') renderPricingPage();
  if(name==='forecast' && STATE.currentReport) renderSmartForecast();
  if(name==='healthadvisor' && STATE.currentReport) renderHealthAdvisor();
  if(name==='profile') loadBusinessProfile();
  loadReportsFromDB();
  window.scrollTo(0,0);
}
window.showPage = showPage;

// تسجيل الخروج
function signOut() {
  const url = window.__SUPABASE_URL__ || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url) { window.location.href = '/auth.html'; return; }
  const _sb = window.supabase.createClient(url, anon);
  _sb.auth.signOut().then(() => window.location.href = '/auth.html');
}
window.signOut = signOut;
