// ══════════════════════════════════════════════════════════════════════════
// plan-config.js — المرجع المركزي الوحيد لمنطق الخطط والتسعير في توكّد
// جميع ملفات الـ Frontend تقرأ من هذا الكائن فقط
// ══════════════════════════════════════════════════════════════════════════

window.PLAN_CONFIG = {

  // ── الأسعار ──────────────────────────────────────────────────────────────
  PRICE_ONE_TIME : 29,    // ريال — فتح نتائج تحليل واحد
  PRICE_MONTHLY  : 79,    // ريال / شهر — اشتراك كامل

  // ── حدود الاستخدام ────────────────────────────────────────────────────────
  //   free  : تحليل واحد مفتوح بالكامل (أول تحليل)، بعده النتائج مقفلة
  //   paid  : 8 تحليلات / شهر (مفتوحة بالكامل)، 3 رسائل CFO / يوم
  FREE_UNLOCKED_ANALYSES : 1,          // تحليل واحد مجاني مفتوح بالكامل
  FREE_ANALYSES_LIMIT    : Infinity,   // لا حد للإنشاء — القفل في العرض فقط
  PAID_ANALYSES_PER_MONTH: 8,          // تحليل / شهر
  PAID_CFO_PER_DAY       : 3,          // رسائل AI CFO / يوم (مشتركون فقط)

  // ── الميزات المتاحة لكل خطة ───────────────────────────────────────────────
  FEATURES: {
    free: [
      // يقدر يشغّل التحليل — النتائج الكاملة مقفلة حتى يدفع
      'analysis',
    ],
    one_time: [
      // فتح تقرير واحد فقط
      'analysis', 'health_score',
      'full_report', 'basic_report', 'advanced_report',
      'pdf_export',
    ],
    paid: [
      // جميع الميزات
      'analysis', 'health_score',
      'full_report', 'basic_report', 'advanced_report',
      'cfo_limited', 'cfo_full',
      'forecast', 'market_compare',
      'pdf_export', 'save_reports', 'compare_reports',
    ],
  },

  // ── بيانات وصفية لكل خطة ──────────────────────────────────────────────────
  PLAN_META: {
    free      : { label: 'الخطة المجانية', resultsLocked: true,  hasCFO: false, resetCycle: null      },
    one_time  : { label: 'فتح تقرير',      resultsLocked: false, hasCFO: false, resetCycle: null      },
    paid      : { label: 'الخطة المدفوعة', resultsLocked: false, hasCFO: true,  resetCycle: 'monthly' },
    pro       : { label: 'الخطة المدفوعة', resultsLocked: false, hasCFO: true,  resetCycle: 'monthly' },
    enterprise: { label: 'الخطة المدفوعة', resultsLocked: false, hasCFO: true,  resetCycle: 'monthly' },
  },

};

// pro / enterprise يرثان ميزات paid
window.PLAN_CONFIG.FEATURES.pro        = window.PLAN_CONFIG.FEATURES.paid;
window.PLAN_CONFIG.FEATURES.enterprise = window.PLAN_CONFIG.FEATURES.paid;

// ══════════════════════════════════════════════════════════════════════════
// getAccessUser() — يبني كائن المستخدم من الحالة الراهنة للجلسة
// يُستخدَم كمدخل لـ canAccessFeature()
// ══════════════════════════════════════════════════════════════════════════
window.getAccessUser = function () {
  return {
    // الخطة المُستردّة من قاعدة البيانات (أو 'free' كقيمة افتراضية)
    plan: window.__USER_PLAN__ || 'free',

    // هذا هو أول تحليل مجاني للمستخدم — يُعيّنه الـ API بعد نجاح التحليل
    isFirstFreeAnalysis: window.__FIRST_ANALYSIS__ === true,

    // دفع مرة واحدة في نفس الجلسة الحالية (قبل تحديث قاعدة البيانات)
    isPaidOneTime: !!(window.STATE?.isPaidOneTime || window.STATE?.plan === 'one_time'),
  };
};

// ══════════════════════════════════════════════════════════════════════════
// canAccessFeature(user, feature) — دالة التحكم في الصلاحيات
//
// المنطق (بالترتيب):
//   1. مشترك (paid / pro / enterprise)      → صلاحية كاملة دائماً
//   2. دفع مرة واحدة لهذا التحليل           → ميزات one_time فقط
//   3. مجاني في أول تحليل مجاني             → صلاحية كاملة مؤقتة (= one_time)
//   4. مجاني وانتهى حقه المجاني             → ميزات الخطة المجانية فقط (مقفلة)
//
// هذه الدالة هي المرجع الوحيد لكل قرار صلاحية في التطبيق.
// لا تُعدَّل الواجهة أو الـ Backend مباشرةً — بل تُعتمد هذه الدالة حصراً.
// ══════════════════════════════════════════════════════════════════════════
window.canAccessFeature = function (user, feature) {
  const C = window.PLAN_CONFIG;

  // ── 1. مشترك → صلاحية كاملة ───────────────────────────────────────────
  if (user.plan === 'paid' || user.plan === 'pro' || user.plan === 'enterprise') {
    const features = C.FEATURES[user.plan] || C.FEATURES.paid;
    return features.includes(feature);
  }

  // ── 2. دفع مرة واحدة في هذه الجلسة → ميزات one_time فقط ──────────────
  if (user.isPaidOneTime) {
    return C.FEATURES.one_time.includes(feature);
  }

  // ── 3. مجاني في أول تحليل مجاني → نفس ميزات one_time ─────────────────
  if (user.plan === 'free' && user.isFirstFreeAnalysis) {
    return C.FEATURES.one_time.includes(feature);
  }

  // ── 4. مجاني وانتهى حقه / خطة غير معروفة → الميزات المجانية فقط ──────
  const features = C.FEATURES[user.plan] || C.FEATURES.free;
  return features.includes(feature);
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
// (تُستخدَم في ai-cfo.js وأماكن أخرى تحتاج التحقق من الاشتراك فقط)
window.isPaidPlan = function (plan) {
  plan = plan || window.__USER_PLAN__ || 'free';
  return plan === 'paid' || plan === 'pro' || plan === 'enterprise';
};
