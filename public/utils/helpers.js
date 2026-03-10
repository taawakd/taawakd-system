// utils/helpers.js — أدوات مشتركة

// ══════════════════════════════════════════
// SHARED UTILS — تعريف مرة واحدة هنا فقط
// ══════════════════════════════════════════

// رمز الريال السعودي الرسمي (SVG مضمّن يرث لون النص تلقائياً)
const SAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" class="sar-icon" aria-label="ر.س" role="img"><path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/><path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/></svg>`;
window.SAR = SAR;

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
  t.innerHTML = msg;
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
