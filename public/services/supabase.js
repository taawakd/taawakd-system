// services/supabase.js — Supabase client + STATE + auth
// ✅ parseNum / getN / fmt مُعرَّفة في utils/helpers.js — لا تكرار هنا

const delay = ms => new Promise(r=>setTimeout(r,ms));

async function loadBusinessProfile() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data, error } = await sb.from('business_profile')
      .select('*').eq('user_id', user.id).single();
    if (error || !data) return;
    window._businessProfile = data;
    window.BP_PRODUCTS = data.products || [];
    // set + تشغيل input event لتفعيل تنسيق الأرقام وتحديث الإجماليات
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (val !== null && val !== undefined) ? val : '';
      el.dispatchEvent(new Event('input'));
    };
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
    // parseNum يتعامل مع الأرقام المنسّقة بفواصل ("5,000" → 5000) بخلاف parseFloat ("5,000" → 5)
    const g = id => parseNum(document.getElementById(id)?.value || '');
    const profile = {
      user_id: user.id,
      biz_name: document.getElementById('bp-name')?.value?.trim() || '',
      biz_type: document.getElementById('bp-type')?.value?.trim() || '',
      fixed_rent:          g('bp-rent'),
      fixed_salaries:      g('bp-salaries'),
      fixed_utilities:     g('bp-utilities'),
      fixed_subscriptions: g('bp-subscriptions'),
      fixed_other:         g('bp-fixed-other'),
      var_cogs_pct:        g('bp-cogs'),
      var_delivery_pct:    g('bp-delivery'),
      var_marketing_pct:   g('bp-marketing'),
      var_other_pct:       g('bp-var-other'),
      products: window.BP_PRODUCTS || [],
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
