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
  if (tab === 'logs')      renderAdminLogs(1, 'all');
};

// ── Init ───────────────────────────────────────────────────────────────────
window.initAdminDashboard = function() {
  switchAdminTab('overview');
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════
async function renderAdminOverview() {
  const container = document.getElementById('admin-overview-content');
  if (!container) return;
  container.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center">جارٍ تحميل البيانات…</p>';

  const data = await adminFetch('getDashboardData');
  if (!data) return;

  const { stats, userGrowth, dailyReports, planDist, activity, retentionRate, heatmap, funnel, alerts } = data;
  const fmt = n => (n || 0).toLocaleString('ar-SA');
  const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const heatMax = Math.max(...heatmap, 1);

  container.innerHTML = `
    <!-- ══ KPI Grid ══ -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi-card">
        <div class="adm-kpi-label">👥 المستخدمون</div>
        <div class="adm-kpi-value">${fmt(stats.totalUsers)}</div>
        <div class="adm-kpi-sub">+${fmt(stats.todayUsers)} اليوم</div>
      </div>
      <div class="adm-kpi-card">
        <div class="adm-kpi-label">✅ المستخدمون النشطون</div>
        <div class="adm-kpi-value">${fmt(stats.activeUsers)}</div>
        <div class="adm-kpi-sub">استخدموا التحليل</div>
      </div>
      <div class="adm-kpi-card">
        <div class="adm-kpi-label">📄 التقارير</div>
        <div class="adm-kpi-value">${fmt(stats.totalReports)}</div>
        <div class="adm-kpi-sub">+${fmt(stats.todayReports)} اليوم</div>
      </div>
      <div class="adm-kpi-card">
        <div class="adm-kpi-label">💎 الاشتراكات المدفوعة</div>
        <div class="adm-kpi-value">${fmt(stats.paidSubs)}</div>
        <div class="adm-kpi-sub">من ${fmt(stats.totalUsers)} مستخدم</div>
      </div>
      <div class="adm-kpi-card adm-kpi-gold">
        <div class="adm-kpi-label">💰 الإيراد الشهري</div>
        <div class="adm-kpi-value">${fmt(stats.monthlyRevenue)} ${SAR}</div>
        <div class="adm-kpi-sub">MRR</div>
      </div>
      <div class="adm-kpi-card adm-kpi-accent">
        <div class="adm-kpi-label">🔁 معدل الاحتفاظ</div>
        <div class="adm-kpi-value">${retentionRate}%</div>
        <div class="adm-kpi-sub">Retention Rate</div>
      </div>
    </div>

    <!-- ══ Charts Row ══ -->
    <div class="adm-charts-row">
      <div class="adm-chart-card">
        <div class="adm-chart-title">📈 نمو المستخدمين (آخر 30 يوم)</div>
        <canvas id="adm-chart-users" height="150"></canvas>
      </div>
      <div class="adm-chart-card">
        <div class="adm-chart-title">📊 التقارير اليومية (آخر 30 يوم)</div>
        <canvas id="adm-chart-reports" height="150"></canvas>
      </div>
      <div class="adm-chart-card adm-chart-donut">
        <div class="adm-chart-title">🥧 توزيع الخطط</div>
        <canvas id="adm-chart-plans" height="150"></canvas>
      </div>
    </div>

    <!-- ══ Middle Row: Activity + Heatmap + Alerts ══ -->
    <div class="adm-mid-row">

      <!-- Activity Feed -->
      <div class="adm-panel">
        <div class="adm-panel-title">⚡ آخر النشاطات</div>
        <div class="adm-activity-list">
          ${activity.length ? activity.map(a => `
            <div class="adm-activity-item">
              <div class="adm-activity-icon">${a.type === 'signup' ? '👤' : '📄'}</div>
              <div>
                <div style="font-size:12px;font-weight:500">${a.type === 'signup' ? 'مستخدم جديد: ' + a.label : 'تقرير: ' + a.label}</div>
                <div style="font-size:11px;color:var(--text-muted)">${fmtDate(a.time)}</div>
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-muted);font-size:13px">لا توجد نشاطات بعد</p>'}
        </div>
      </div>

      <!-- Heatmap + Alerts stack -->
      <div style="display:flex;flex-direction:column;gap:16px;">

        <!-- Heatmap -->
        <div class="adm-panel" style="margin-bottom:0">
          <div class="adm-panel-title">🗓 خريطة الاستخدام (آخر 30 يوم)</div>
          <div class="adm-heatmap">
            ${DAYS_AR.map((day, i) => `
              <div class="adm-heatmap-row">
                <div class="adm-heatmap-day">${day}</div>
                <div class="adm-heatmap-bar-bg">
                  <div class="adm-heatmap-bar" style="width:${Math.round(heatmap[i] / heatMax * 100)}%"></div>
                </div>
                <div class="adm-heatmap-count">${heatmap[i]}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Smart Alerts -->
        <div class="adm-panel" style="margin-bottom:0">
          <div class="adm-panel-title">🔔 تنبيهات النظام</div>
          ${alerts.map(a => `<div class="adm-alert-item">${a.icon} ${a.text}</div>`).join('')}
        </div>
      </div>
    </div>

    <!-- ══ Bottom Row: Funnel ══ -->
    <div class="adm-panel">
      <div class="adm-panel-title">🔽 Conversion Funnel — هل المنصة تنمو؟</div>
      <div class="adm-funnel">
        ${[
          { label: 'المسجلون', val: funnel.signups, color: 'var(--gold)', pct: 100 },
          { label: 'استخدموا التحليل (Active)', val: funnel.active, color: '#4caf82',
            pct: funnel.signups ? Math.round(funnel.active / funnel.signups * 100) : 0 },
          { label: 'اشتركوا مدفوعاً (Paid)', val: funnel.paid, color: '#7c5cbf',
            pct: funnel.signups ? Math.round(funnel.paid / funnel.signups * 100) : 0 }
        ].map(s => `
          <div class="adm-funnel-step">
            <div class="adm-funnel-info">
              <span class="adm-funnel-label">${s.label}</span>
              <span class="adm-funnel-num">${fmt(s.val)}</span>
              <span class="adm-funnel-pct" style="color:${s.color}">${s.pct}%</span>
            </div>
            <div class="adm-funnel-bar-bg">
              <div class="adm-funnel-bar" style="width:${s.pct}%;background:${s.color}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // رسم الـ Charts بعد إدراج الـ DOM
  requestAnimationFrame(() => _renderAdminDashCharts(userGrowth, dailyReports, planDist));
}

function _renderAdminDashCharts(userGrowth, dailyReports, planDist) {
  const gridColor = 'rgba(255,255,255,0.05)';
  const tickColor = '#6b7280';
  const baseScales = {
    x: { ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 7 }, grid: { color: gridColor } },
    y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor }, beginAtZero: true }
  };

  // نمو المستخدمين
  const ugEl = document.getElementById('adm-chart-users');
  if (ugEl) new Chart(ugEl, {
    type: 'line',
    data: {
      labels: userGrowth.map(d => d.date.slice(5)),
      datasets: [{ data: userGrowth.map(d => d.count), borderColor: '#c9a84c',
        backgroundColor: 'rgba(201,168,76,0.12)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }]
    },
    options: { plugins: { legend: { display: false } }, scales: baseScales, responsive: true }
  });

  // التقارير اليومية
  const drEl = document.getElementById('adm-chart-reports');
  if (drEl) new Chart(drEl, {
    type: 'bar',
    data: {
      labels: dailyReports.map(d => d.date.slice(5)),
      datasets: [{ data: dailyReports.map(d => d.count),
        backgroundColor: 'rgba(76,175,130,0.65)', borderRadius: 3, borderSkipped: false }]
    },
    options: { plugins: { legend: { display: false } }, scales: baseScales, responsive: true }
  });

  // توزيع الخطط
  const plEl = document.getElementById('adm-chart-plans');
  if (plEl) new Chart(plEl, {
    type: 'doughnut',
    data: {
      labels: ['مجاني', 'احترافي', 'مؤسسي'],
      datasets: [{ data: [planDist.free, planDist.pro, planDist.enterprise],
        backgroundColor: ['rgba(107,114,128,0.7)', 'rgba(76,175,130,0.8)', 'rgba(201,168,76,0.9)'],
        borderWidth: 0 }]
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: tickColor, font: { size: 11 }, padding: 10, boxWidth: 12 } } },
      responsive: true, cutout: '60%'
    }
  });
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
          <button class="btn-sm" onclick="openUserProfile('${u.id}')">👤 الحساب</button>
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

window.openUserProfile = async function(userId) {
  const overlay = document.getElementById('user-profile-overlay');
  const content = document.getElementById('user-profile-content');
  if (!overlay || !content) return;
  overlay.style.display = 'flex';
  content.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">جارٍ التحميل…</p>';

  const data = await adminFetch('getUserProfile', { userId });
  if (!data) { overlay.style.display = 'none'; return; }

  const { profile = {}, plan = {}, reports = [], reportsCount = 0 } = data;
  const isSuspended = profile.is_suspended;

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div>
        <div style="font-size:20px;font-weight:700">${profile.full_name || 'بدون اسم'}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${profile.email || ''}</div>
      </div>
      <button onclick="closeUserProfile()" style="background:none;border:none;color:var(--text-muted);font-size:22px;cursor:pointer;line-height:1">✕</button>
    </div>

    <!-- الخطة والاستخدام -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
      <div class="kpi-card" style="padding:14px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">الخطة</div>
        <div style="font-weight:700">${plan?.name_ar || profile.plan || 'مجاني'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${plan?.price_monthly > 0 ? plan.price_monthly + ' ' + SAR + '/شهر' : 'مجاني'}</div>
      </div>
      <div class="kpi-card" style="padding:14px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">الاستخدام</div>
        <div style="font-weight:700">${profile.analyses_used || 0} / ${profile.analyses_limit === -1 ? '∞' : (profile.analyses_limit || 2)}</div>
        <div style="height:4px;background:var(--border);border-radius:2px;margin-top:6px">
          <div style="height:4px;background:var(--gold);border-radius:2px;width:${profile.analyses_limit > 0 ? Math.min(100,Math.round((profile.analyses_used||0)/(profile.analyses_limit||2)*100)) : 0}%"></div>
        </div>
      </div>
      <div class="kpi-card" style="padding:14px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">التقارير</div>
        <div style="font-weight:700">${reportsCount}</div>
      </div>
      <div class="kpi-card" style="padding:14px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">تاريخ التسجيل</div>
        <div style="font-weight:600;font-size:13px">${fmtDate(profile.auth_created_at)}</div>
      </div>
    </div>

    <!-- آخر التقارير -->
    ${reports.length ? `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:10px">آخر التقارير</div>
      ${reports.map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:600">${r.biz_name || 'بدون اسم'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${r.biz_type || ''} · ${fmtDate(r.created_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${r.health_score ? `<span style="font-size:12px;color:var(--gold)">${r.health_score}%</span>` : ''}
            <button class="btn-sm" onclick="closeUserProfile();adminViewReport('${r.id}')">👁</button>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- إجراءات -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn-sm" onclick="openAssignPlan('${userId}','${profile.plan || 'free'}','${profile.email || ''}');closeUserProfile()">📋 تغيير الخطة</button>
      ${profile.is_admin ? '' : `
        <button class="btn-sm ${isSuspended ? 'btn-gold' : 'btn-danger-sm'}"
          onclick="toggleSuspend('${userId}',${!isSuspended},'${profile.email || ''}');closeUserProfile()">
          ${isSuspended ? '✅ تفعيل الحساب' : '⏸ إيقاف الحساب'}
        </button>
        <button class="btn-sm btn-danger-sm" onclick="confirmDeleteUser('${userId}','${profile.email || ''}');closeUserProfile()">🗑 حذف الحساب</button>
      `}
    </div>
  `;
};

window.closeUserProfile = function() {
  const overlay = document.getElementById('user-profile-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.showLimitModal = function(used, limit) {
  const overlay = document.getElementById('limit-reached-overlay');
  const msg     = document.getElementById('limit-reached-msg');
  if (!overlay) return;
  if (msg) msg.textContent =
    `لقد استخدمت ${used} من أصل ${limit} تحليلات المتاحة في الخطة المجانية. ` +
    `قم بترقية حسابك للحصول على تحليلات غير محدودة ووصول كامل لجميع الميزات.`;
  overlay.style.display = 'flex';
};

window.closeLimitModal = function() {
  const overlay = document.getElementById('limit-reached-overlay');
  if (overlay) overlay.style.display = 'none';
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
        <div style="font-weight:600;font-size:13px">${r.biz_name || 'بدون اسم'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${r.biz_type || ''}</div>
      </td>
      <td style="font-size:12px">${r.user_email}</td>
      <td style="text-align:center;font-size:12px">${r.health_score ? r.health_score + '%' : '—'}</td>
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

  const r = data.report;
  const report = r.report_json || r.report_data || {};
  if (!report || !report.bizName) {
    toast('⚠️ بيانات التقرير غير مكتملة');
    return;
  }

  // احفظ بيانات التقرير ثم افتح تاب جديد يعرضه
  localStorage.setItem('tw_admin_preview', JSON.stringify(report));
  window.open('https://app.towkd.com', '_blank');
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

  const { labels = [], reports = [], totalReports = 0 } = data;

  kpiEl.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">${totalReports.toLocaleString('ar-SA')}</div>
      <div class="kpi-label">إجمالي التقارير</div>
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
          backgroundColor: 'rgba(180,130,50,0.5)',
          borderColor: '#b48232',
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
        ${p.analyses_limit === -1 ? 'تحليلات غير محدودة' : p.analyses_limit + (p.id === 'free' ? ' تحليل' : ' تحليل/شهر')}
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

  let plan = { id: '', name: '', name_ar: '', analyses_limit: 2, price_monthly: 0, is_active: true };

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
    analyses_limit:  parseInt(document.getElementById('pm-limit')?.value || '2'),
    price_monthly:   parseFloat(document.getElementById('pm-price')?.value || '0'),
    is_active:       document.getElementById('pm-active')?.checked
  };

  if (!planData.id || !planData.name || !planData.name_ar) {
    toast('⚠️ يرجى تعبئة جميع الحقول المطلوبة'); return;
  }

  const data = await adminFetch('savePlan', planData);
  if (data) { toast('✅ تم حفظ الخطة'); closePlanModal(); renderAdminPlans(); }
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. LOGS
// ═══════════════════════════════════════════════════════════════════════════
let _adminLogsPage = 1;
let _adminLogsType = 'all';

async function renderAdminLogs(page = 1, type = _adminLogsType) {
  _adminLogsPage = page;
  _adminLogsType = type;

  const tbody = document.getElementById('admin-logs-tbody');
  const pag   = document.getElementById('admin-logs-pag');
  if (!tbody) return;

  // تحديث أزرار الفلتر
  document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('lf-' + type);
  if (activeBtn) activeBtn.classList.add('active');

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">جارٍ التحميل…</td></tr>`;

  const data = await adminFetch('getLogs', { type, page });
  if (!data) return;

  const { logs = [], total = 0 } = data;

  if (!logs.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">لا توجد سجلات</td></tr>`;
    if (pag) pag.innerHTML = '';
    return;
  }

  const typeLabel = { api_call: '🔌 API', ai_usage: '🤖 AI', error: '❌ خطأ', payment: '💳 دفع' };
  const typeBadge = { api_call: 'gray', ai_usage: 'green', error: 'red', payment: 'gold' };

  tbody.innerHTML = logs.map(l => {
    const details = l.details ? JSON.stringify(l.details).substring(0, 80) : '—';
    return `
      <tr>
        <td style="font-size:11px;color:var(--text-muted)">${l.id?.substring(0,8)}…</td>
        <td>${badge(typeLabel[l.type] || l.type, typeBadge[l.type] || 'gray')}</td>
        <td style="font-size:12px">${l.action || '—'}</td>
        <td style="font-size:11px;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${details}</td>
        <td style="font-size:11px;color:var(--text-muted)">${fmtDate(l.created_at)}</td>
      </tr>
    `;
  }).join('');

  const pages = Math.ceil(total / 50);
  if (pag) pag.innerHTML = buildPagination(page, pages, `renderAdminLogs`);
}

window.renderAdminLogs = renderAdminLogs;
