// public/services/admin.js — Admin Dashboard Service for Tawakkad
'use strict';

// ── Helpers ────────────────────────────────────────────────────────────────
async function adminFetch(action, payload = {}) {
  const session = await window.sb.auth.getSession();
  const token = session?.data?.session?.access_token;
  if (!token) { toast('⚠️ انتهت الجلسة، سجّل دخولك مجدداً'); return null; }

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ action, payload })
  });
  const data = await res.json();
  if (!res.ok) { toast('⚠️ ' + (data.error || 'خطأ غير معروف')); return null; }
  return data;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function badge(text, color) {
  return `<span class="badge ${color}">${text}</span>`;
}

// ── Tab Switching ──────────────────────────────────────────────────────────
window.switchAdminTab = function(tab) {
  document.querySelectorAll('#page-admin .admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#page-admin .admin-section').forEach(s => s.classList.add('hidden'));
  const btn = document.getElementById('atab-' + tab);
  const sec = document.getElementById('asec-' + tab);
  if (btn) btn.classList.add('active');
  if (sec) sec.classList.remove('hidden');

  if (tab === 'overview')  renderAdminOverview();
  if (tab === 'users')     renderAdminUsers(1);
  if (tab === 'reports')   renderAdminReports(1);
  if (tab === 'usage')     renderAdminUsage();
  if (tab === 'plans')     renderAdminPlans();
};

// ── Init ───────────────────────────────────────────────────────────────────
window.initAdminDashboard = function() {
  switchAdminTab('overview');
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
async function renderAdminOverview() {
  const el = document.getElementById('admin-overview-kpis');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--text-muted)">جارٍ التحميل…</p>';

  const data = await adminFetch('getStats');
  if (!data) return;

  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">${(data.totalUsers || 0).toLocaleString('ar-SA')}</div>
      <div class="kpi-label">إجمالي المستخدمين</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${(data.totalReports || 0).toLocaleString('ar-SA')}</div>
      <div class="kpi-label">إجمالي التقارير</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${(data.todayReports || 0).toLocaleString('ar-SA')}</div>
      <div class="kpi-label">تقارير اليوم</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${(data.aiUsage || 0).toLocaleString('ar-SA')}</div>
      <div class="kpi-label">تحليلات AI</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. USERS
// ═══════════════════════════════════════════════════════════════════════════
let _adminUserPage = 1;
let _adminUserSearch = '';
let _adminUserSearchTimer = null;

async function renderAdminUsers(page = 1) {
  _adminUserPage = page;
  const tbody = document.getElementById('admin-users-tbody');
  const pag = document.getElementById('admin-users-pag');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">جارٍ التحميل…</td></tr>`;

  const data = await adminFetch('getUsers', { page, search: _adminUserSearch });
  if (!data) return;

  const { users = [], total = 0 } = data;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">لا توجد نتائج</td></tr>`;
    if (pag) pag.innerHTML = '';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:13px">${u.full_name || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${u.email}</div>
      </td>
      <td>${getPlanBadge(u.plan)}</td>
      <td style="text-align:center">${u.reports_count}</td>
      <td style="text-align:center">${u.analyses_used} / ${u.analyses_limit === -1 ? '∞' : u.analyses_limit}</td>
      <td>${u.is_suspended ? badge('موقوف','red') : badge('نشط','green')}</td>
      <td style="font-size:11px;color:var(--text-muted)">${fmtDate(u.created_at)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <button class="btn-sm" onclick="openAssignPlan('${u.id}','${u.plan}','${u.email}')" title="تغيير الخطة">📋 خطة</button>
          <button class="btn-sm" onclick="adminViewUserReports('${u.id}','${u.email}')" title="عرض تقاريره">📄</button>
          ${u.is_admin ? '' : `
            <button class="btn-sm ${u.is_suspended ? 'btn-gold' : 'btn-danger-sm'}" onclick="toggleSuspend('${u.id}',${!u.is_suspended},'${u.email}')">
              ${u.is_suspended ? '✅ تفعيل' : '⏸ إيقاف'}
            </button>
            <button class="btn-sm btn-danger-sm" onclick="confirmDeleteUser('${u.id}','${u.email}')">🗑</button>
          `}
        </div>
      </td>
    </tr>
  `).join('');

  // Pagination
  const pages = Math.ceil(total / 20);
  if (pag) pag.innerHTML = buildPagination(page, pages, `renderAdminUsers`);
}

function getPlanBadge(plan) {
  if (plan === 'enterprise') return badge('مؤسسي', 'gold');
  if (plan === 'pro')        return badge('احترافي', 'green');
  return badge('مجاني', 'gray');
}

function buildPagination(current, total, fn) {
  if (total <= 1) return '';
  let html = `<div class="admin-pag">`;
  if (current > 1) html += `<button class="btn-sm" onclick="${fn}(${current-1})">‹ السابق</button>`;
  html += `<span style="padding:0 8px;font-size:13px">صفحة ${current} / ${total}</span>`;
  if (current < total) html += `<button class="btn-sm" onclick="${fn}(${current+1})">التالي ›</button>`;
  html += `</div>`;
  return html;
}

window.toggleSuspend = async function(userId, suspend, email) {
  const msg = suspend ? `إيقاف حساب "${email}"؟` : `إعادة تفعيل حساب "${email}"؟`;
  if (!confirm(msg)) return;
  const data = await adminFetch('suspendUser', { userId, suspend });
  if (data) { toast(suspend ? '⏸ تم إيقاف الحساب' : '✅ تم تفعيل الحساب'); renderAdminUsers(_adminUserPage); }
};

window.confirmDeleteUser = async function(userId, email) {
  if (!confirm(`حذف حساب "${email}" نهائياً؟ سيُحذف معه كل تقاريره.`)) return;
  const data = await adminFetch('deleteUser', { userId });
  if (data) { toast('🗑 تم حذف الحساب'); renderAdminUsers(_adminUserPage); }
};

window.adminViewUserReports = function(userId, email) {
  // انتقل لتبويب التقارير وفلتر بالمستخدم
  window._adminReportsUserFilter = userId;
  window._adminReportsUserFilterEmail = email;
  switchAdminTab('reports');
};

window.openAssignPlan = async function(userId, currentPlan, email) {
  // جلب قائمة الخطط
  const data = await adminFetch('getPlans');
  if (!data) return;
  const plans = data.plans || [];

  const overlay = document.getElementById('admin-assign-plan-overlay');
  const content = document.getElementById('admin-assign-plan-content');
  if (!overlay || !content) return;

  content.innerHTML = `
    <h3 style="margin:0 0 12px">تغيير خطة: ${email}</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${plans.map(p => `
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px;border:1px solid var(--border);border-radius:8px;${p.id===currentPlan?'border-color:var(--gold)':''}">
          <input type="radio" name="assign-plan-radio" value="${p.id}" ${p.id===currentPlan?'checked':''}>
          <span>
            <strong>${p.name_ar}</strong>
            <span style="color:var(--text-muted);font-size:12px;margin-right:8px">${p.analyses_limit===-1?'غير محدود':p.analyses_limit+' تحليل'}</span>
            <span style="font-size:12px">${p.price_monthly} ${SAR}/شهر</span>
          </span>
        </label>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
      <button class="btn-secondary" onclick="closeAssignPlan()">إلغاء</button>
      <button class="btn-primary" onclick="doAssignPlan('${userId}')">حفظ</button>
    </div>
  `;
  overlay.style.display = 'flex';
};

window.closeAssignPlan = function() {
  const overlay = document.getElementById('admin-assign-plan-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.doAssignPlan = async function(userId) {
  const selected = document.querySelector('input[name="assign-plan-radio"]:checked');
  if (!selected) { toast('⚠️ اختر خطة'); return; }
  const data = await adminFetch('assignPlan', { userId, planId: selected.value });
  if (data) { toast('✅ تم تغيير الخطة'); closeAssignPlan(); renderAdminUsers(_adminUserPage); }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. REPORTS
// ═══════════════════════════════════════════════════════════════════════════
let _adminReportsPage = 1;

async function renderAdminReports(page = 1) {
  _adminReportsPage = page;
  const tbody = document.getElementById('admin-reports-tbody');
  const pag = document.getElementById('admin-reports-pag');
  const filterLabel = document.getElementById('admin-reports-filter-label');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">جارٍ التحميل…</td></tr>`;

  const userId = window._adminReportsUserFilter || null;
  if (filterLabel) {
    filterLabel.textContent = userId ? `(مفلترة لـ: ${window._adminReportsUserFilterEmail || userId})` : '';
  }

  const data = await adminFetch('getReports', { page, userId });
  if (!data) return;

  const { reports = [], total = 0 } = data;

  if (!reports.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">لا توجد تقارير</td></tr>`;
    if (pag) pag.innerHTML = '';
    return;
  }

  tbody.innerHTML = reports.map(r => `
    <tr>
      <td style="font-size:12px;color:var(--text-muted)">${r.id.substring(0,8)}…</td>
      <td>
        <div style="font-weight:600;font-size:13px">${r.title || 'بدون عنوان'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${r.biz_type || ''}</div>
      </td>
      <td style="font-size:12px">${r.user_email}</td>
      <td style="text-align:center">${r.ai_used ? badge('نعم','green') : badge('لا','gray')}</td>
      <td style="font-size:11px;color:var(--text-muted)">${fmtDate(r.created_at)}</td>
      <td style="text-align:center">
        <button class="btn-sm" onclick="adminViewReport('${r.id}')">👁 عرض</button>
      </td>
    </tr>
  `).join('');

  const pages = Math.ceil(total / 20);
  if (pag) pag.innerHTML = buildPagination(page, pages, `renderAdminReports`);
}

window.renderAdminReports = renderAdminReports;

window.adminClearUserFilter = function() {
  window._adminReportsUserFilter = null;
  window._adminReportsUserFilterEmail = null;
  renderAdminReports(1);
};

window.adminViewReport = async function(reportId) {
  const data = await adminFetch('getReport', { reportId });
  if (!data || !data.report) return;

  // تحويل بيانات DB إلى format يقبله renderResults
  const r = data.report;
  const report = {
    id: r.id,
    title: r.title,
    data: r.report_data || r.data || {},
    ai_analysis: r.ai_analysis || null,
    created_at: r.created_at
  };

  if (typeof renderResults === 'function') {
    STATE.currentReport = report;
    renderResults(report);
    showPage('results');
  } else {
    toast('⚠️ تعذّر فتح التقرير');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. USAGE
// ═══════════════════════════════════════════════════════════════════════════
let _adminUsageChart = null;

async function renderAdminUsage() {
  const kpiEl = document.getElementById('admin-usage-kpis');
  const canvasEl = document.getElementById('admin-usage-chart');
  if (!kpiEl || !canvasEl) return;

  kpiEl.innerHTML = '<p style="color:var(--text-muted)">جارٍ التحميل…</p>';

  const data = await adminFetch('getUsage');
  if (!data) return;

  const { labels = [], reports = [], ai = [], totalAI = 0, totalReports = 0 } = data;

  kpiEl.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">${totalReports.toLocaleString('ar-SA')}</div>
      <div class="kpi-label">إجمالي التقارير</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${totalAI.toLocaleString('ar-SA')}</div>
      <div class="kpi-label">تحليلات AI</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${reports.reduce((a,b)=>a+b,0).toLocaleString('ar-SA')}</div>
      <div class="kpi-label">تقارير آخر 30 يوم</div>
    </div>
  `;

  // رسم بياني
  if (_adminUsageChart) _adminUsageChart.destroy();

  const shortLabels = labels.map(d => d.substring(5)); // MM-DD

  _adminUsageChart = new Chart(canvasEl, {
    type: 'bar',
    data: {
      labels: shortLabels,
      datasets: [
        {
          label: 'تقارير',
          data: reports,
          backgroundColor: 'rgba(var(--gold-rgb,180,130,50), 0.5)',
          borderColor: 'var(--gold, #b48232)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'AI',
          data: ai,
          backgroundColor: 'rgba(100,160,255,0.4)',
          borderColor: '#64a0ff',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#999', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#888', font: { size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#888', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. PLANS
// ═══════════════════════════════════════════════════════════════════════════
async function renderAdminPlans() {
  const el = document.getElementById('admin-plans-grid');
  if (!el) return;
  el.innerHTML = '<p style="color:var(--text-muted)">جارٍ التحميل…</p>';

  const data = await adminFetch('getPlans');
  if (!data) return;

  const plans = data.plans || [];

  el.innerHTML = plans.map(p => `
    <div class="plan-card ${p.is_active ? '' : 'plan-inactive'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:18px;font-weight:700">${p.name_ar}</div>
          <div style="font-size:12px;color:var(--text-muted)">${p.name}</div>
        </div>
        ${p.is_active ? badge('نشطة','green') : badge('معطلة','gray')}
      </div>
      <div style="margin:12px 0;font-size:22px;font-weight:700">
        ${p.price_monthly > 0 ? p.price_monthly + ' ' + SAR : 'مجاني'}
        ${p.price_monthly > 0 ? '<span style="font-size:12px;font-weight:400;color:var(--text-muted)">/شهر</span>' : ''}
      </div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        ${p.analyses_limit === -1 ? 'تحليلات غير محدودة' : p.analyses_limit + ' تحليل/شهر'}
      </div>
      <button class="btn-secondary" style="width:100%" onclick="openPlanModal('${p.id}')">✏️ تعديل</button>
    </div>
  `).join('') + `
    <div class="plan-card plan-add" onclick="openPlanModal(null)">
      <div style="font-size:36px;margin-bottom:8px;opacity:0.4">+</div>
      <div style="color:var(--text-muted)">إضافة خطة جديدة</div>
    </div>
  `;
}

window.openPlanModal = async function(planId) {
  const overlay = document.getElementById('plan-modal-overlay');
  const form = document.getElementById('plan-modal-form');
  if (!overlay || !form) return;

  let plan = { id: '', name: '', name_ar: '', analyses_limit: 10, price_monthly: 0, is_active: true };

  if (planId) {
    const data = await adminFetch('getPlans');
    const found = (data?.plans || []).find(p => p.id === planId);
    if (found) plan = found;
  }

  form.innerHTML = `
    <div class="form-group">
      <label>معرف الخطة (لا يتغير)</label>
      <input id="pm-id" class="input" value="${plan.id}" ${planId ? 'readonly' : ''} placeholder="free / pro / enterprise">
    </div>
    <div class="form-group">
      <label>الاسم بالإنجليزية</label>
      <input id="pm-name" class="input" value="${plan.name}" placeholder="Free">
    </div>
    <div class="form-group">
      <label>الاسم بالعربية</label>
      <input id="pm-name-ar" class="input" value="${plan.name_ar}" placeholder="مجاني">
    </div>
    <div class="form-group">
      <label>حد التحليلات (-1 = غير محدود)</label>
      <input id="pm-limit" class="input" type="number" value="${plan.analyses_limit}">
    </div>
    <div class="form-group">
      <label>السعر الشهري (${SAR})</label>
      <input id="pm-price" class="input" type="number" step="0.01" value="${plan.price_monthly}">
    </div>
    <div class="form-group" style="display:flex;align-items:center;gap:10px">
      <input id="pm-active" type="checkbox" ${plan.is_active ? 'checked' : ''} style="width:auto">
      <label for="pm-active" style="margin:0;cursor:pointer">الخطة نشطة</label>
    </div>
  `;

  overlay.style.display = 'flex';
};

window.closePlanModal = function() {
  const overlay = document.getElementById('plan-modal-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.savePlan = async function() {
  const planData = {
    id:              document.getElementById('pm-id')?.value?.trim(),
    name:            document.getElementById('pm-name')?.value?.trim(),
    name_ar:         document.getElementById('pm-name-ar')?.value?.trim(),
    analyses_limit:  parseInt(document.getElementById('pm-limit')?.value || '10'),
    price_monthly:   parseFloat(document.getElementById('pm-price')?.value || '0'),
    is_active:       document.getElementById('pm-active')?.checked
  };

  if (!planData.id || !planData.name || !planData.name_ar) {
    toast('⚠️ يرجى تعبئة جميع الحقول المطلوبة'); return;
  }

  const data = await adminFetch('savePlan', planData);
  if (data) { toast('✅ تم حفظ الخطة'); closePlanModal(); renderAdminPlans(); }
};
