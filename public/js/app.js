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
  } catch (err) {
    console.error('initApp error:', err);
  }
}
document.addEventListener('DOMContentLoaded', initApp);
