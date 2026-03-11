// js/app.js
async function initApp() {
  try {
    const [sidebarRes, pagesRes] = await Promise.all([
      fetch('components/sidebar.html'),
      fetch('components/pages.html')
    ]);
    const sidebarHTML = await sidebarRes.text();
    const pagesHTML   = await pagesRes.text();
    const sc = document.getElementById('sidebar-container');
    const pc = document.getElementById('pages-container');
    if (sc) sc.innerHTML = sidebarHTML;
    if (pc) pc.innerHTML = pagesHTML;
    if (typeof initNumInputs === 'function') initNumInputs();
    if (typeof loadBusinessProfile === 'function') loadBusinessProfile();
    if (typeof renderSavedReports === 'function') {
      // تأكّد من وجود STATE قبل الاستدعاء
      window.STATE = window.STATE || { currentReport: null, savedReports: JSON.parse(localStorage.getItem('tw_reports')||'[]'), chartInstance: null, chartMode: 'net' };
      renderSavedReports();
    }
    if (typeof showPage === 'function') showPage('dashboard');

    // إظهار زر الإدارة بعد تحميل الـ sidebar (الـ IIFE في head يسبق تحميل المكونات)
    if (window.__IS_ADMIN__) {
      const navAdmin = document.getElementById('nav-admin');
      const navAdminSec = document.getElementById('nav-admin-section');
      if (navAdmin) navAdmin.style.display = '';
      if (navAdminSec) navAdminSec.style.display = '';
    }

    // عرض تقرير المستخدم في تاب جديد (مفتوح من لوحة الإدارة)
    const adminPreview = localStorage.getItem('tw_admin_preview');
    if (adminPreview) {
      localStorage.removeItem('tw_admin_preview');
      try {
        const report = JSON.parse(adminPreview);
        setTimeout(() => {
          if (typeof renderResults === 'function' && report?.bizName) {
            window.STATE = window.STATE || {};
            STATE.currentReport = report;
            renderResults(report);
            if (typeof showPage === 'function') showPage('results');
          }
        }, 300);
      } catch(e) { /* تجاهل */ }
    }
  } catch (err) {
    console.error('initApp error:', err);
  }
}
document.addEventListener('DOMContentLoaded', initApp);
