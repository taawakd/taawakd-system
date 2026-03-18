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
  if(a >= 1e6) return (n/1e6).toFixed(1)+' مليون';
  if(a >= 1e3) return (n/1e3).toFixed(1)+' ألف';
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
// الصفحات التي لا تُضاف لـ URL hash (صفحات وسيطة أو نتائج مؤقتة)
const _NO_HASH_PAGES = new Set(['results','scenarios','actionplan','healthadvisor']);

function showPage(name, _fromHash) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('page-'+name);
  if(pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{
    if(n.getAttribute('onclick')?.includes(`'${name}'`)) n.classList.add('active');
  });

  // ── Hash Routing: تحديث الرابط ──
  if (!_fromHash && !_NO_HASH_PAGES.has(name)) {
    history.pushState({ page: name }, '', '#' + name);
  }

  if(name==='dashboard') updateDashboard();
  if(name==='analysis') _prefillFromBP();
  if(name==='reports') {
    if (!planAllows('save_reports')) { showUpgradeModal('سجل التقارير المحفوظة', 'pro'); return; }
    renderSavedReports();
  }
  if(name==='benchmark') {
    if (!planAllows('market_compare')) { showUpgradeModal('مقارنة السوق', 'pro'); return; }
    renderBenchmarkPage();
  }
  if(name==='scenarios') {
    if (window.STATE?.currentReport) renderScenariosPage(); // preview داخل renderScenariosPage() حسب الخطة
  }
  if(name==='compare') {
    if (!planAllows('compare_reports')) { showUpgradeModal('مقارنة التقارير', 'pro'); return; }
    renderComparePage();
  }
  if(name==='actionplan') {
    if (!planAllows('full_report')) { showUpgradeModal('خطة العمل الأسبوعية', 'one_time'); return; }
    if (window.STATE?.currentReport) generateActionPlan();
  }
  if(name==='cashflow') prefillCashFlowFromReport();
  if(name==='pricing') {
    // تأكد من تحميل بيانات حاسبة التكاليف قبل عرض التسعير
    if (typeof pcLoadFromDB === 'function') {
      pcLoadFromDB().catch(() => {}).finally(() => renderPricingPage());
    } else {
      renderPricingPage();
    }
  }
  if(name==='forecast') {
    if (!planAllows('forecast')) { showUpgradeModal('التوقعات الذكية', 'pro'); return; }
    if (window.STATE?.currentReport) renderSmartForecast();
  }
  if(name==='healthadvisor' && window.STATE?.currentReport) renderHealthAdvisor();
  if(name==='profile') loadBusinessProfile();
  if(name==='userprofile' && typeof loadUserProfile==='function') loadUserProfile();
  if(name==='costcalc' && typeof initProductCostPage==='function') initProductCostPage();
  // عند فتح AI CFO: حمّل بيانات حاسبة التكاليف من Supabase بشكل غير متزامن
  // حتى تكون PC_STATE محدّثة حتى لو لم يزر المستخدم صفحة الحاسبة في هذه الجلسة
  if(name==='cfo' && typeof pcLoadFromDB==='function') pcLoadFromDB().catch(()=>{});
  if(name==='admin' && typeof initAdminDashboard==='function') initAdminDashboard();
  if(name==='plans' && typeof initPlansPage==='function') initPlansPage();
  loadReportsFromDB();
  window.scrollTo(0,0);
}
window.showPage = showPage;

// ── الاستجابة لزر Back/Forward في المتصفح ──
window.addEventListener('popstate', function(e) {
  const page = e.state?.page || location.hash.replace('#','') || 'dashboard';
  showPage(page, true);
});

// ── تحميل الصفحة من الـ hash عند الدخول ──
window.addEventListener('tw:appReady', function() {
  const hash = location.hash.replace('#','');
  if (hash && !_NO_HASH_PAGES.has(hash)) {
    showPage(hash, true);
  }
});

// ══════════════════════════════════════════
// PLAN GATING — التحقق من الخطة والميزات
// ══════════════════════════════════════════

// تعريف الميزات المتاحة لكل خطة
// ── free:     تشغيل التحليل فقط + preview (هامش + مؤشر الصحة)
// ── one_time: تقرير كامل لمرة واحدة (بدون حفظ / CFO / مقارنة)
// ── pro/paid: كل الميزات
const _PAID_FEATURES = ['analysis', 'health_score', 'full_report', 'basic_report', 'cfo_limited', 'cfo_full',
  'advanced_report', 'forecast', 'market_compare', 'pdf_export',
  'save_reports', 'compare_reports'];
const _ONE_TIME_FEATURES = ['analysis', 'health_score', 'full_report', 'basic_report', 'advanced_report', 'pdf_export'];
const PLAN_FEATURES = {
  free:       ['analysis', 'health_score'],   // preview فقط — لا يُعرض التقرير الكامل
  one_time:   _ONE_TIME_FEATURES,             // تقرير كامل لمرة واحدة
  paid:       _PAID_FEATURES,
  pro:        _PAID_FEATURES,                 // توافق مع الخطط القديمة
  enterprise: _PAID_FEATURES,                 // توافق مع الخطط القديمة
};

function planAllows(feature) {
  // ── أولوية: session-level state بعد دفع one_time في نفس الجلسة ──
  if (window.STATE?.isPaidOneTime && feature === 'full_report') return true;
  if (window.STATE?.plan === 'one_time' && feature === 'full_report') return true;
  // ── الخطة العادية من الـ server ───────────────────────────────
  const plan = window.__USER_PLAN__ || 'free';
  return (PLAN_FEATURES[plan] || PLAN_FEATURES.free).includes(feature);
}
window.planAllows = planAllows;

// ── عرض نافذة الترقية ──────────────────────────────────────
function showUpgradeModal(featureName, requiredPlan) {
  const existing = document.getElementById('upgradeModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'upgradeModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
  overlay.innerHTML = `
    <div style="background:#13131a;border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:32px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;position:relative;font-family:inherit;">
      <button onclick="document.getElementById('upgradeModalOverlay').remove()"
        style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,0.06);border:none;color:#888;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>

      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;margin-bottom:10px;">🔒</div>
        <h3 style="color:#fff;font-size:18px;margin:0 0 6px;">${featureName ? featureName + ' — ' : ''}هذه الميزة تحتاج ترقية</h3>
        <p style="color:#888;font-size:13px;margin:0;">اختر الخيار المناسب لك</p>
      </div>

      <!-- خيار ١: تقرير لمرة واحدة -->
      <div style="border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="color:#ddd;font-size:15px;font-weight:600;">فتح هذا التقرير</span>
          <span style="color:#fff;font-size:20px;font-weight:800;">29 <span style="font-size:12px;color:#888;font-weight:400;">ر.س</span></span>
        </div>
        <ul style="list-style:none;padding:0;margin:0 0 14px;display:flex;flex-direction:column;gap:6px;">
          <li style="font-size:12px;color:#aaa;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>التقرير المالي الكامل</li>
          <li style="font-size:12px;color:#aaa;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>تحليل المنتجات ونقطة التعادل</li>
          <li style="font-size:12px;color:#555;display:flex;align-items:center;gap:6px;"><span style="color:#555;">✗</span>لا يشمل الحفظ أو AI CFO أو التقارير المستقبلية</li>
        </ul>
        <button id="btnOneTimePay"
          style="display:block;width:100%;text-align:center;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;">
          فتح التقرير — 29 ر.س
        </button>
      </div>

      <!-- خيار ٢: الاشتراك الشهري — الأفضل -->
      <div style="background:linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.05));border:1px solid rgba(201,168,76,0.4);border-radius:14px;padding:18px;position:relative;">
        <div style="position:absolute;top:-10px;right:16px;background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;font-size:10px;font-weight:700;padding:3px 12px;border-radius:100px;">الأفضل قيمة ⭐</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="color:#e8c76a;font-size:15px;font-weight:700;">الاشتراك الشهري</span>
          <span style="color:#fff;font-size:20px;font-weight:800;">79 <span style="font-size:12px;color:#888;font-weight:400;">ر.س/شهر</span></span>
        </div>
        <ul style="list-style:none;padding:0;margin:0 0 14px;display:flex;flex-direction:column;gap:6px;">
          <li style="font-size:12px;color:#ddd;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>تقارير غير محدودة</li>
          <li style="font-size:12px;color:#ddd;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>AI CFO كامل — استشارات مالية لا محدودة</li>
          <li style="font-size:12px;color:#ddd;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>حفظ التقارير وتتبع الأداء</li>
          <li style="font-size:12px;color:#ddd;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>تحليل المنتجات + التوقعات الذكية</li>
          <li style="font-size:12px;color:#ddd;display:flex;align-items:center;gap:6px;"><span style="color:#4caf82;">✓</span>مقارنة السوق وجميع الميزات</li>
        </ul>
        <a href="/landing.html#pricing" target="_blank"
          style="display:block;text-align:center;background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border-radius:10px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;">
          اشترك الآن — 79 ر.س/شهر ←
        </a>
      </div>

      <p style="text-align:center;font-size:11px;color:#444;margin:14px 0 0;">للتواصل والاستفسار: <a href="https://wa.me/966500000000" target="_blank" style="color:#555;text-decoration:none;">WhatsApp</a></p>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  // ربط زر "29 ر.س" مباشرة بعد إضافة الـ overlay للـ DOM
  const btnPay = document.getElementById('btnOneTimePay');
  if (btnPay) {
    btnPay.addEventListener('click', function() { _onOneTimePaid(); });
  }
}
window.showUpgradeModal = showUpgradeModal;

// ── فحص الخطة قبل تنفيذ أي وظيفة ──────────────────────────
function requirePlan(feature, featureName, requiredPlan, fn) {
  if (planAllows(feature)) { fn(); }
  else { showUpgradeModal(featureName, requiredPlan || 'pro'); }
}
window.requirePlan = requirePlan;

// ── دفع مرة واحدة: فتح التقرير الكامل في نفس الجلسة ────────
function _onOneTimePaid() {
  // تحديث الحالة على مستوى الجلسة — بدون إعادة تحميل
  window.STATE = window.STATE || {};
  window.STATE.isPaidOneTime = true;
  window.STATE.plan          = 'one_time';
  window.__USER_PLAN__       = 'one_time';

  // إغلاق نافذة الترقية
  const modal = document.getElementById('upgradeModalOverlay');
  if (modal) modal.remove();

  // إعادة تصيير التقرير الكامل مباشرةً — بدون navigation أو reload
  renderResults(STATE.currentReport);
}
window._onOneTimePaid = _onOneTimePaid;

// تسجيل الخروج
function signOut() {
  const url = window.__SUPABASE_URL__ || '';
  const anon = window.__SUPABASE_ANON__ || '';
  if (!url) { window.location.href = '/auth.html'; return; }
  const _sb = window.supabase.createClient(url, anon);
  _sb.auth.signOut().then(() => window.location.href = '/auth.html');
}
window.signOut = signOut;

// ══════════════════════════════════════════
// PRE-FILL — ملء نموذج التحليل من ملف المشروع
// ══════════════════════════════════════════
function _prefillFromBP() {
  const bp = window._businessProfile;
  if (!bp) return;

  // يملأ الحقل فقط إذا كان فارغاً
  const setIfEmpty = (id, val) => {
    const el = document.getElementById(id);
    if (!el || el.value) return; // لا تُعيد الكتابة إذا كان ممتلئاً
    const n = Number(val);
    if (n > 0) {
      el.value = Math.round(n).toLocaleString('en');
      el.dispatchEvent(new Event('input'));
    }
  };

  setIfEmpty('f-rent',      bp.fixed_rent);
  setIfEmpty('f-sal',       bp.fixed_salaries);
  setIfEmpty('f-utilities', bp.fixed_utilities);

  // نوع النشاط (select)
  if (bp.biz_type) {
    const typeEl = document.getElementById('f-type');
    if (typeEl && !typeEl.value) typeEl.value = bp.biz_type;
  }
}
window._prefillFromBP = _prefillFromBP;
