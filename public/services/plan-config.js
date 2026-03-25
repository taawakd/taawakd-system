// ══════════════════════════════════════════════════════════════════════════
// plan-config.js — المرجع المركزي الوحيد لمنطق الخطط والتسعير في توكّد
// جميع ملفات الـ Frontend تقرأ من هذا الكائن فقط
// ══════════════════════════════════════════════════════════════════════════

window.PLAN_CONFIG = {

  // ── الأسعار ──────────────────────────────────────────────────────────────
  PRICE_MONTHLY              : 79,   // ريال / شهر — الاشتراك الوحيد المتاح
  ONE_TIME_PRICE_SUBSCRIBER  : 19,   // ريال — تحليل إضافي للمشترك بعد الوصول للحد
  ONE_TIME_PRICE_NON_SUBSCRIBER: 29, // ريال — تحليل واحد لغير المشترك

  // ── التجربة المجانية (7 أيام) ───────────────────────────────────────────────
  TRIAL_DAYS             : 7,   // عدد أيام التجربة
  TRIAL_ANALYSES_PER_DAY : 1,   // تحليل واحد / يوم خلال التجربة
  TRIAL_CFO_PER_DAY      : 3,   // رسائل AI CFO / يوم خلال التجربة

  // ── حدود الاستخدام (للمشتركين — 79 ريال/شهر) ────────────────────────────
  //   trial : 1 تحليل / يوم | 3 رسائل CFO / يوم
  //   paid  : 8 تحليلات / شهر | 5 رسائل CFO / يوم
  //   بعد الوصول للحد الشهري: تحليل إضافي بـ 19 ريال
  //   غير مشترك بعد التجربة: تحليل واحد بـ 29 ريال
  PAID_ANALYSES_PER_MONTH: 8,   // تحليل / شهر
  PAID_CFO_PER_DAY       : 5,   // رسائل AI CFO / يوم (مشتركون فقط)

  // ── الميزات المتاحة لكل خطة ───────────────────────────────────────────────
  FEATURES: {
    free: [
      // لا ميزات — كل شيء مقفل بعد انتهاء التجربة
    ],
    paid: [
      // جميع الميزات — اشتراك نشط أو تجربة مجانية نشطة
      'analysis', 'health_score',
      'full_report', 'basic_report', 'advanced_report',
      'cfo_limited', 'cfo_full',
      'forecast', 'market_compare',
      'pdf_export', 'save_reports', 'compare_reports',
    ],
  },

  // ── بيانات وصفية لكل خطة ──────────────────────────────────────────────────
  PLAN_META: {
    free    : { label: 'الخطة المجانية', resultsLocked: true,  hasCFO: false, resetCycle: null      },
    paid    : { label: 'الخطة المدفوعة', resultsLocked: false, hasCFO: true,  resetCycle: 'monthly' },
  },

};

// ══════════════════════════════════════════════════════════════════════════
// normalizePlan(rawPlan) — الحقيقة الوحيدة لقيم الخطط
//
// قاعدة البيانات تخزّن: 'free' | 'pro' | 'enterprise' | 'paid'
// الـ Frontend يتعامل فقط مع: 'free' | 'paid'
//
// الحلّ: نعيد تعيين كل قيمة خارجية إلى إحدى القيمتين
// ── 'pro' و 'enterprise' و 'paid'  →  'paid'  (مشترك)
// ── أي قيمة أخرى (أو فارغة)       →  'free'
// ══════════════════════════════════════════════════════════════════════════
window.normalizePlan = function (rawPlan) {
  if (rawPlan === 'paid' || rawPlan === 'pro' || rawPlan === 'enterprise') return 'paid';
  return 'free';
};

// ══════════════════════════════════════════════════════════════════════════
// isTrialActive(trialStartedAt) — هل التجربة المجانية لا تزال سارية؟
//
// trialStartedAt: ISO string أو null
// يعيد true إذا كان الوقت المنقضي منذ البدء ≤ TRIAL_DAYS
// ══════════════════════════════════════════════════════════════════════════
window.isTrialActive = function (trialStartedAt) {
  if (!trialStartedAt) return false;
  const startMs  = new Date(trialStartedAt).getTime();
  const nowMs    = Date.now();
  const elapsedDays = (nowMs - startMs) / (1000 * 60 * 60 * 24);
  return elapsedDays <= window.PLAN_CONFIG.TRIAL_DAYS;
};

// ══════════════════════════════════════════════════════════════════════════
// getAccessUser() — يبني كائن المستخدم من الحالة الراهنة للجلسة
// يُستخدَم كمدخل لـ canAccessFeature()
// يُطبَّق normalizePlan هنا دائماً — حتى لو خُزِّن __USER_PLAN__ بقيمة خام
// ══════════════════════════════════════════════════════════════════════════
window.getAccessUser = function () {
  const rawPlan = window.__USER_PLAN__ || 'free';
  return {
    // دائماً إحدى القيمتين: 'free' | 'paid'
    plan: window.normalizePlan(rawPlan),

    // هل التجربة المجانية نشطة؟ — يُعيَّن من API بعد نجاح التحليل أو من بيانات الجلسة
    isTrialActive: window.isTrialActive(window.__TRIAL_STARTED_AT__ || null),

    // المشرف — وصول كامل دائماً بدون قيود
    isAdmin: !!(window.__IS_ADMIN__),
  };
};

// ══════════════════════════════════════════════════════════════════════════
// canAccessFeature(user, feature) — دالة التحكم في الصلاحيات
//
// المنطق (بالترتيب):
//   0. مشرف (user.isAdmin)               → true دائماً بدون استثناء
//   1. مشترك (user.plan === 'paid')      → true دائماً لكل الميزات
//   2. تجربة مجانية نشطة                 → true لكل الميزات
//   3. منتهية التجربة / غير مشترك        → false لكل الميزات
//
// user.plan يجب أن يكون مُسوَّى بـ normalizePlan() قبل الاستدعاء.
// هذه الدالة هي المرجع الوحيد لكل قرار صلاحية في التطبيق.
// ══════════════════════════════════════════════════════════════════════════
window.canAccessFeature = function (user, feature) {

  // ─────────────── DEBUG LOG ────────────────────────────────────────────
  console.log(
    '[Tawakkad][access] plan=%s | feature=%s | trialActive=%s | isAdmin=%s',
    user.plan, feature, user.isTrialActive, user.isAdmin
  );
  // ─────────────────────────────────────────────────────────────────────

  // ── 0. مشرف → وصول كامل دائماً ────────────────────────────────────────
  if (user.isAdmin) {
    console.log('[Tawakkad][access] ADMIN → granted');
    return true;
  }

  // ── ميزات مرئية دائماً (التقارير السابقة) ─────────────────────────────
  // المشترك يقدر يطلع على تقاريره السابقة حتى لو وصل للحد
  const READ_ONLY_FEATURES = ['save_reports', 'view_reports'];
  if (READ_ONLY_FEATURES.includes(feature) && (user.plan === 'paid' || user.isTrialActive)) {
    console.log('[Tawakkad][access] READ_ONLY → granted for', feature);
    return true;
  }

  // ── 1. مشترك → true لكل الميزات ──────────────────────────────────────
  // ملاحظة: حدود الاستخدام (8 تحليلات، 5 CFO) تُطبَّق على مستوى الـ API
  // هنا نسمح بالوصول للواجهة، والـ backend هو من يرفض عند تجاوز الحد
  if (user.plan === 'paid') {
    console.log('[Tawakkad][access] SUBSCRIBED → granted');
    return true;
  }

  // ── 2. تجربة مجانية نشطة → true لكل الميزات ──────────────────────────
  // ملاحظة: حد CFO (3 رسائل/يوم) للتجربة يُطبَّق على مستوى الـ API
  if (user.isTrialActive) {
    console.log('[Tawakkad][access] TRIAL_ACTIVE → granted');
    return true;
  }

  // ── 3. انتهت التجربة / غير مشترك → مقفل تماماً ───────────────────────
  console.log('[Tawakkad][access] LOCKED → denied for', feature);
  return false;
};

// ══════════════════════════════════════════════════════════════════════════
// planAllows(feature) — واجهة متوافقة مع الكود القديم
// جميع استدعاءات planAllows() في بقية الملفات تمرّ عبر هذه الدالة
// التي تبني كائن المستخدم تلقائياً وتستدعي canAccessFeature()
// ══════════════════════════════════════════════════════════════════════════
window.planAllows = function (feature) {
  return window.canAccessFeature(window.getAccessUser(), feature);
};

// ── هل الخطة مدفوعة باشتراك؟ ─────────────────────────────────────────────
// (تُستخدَم في أماكن تحتاج التحقق من الاشتراك فقط — مثل ai-cfo.js)
window.isPaidPlan = function (plan) {
  return window.normalizePlan(plan || window.__USER_PLAN__ || 'free') === 'paid';
};
