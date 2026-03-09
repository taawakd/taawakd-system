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
      fixed_rent: parseFloat(document.getElementById('bp-rent')?.value) || 0,
      fixed_salaries: parseFloat(document.getElementById('bp-salaries')?.value) || 0,
      fixed_utilities: parseFloat(document.getElementById('bp-utilities')?.value) || 0,
      fixed_subscriptions: parseFloat(document.getElementById('bp-subscriptions')?.value) || 0,
      fixed_other: parseFloat(document.getElementById('bp-fixed-other')?.value) || 0,
      var_cogs_pct: parseFloat(document.getElementById('bp-cogs')?.value) || 0,
      var_delivery_pct: parseFloat(document.getElementById('bp-delivery')?.value) || 0,
      var_marketing_pct: parseFloat(document.getElementById('bp-marketing')?.value) || 0,
      var_other_pct: parseFloat(document.getElementById('bp-var-other')?.value) || 0,
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
