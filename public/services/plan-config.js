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
      // جميع الميزات — اشتراك نشط (paid / pro / enterprise كلها تُعامَل كـ paid)
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
    one_time: { label: 'فتح تقرير',      resultsLocked: false, hasCFO: false, resetCycle: null      },
    paid    : { label: 'الخطة المدفوعة', resultsLocked: false, hasCFO: true,  resetCycle: 'monthly' },
  },

};

// ══════════════════════════════════════════════════════════════════════════
// normalizePlan(rawPlan) — الحقيقة الوحيدة لقيم الخطط
//
// قاعدة البيانات تخزّن: 'free' | 'pro' | 'enterprise' | 'one_time' | 'paid'
// الـ Frontend يتعامل فقط مع: 'free' | 'one_time' | 'paid'
//
// الحلّ: نعيد تعيين كل قيمة خارجية إلى إحدى القيم الثلاث
// ── 'pro' و 'enterprise' و 'paid'  →  'paid'  (مشترك)
// ── 'one_time'                     →  'one_time'
// ── أي قيمة أخرى (أو فارغة)       →  'free'
// ══════════════════════════════════════════════════════════════════════════
window.normalizePlan = function (rawPlan) {
  if (rawPlan === 'paid' || rawPlan === 'pro' || rawPlan === 'enterprise') return 'paid';
  if (rawPlan === 'one_time') return 'one_time';
  return 'free';
};

// ══════════════════════════════════════════════════════════════════════════
// getAccessUser() — يبني كائن المستخدم من الحالة الراهنة للجلسة
// يُستخدَم كمدخل لـ canAccessFeature()
// يُطبَّق normalizePlan هنا دائماً — حتى لو خُزِّن __USER_PLAN__ بقيمة خام
// ══════════════════════════════════════════════════════════════════════════
window.getAccessUser = function () {
  const rawPlan = window.__USER_PLAN__ || 'free';
  return {
    // دائماً إحدى القيم الثلاث: 'free' | 'one_time' | 'paid'
    plan: window.normalizePlan(rawPlan),

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
//   1. مشترك (user.plan === 'paid')      → true دائماً لكل الميزات
//   2. دفع مرة واحدة لهذا التحليل       → ميزات one_time فقط
//   3. مجاني في أول تحليل مجاني         → صلاحية كاملة مؤقتة (= one_time)
//   4. مجاني وانتهى حقه المجاني         → ميزات free فقط (مقفلة)
//
// user.plan يجب أن يكون مُسوَّى بـ normalizePlan() قبل الاستدعاء.
// هذه الدالة هي المرجع الوحيد لكل قرار صلاحية في التطبيق.
// ══════════════════════════════════════════════════════════════════════════
window.canAccessFeature = function (user, feature) {
  const C = window.PLAN_CONFIG;

  // ─────────────── DEBUG LOG ────────────────────────────────────────────
  console.log(
    '[Tawakkad][access] plan=%s | feature=%s | firstFree=%s | oneTime=%s',
    user.plan, feature, user.isFirstFreeAnalysis, user.isPaidOneTime
  );
  // ─────────────────────────────────────────────────────────────────────

  // ── 1. مشترك → true لكل الميزات بدون استثناء ─────────────────────────
  if (user.plan === 'paid') {
    console.log('[Tawakkad][access] SUBSCRIBED → granted');
    return true;
  }

  // ── 2. دفع مرة واحدة في هذه الجلسة → ميزات one_time فقط ──────────────
  if (user.isPaidOneTime) {
    const result = C.FEATURES.one_time.includes(feature);
    console.log('[Tawakkad][access] ONE_TIME →', result, 'for', feature);
    return result;
  }

  // ── 3. مجاني في أول تحليل مجاني → نفس ميزات one_time ─────────────────
  if (user.plan === 'free' && user.isFirstFreeAnalysis) {
    const result = C.FEATURES.one_time.includes(feature);
    console.log('[Tawakkad][access] FIRST_FREE →', result, 'for', feature);
    return result;
  }

  // ── 4. مجاني وانتهى حقه / خطة غير معروفة → الميزات المجانية فقط ──────
  const features = C.FEATURES[user.plan] || C.FEATURES.free;
  const result = features.includes(feature);
  console.log('[Tawakkad][access] LOCKED →', result, 'for', feature);
  return result;
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
