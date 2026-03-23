// ══════════════════════════════════════════════════════════════════════════
// vat-config.js — المرجع المركزي الوحيد لمنطق ضريبة القيمة المضافة في توكّد
// ══════════════════════════════════════════════════════════════════════════
//
// القواعد الأساسية:
// ─────────────────
// • النسبة ثابتة: 15%
// • window.__VAT_ENABLED__ = true/false — يُعيَّن من supabase.js عند تحميل ملف المشروع
// • الأرباح تُحسب دائماً بدون ضريبة (ex-VAT)
// • الضريبة تُتتبع بشكل منفصل: vatOutput و vatInput و netVAT
//
// الصيغ:
// ──────
//   المستخدم يُدخل الأرقام بدون ضريبة (أسعار صافية)
//   vatOutput = revenue × 0.15          ← ضريبة المبيعات (على الزبائن)
//   vatInput  = totalExpenses × 0.15    ← ضريبة المشتريات (المسترجعة)
//   netVAT    = vatOutput - vatInput    ← المستحق لهيئة الزكاة والضريبة
//   الربح     = revenue - totalExpenses ← لا تتغير بالضريبة أبداً
// ══════════════════════════════════════════════════════════════════════════

window.VAT_CONFIG = {
  RATE: 0.15,         // 15% — ثابت بموجب نظام الزكاة والضريبة والجمارك
  RATE_PCT: 15,       // للعرض في الـ UI
};

// ── هل الضريبة مفعّلة للمشروع الحالي؟ ──────────────────────────────────
// يُقرأ من window.__VAT_ENABLED__ الذي يُعيَّنه supabase.js
window.vatIsEnabled = function () {
  return window.__VAT_ENABLED__ === true;
};

// ── حساب ضريبة المبيعات (Output VAT) ────────────────────────────────────
// revenue: الإيراد الصافي بدون ضريبة (المُدخَل من المستخدم)
// → تُضاف الضريبة فوق السعر: vatOutput = revenue × 15%
window.calcVATOutput = function (revenue) {
  if (!window.vatIsEnabled()) return 0;
  return revenue * window.VAT_CONFIG.RATE;
};

// ── حساب ضريبة المشتريات (Input VAT) ────────────────────────────────────
// totalExpenses: إجمالي المصاريف بدون ضريبة (المُدخَلة من المستخدم)
// → تُضاف الضريبة فوق التكلفة: vatInput = totalExpenses × 15%
window.calcVATInput = function (totalExpenses) {
  if (!window.vatIsEnabled()) return 0;
  return totalExpenses * window.VAT_CONFIG.RATE;
};

// ── صافي الضريبة المستحقة لهيئة الزكاة والضريبة والجمارك ───────────────
// netVAT = vatOutput - vatInput
// إذا موجب → مديون للهيئة | إذا سالب → مسترجع من الهيئة
window.calcNetVAT = function (vatOutput, vatInput) {
  if (!window.vatIsEnabled()) return 0;
  return vatOutput - vatInput;
};

// ── حساب جميع أرقام الضريبة دفعة واحدة ─────────────────────────────────
// الإدخال: revenue (ex-VAT), totalExpenses (ex-VAT)
// الإخراج: { vatEnabled, vatOutput, vatInput, netVAT }
window.calcVAT = function (revenue, totalExpenses) {
  const enabled    = window.vatIsEnabled();
  const vatOutput  = enabled ? revenue       * window.VAT_CONFIG.RATE : 0;
  const vatInput   = enabled ? totalExpenses * window.VAT_CONFIG.RATE : 0;
  const netVAT     = enabled ? vatOutput - vatInput : 0;
  return { vatEnabled: enabled, vatOutput, vatInput, netVAT };
};
