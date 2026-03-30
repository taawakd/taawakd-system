// ══════════════════════════════════════════════════════════════════════════
// vat-config.js — المرجع المركزي الوحيد لمنطق ضريبة القيمة المضافة في توكّد
// ══════════════════════════════════════════════════════════════════════════
//
// القواعد الأساسية:
// ─────────────────
// • النسبة ثابتة: 15%
// • window.__VAT_ENABLED__ = true/false — يُعيَّن من supabase.js أو toggle المستخدم
// • PRICES_INCLUDE_VAT = true (افتراضي) → الأسعار المُدخَلة شاملة للضريبة
//   → نخرج الضريبة بقسمة الإيراد على 1.15 للحصول على صافي الإيراد
//
// الصيغ (وضع الشامل — الافتراضي):
// ──────────────────────────────────
//   المستخدم يُدخل الإيراد الإجمالي (شامل الضريبة)
//   vatAmount    = grossRevenue - (grossRevenue / 1.15)
//   netRevenue   = grossRevenue / 1.15
//   vatPct       = vatAmount / grossRevenue × 100
//   netProfit    = netRevenue - totalExpenses
// ══════════════════════════════════════════════════════════════════════════

window.VAT_CONFIG = {
  RATE:              0.15,   // 15% — ثابت بموجب نظام الزكاة والضريبة والجمارك
  RATE_PCT:          15,     // للعرض في الـ UI
  PRICES_INCLUDE_VAT: true,  // الافتراضي: الأسعار المُدخَلة شاملة للضريبة
};

// ── هل الضريبة مفعّلة للمشروع الحالي؟ ──────────────────────────────────
// يُقرأ من window.__VAT_ENABLED__ الذي يُعيَّنه supabase.js أو toggle المستخدم
window.vatIsEnabled = function () {
  return window.__VAT_ENABLED__ === true;
};

// ── هل الوضع "شامل الضريبة"؟ (الافتراضي نعم) ──────────────────────────
window.vatIsInclusive = function () {
  return window.vatIsEnabled() && (window.VAT_CONFIG.PRICES_INCLUDE_VAT !== false);
};

// ── حساب الضريبة والإيراد الصافي (وضع الشامل) ──────────────────────────
// grossRevenue: الإيراد الإجمالي كما أدخله المستخدم (شامل الضريبة)
// الإخراج: { netRevenue, vatAmount, vatPct }
window.calcVATInclusive = function (grossRevenue) {
  if (!window.vatIsInclusive() || !(grossRevenue > 0)) {
    return { netRevenue: grossRevenue, vatAmount: 0, vatPct: 0 };
  }
  const netRevenue = grossRevenue / (1 + window.VAT_CONFIG.RATE);  // ÷ 1.15
  const vatAmount  = grossRevenue - netRevenue;
  const vatPct     = grossRevenue > 0 ? parseFloat(((vatAmount / grossRevenue) * 100).toFixed(2)) : 0;
  return { netRevenue, vatAmount, vatPct };
};

// ── حساب جميع أرقام الضريبة دفعة واحدة ─────────────────────────────────
// الإدخال: grossRevenue (شامل الضريبة إذا PRICES_INCLUDE_VAT=true)
// الإخراج: { vatEnabled, vatInclusive, grossRevenue, netRevenue, vatAmount, vatPct }
window.calcVAT = function (grossRevenue, totalExpenses) {
  const enabled   = window.vatIsEnabled();
  const inclusive = enabled && (window.VAT_CONFIG.PRICES_INCLUDE_VAT !== false);

  if (!enabled) {
    return {
      vatEnabled: false, vatInclusive: false,
      grossRevenue, netRevenue: grossRevenue,
      vatAmount: 0, vatPct: 0,
      // compat fields (old API)
      vatOutput: 0, vatInput: 0, netVAT: 0,
    };
  }

  if (inclusive) {
    const { netRevenue, vatAmount, vatPct } = window.calcVATInclusive(grossRevenue);
    return {
      vatEnabled: true, vatInclusive: true,
      grossRevenue, netRevenue, vatAmount, vatPct,
      // compat fields
      vatOutput: vatAmount, vatInput: (totalExpenses || 0) * window.VAT_CONFIG.RATE,
      netVAT: vatAmount - ((totalExpenses || 0) * window.VAT_CONFIG.RATE),
    };
  }

  // وضع الحصري (exclusive) — الأسعار بدون ضريبة
  const vatOutput = grossRevenue * window.VAT_CONFIG.RATE;
  const vatInput  = (totalExpenses || 0) * window.VAT_CONFIG.RATE;
  return {
    vatEnabled: true, vatInclusive: false,
    grossRevenue, netRevenue: grossRevenue,
    vatAmount: vatOutput, vatPct: window.VAT_CONFIG.RATE_PCT,
    vatOutput, vatInput, netVAT: vatOutput - vatInput,
  };
};
