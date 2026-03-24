// services/supabase.js — Supabase client + STATE + auth
// ✅ parseNum / getN / fmt مُعرَّفة في utils/helpers.js — لا تكرار هنا

const delay = ms => new Promise(r=>setTimeout(r,ms));

async function loadBusinessProfile() {
  try {
    if (!window.sb) return; // ← الـ Supabase client لم يُضبط بعد
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // ── مشاريع غير الافتراضي تُحمَّل من localStorage ──────────────
    const projId = window.__CURRENT_PROJECT_ID__ || 'default';
    if (projId !== 'default' && typeof _loadProjectProfile === 'function') {
      _loadProjectProfile(projId);
      return;
    }

    const { data, error } = await window.sb.from('business_profile')
      .select('*').eq('user_id', user.id).single();
    if (error || !data) return;
    window._businessProfile = data;

    // ── تحميل المنتجات من جدول products الجديد أولاً ──────────────────
    if (typeof loadProductsFromDB === 'function') {
      await loadProductsFromDB(); // يُحدّث window._PRODUCTS و window.BP_PRODUCTS
    } else {
      window.BP_PRODUCTS = data.products || [];
    }

    // set + تشغيل input event لتفعيل تنسيق الأرقام وتحديث الإجماليات
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (val !== null && val !== undefined) ? val : '';
      el.dispatchEvent(new Event('input'));
    };
    set('bp-name', data.biz_name);
    set('bp-type', data.biz_type);
    set('bp-city', data.city);
    set('bp-rent', data.fixed_rent);
    set('bp-salaries', data.fixed_salaries);
    set('bp-utilities', data.fixed_utilities);
    set('bp-subscriptions', data.fixed_subscriptions);
    set('bp-marketing-fixed', data.fixed_marketing);
    set('bp-fixed-other', data.fixed_other);
    set('bp-cogs', data.var_cogs_pct);
    set('bp-delivery', data.var_delivery_pct);
    set('bp-marketing', data.var_marketing_pct);
    set('bp-var-other', data.var_other_pct);

    // ── تحميل إعداد ضريبة القيمة المضافة ──────────────────────────────
    const vatEnabled = data.vat_enabled === true;
    window.__VAT_ENABLED__ = vatEnabled;
    _applyVATToggleUI(vatEnabled);

    calcBPFixed();
    renderBPProducts();
  } catch(e) { console.warn('loadBusinessProfile:', e); }
}

// ── تحديث حالة الـ VAT checkbox عند التحميل (الـ CSS يتولى المظهر) ──────
function _applyVATToggleUI(enabled) {
  const chk = document.getElementById('bp-vat-enabled');
  if (!chk) return;
  chk.checked = enabled;
}
// ── مزامنة window.__VAT_ENABLED__ عند تغيير الـ toggle ─────────────────
document.addEventListener('change', function(e) {
  if (e.target?.id !== 'bp-vat-enabled') return;
  window.__VAT_ENABLED__ = e.target.checked;
});
window.loadBusinessProfile = loadBusinessProfile;

async function saveBusinessProfile() {
  const statusEl = document.getElementById('bp-save-status');
  if (statusEl) statusEl.textContent = 'جاري الحفظ...';
  try {
    if (!window.sb) { toast('خطأ: الاتصال غير جاهز'); return; }
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) { toast('يجب تسجيل الدخول أولاً'); return; }

    // ── مشاريع غير الافتراضي تُحفظ في localStorage ──────────────
    const projId = window.__CURRENT_PROJECT_ID__ || 'default';
    if (projId !== 'default') {
      const g = id => parseNum(document.getElementById(id)?.value || '');
      const _vatEnabledNP = document.getElementById('bp-vat-enabled')?.checked === true;
      const profile = {
        biz_name:            document.getElementById('bp-name')?.value?.trim() || '',
        biz_type:            document.getElementById('bp-type')?.value?.trim() || '',
        city:                document.getElementById('bp-city')?.value?.trim() || '',
        fixed_rent:          g('bp-rent'),
        fixed_salaries:      g('bp-salaries'),
        fixed_utilities:     g('bp-utilities'),
        fixed_subscriptions: g('bp-subscriptions'),
        fixed_marketing:     g('bp-marketing-fixed'),
        fixed_other:         g('bp-fixed-other'),
        var_cogs_pct:        g('bp-cogs'),
        var_delivery_pct:    g('bp-delivery'),
        var_marketing_pct:   g('bp-marketing'),
        var_other_pct:       g('bp-var-other'),
        vat_enabled:         _vatEnabledNP,
        products: window.BP_PRODUCTS || [],
      };
      if (typeof saveProjectProfile === 'function') saveProjectProfile(projId, profile);
      window.__VAT_ENABLED__ = _vatEnabledNP;
      window._businessProfile = profile;
      if (statusEl) statusEl.textContent = '✅ تم الحفظ في ' + new Date().toLocaleTimeString('ar-SA');
      toast('✅ تم حفظ ملف المشروع');
      return;
    }
    // parseNum يتعامل مع الأرقام المنسّقة بفواصل ("5,000" → 5000) بخلاف parseFloat ("5,000" → 5)
    const g = id => parseNum(document.getElementById(id)?.value || '');
    const _vatEnabledDB = document.getElementById('bp-vat-enabled')?.checked === true;
    const profile = {
      user_id: user.id,
      biz_name:            document.getElementById('bp-name')?.value?.trim() || '',
      biz_type:            document.getElementById('bp-type')?.value?.trim() || '',
      city:                document.getElementById('bp-city')?.value?.trim() || '',
      fixed_rent:          g('bp-rent'),
      fixed_salaries:      g('bp-salaries'),
      fixed_utilities:     g('bp-utilities'),
      fixed_subscriptions: g('bp-subscriptions'),
      fixed_marketing:     g('bp-marketing-fixed'),
      fixed_other:         g('bp-fixed-other'),
      var_cogs_pct:        g('bp-cogs'),
      var_delivery_pct:    g('bp-delivery'),
      var_marketing_pct:   g('bp-marketing'),
      var_other_pct:       g('bp-var-other'),
      vat_enabled:         _vatEnabledDB,
      products: window.BP_PRODUCTS || [],
    };
    const { error } = await window.sb.from('business_profile')
      .upsert(profile, { onConflict: 'user_id' });
    if (error) throw error;
    window.__VAT_ENABLED__ = _vatEnabledDB;
    window._businessProfile = profile;
    if (statusEl) statusEl.textContent = '✅ تم الحفظ في ' + new Date().toLocaleTimeString('ar-SA');
    toast('✅ تم حفظ ملف المشروع');
  } catch(err) {
    console.error(err);
    if (statusEl) statusEl.textContent = '❌ خطأ في الحفظ';
    toast('❌ خطأ: ' + err.message);
  }
}
window.saveBusinessProfile = saveBusinessProfile;

// ══════════════════════════════════════════
// ONBOARDING — حفظ الإعداد الأولي
// ══════════════════════════════════════════
async function saveOnboarding() {
  const errEl = document.getElementById('ob-error');
  const btn   = document.getElementById('ob-save-btn');

  // تحقق من الحقول الإلزامية
  const name = document.getElementById('ob-name')?.value?.trim();
  const type = document.getElementById('ob-type')?.value;
  const showErr = (msg) => {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  };
  if (!name) { showErr('يرجى إدخال اسم المشروع'); return; }
  if (!type) { showErr('يرجى اختيار نوع النشاط'); return; }
  if (errEl) errEl.style.display = 'none';
  if (btn) { btn.textContent = 'جاري الحفظ...'; btn.disabled = true; }

  try {
    if (!window.sb) throw new Error('الاتصال غير جاهز');
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    const g = id => parseNum(document.getElementById(id)?.value || '');
    const profile = {
      user_id:             user.id,
      biz_name:            name,
      biz_type:            type,
      city:                document.getElementById('ob-city')?.value?.trim() || '',
      fixed_rent:          g('ob-rent'),
      fixed_salaries:      g('ob-salaries'),
      fixed_utilities:     g('ob-utilities'),
      fixed_marketing:     g('ob-marketing'),
      fixed_other:         g('ob-other'),
      fixed_subscriptions: 0,
      var_cogs_pct:        0,
      var_delivery_pct:    0,
      var_marketing_pct:   0,
      var_other_pct:       0,
      products:            [],
    };

    // upsert في business_profile
    const { error } = await window.sb.from('business_profile')
      .upsert(profile, { onConflict: 'user_id' });
    if (error) throw error;

    // تحديث onboarding_completed في profiles (اختياري — لا يوقف التطبيق إذا فشل)
    try {
      await window.sb.from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    } catch(_) {}

    // تحديث الكاش العالمي
    window._businessProfile = profile;
    window.__ONBOARDING_NEEDED__ = false;

    // ملء حقول page-profile بنفس القيم
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (val !== null && val !== undefined) ? val : '';
      el.dispatchEvent(new Event('input'));
    };
    set('bp-name',           profile.biz_name);
    set('bp-type',           profile.biz_type);
    set('bp-city',           profile.city);
    set('bp-rent',           profile.fixed_rent);
    set('bp-salaries',       profile.fixed_salaries);
    set('bp-utilities',      profile.fixed_utilities);
    set('bp-marketing-fixed',profile.fixed_marketing);
    set('bp-fixed-other',    profile.fixed_other);
    if (typeof calcBPFixed === 'function') calcBPFixed();

    // إخفاء الـ overlay
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'none';

    toast('🎉 مرحباً! تم إعداد مشروعك بنجاح');
  } catch(err) {
    console.error(err);
    if (errEl) { errEl.textContent = 'خطأ: ' + err.message; errEl.style.display = 'block'; }
    if (btn) { btn.textContent = 'حفظ وبدء استخدام النظام ←'; btn.disabled = false; }
  }
}
window.saveOnboarding = saveOnboarding;
