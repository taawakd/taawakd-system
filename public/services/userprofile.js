// public/services/userprofile.js — User Profile Page Service
'use strict';

const PLAN_LABELS = {
  free:       'الخطة المجانية',
  pro:        'الخطة الاحترافية',
  enterprise: 'الخطة المؤسسية',
};

const PLAN_LIMITS = { free: 3, pro: 12, enterprise: null };

// ── Load & render profile ──────────────────────────────────
window.loadUserProfile = async function () {
  if (!window.sb || !window.__USER__) return;

  const userId = window.__USER__?.id || window.__USER__;
  const email  = window.__USER__?.email || '';

  // ── Set email (read-only) ──
  const emailEl = document.getElementById('up-email');
  if (emailEl) emailEl.value = email;

  // ── Avatar & display name from sidebar ──
  const sbName = document.getElementById('sbName')?.textContent || '';
  const upName = document.getElementById('up-display-name');
  const upEmail = document.getElementById('up-display-email');
  const upAvatarBig = document.getElementById('up-avatar-big');
  if (upName) upName.textContent = sbName || 'مستخدم';
  if (upEmail) upEmail.textContent = email;
  if (upAvatarBig) upAvatarBig.textContent = (sbName || email || 'م').charAt(0).toUpperCase();

  // ── Fetch profile from Supabase ──
  try {
    const { data: profile, error } = await window.sb
      .from('profiles')
      .select('full_name, plan, analyses_used, analyses_reset_at, subscription_end_date, company_name, business_type, city, phone, commercial_reg, tax_number')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Personal fields
    _setVal('up-full-name',  profile?.full_name    || '');
    _setVal('up-company',    profile?.company_name || '');
    _setVal('up-city',       profile?.city         || '');
    _setVal('up-phone',      profile?.phone        || '');
    _setVal('up-crn',        profile?.commercial_reg || '');
    _setVal('up-vat',        profile?.tax_number   || '');

    // Activity select
    const actEl = document.getElementById('up-activity');
    if (actEl && profile?.business_type) actEl.value = profile.business_type;

    // Update display name if we got it from DB
    if (profile?.full_name) {
      if (upName) upName.textContent = profile.full_name;
      if (upAvatarBig) upAvatarBig.textContent = profile.full_name.charAt(0).toUpperCase();
    }

    // ── Subscription info ──
    const plan = profile?.plan || 'free';
    const planEl    = document.getElementById('up-plan-name');
    const expiryEl  = document.getElementById('up-plan-expiry');
    const daysEl    = document.getElementById('up-plan-days');

    if (planEl) {
      planEl.textContent = PLAN_LABELS[plan] || plan;
      planEl.style.color = plan === 'enterprise' ? '#b06cf0' : plan === 'pro' ? '#5b8fcc' : 'var(--gold)';
    }

    // Expiry date & days remaining
    const endDate = profile?.subscription_end_date;
    if (endDate) {
      const end   = new Date(endDate);
      const now   = new Date();
      const days  = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (expiryEl) expiryEl.textContent = end.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
      if (daysEl) {
        daysEl.textContent = days > 0 ? `${days} يوم` : 'منتهي';
        daysEl.style.color = days <= 7 ? 'var(--red)' : days <= 30 ? 'var(--warn)' : 'var(--green)';
      }
    } else {
      if (expiryEl) expiryEl.textContent = plan === 'free' ? 'مجاني دائماً' : 'غير محدد';
      if (daysEl)   daysEl.textContent   = plan === 'free' ? '∞' : '—';
      if (daysEl && plan === 'free') daysEl.style.color = 'var(--gray2)';
    }

    // ── Usage bar (free & pro only) ──
    const limit = PLAN_LIMITS[plan];
    const used  = profile?.analyses_used || 0;
    const barWrap = document.getElementById('up-usage-bar-wrap');
    const usageText = document.getElementById('up-usage-text');
    const usageFill = document.getElementById('up-usage-fill');

    if (barWrap && limit !== null) {
      barWrap.style.display = 'block';
      if (usageText) usageText.textContent = `${used} / ${limit}`;
      const pct = Math.min((used / limit) * 100, 100);
      if (usageFill) {
        usageFill.style.width = pct + '%';
        usageFill.style.background = pct >= 100 ? 'var(--red)' : pct >= 75 ? 'var(--warn)' : 'var(--gold)';
      }
    }

  } catch (e) {
    console.warn('userprofile: could not load profile', e);
  }
};

// ── Save profile ───────────────────────────────────────────
window.saveUserProfile = async function () {
  if (!window.sb || !window.__USER__) return;

  const userId = window.__USER__?.id || window.__USER__;
  const btn = document.querySelector('#page-userprofile .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ…'; }

  const payload = {
    id:              userId,
    full_name:       _getVal('up-full-name'),
    company_name:    _getVal('up-company'),
    business_type:   document.getElementById('up-activity')?.value || '',
    city:            _getVal('up-city'),
    phone:           _getVal('up-phone'),
    commercial_reg:  _getVal('up-crn'),
    tax_number:      _getVal('up-vat'),
    updated_at:      new Date().toISOString(),
  };

  try {
    const { error } = await window.sb.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    // Update sidebar name
    const nameEl = document.getElementById('sbName');
    const avatarEl = document.getElementById('sbAvatar');
    const upName = document.getElementById('up-display-name');
    const upAvatarBig = document.getElementById('up-avatar-big');
    const name = payload.full_name || nameEl?.textContent || '';
    if (nameEl && name) nameEl.textContent = name;
    if (avatarEl && name) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (upName && name) upName.textContent = name;
    if (upAvatarBig && name) upAvatarBig.textContent = name.charAt(0).toUpperCase();

    // Show success
    const msgEl = document.getElementById('up-save-msg');
    if (msgEl) { msgEl.style.display = 'block'; setTimeout(() => { msgEl.style.display = 'none'; }, 3000); }
    if (typeof toast === 'function') toast('✅ تم حفظ البيانات بنجاح');

  } catch (e) {
    if (typeof toast === 'function') toast('⚠️ حدث خطأ أثناء الحفظ');
    console.error('saveUserProfile error:', e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ التغييرات'; }
  }
};

// ── Helpers ────────────────────────────────────────────────
function _setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function _getVal(id) {
  return (document.getElementById(id)?.value || '').trim();
}
