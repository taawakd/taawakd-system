// utils/helpers.js — أدوات مشتركة

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}
window.pct = pct;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}
window.toast = toast;

function showMsg(id, msg, type='error') {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = `msg ${type}`; el.style.display = 'block';
  setTimeout(()=>el.style.display='none', 4000);
}
window.showMsg = showMsg;

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
window.initNumInputs = initNumInputs;

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
window.showPage = showPage;


// ── تسجيل الخروج ──
function signOut() {
  const url  = window.__SUPABASE_URL__  || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url) { window.location.href = '/auth.html'; return; }
  const _sb = window.supabase.createClient(url, anon);
  _sb.auth.signOut().then(() => window.location.href = '/auth.html');
}
