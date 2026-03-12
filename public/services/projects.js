// services/projects.js — إدارة المشاريع المتعددة (الخطة المؤسسية)
// كل مشروع له مساحة بيانات منفصلة: تقارير + ملف مشروع + منتجات

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const MAX_PROJECTS_PER_PLAN = { free: 1, pro: 1, enterprise: 3 };

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function _uid() {
  const u = window.__USER__;
  if (!u) return 'local';
  return typeof u === 'string' ? u : (u.id || 'local');
}

function _projKey(suffix) {
  return `tw_proj_${suffix}_${_uid()}`;
}

// ═══════════════════════════════════════
// PROJECTS LIST
// ═══════════════════════════════════════

function getProjects() {
  const raw = localStorage.getItem(_projKey('list'));
  if (raw) {
    try { return JSON.parse(raw); } catch(e) {}
  }
  // مشروع افتراضي — متوافق مع البيانات الموجودة
  const defaults = [{
    id: 'default',
    name: 'مشروعي الأول',
    type: '',
    color: '#c9a84c',
    createdAt: new Date().toISOString()
  }];
  _saveProjectsList(defaults);
  return defaults;
}

function _saveProjectsList(projects) {
  localStorage.setItem(_projKey('list'), JSON.stringify(projects));
}

function getActiveProjectId() {
  return localStorage.getItem(_projKey('active')) || 'default';
}

function _setActiveProjectId(id) {
  localStorage.setItem(_projKey('active'), id);
  window.__CURRENT_PROJECT_ID__ = id;
}

// ═══════════════════════════════════════
// PROJECT DATA KEYS
// ═══════════════════════════════════════

// مفتاح التقارير لمشروع معين
function projectReportsKey(projId) {
  return projId === 'default' ? 'tw_reports' : `tw_reports_${projId}`;
}

// مفتاح ملف المشروع لمشروع معين
function projectProfileKey(projId) {
  return projId === 'default' ? null : `tw_bp_${projId}`;
}

// ═══════════════════════════════════════
// CREATE / DELETE
// ═══════════════════════════════════════

function createProject(name, type, color) {
  const plan     = window.__USER_PLAN__ || 'free';
  const projects = getProjects();
  const maxProj  = MAX_PROJECTS_PER_PLAN[plan] || 1;

  if (projects.length >= maxProj) {
    toast(`❌ خطتك المؤسسية تسمح بـ ${maxProj} مشاريع فقط`);
    return null;
  }

  const colors = ['#c9a84c', '#4caf82', '#5b8ef0'];
  const id     = 'proj_' + Date.now();
  const newProj = {
    id,
    name:      name  || 'مشروع جديد',
    type:      type  || '',
    color:     color || colors[projects.length % colors.length],
    createdAt: new Date().toISOString()
  };
  _saveProjectsList([...projects, newProj]);
  return newProj;
}

function deleteProject(id) {
  if (id === 'default') { toast('❌ لا يمكن حذف المشروع الافتراضي'); return false; }
  const projects = getProjects().filter(p => p.id !== id);
  _saveProjectsList(projects);
  // حذف بيانات المشروع
  localStorage.removeItem(projectReportsKey(id));
  localStorage.removeItem(projectProfileKey(id));
  return true;
}

// ═══════════════════════════════════════
// SWITCH PROJECT
// ═══════════════════════════════════════

async function switchProject(id) {
  _setActiveProjectId(id);

  // تحميل تقارير المشروع الجديد
  const saved = localStorage.getItem(projectReportsKey(id));
  STATE.savedReports  = saved ? JSON.parse(saved) : [];
  STATE.currentReport = STATE.savedReports[0] || null;

  // مسح سجل CFO عند التبديل
  window.CFO_HISTORY = [];
  const cfoMessages = document.getElementById('cfoMessages');
  if (cfoMessages) cfoMessages.innerHTML = '';

  // تحديث الـ context في CFO
  window.bpContext = '';

  // رسم القائمة من جديد
  renderProjectSelector();

  // إعادة تحميل بيانات المشروع من Supabase (للمشروع الافتراضي)
  // أو من localStorage للمشاريع الأخرى
  if (id === 'default') {
    if (typeof loadReportsFromDB === 'function') await loadReportsFromDB();
    if (typeof loadBusinessProfile === 'function') loadBusinessProfile();
  } else {
    _loadProjectProfile(id);
    if (document.getElementById('savedReportsGrid')) {
      if (typeof renderSavedReports === 'function') renderSavedReports();
    }
  }

  // تحديث لوحة التحكم
  if (typeof updateDashboard === 'function') updateDashboard();

  const projName = getProjects().find(p => p.id === id)?.name || id;
  toast(`✅ تم التبديل إلى: ${projName}`);
}

// ═══════════════════════════════════════
// PROFILE PER PROJECT (localStorage)
// ═══════════════════════════════════════

function _loadProjectProfile(projId) {
  if (projId === 'default') return; // الافتراضي يتحمّل من Supabase
  const key  = projectProfileKey(projId);
  const raw  = localStorage.getItem(key);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    window._businessProfile = data;
    window.BP_PRODUCTS = data.products || [];
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (val !== null && val !== undefined) ? val : '';
      el.dispatchEvent(new Event('input'));
    };
    set('bp-name',           data.biz_name);
    set('bp-type',           data.biz_type);
    set('bp-rent',           data.fixed_rent);
    set('bp-salaries',       data.fixed_salaries);
    set('bp-utilities',      data.fixed_utilities);
    set('bp-subscriptions',  data.fixed_subscriptions);
    set('bp-fixed-other',    data.fixed_other);
    set('bp-cogs',           data.var_cogs_pct);
    set('bp-delivery',       data.var_delivery_pct);
    set('bp-marketing',      data.var_marketing_pct);
    set('bp-var-other',      data.var_other_pct);
    if (typeof calcBPFixed     === 'function') calcBPFixed();
    if (typeof renderBPProducts === 'function') renderBPProducts();
  } catch(e) { console.warn('_loadProjectProfile:', e); }
}

function saveProjectProfile(projId, profile) {
  if (projId === 'default') return; // الافتراضي يحفظ في Supabase
  const key = projectProfileKey(projId);
  localStorage.setItem(key, JSON.stringify(profile));
}

// ═══════════════════════════════════════
// REPORTS PER PROJECT
// ═══════════════════════════════════════

function saveProjectReports(reports) {
  const id  = window.__CURRENT_PROJECT_ID__ || 'default';
  const key = projectReportsKey(id);
  localStorage.setItem(key, JSON.stringify((reports || []).slice(0, 20)));
}

function loadProjectReports() {
  const id  = window.__CURRENT_PROJECT_ID__ || 'default';
  const key = projectReportsKey(id);
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

// ═══════════════════════════════════════
// RENDER PROJECT SELECTOR
// ═══════════════════════════════════════

function renderProjectSelector() {
  const el = document.getElementById('projectSelector');
  if (!el) return;

  const plan = window.__USER_PLAN__ || 'free';
  if (plan !== 'enterprise') {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';

  const projects = getProjects();
  const activeId = getActiveProjectId();
  const active   = projects.find(p => p.id === activeId) || projects[0];

  el.innerHTML = `
    <div class="proj-selector" id="projSelectorBtn" onclick="toggleProjectMenu(event)">
      <span class="proj-sel-dot" style="background:${active?.color||'#c9a84c'}"></span>
      <span class="proj-sel-name">${active?.name || 'المشروع'}</span>
      <span class="proj-sel-arrow">▾</span>
    </div>
    <div class="proj-dropdown" id="projDropdown" style="display:none;">
      <div class="proj-dd-label">مشاريعك</div>
      ${projects.map(p => `
        <div class="proj-option ${p.id === activeId ? 'active' : ''}" onclick="switchProject('${p.id}')">
          <span class="proj-opt-dot" style="background:${p.color||'#888'}"></span>
          <span class="proj-opt-name">${p.name}</span>
          <span class="proj-opt-type">${p.type || ''}</span>
          ${p.id === activeId ? '<span class="proj-opt-check">✓</span>' : ''}
          ${p.id !== 'default' ? `<button class="proj-opt-del" onclick="event.stopPropagation();confirmDeleteProject('${p.id}')" title="حذف">✕</button>` : ''}
        </div>
      `).join('')}
      ${projects.length < 3 ? `
        <div class="proj-option proj-add" onclick="openAddProjectModal()">
          <span class="proj-opt-dot" style="background:#444;border:1px dashed #666"></span>
          <span class="proj-opt-name" style="color:#888">+ مشروع جديد</span>
        </div>
      ` : `
        <div style="padding:8px 12px;font-size:11px;color:#555;text-align:center;">وصلت للحد الأقصى (3 مشاريع)</div>
      `}
    </div>`;
}

// ═══════════════════════════════════════
// PROJECT DROPDOWN TOGGLE
// ═══════════════════════════════════════

function toggleProjectMenu(e) {
  const dd = document.getElementById('projDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : '';
  e.stopPropagation();
  if (!isOpen) {
    const close = ev => {
      if (!ev.target.closest('#projectSelector')) {
        dd.style.display = 'none';
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}
window.toggleProjectMenu = toggleProjectMenu;

// ═══════════════════════════════════════
// ADD PROJECT MODAL
// ═══════════════════════════════════════

function openAddProjectModal() {
  const dd = document.getElementById('projDropdown');
  if (dd) dd.style.display = 'none';
  document.getElementById('addProjectModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'addProjectModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = `
    <div style="background:#13131a;border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:32px;width:100%;max-width:400px;font-family:inherit;position:relative;">
      <button onclick="document.getElementById('addProjectModal').remove()"
        style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,0.06);border:none;color:#888;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;">✕</button>
      <h3 style="color:#fff;margin:0 0 6px;font-size:18px;">مشروع جديد</h3>
      <p style="color:#666;font-size:13px;margin:0 0 22px;">أنشئ مساحة مستقلة لمشروعك الجديد</p>

      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:12px;color:#888;margin-bottom:6px;">اسم المشروع *</label>
        <input id="newProjName" type="text" placeholder="مثال: مقهى الشروق" maxlength="40"
          style="width:100%;background:#1a1a24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter') submitNewProject()">
      </div>

      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:12px;color:#888;margin-bottom:6px;">نوع المشروع</label>
        <select id="newProjType"
          style="width:100%;background:#1a1a24;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;">
          <option value="">اختر النوع</option>
          <option value="مطعم">🍽️ مطعم / كافيه</option>
          <option value="تجزئة">🛍️ تجزئة</option>
          <option value="خدمات">⚙️ خدمات</option>
          <option value="تقنية">💻 تقنية</option>
          <option value="صناعة">🏭 صناعة</option>
          <option value="أخرى">📦 أخرى</option>
        </select>
      </div>

      <div style="margin-bottom:22px;">
        <label style="display:block;font-size:12px;color:#888;margin-bottom:8px;">لون التمييز</label>
        <div style="display:flex;gap:10px;">
          ${['#c9a84c','#4caf82','#5b8ef0','#e05555','#b06cf0'].map(c=>`
            <div class="proj-color-opt" onclick="selectProjColor('${c}')" data-color="${c}"
              style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;transition:border-color .2s;"
              title="${c}"></div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button onclick="submitNewProject()"
          style="flex:1;background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
          إنشاء المشروع ←
        </button>
        <button onclick="document.getElementById('addProjectModal').remove()"
          style="background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 18px;font-size:14px;cursor:pointer;font-family:inherit;">
          إلغاء
        </button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('newProjName')?.focus(), 100);
  // تحديد اللون الافتراضي
  const colors   = getProjects().length;
  const defColor = ['#c9a84c','#4caf82','#5b8ef0'][colors % 3];
  window._selectedProjColor = defColor;
  const opt = document.querySelector(`[data-color="${defColor}"]`);
  if (opt) opt.style.borderColor = '#fff';
}

function selectProjColor(color) {
  window._selectedProjColor = color;
  document.querySelectorAll('.proj-color-opt').forEach(el => {
    el.style.borderColor = el.dataset.color === color ? '#fff' : 'transparent';
  });
}

function submitNewProject() {
  const name  = document.getElementById('newProjName')?.value?.trim();
  const type  = document.getElementById('newProjType')?.value || '';
  const color = window._selectedProjColor || '#c9a84c';
  if (!name) { toast('❌ أدخل اسم المشروع أولاً'); return; }
  const proj = createProject(name, type, color);
  if (proj) {
    document.getElementById('addProjectModal')?.remove();
    switchProject(proj.id);
  }
}

function confirmDeleteProject(id) {
  const proj = getProjects().find(p => p.id === id);
  if (!proj) return;
  if (!confirm(`هل تريد حذف مشروع "${proj.name}"؟\nسيتم حذف جميع بياناته نهائياً.`)) return;
  if (deleteProject(id)) {
    renderProjectSelector();
    toast(`✅ تم حذف "${proj.name}"`);
  }
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════

function initProjectSelector() {
  const plan = window.__USER_PLAN__ || 'free';
  if (plan !== 'enterprise') return;

  // تعيين المشروع النشط عالمياً
  window.__CURRENT_PROJECT_ID__ = getActiveProjectId();

  // تحميل تقارير المشروع النشط (إذا كان غير الافتراضي)
  const activeId = window.__CURRENT_PROJECT_ID__;
  if (activeId !== 'default') {
    const saved = localStorage.getItem(projectReportsKey(activeId));
    if (saved) {
      STATE.savedReports  = JSON.parse(saved);
      STATE.currentReport = STATE.savedReports[0] || null;
    }
  }

  renderProjectSelector();
}

// ═══════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════

window.getProjects            = getProjects;
window.getActiveProjectId     = getActiveProjectId;
window.createProject          = createProject;
window.deleteProject          = deleteProject;
window.switchProject          = switchProject;
window.renderProjectSelector  = renderProjectSelector;
window.openAddProjectModal    = openAddProjectModal;
window.selectProjColor        = selectProjColor;
window.submitNewProject       = submitNewProject;
window.confirmDeleteProject   = confirmDeleteProject;
window.initProjectSelector    = initProjectSelector;
window.saveProjectReports     = saveProjectReports;
window.loadProjectReports     = loadProjectReports;
window.projectReportsKey      = projectReportsKey;
window.saveProjectProfile     = saveProjectProfile;
window._loadProjectProfile    = _loadProjectProfile;
