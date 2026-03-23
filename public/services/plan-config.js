// ══════════════════════════════════════════════════════════════════════════
// plan-config.js — المرجع المركزي الوحيد لمنطق الخطط والتسعير في توكّد
// جميع ملفات الـ Frontend تقرأ من هذا الكائن فقط
// ══════════════════════════════════════════════════════════════════════════

window.PLAN_CONFIG = {

  // ── الأسعار ──────────────────────────────────────────────────────────────
  PRICE_ONE_TIME : 29,    // ريال — فتح نتائج تحليل واحد
  PRICE_MONTHLY  : 79,    // ريال / شهر — اشتراك كامل

  // ── حدود الاستخدام ────────────────────────────────────────────────────────
  //   free  : يقدر يشغّل تحليلات بدون حد، لكن النتائج مقفلة دائماً
  //   paid  : 8 تحليلات / شهر (مفتوحة بالكامل)، 3 رسائل CFO / يوم
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

// ── هل الخطة مدفوعة باشتراك؟ ─────────────────────────────────────────────
window.isPaidPlan = function (plan) {
  plan = plan || window.__USER_PLAN__ || 'free';
  return plan === 'paid' || plan === 'pro' || plan === 'enterprise';
};

// ══════════════════════════════════════════════════════════════════════════
// planAllows(feature) — الدالة المركزية للتحقق من صلاحية الميزة
// تحلّ محلّ أي منطق متفرق في بقية الملفات
// ══════════════════════════════════════════════════════════════════════════
window.planAllows = function (feature) {
  // أولوية: دفع one_time في نفس الجلسة
  if (window.STATE?.isPaidOneTime || window.STATE?.plan === 'one_time') {
    return (window.PLAN_CONFIG.FEATURES.one_time).includes(feature);
  }
  const plan = window.__USER_PLAN__ || 'free';
  const features = window.PLAN_CONFIG.FEATURES[plan] || window.PLAN_CONFIG.FEATURES.free;
  return features.includes(feature);
};
