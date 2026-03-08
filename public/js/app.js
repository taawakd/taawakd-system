// js/app.js — نقطة التشغيل

// ── حقن HTML components عند تحميل الصفحة ──
async function initApp() {
  try {
    const [sidebarRes, pagesRes] = await Promise.all([
      fetch('/components/sidebar.html'),
      fetch('/components/pages.html')
    ]);
    const sidebarHTML = await sidebarRes.text();
    const pagesHTML   = await pagesRes.text();

    const sc = document.getElementById('sidebar-container');
    const pc = document.getElementById('pages-container');
    if (sc) sc.innerHTML = sidebarHTML;
    if (pc) pc.innerHTML = pagesHTML;

    // تهيئة بعد حقن الـ HTML
    if (typeof initNumInputs === 'function') initNumInputs();
    if (typeof loadBusinessProfile === 'function') loadBusinessProfile();
    if (typeof renderSavedReports === 'function') renderSavedReports();
    if (typeof showPage === 'function') showPage('dashboard');

  } catch (err) {
    console.error('initApp error:', err);
  }
}

document.addEventListener('DOMContentLoaded', initApp);
