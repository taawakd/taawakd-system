// public/services/userprofile.js — User Profile Page Service
'use strict';

// ── رقم واتساب للتواصل (عدّله برقم الشركة الفعلي) ──────────────
const WHATSAPP_NUMBER = '966XXXXXXXXX'; // ← غيّر هذا الرقم

const PLAN_LABELS = {
  free:       'الخطة المجانية',
  paid:       'الخطة المدفوعة',
  pro:        'الخطة المدفوعة',        // توافق مع الحسابات القديمة
  enterprise: 'الخطة المدفوعة',        // توافق مع الحسابات القديمة
};

const PLAN_LIMITS = { free: 3, paid: null, pro: null, enterprise: null };

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

    // ── Cache plan globally for plans page ──
    window.__USER_PLAN__ = profile?.plan || 'free';

    // ── Subscription info ──
    const plan = profile?.plan || 'free';
    const planEl    = document.getElementById('up-plan-name');
    const expiryEl  = document.getElementById('up-plan-expiry');
    const daysEl    = document.getElementById('up-plan-days');

    if (planEl) {
      planEl.textContent = PLAN_LABELS[plan] || plan;
      const isPaid = window.isPaidPlan ? window.isPaidPlan(plan) : (plan === 'paid' || plan === 'pro' || plan === 'enterprise');
      planEl.style.color = isPaid ? '#5b8fcc' : 'var(--gold)';
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
      const isFree = plan === 'free';
      if (expiryEl) expiryEl.textContent = isFree ? 'فترة تجريبية' : 'غير محدد';
      if (daysEl)   daysEl.textContent   = isFree ? '—' : '—';
      if (daysEl && isFree) daysEl.style.color = 'var(--gray2)';
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
  const btn = document.querySelector('#page-userprofile [onclick="saveUserProfile()"]');
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

// ── Plans Page ─────────────────────────────────────────────
const _PLAN_LABELS_MAP = {
  free: 'الخطة المجانية',
  paid: 'الخطة المدفوعة',
  pro:  'الخطة المدفوعة',        // توافق مع الحسابات القديمة
  enterprise: 'الخطة المدفوعة',  // توافق مع الحسابات القديمة
};

// قيم الخطط الافتراضية — خطتان فقط: مجانية ومدفوعة
const _DEFAULT_PLANS = {
  free: { price: 0,  limit: 3,    label: 'مجاني' },
  paid: { price: 79, limit: -1,   label: 'مدفوع' },
};

window.initPlansPage = async function () {
  // ── 1. جلب خطة المستخدم الحالية ─────────────────────────────
  if (!window.__USER_PLAN__ && window.sb && window.__USER__) {
    try {
      const userId = window.__USER__?.id || window.__USER__;
      const { data } = await window.sb.from('profiles').select('plan').eq('id', userId).single();
      if (data?.plan) window.__USER_PLAN__ = data.plan;
    } catch(e) { /* تجاهل — نستخدم الافتراضي */ }
  }

  const plan = window.__USER_PLAN__ || 'free';

  // ── 2. جلب بيانات الخطط من قاعدة البيانات ──────────────────
  let plansData = { ..._DEFAULT_PLANS };
  if (window.sb) {
    try {
      const { data: rows } = await window.sb.from('plans').select('id,price_monthly,analyses_limit,name_ar').eq('is_active', true);
      if (rows?.length) {
        rows.forEach(r => {
          if (plansData[r.id]) {
            plansData[r.id].price = r.price_monthly ?? plansData[r.id].price;
            plansData[r.id].limit = r.analyses_limit ?? plansData[r.id].limit;
            if (r.name_ar) plansData[r.id].label = r.name_ar;
          }
        });
      }
    } catch(e) { /* تجاهل — نستخدم القيم الافتراضية */ }
  }

  // ── 3. تحديث السعر وحد التحليلات في كل بطاقة ───────────────
  ['free', 'paid'].forEach(pid => {
    const pd = plansData[pid];
    if (!pd) return;
    const amountEl = document.querySelector(`#plan-card-${pid} .plans-amount`);
    const limitLi  = document.querySelector(`#plan-card-${pid} .plans-features li:first-child`);
    if (amountEl) amountEl.textContent = pd.price > 0 ? pd.price : '0';
    if (limitLi) {
      if (pid === 'free') limitLi.textContent = `✅ حتى ${pd.limit} تحليلات تجريبية (لا تتجدد)`;
      else limitLi.textContent = '✅ تحليلات غير محدودة';
    }
  });

  // ── 4. تحديث بادج الخطة الحالية ─────────────────────────────
  const badge = document.getElementById('plans-current-badge');
  if (badge) badge.textContent = _PLAN_LABELS_MAP[plan] || plan;

  // ── 5. تمييز البطاقة الحالية (نعامل pro/enterprise كـ paid) ───
  const displayPlan = (plan === 'pro' || plan === 'enterprise') ? 'paid' : plan;
  ['free', 'paid'].forEach(p => {
    const card = document.getElementById('plan-card-' + p);
    const btn  = document.getElementById('plan-btn-' + p);
    if (!card || !btn) return;
    if (p === displayPlan) {
      card.style.borderColor = 'var(--gold-b)';
      btn.disabled = true;
      btn.textContent = '✅ خطتك الحالية';
      btn.className = 'plans-btn plans-btn-ghost';
    } else {
      btn.disabled = false;
      if (p === 'free') { btn.textContent = '⬇️ تخفيض الخطة'; btn.className = 'plans-btn plans-btn-ghost'; }
      if (p === 'paid') { btn.textContent = '⚡ اشترك الآن';   btn.className = 'plans-btn plans-btn-primary'; }
    }
  });
};

window.selectPlan = function (plan) {
  const current    = window.__USER_PLAN__ || 'free';
  const displayCur = (current === 'pro' || current === 'enterprise') ? 'paid' : current;
  if (plan === displayCur) return;

  if (plan === 'free') {
    if (typeof toast === 'function') toast('📬 تواصل معنا على واتساب لتعديل خطتك');
    return;
  }

  if (plan === 'paid') {
    // توجيه لواتساب أو بوابة الدفع
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('أريد الاشتراك في الخطة المدفوعة لـ توكّد'), '_blank');
    return;
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
