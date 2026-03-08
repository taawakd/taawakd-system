// services/supabase.js — Supabase client + STATE + auth


// ══════════════════════════════════════════
// BENCHMARKS DATA
// ══════════════════════════════════════════
const BENCHMARKS = {
  restaurant: {
    label: 'مطعم',
    netMargin:   { min: 10, max: 18, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 70, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 6,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 22, max: 35, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 28, max: 40, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  cafe: {
    label: 'مقهى / كافيه',
    netMargin:   { min: 18, max: 32, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 8,  max: 15, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 18, max: 28, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  juice_kiosk: {
    label: 'كيوسك عصائر',
    netMargin:   { min: 20, max: 35, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  bakery: {
    label: 'مخبز / حلويات',
    netMargin:   { min: 12, max: 22, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 72, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 20, max: 30, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  food_truck: {
    label: 'فود ترك',
    netMargin:   { min: 15, max: 25, label: 'هامش الربح الصافي' },
    grossMargin: { min: 60, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 5,  label: 'نسبة الإيجار / موقع', lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  retail: {
    label: 'متجر تجزئة',
    netMargin:   { min: 10, max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 50, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 20, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 50, max: 70, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 5,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  services: {
    label: 'خدمات',
    netMargin:   { min: 20, max: 40, label: 'هامش الربح الصافي' },
    grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 3,  max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 30, max: 50, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 20, max: 40, label: 'تكلفة الخدمة',        lowerIsBetter: true },
    mktPct:      { min: 5,  max: 12, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  barber: {
    label: 'حلاقة وتجميل',
    netMargin:   { min: 18, max: 30, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 10, max: 18, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 25, max: 40, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 15, max: 30, label: 'تكلفة اللوازم',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  ecom: {
    label: 'تجارة إلكترونية',
    netMargin:   { min: 8,  max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 55, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 3,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 45, max: 65, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 10, max: 20, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
};

// ══════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════
const parseNum = v => parseFloat(String(v||'').replace(/[,،\s]/g,'')) || 0;
const getN = id => parseNum(document.getElementById(id)?.value);
const fmt = n => {
  const a = Math.abs(n);
  if(a>=1e6) return (n/1e6).toFixed(1)+'م';
  if(a>=1e3) return (n/1e3).toFixed(1)+'ك';
  return Math.round(n).toLocaleString('ar-SA');
};
const delay = ms => new Promise(r=>setTimeout(r,ms));


async function loadBusinessProfile() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data, error } = await sb.from('business_profile')
      .select('*').eq('user_id', user.id).single();
    if (error || !data) return;
    window._businessProfile = data;
    BP_PRODUCTS = data.products || [];
    // ملء الحقول
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('bp-name', data.biz_name);
    set('bp-type', data.biz_type);
    set('bp-rent', data.fixed_rent);
    set('bp-salaries', data.fixed_salaries);
    set('bp-utilities', data.fixed_utilities);
    set('bp-subscriptions', data.fixed_subscriptions);
    set('bp-fixed-other', data.fixed_other);
    set('bp-cogs', data.var_cogs_pct);
    set('bp-delivery', data.var_delivery_pct);
    set('bp-marketing', data.var_marketing_pct);
    set('bp-var-other', data.var_other_pct);
    calcBPFixed();
    renderBPProducts();
  } catch(e) { console.warn('loadBusinessProfile:', e); }
}
window.loadBusinessProfile = loadBusinessProfile;

async function saveBusinessProfile() {
  const statusEl = document.getElementById('bp-save-status');
  if (statusEl) statusEl.textContent = 'جاري الحفظ...';
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { toast('يجب تسجيل الدخول أولاً'); return; }
    const profile = {
      user_id: user.id,
      biz_name: document.getElementById('bp-name')?.value || '',
      biz_type: document.getElementById('bp-type')?.value || '',
      fixed_rent:          parseFloat(document.getElementById('bp-rent')?.value)          || 0,
      fixed_salaries:      parseFloat(document.getElementById('bp-salaries')?.value)      || 0,
      fixed_utilities:     parseFloat(document.getElementById('bp-utilities')?.value)     || 0,
      fixed_subscriptions: parseFloat(document.getElementById('bp-subscriptions')?.value) || 0,
      fixed_other:         parseFloat(document.getElementById('bp-fixed-other')?.value)   || 0,
      var_cogs_pct:        parseFloat(document.getElementById('bp-cogs')?.value)          || 0,
      var_delivery_pct:    parseFloat(document.getElementById('bp-delivery')?.value)      || 0,
      var_marketing_pct:   parseFloat(document.getElementById('bp-marketing')?.value)     || 0,
      var_other_pct:       parseFloat(document.getElementById('bp-var-other')?.value)     || 0,
      products: BP_PRODUCTS,
    };
    const { error } = await sb.from('business_profile')
      .upsert(profile, { onConflict: 'user_id' });
    if (error) throw error;
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
