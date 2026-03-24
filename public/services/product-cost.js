// ════════════════════════════════════════════════════════════════
// product-cost.js — حاسبة تكلفة المنتج
// ════════════════════════════════════════════════════════════════

// ── escape helper — تمنع XSS عند تضمين اسم المنتج في innerHTML ──
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── مفتاح التخزين الخاص بالمشروع الحالي ──────────────────────
function _pcStorageKey() {
  const projId = window.__CURRENT_PROJECT_ID__ || 'default';
  return typeof projectProductCostsKey === 'function'
    ? projectProductCostsKey(projId)
    : 'tw_product_costs';
}

// ── الحالة العامة ──────────────────────────────────────────────
var PC_STATE = {
  products: JSON.parse(localStorage.getItem(_pcStorageKey()) || '[]'),
};
var PC_TARGET_MARGIN = 40; // الهامش المستهدف الافتراضي
window.PC_STATE = PC_STATE;

// ── معايير الهوامش الصحية حسب نوع النشاط ──────────────────────
var PC_BENCHMARKS = {
  'مشروب':               { min: 55, good: 70, label: 'مشروب' },
  'طعام':                { min: 35, good: 55, label: 'طعام'  },
  'خدمة':                { min: 50, good: 65, label: 'خدمة'  },
  'منتج بيع بالتجزئة':  { min: 25, good: 45, label: 'تجزئة' },
};

// ── قراءة المكونات من الجدول ────────────────────────────────────
function pcGetIngredients() {
  return [...document.querySelectorAll('.pc-ing-row')].map(row => {
    const ins = row.querySelectorAll('input');
    const qty      = parseNum(ins[1]?.value || '');
    const unitCost = parseNum(ins[3]?.value || '');
    return {
      name:     ins[0]?.value?.trim() || '',
      qty,
      unit:     ins[2]?.value?.trim() || '',
      unitCost,
      total:    qty * unitCost,
    };
  }).filter(r => r.name || r.unitCost > 0);
}

// ── قراءة التكاليف التشغيلية ────────────────────────────────────
function pcGetOpCosts() {
  const ids = ['pc-rent','pc-salaries','pc-elec','pc-water','pc-internet','pc-maintenance','pc-marketing','pc-op-other'];
  return ids.reduce((s, id) => s + parseNum(document.getElementById(id)?.value || ''), 0);
}

// ── تحديث إجماليات صفوف المكونات ────────────────────────────────
function pcUpdateIngTotals() {
  document.querySelectorAll('.pc-ing-row').forEach(row => {
    const ins  = row.querySelectorAll('input');
    const qty  = parseNum(ins[1]?.value || '');
    const cost = parseNum(ins[3]?.value || '');
    const tot  = row.querySelector('.pc-ing-total');
    if (tot) tot.textContent = (qty * cost).toFixed(2);
  });
}

// ── الحساب الرئيسي ─────────────────────────────────────────────
function calcProductCost() {
  pcUpdateIngTotals();

  // نوع المنتج: من حقل pc-type، وإذا فارغ → نوع الفئة الافتراضي بناءً على biz_type (لا 'طعام' ثابت)
  const _bpTypeForCalc = window._businessProfile?.biz_type;
  const productType   = document.getElementById('pc-type')?.value ||
    (typeof window.getCategoryDefaultType === 'function'
      ? window.getCategoryDefaultType(_bpTypeForCalc)
      : (_bpTypeForCalc ? 'خدمة' : 'خدمة'));
  console.log('[Tawakkad][calcPC] biz_type=%s → productType=%s', _bpTypeForCalc, productType);
  const salePrice     = parseNum(document.getElementById('pc-price')?.value || '');
  const sugPrice      = parseNum(document.getElementById('pc-suggested-price')?.value || '');
  const monthlySales  = parseNum(document.getElementById('pc-monthly-sales')?.value || '');
  const dailySales    = parseNum(document.getElementById('pc-daily-sales')?.value || '');

  // تحويل اليومي → شهري
  const actualSales = monthlySales || (dailySales * 30);
  const convEl = document.getElementById('pc-daily-converted');
  if (convEl) {
    convEl.textContent = (!monthlySales && dailySales > 0)
      ? `← تعادل ${Math.round(actualSales)} وحدة شهرياً`
      : '';
  }

  // مكونات
  const ingredients   = pcGetIngredients();
  const ingCost       = ingredients.reduce((s, r) => s + r.total, 0);

  // إجمالي المكونات
  const ingTotalEl = document.getElementById('pc-ing-total');
  if (ingTotalEl) ingTotalEl.innerHTML = '﷼ ' + ingCost.toFixed(2);

  const ingPctEl = document.getElementById('pc-ing-pct');
  if (ingPctEl) {
    const pctVal = salePrice > 0 ? (ingCost / salePrice * 100).toFixed(1) : 0;
    ingPctEl.textContent = salePrice > 0 ? pctVal + '% من سعر البيع' : '—';
    ingPctEl.style.color = pctVal > 60 ? 'var(--red)' : pctVal > 40 ? 'var(--warn)' : 'var(--green)';
  }

  // تكاليف تشغيلية
  const opTotal       = pcGetOpCosts();
  const opTotalEl     = document.getElementById('pc-op-total');
  if (opTotalEl) opTotalEl.innerHTML = '﷼ ' + fmt(opTotal);

  const projectSales  = parseNum(document.getElementById('pc-project-sales')?.value || '');
  const productRev    = salePrice * actualSales;
  const sharePct      = (projectSales > 0 && productRev > 0) ? productRev / projectSales : 0;
  const productOpShare= opTotal * sharePct;
  const opPerUnit     = actualSales > 0 ? productOpShare / actualSales : 0;

  // التكلفة الحقيقية
  const trueCost      = ingCost + opPerUnit;
  const profitPerUnit = salePrice - trueCost;
  const margin        = salePrice > 0 ? (profitPerUnit / salePrice * 100) : 0;
  const monthlyProfit = profitPerUnit * actualSales;

  // نقطة التعادل: التكاليف الثابتة المخصصة / (سعر - تكلفة المكونات)
  const contribPerUnit = salePrice - ingCost;
  const beUnits = contribPerUnit > 0 ? Math.ceil(productOpShare / contribPerUnit) : Infinity;

  // معيار النشاط — الاحتياطي 'خدمة' بدلاً من 'طعام' لمنع تسرب معايير المطاعم
  const bench = PC_BENCHMARKS[productType] || PC_BENCHMARKS['خدمة'] || PC_BENCHMARKS['طعام'];

  // السعر المقترح لهامش مستهدف
  const targetRatio  = PC_TARGET_MARGIN / 100;
  const suggestedCalc = targetRatio < 1 && trueCost > 0 ? trueCost / (1 - targetRatio) : 0;

  // تحديث واجهة النتائج
  _pcSetResults({
    ingCost, opPerUnit, trueCost, profitPerUnit, margin, monthlyProfit,
    beUnits, actualSales, sharePct, bench, suggestedCalc,
    salePrice, sugPrice, productOpShare, ingCost,
  });

  // التنبيهات
  _pcUpdateAlerts({ salePrice, trueCost, margin, bench, suggestedCalc });

  // جدول تأثير تغيير السعر
  _pcPriceImpactTable(salePrice, trueCost, actualSales);

  // جدول تأثير تغيير المبيعات
  _pcSalesImpactTable(profitPerUnit, actualSales);

  // نقطة التعادل مقارنة بالمبيعات
  const beVsEl = document.getElementById('res-be-vs-sales');
  if (beVsEl) {
    if (beUnits === Infinity || actualSales === 0) {
      beVsEl.textContent = '—';
      beVsEl.style.color = 'var(--gray)';
    } else if (actualSales >= beUnits) {
      const surplus = Math.round(actualSales - beUnits);
      beVsEl.textContent = `فائض ${surplus} وحدة ✅`;
      beVsEl.style.color = 'var(--green)';
    } else {
      const deficit = Math.round(beUnits - actualSales);
      beVsEl.textContent = `تحتاج ${deficit} وحدة إضافية ⚠️`;
      beVsEl.style.color = 'var(--warn)';
    }
  }
}

// قالب القفل المشترك للحاسبة
function _pcLockHTML(label) {
  return `<span style="color:var(--gray);font-size:12px;cursor:pointer;" onclick="showUpgradeModal('حاسبة التكاليف الكاملة', 'paid')">🔒 ${label||''}</span>`;
}

// قفل الأقسام التفصيلية عند الخطة المجانية
function _pcLockDetailSections() {
  const _sectionLock = `
    <div style="position:relative;border-radius:12px;overflow:hidden;margin:8px 0;">
      <div style="filter:blur(3px);pointer-events:none;opacity:0.25;padding:20px;background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.05);border-radius:12px;">
        <div style="height:10px;background:rgba(255,255,255,0.1);border-radius:4px;margin-bottom:8px;width:60%;"></div>
        <div style="height:8px;background:rgba(255,255,255,0.07);border-radius:4px;width:80%;"></div>
      </div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px;">
        <span style="font-size:16px;">🔒</span>
        <button onclick="showUpgradeModal('التفاصيل الكاملة', 'paid')"
          style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">
          فتح التحليل الكامل
        </button>
      </div>
    </div>`;
  ['pc-alerts','pc-price-impact-table','pc-sales-impact-table','pc-comparison'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = _sectionLock;
  });
}

// ── تحديث حقول النتائج ─────────────────────────────────────────
function _pcSetResults(d) {
  const setEl    = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  const setColor = (id, c)   => { const e = document.getElementById(id); if (e) e.style.color = c; };

  // الهامش يُعرض دائماً
  setEl('res-margin', d.margin.toFixed(1) + '%');
  setColor('res-margin', d.margin >= d.bench.min ? 'var(--green)' : d.margin >= 0 ? 'var(--warn)' : 'var(--red)');

  // تقييم الربحية — عنوان فقط (بدون أرقام)
  let rating = '—', rColor = 'var(--gray)';
  if (d.salePrice > 0) {
    if      (d.margin >= d.bench.good)        { rating = '⭐ ممتاز';  rColor = 'var(--green)'; }
    else if (d.margin >= d.bench.min)         { rating = '✅ صحي';    rColor = 'var(--green)'; }
    else if (d.margin >= d.bench.min * 0.6)  { rating = '⚠️ ضعيف';  rColor = 'var(--warn)';  }
    else                                      { rating = '🔴 خطر';   rColor = 'var(--red)';   }
  }
  const rEl = document.getElementById('res-rating');
  if (rEl) { rEl.textContent = rating; rEl.style.color = rColor; }

  // ── فحص الصلاحية: مشترك أو تجربة نشطة → كامل | منتهية → مقفل ──
  const _pcUser   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _pcAccess = window.canAccessFeature ? window.canAccessFeature(_pcUser, 'full_report') : planAllows('full_report');
  console.log('[Tawakkad][productCost] plan=%s | trialActive=%s | access=%s',
    _pcUser.plan, _pcUser.isTrialActive, _pcAccess);

  if (!_pcAccess) {
    const _lock = (id) => { const e = document.getElementById(id); if (e) { e.innerHTML = _pcLockHTML(); e.style.color = ''; } };
    _lock('res-ing-cost'); _lock('res-op-cost-unit'); _lock('res-true-cost');
    _lock('res-profit-unit'); _lock('res-monthly-profit'); _lock('res-be-units');
    _lock('res-product-share'); _lock('res-sales-count'); _lock('res-suggested-price');
    const beVsEl = document.getElementById('res-be-vs-sales');
    if (beVsEl) { beVsEl.innerHTML = _pcLockHTML(); beVsEl.style.color = ''; }
    _pcLockDetailSections();
    return;
  }

  // ── نتائج كاملة للخطط المدفوعة ──────────────────────────────
  setEl('res-ing-cost',      d.ingCost.toFixed(2) + ' ﷼');
  setEl('res-op-cost-unit',  d.opPerUnit.toFixed(2) + ' ﷼');
  setEl('res-true-cost',     d.trueCost.toFixed(2) + ' ﷼');

  setEl('res-profit-unit',   (d.profitPerUnit >= 0 ? '+' : '') + d.profitPerUnit.toFixed(2) + ' ﷼');
  setColor('res-profit-unit', d.profitPerUnit >= 0 ? 'var(--green)' : 'var(--red)');

  setEl('res-monthly-profit', fmt(Math.round(d.monthlyProfit)) + ' ﷼');
  setColor('res-monthly-profit', d.monthlyProfit >= 0 ? 'var(--green)' : 'var(--red)');

  setEl('res-be-units', d.beUnits === Infinity ? '—' : d.beUnits.toLocaleString('ar-SA'));
  setEl('res-product-share', (d.sharePct * 100).toFixed(1) + '%');
  setEl('res-sales-count', d.actualSales > 0 ? Math.round(d.actualSales) + ' وحدة' : '—');
  setEl('res-suggested-price', d.suggestedCalc > 0 ? d.suggestedCalc.toFixed(2) + ' ﷼' : '—');
}

// ── التنبيهات ──────────────────────────────────────────────────
function _pcUpdateAlerts({ salePrice, trueCost, margin, bench, suggestedCalc }) {
  const container = document.getElementById('pc-alerts');
  if (!container) return;
  const alerts = [];

  if (salePrice > 0 && trueCost > 0 && salePrice < trueCost) {
    alerts.push({ cls: 'danger', icon: '🔴',
      msg: `سعر البيع (${salePrice} ﷼) أقل من التكلفة الحقيقية (${trueCost.toFixed(2)} ﷼) — أنت تخسر على كل وحدة!` });
  }
  if (salePrice > 0 && margin < bench.min && margin >= 0) {
    alerts.push({ cls: 'warn', icon: '⚠️',
      msg: `هامش ${margin.toFixed(1)}% أقل من الحد الصحي لنشاطك (${bench.min}%) — راجع التسعير أو خفّض التكلفة` });
  }
  if (salePrice > 0 && margin < 0) {
    alerts.push({ cls: 'danger', icon: '💸',
      msg: 'هامش الربح سالب! كل وحدة تبيعها تزيد خسارتك — أوقف البيع وراجع التكاليف فوراً' });
  }
  if (suggestedCalc > 0 && salePrice > 0) {
    const diff = suggestedCalc - salePrice;
    if (diff > 1) {
      alerts.push({ cls: 'info', icon: '💡',
        msg: `لتحقيق هامش ${PC_TARGET_MARGIN}%، ارفع السعر إلى ${suggestedCalc.toFixed(2)} ﷼ (زيادة ${diff.toFixed(2)} ﷼ فقط)` });
    } else if (margin >= PC_TARGET_MARGIN) {
      alerts.push({ cls: 'good', icon: '✅',
        msg: `هامشك (${margin.toFixed(1)}%) أعلى من الهدف (${PC_TARGET_MARGIN}%) — سعرك مناسب جداً!` });
    }
  }
  if (!alerts.length && salePrice <= 0) {
    container.innerHTML = '<div style="color:var(--gray);font-size:13px;text-align:center;padding:10px">أدخل البيانات لرؤية التنبيهات</div>';
    return;
  }

  container.innerHTML = alerts.map(a =>
    `<div class="alert alert-${a.cls}"><span class="alert-icon">${a.icon}</span><span>${a.msg}</span></div>`
  ).join('');
}

// ── جدول تأثير تغيير السعر ─────────────────────────────────────
function _pcPriceImpactTable(salePrice, trueCost, actualSales) {
  const container = document.getElementById('pc-price-impact-table');
  if (!container || salePrice <= 0 || actualSales <= 0) {
    if (container) container.innerHTML = '<div style="color:var(--gray);text-align:center;padding:8px;font-size:12px">أدخل السعر والمبيعات لرؤية التأثير</div>';
    return;
  }
  const changes = [-20, -10, -5, 0, +5, +10, +20];
  const rows = changes.map(pct => {
    const newPrice  = salePrice * (1 + pct / 100);
    const newProfit = (newPrice - trueCost) * actualSales;
    const newMargin = newPrice > 0 ? ((newPrice - trueCost) / newPrice * 100) : 0;
    const color     = newProfit >= 0 ? 'var(--green)' : 'var(--red)';
    const badge     = pct === 0 ? ' style="background:var(--gold-d);color:var(--gold);font-weight:700"' : '';
    return `<tr${badge}>
      <td style="padding:5px 8px;color:${pct > 0 ? 'var(--green)' : pct < 0 ? 'var(--red)' : 'var(--gold)'};font-weight:600">${pct === 0 ? 'الحالي' : (pct > 0 ? '+' : '') + pct + '%'}</td>
      <td style="padding:5px 8px;text-align:center;color:var(--white)">${newPrice.toFixed(2)} ﷼</td>
      <td style="padding:5px 8px;text-align:center;color:${newMargin>=0?'var(--gray2)':'var(--red)'}">${newMargin.toFixed(1)}%</td>
      <td style="padding:5px 8px;text-align:center;color:${color};font-weight:700">${Math.round(newProfit).toLocaleString('ar-SA')} ﷼</td>
    </tr>`;
  });
  container.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr style="color:#666;border-bottom:1px solid #222">
      <th style="padding:5px 8px;text-align:right">التغيير</th>
      <th style="padding:5px 8px;text-align:center">السعر الجديد</th>
      <th style="padding:5px 8px;text-align:center">الهامش</th>
      <th style="padding:5px 8px;text-align:center">الربح الشهري</th>
    </tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

// ── جدول تأثير تغيير المبيعات ──────────────────────────────────
function _pcSalesImpactTable(profitPerUnit, actualSales) {
  const container = document.getElementById('pc-sales-impact-table');
  if (!container) return;
  if (actualSales <= 0 || profitPerUnit === 0) {
    container.innerHTML = '<div style="color:var(--gray);text-align:center;padding:12px;font-size:12px">أدخل المبيعات وبيانات المنتج لرؤية التأثير</div>';
    return;
  }
  const multiples = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const rows = multiples.map(m => {
    const sales      = Math.round(actualSales * m);
    const monthly    = profitPerUnit * sales;
    const color      = monthly >= 0 ? 'var(--green)' : 'var(--red)';
    const badge      = m === 1 ? ' style="background:var(--gold-d)"' : '';
    const label      = m === 1 ? 'الحالي' : m < 1 ? `انخفاض ${Math.round((1-m)*100)}%` : `نمو ${Math.round((m-1)*100)}%`;
    return `<tr${badge}>
      <td style="padding:7px 10px;color:${m > 1 ? 'var(--green)' : m < 1 ? 'var(--warn)' : 'var(--gold)'};font-size:12px">${label}</td>
      <td style="padding:7px 10px;text-align:center;color:var(--white);font-size:12px">${sales.toLocaleString('ar-SA')} وحدة</td>
      <td style="padding:7px 10px;text-align:center;color:${color};font-weight:700;font-size:13px">${Math.round(monthly).toLocaleString('ar-SA')} ﷼</td>
    </tr>`;
  });
  container.innerHTML = `<table style="width:100%;border-collapse:collapse">
    <thead><tr style="color:#666;font-size:11px;border-bottom:1px solid #222">
      <th style="padding:7px 10px;text-align:right">السيناريو</th>
      <th style="padding:7px 10px;text-align:center">المبيعات</th>
      <th style="padding:7px 10px;text-align:center">الربح الشهري</th>
    </tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

// ── إضافة صف مكوّن ─────────────────────────────────────────────
function addIngredient() {
  const container = document.getElementById('pc-ingredients');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'pc-ing-row';
  row.style.cssText = 'display:grid;grid-template-columns:2fr 0.8fr 0.8fr 1fr 0.8fr auto;gap:5px;margin-bottom:5px;align-items:center;';
  row.innerHTML = `
    <input class="input" placeholder="اسم المكوّن (مثال: حليب)" oninput="calcProductCost()" style="font-size:12px;padding:6px 8px">
    <input class="input" type="number" min="0" step="0.01" placeholder="الكمية" oninput="calcProductCost()" style="font-size:12px;padding:6px 8px">
    <input class="input" placeholder="وحدة (كجم)" oninput="calcProductCost()" style="font-size:12px;padding:6px 8px">
    <input class="input" type="number" min="0" step="0.01" placeholder="تكلفة/وحدة" oninput="calcProductCost()" style="font-size:12px;padding:6px 8px">
    <span class="pc-ing-total" style="color:var(--gold);font-weight:700;font-size:13px;text-align:center;display:block">0.00</span>
    <button onclick="this.closest('.pc-ing-row').remove();calcProductCost();" style="background:var(--red-d);border:1px solid rgba(217,95,95,0.2);color:var(--red);border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">×</button>
  `;
  container.appendChild(row);
  row.querySelector('input')?.focus();
}

// ── حفظ المنتج ─────────────────────────────────────────────────
function saveProductCost() {
  const _sv1User   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _sv1Access = window.canAccessFeature ? window.canAccessFeature(_sv1User, 'save_reports') : planAllows('save_reports');
  console.log('[Tawakkad][saveProduct] plan=%s | trialActive=%s | access=%s',
    _sv1User.plan, _sv1User.isTrialActive, _sv1Access);
  if (!_sv1Access) {
    showUpgradeModal('حفظ المنتجات وتعديلها', 'paid');
    return;
  }
  const name = document.getElementById('pc-name')?.value?.trim();
  if (!name) { toast('أدخل اسم المنتج أولاً'); return; }

  const monthlySales = parseNum(document.getElementById('pc-monthly-sales')?.value || '') ||
                       parseNum(document.getElementById('pc-daily-sales')?.value || '') * 30;

  const productData = {
    id:           (PC_STATE.products.find(p => p.name === name)?.id) || Date.now().toString(),
    name,
    type:         document.getElementById('pc-type')?.value ||
                  (typeof window.getCategoryDefaultType === 'function'
                    ? window.getCategoryDefaultType(window._businessProfile?.biz_type)
                    : 'خدمة'),
    salePrice:    parseNum(document.getElementById('pc-price')?.value || ''),
    suggestedPrice: parseNum(document.getElementById('pc-suggested-price')?.value || ''),
    monthlySales,
    ingredients:  pcGetIngredients(),
    opCosts: {
      rent:        parseNum(document.getElementById('pc-rent')?.value || ''),
      salaries:    parseNum(document.getElementById('pc-salaries')?.value || ''),
      elec:        parseNum(document.getElementById('pc-elec')?.value || ''),
      water:       parseNum(document.getElementById('pc-water')?.value || ''),
      internet:    parseNum(document.getElementById('pc-internet')?.value || ''),
      maintenance: parseNum(document.getElementById('pc-maintenance')?.value || ''),
      marketing:   parseNum(document.getElementById('pc-marketing')?.value || ''),
      other:       parseNum(document.getElementById('pc-op-other')?.value || ''),
    },
    projectTotalSales: parseNum(document.getElementById('pc-project-sales')?.value || ''),
    targetMargin: PC_TARGET_MARGIN,
    // خزّن التكلفة الحقيقية المحسوبة — تُستخدم عند الاستيراد لنموذج التحليل المالي
    trueCost:     parseNum(document.getElementById('res-true-cost')?.textContent?.replace(/[^0-9.]/g, '') || '') || undefined,
    savedAt:      new Date().toISOString(),
  };

  const idx = PC_STATE.products.findIndex(p => p.id === productData.id);
  if (idx >= 0) PC_STATE.products[idx] = productData;
  else PC_STATE.products.push(productData);

  localStorage.setItem(_pcStorageKey(), JSON.stringify(PC_STATE.products));

  const statusEl = document.getElementById('pc-save-status');
  if (statusEl) statusEl.textContent = '✅ تم الحفظ في ' + new Date().toLocaleTimeString('ar-SA');

  pcSyncToDB();
  renderProductComparison();
  toast('✅ تم حفظ المنتج: ' + name);
  // حدّث زر الاستيراد في نموذج التحليل المالي
  if (typeof window._updateImportBtn === 'function') window._updateImportBtn();
}

// ── مزامنة مع Supabase ──────────────────────────────────────────
async function pcSyncToDB() {
  try {
    if (!window.sb) return;
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // 1. حفظ البيانات التفصيلية (المكونات وغيرها) في business_profile
    await window.sb.from('business_profile').upsert(
      { user_id: user.id, product_costs: PC_STATE.products },
      { onConflict: 'user_id' }
    );

    // 2. مزامنة selling_price + cost مع جدول products الجديد
    if (typeof updateProductInDB === 'function' && window._PRODUCTS?.length) {
      for (const p of PC_STATE.products) {
        // البحث بالاسم في الجدول الجديد
        const match = window._PRODUCTS.find(dp => dp.name.toLowerCase() === (p.name||'').toLowerCase());
        if (match) {
          await updateProductInDB(match.id, {
            selling_price: p.salePrice   || match.selling_price,
            cost:          p.trueCost    || match.cost,
          });
        }
      }
    }
  } catch(e) { console.warn('product-cost DB sync:', e); }
}

// ── تحميل من Supabase ───────────────────────────────────────────
async function pcLoadFromDB() {
  try {
    if (!window.sb) return;
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return;

    // 1. تحميل البيانات التفصيلية من business_profile
    const { data, error } = await window.sb.from('business_profile')
      .select('product_costs').eq('user_id', user.id).single();
    if (!error && Array.isArray(data?.product_costs) && data.product_costs.length) {
      PC_STATE.products = data.product_costs;
      localStorage.setItem(_pcStorageKey(), JSON.stringify(PC_STATE.products));
    }

    // 2. Pre-populate بالمنتجات من جدول products إذا لم تكن موجودة في PC_STATE
    if (typeof loadProductsFromDB === 'function') {
      const dbProds = await loadProductsFromDB();
      if (dbProds.length && PC_STATE.products.length === 0) {
        // تحويل products → PC_STATE format (بدون مكونات، فقط الأساسيات)
        // نوع المنتج: من category المخزن، وإذا فارغ → نوع الفئة الافتراضي (لا 'طعام' ثابت)
        const _bpTypeForLoad = window._businessProfile?.biz_type;
        const _catDefault = typeof window.getCategoryDefaultType === 'function'
          ? window.getCategoryDefaultType(_bpTypeForLoad)
          : 'خدمة';  // الاحتياطي الآمن — لا 'طعام' ثابت
        console.log('[Tawakkad][pcLoadFromDB] bizType=%s → using default type=%s for products without category',
          _bpTypeForLoad, _catDefault);
        PC_STATE.products = dbProds.map(p => ({
          id:          p.id,
          name:        p.name,
          salePrice:   p.selling_price,
          trueCost:    p.cost,
          type:        p.category || _catDefault,
          ingredients: [],
          opCosts:     {},
          monthlySales: 0,
        }));
        localStorage.setItem(_pcStorageKey(), JSON.stringify(PC_STATE.products));
      }
    }
  } catch(e) { console.warn('product-cost DB load:', e); }
}

// ── تحميل منتج في النموذج ──────────────────────────────────────
function loadProductToForm(p) {
  if (!p) return;
  const _sv2User   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _sv2Access = window.canAccessFeature ? window.canAccessFeature(_sv2User, 'save_reports') : planAllows('save_reports');
  console.log('[Tawakkad][editProduct] plan=%s | trialActive=%s | access=%s',
    _sv2User.plan, _sv2User.isTrialActive, _sv2Access);
  if (!_sv2Access) {
    showUpgradeModal('تعديل المنتجات وحفظها', 'paid');
    return;
  }
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.value = (val !== undefined && val !== null) ? val : ''; el.dispatchEvent(new Event('input')); }
  };
  set('pc-name',            p.name);
  set('pc-type',            p.type);
  set('pc-price',           p.salePrice);
  set('pc-suggested-price', p.suggestedPrice || '');
  set('pc-monthly-sales',   p.monthlySales);
  if (p.opCosts) {
    set('pc-rent',        p.opCosts.rent);
    set('pc-salaries',    p.opCosts.salaries);
    set('pc-elec',        p.opCosts.elec);
    set('pc-water',       p.opCosts.water);
    set('pc-internet',    p.opCosts.internet);
    set('pc-maintenance', p.opCosts.maintenance);
    set('pc-marketing',   p.opCosts.marketing);
    set('pc-op-other',    p.opCosts.other);
  }
  set('pc-project-sales', p.projectTotalSales || '');
  if (p.targetMargin) {
    PC_TARGET_MARGIN = p.targetMargin;
    const slider = document.getElementById('pc-target-margin');
    const label  = document.getElementById('pc-target-margin-val');
    if (slider) slider.value = PC_TARGET_MARGIN;
    if (label)  label.textContent = PC_TARGET_MARGIN + '%';
  }
  // تحميل المكونات
  const container = document.getElementById('pc-ingredients');
  if (container) {
    container.innerHTML = '';
    (p.ingredients || []).forEach(ing => {
      addIngredient();
      const rows = container.querySelectorAll('.pc-ing-row');
      const row  = rows[rows.length - 1];
      const ins  = row.querySelectorAll('input');
      if (ins[0]) ins[0].value = ing.name;
      if (ins[1]) ins[1].value = ing.qty;
      if (ins[2]) ins[2].value = ing.unit;
      if (ins[3]) ins[3].value = ing.unitCost;
    });
  }
  calcProductCost();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── تكرار منتج ─────────────────────────────────────────────────
function duplicateProduct(id) {
  const _sv2User   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _sv2Access = window.canAccessFeature ? window.canAccessFeature(_sv2User, 'save_reports') : planAllows('save_reports');
  console.log('[Tawakkad][editProduct] plan=%s | trialActive=%s | access=%s',
    _sv2User.plan, _sv2User.isTrialActive, _sv2Access);
  if (!_sv2Access) {
    showUpgradeModal('تعديل المنتجات وحفظها', 'paid');
    return;
  }
  const p = PC_STATE.products.find(x => x.id === id);
  if (!p) return;
  loadProductToForm({ ...p, name: p.name + ' (نسخة)', id: Date.now().toString() });
  const nameEl = document.getElementById('pc-name');
  if (nameEl) nameEl.focus();
  toast('📋 نسخة المنتج محمّلة — عدّل الاسم واحفظ');
}

// ── حذف منتج محفوظ ─────────────────────────────────────────────
function deleteProductCost(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  PC_STATE.products = PC_STATE.products.filter(p => p.id !== id);
  localStorage.setItem(_pcStorageKey(), JSON.stringify(PC_STATE.products));
  pcSyncToDB();
  renderProductComparison();
  toast('تم حذف المنتج');
}

// ── مقارنة المنتجات ─────────────────────────────────────────────
function renderProductComparison() {
  const container = document.getElementById('pc-comparison');
  if (!container) return;
  if (!PC_STATE.products.length) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:13px">احفظ منتجات لمقارنتها هنا</div>';
    return;
  }

  // احسب بيانات كل منتج
  const computed = PC_STATE.products.map(p => {
    const ingCost   = (p.ingredients || []).reduce((s, i) => s + (i.total || i.qty * i.unitCost || 0), 0);
    const opTotal   = p.opCosts ? Object.values(p.opCosts).reduce((s, v) => s + (v || 0), 0) : 0;
    const sales     = p.monthlySales || 0;
    const rev       = p.salePrice * sales;
    const sharePct  = p.projectTotalSales > 0 ? rev / p.projectTotalSales : 0;
    const opShare   = opTotal * sharePct;
    const opUnit    = sales > 0 ? opShare / sales : 0;
    const trueCost  = ingCost + opUnit;
    const profit    = p.salePrice - trueCost;
    const margin    = p.salePrice > 0 ? (profit / p.salePrice * 100) : 0;
    const mProfit   = profit * sales;
    return { ...p, ingCost, trueCost, profit, margin, mProfit };
  }).sort((a, b) => b.margin - a.margin);

  const medals = ['🥇', '🥈', '🥉'];
  const rows   = computed.map((p, i) => {
    const mc = p.margin >= 40 ? '#4caf82' : p.margin >= 20 ? '#d4af37' : '#d95f5f';
    return `<tr style="background:${i % 2 === 0 ? '#111' : '#0d0d0d'}">
      <td style="padding:8px;color:#eee;font-weight:500">${medals[i] || ''} ${_esc(p.name)}</td>
      <td style="padding:8px;text-align:center;color:#aaa;font-size:12px">${p.type}</td>
      <td style="padding:8px;text-align:center;color:var(--gold)">${p.salePrice} ﷼</td>
      <td style="padding:8px;text-align:center;color:#aaa;font-size:12px">${p.trueCost.toFixed(2)} ﷼</td>
      <td style="padding:8px;text-align:center;color:${p.profit >= 0 ? '#4caf82' : '#d95f5f'}">${p.profit.toFixed(2)} ﷼</td>
      <td style="padding:8px;text-align:center;color:${mc};font-weight:700">${p.margin.toFixed(1)}%</td>
      <td style="padding:8px;text-align:center;color:${p.mProfit >= 0 ? '#4caf82' : '#d95f5f'}">${Math.round(p.mProfit).toLocaleString('ar-SA')} ﷼</td>
      <td style="padding:8px;text-align:center">
        <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
          <button onclick="loadProductToForm(PC_STATE.products.find(x=>x.id==='${p.id}'))"
            style="background:var(--gold-d);border:1px solid var(--gold-b);color:var(--gold);border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer">تعديل</button>
          <button onclick="duplicateProduct('${p.id}')"
            style="background:var(--blue-d);border:1px solid rgba(91,143,204,0.2);color:var(--blue);border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer">نسخ</button>
          <button onclick="deleteProductCost('${p.id}')"
            style="background:var(--red-d);border:1px solid rgba(217,95,95,0.2);color:var(--red);border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer">🗑</button>
        </div>
      </td>
    </tr>`;
  });

  container.innerHTML = `<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#1a1a1a;color:#888">
        <th style="padding:8px;text-align:right;border-bottom:1px solid #222">المنتج</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">النوع</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">السعر</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">التكلفة الحقيقية</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">الربح/وحدة</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">الهامش%</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">الربح الشهري</th>
        <th style="padding:8px;text-align:center;border-bottom:1px solid #222">إجراءات</th>
      </tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  </div>`;
}

// ── تحديث الهامش المستهدف ──────────────────────────────────────
function updateTargetMargin(val) {
  PC_TARGET_MARGIN = parseInt(val) || 40;
  const label = document.getElementById('pc-target-margin-val');
  if (label) label.textContent = PC_TARGET_MARGIN + '%';
  calcProductCost();
}

// ── حساب وحدات لربح مستهدف ─────────────────────────────────────
function calcUnitsForProfit() {
  const targetProfit = parseNum(document.getElementById('pc-target-profit')?.value || '');
  const profitUnitEl = document.getElementById('res-profit-unit');
  const profitPerUnit = profitUnitEl
    ? parseNum(profitUnitEl.textContent.replace(/[^\d.\-]/g, ''))
    : 0;
  const resEl = document.getElementById('res-units-for-profit');
  if (!resEl) return;
  if (profitPerUnit > 0 && targetProfit > 0) {
    const units = Math.ceil(targetProfit / profitPerUnit);
    resEl.textContent = units.toLocaleString('ar-SA') + ' وحدة';
    resEl.style.color = 'var(--green)';
  } else if (profitPerUnit <= 0) {
    resEl.textContent = 'سعّر أعلى من التكلفة أولاً';
    resEl.style.color = 'var(--red)';
  } else {
    resEl.textContent = '—';
  }
}

// ── تصدير PDF — نفس أسلوب financial.js: HTML مضمّن + html2canvas ─
async function exportProductCostPDF() {
  const productName = document.getElementById('pc-name')?.value?.trim() || 'منتج';
  const productType = document.getElementById('pc-type')?.value ||
    (typeof window.getCategoryDefaultType === 'function'
      ? window.getCategoryDefaultType(window._businessProfile?.biz_type)
      : 'خدمة');
  const salePrice   = parseNum(document.getElementById('pc-price')?.value || '');
  const statusEl    = document.getElementById('pc-save-status');

  if (statusEl) statusEl.textContent = 'جاري إنشاء PDF...';
  toast('⏳ جاري إنشاء PDF...');

  // ── قراءة النتائج من DOM ──────────────────────────────────────
  const g  = id => document.getElementById(id)?.textContent?.trim() || '—';
  const ingCostTxt   = g('res-ing-cost');
  const opCostTxt    = g('res-op-cost-unit');
  const trueCostTxt  = g('res-true-cost');
  const profitUnitTxt= g('res-profit-unit');
  const marginTxt    = g('res-margin');
  const monthPrfTxt  = g('res-monthly-profit');
  const beUnitsTxt   = g('res-be-units');
  const ratingTxt    = g('res-rating');
  const sugPriceTxt  = g('res-suggested-price');
  const salesCntTxt  = g('res-sales-count');
  const prodShareTxt = g('res-product-share');

  const marginVal    = parseFloat(marginTxt) || 0;
  const marginColor  = marginVal >= 40 ? '#16a34a' : marginVal >= 20 ? '#d97706' : '#dc2626';
  const profitNum    = parseNum((profitUnitTxt).replace(/[^\d.\-]/g, '')) *
                       (profitUnitTxt.startsWith('-') ? -1 : 1);
  const profitColor  = profitNum >= 0 ? '#16a34a' : '#dc2626';
  const mPrfNum      = parseNum((monthPrfTxt).replace(/[^\d,\-]/g, '').replace(/,/g, ''));
  const mPrfColor    = mPrfNum >= 0 ? '#16a34a' : '#dc2626';

  // ── المكونات ─────────────────────────────────────────────────
  const ingredients = pcGetIngredients();
  const ingRows = ingredients.map((ing, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 8px;border:1px solid #e5e7eb;color:#374151;font-size:12px;">${_esc(ing.name)}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;font-size:12px;">${ing.qty} ${_esc(ing.unit)}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;font-size:12px;">${ing.unitCost} ﷼</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:#1a1a1a;font-size:12px;">${ing.total.toFixed(2)} ﷼</td>
    </tr>`;
  }).join('');

  // ── التنبيهات ────────────────────────────────────────────────
  const alertsHtml = Array.from(document.querySelectorAll('#pc-alerts .alert') || [])
    .map(a => {
      const cls    = a.className.includes('danger') ? 'danger' : a.className.includes('warn') ? 'warn' :
                     a.className.includes('good')   ? 'good'   : 'info';
      const bg     = cls === 'danger' ? '#fee2e2' : cls === 'warn' ? '#fef3c7' : cls === 'good' ? '#dcfce7' : '#eff6ff';
      const border = cls === 'danger' ? '#fca5a5' : cls === 'warn' ? '#fcd34d' : cls === 'good' ? '#86efac' : '#bfdbfe';
      return `<div style="padding:9px 12px;margin-bottom:7px;border-radius:7px;background:${bg};border-right:4px solid ${border};font-size:12px;color:#1a1a1a;">${a.textContent.trim()}</div>`;
    }).join('');

  // ── جدول تأثير السعر ─────────────────────────────────────────
  const priceTable = document.getElementById('pc-price-impact-table');
  const priceTableHtml = priceTable ? priceTable.innerHTML : '';

  // ── مساعد البناء ─────────────────────────────────────────────
  const sec = (title, content) => content ? `
    <div style="margin-bottom:20px;padding:18px;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;">
      <h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 14px 0;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">${title}</h3>
      ${content}
    </div>` : '';

  // ── HTML الكامل للـ PDF (ألوان ثابتة للطباعة — html2canvas) ──────────────────
  const htmlContent = `
  <div style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;direction:rtl;background:#f1f5f9;color:#1a1a1a;padding:28px;width:750px;box-sizing:border-box;">

    <!-- رأس الصفحة -->
    <div style="background:#1a1a1a;border-radius:14px;padding:24px 28px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-bottom:4px;">🧾 ${_esc(productName)}</div>
        <div style="font-size:13px;color:#9ca3af;">نوع المنتج: ${_esc(productType)} · سعر البيع: ${salePrice} ﷼</div>
      </div>
      <div style="text-align:center;background:rgba(255,255,255,0.08);padding:14px 22px;border-radius:10px;">
        <div style="font-size:28px;font-weight:800;color:${marginColor};">${marginTxt}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">هامش الربح</div>
        <div style="font-size:12px;font-weight:600;color:${marginColor};margin-top:4px;">${ratingTxt}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      ${[
        { val: trueCostTxt,   label: 'التكلفة الحقيقية/وحدة', color: '#1a1a1a'     },
        { val: profitUnitTxt, label: 'الربح/وحدة',             color: profitColor   },
        { val: monthPrfTxt,   label: 'الربح الشهري',           color: mPrfColor     },
        { val: beUnitsTxt,    label: 'نقطة التعادل (وحدة)',    color: '#1a1a1a'     },
        { val: salesCntTxt,   label: 'المبيعات الشهرية',       color: '#1a1a1a'     },
        { val: sugPriceTxt,   label: 'السعر المقترح',          color: '#1e40af'     },
      ].map(k => `
        <div style="background:#ffffff;border-radius:10px;padding:14px;text-align:center;border:1px solid #e5e7eb;">
          <div style="font-size:15px;font-weight:700;color:${k.color};">${k.val}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:5px;">${k.label}</div>
        </div>`).join('')}
    </div>

    <!-- التنبيهات -->
    ${alertsHtml ? sec('⚡ التنبيهات والتوصيات', alertsHtml) : ''}

    <!-- المكونات -->
    ${ingredients.length ? sec('🧪 تفصيل المكونات (لكل وحدة)', `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:right;color:#374151;">المكوّن</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الكمية</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">تكلفة/وحدة</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الإجمالي</th>
        </tr></thead>
        <tbody>${ingRows}</tbody>
      </table>
      <div style="margin-top:10px;padding:10px 14px;background:#fffbeb;border-radius:8px;border:1px solid #fcd34d;font-size:13px;font-weight:700;color:#92400e;">
        إجمالي تكلفة المكونات: ${ingCostTxt}
      </div>`) : ''}

    <!-- تفاصيل التكلفة -->
    ${sec('⚙️ تفاصيل التكلفة الإجمالية', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;text-align:center;">
          <div style="font-size:11px;color:#6b7280;">تكلفة المكونات / وحدة</div>
          <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-top:6px;">${ingCostTxt}</div>
        </div>
        <div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;text-align:center;">
          <div style="font-size:11px;color:#6b7280;">حصة التشغيل / وحدة</div>
          <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-top:6px;">${opCostTxt}</div>
        </div>
      </div>
      <div style="padding:14px;background:#fffbeb;border-radius:8px;border:2px solid #fcd34d;text-align:center;">
        <div style="font-size:11px;color:#92400e;">التكلفة الحقيقية الإجمالية / وحدة</div>
        <div style="font-size:22px;font-weight:800;color:#d97706;margin-top:4px;">${trueCostTxt}</div>
      </div>
      <div style="margin-top:10px;font-size:12px;color:#6b7280;text-align:center;">مشاركة هذا المنتج من إيرادات المشروع: ${prodShareTxt}</div>
    `)}

    <!-- تذييل -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">تم إنشاء هذا التقرير بواسطة توكّد · ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
  </div>`;

  // ── رسم وتحويل لـ PDF ─────────────────────────────────────────
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { position:'fixed', top:'-9999px', left:'0', width:'806px', background:'#f1f5f9', zIndex:'99999' });
  wrapper.innerHTML = htmlContent;
  document.body.appendChild(wrapper);

  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  try {
    const canvas = await window.html2canvas(wrapper, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#f1f5f9', logging: false, width: 806,
    });

    const { jsPDF } = window.jspdf;
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW   = 210, pageH = 297;
    const imgW    = pageW;
    const imgH    = (canvas.height * pageW) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let yOffset = 0, pageNum = 0;
    while (yOffset < imgH) {
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH);
      yOffset += pageH;
      pageNum++;
    }

    pdf.save(`تكلفة_المنتج_${productName}.pdf`);
    if (statusEl) statusEl.textContent = '✅ تم تنزيل PDF';
    toast('✅ تم تنزيل PDF');
  } catch(err) {
    console.error(err);
    if (statusEl) statusEl.textContent = '❌ خطأ في PDF';
    toast('❌ خطأ في إنشاء PDF: ' + err.message);
  } finally {
    document.body.removeChild(wrapper);
  }
}

// ══════════════════════════════════════════════════════════════════
// ربط التكاليف التشغيلية بـ business_profile (مصدر واحد للحقيقة)
// ══════════════════════════════════════════════════════════════════

/** تعبئة حقول التكاليف التشغيلية من _businessProfile عند فتح الصفحة */
function _pcFillFromBP() {
  const bp = window._businessProfile;
  if (!bp) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    const n = Number(val) || 0;
    el.value = n > 0 ? Math.round(n).toLocaleString('en') : '';
    el.dispatchEvent(new Event('input'));
  };

  // الحقول المخزنة في business_profile  →  حقول الحاسبة
  setVal('pc-rent',      bp.fixed_rent);
  setVal('pc-salaries',  bp.fixed_salaries);
  setVal('pc-elec',      bp.fixed_utilities);    // كهرباء + مياه مجمّعة
  setVal('pc-marketing', bp.fixed_marketing);
  setVal('pc-op-other',  bp.fixed_other);
}

/** حفظ التكاليف التشغيلية المعدَّلة في business_profile (debounced 1.5s) */
let _pcBPSaveTimer = null;
function _pcSaveToBP() {
  clearTimeout(_pcBPSaveTimer);
  _pcBPSaveTimer = setTimeout(async () => {
    if (!window.sb || !window._businessProfile) return;
    try {
      const { data: { user } } = await window.sb.auth.getUser();
      if (!user) return;

      const g = id => parseNum(document.getElementById(id)?.value || '');
      const updates = {
        user_id:         user.id,
        fixed_rent:      g('pc-rent'),
        fixed_salaries:  g('pc-salaries'),
        fixed_utilities: g('pc-elec'),
        fixed_marketing: g('pc-marketing'),
        fixed_other:     g('pc-op-other'),
      };

      const { error } = await window.sb.from('business_profile')
        .upsert(updates, { onConflict: 'user_id' });

      if (!error) {
        // تحديث الكاش العالمي ليتزامن مع التغيير
        Object.assign(window._businessProfile, {
          fixed_rent:      updates.fixed_rent,
          fixed_salaries:  updates.fixed_salaries,
          fixed_utilities: updates.fixed_utilities,
          fixed_marketing: updates.fixed_marketing,
          fixed_other:     updates.fixed_other,
        });
        // تحديث الحقول المطابقة في صفحة ملف المشروع (إذا كانت ظاهرة)
        const syncProfile = (bpId, val) => {
          const el = document.getElementById(bpId);
          if (el && document.getElementById('page-profile')?.classList.contains('active')) {
            el.value = val > 0 ? Math.round(val).toLocaleString('en') : '';
            el.dispatchEvent(new Event('input'));
          }
        };
        syncProfile('bp-rent',           updates.fixed_rent);
        syncProfile('bp-salaries',       updates.fixed_salaries);
        syncProfile('bp-utilities',      updates.fixed_utilities);
        syncProfile('bp-marketing-fixed',updates.fixed_marketing);
        syncProfile('bp-fixed-other',    updates.fixed_other);
      }
    } catch(e) { console.warn('_pcSaveToBP error:', e); }
  }, 1500);
}

// ── تهيئة الصفحة عند الدخول إليها ─────────────────────────────
function initProductCostPage() {
  // أضف مكوّناً افتراضياً إذا كان الجدول فارغاً
  const container = document.getElementById('pc-ingredients');
  if (container && container.children.length === 0) addIngredient();

  // ① تعبئة التكاليف من ملف المشروع
  if (window._businessProfile) {
    _pcFillFromBP();
  } else if (typeof loadBusinessProfile === 'function') {
    // إذا لم يُحمَّل بعد (زيارة مباشرة للصفحة) — حمّله ثم عبّئ
    loadBusinessProfile().then(() => { _pcFillFromBP(); calcProductCost(); });
  }

  // ② ربط حقول التكاليف التشغيلية بـ _pcSaveToBP (مصدر واحد للحقيقة)
  const opIds = ['pc-rent','pc-salaries','pc-elec','pc-water','pc-internet',
                 'pc-maintenance','pc-marketing','pc-op-other'];
  opIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el._pcLinkedToBP) {
      el._pcLinkedToBP = true; // علامة لمنع ربط مزدوج
      el.addEventListener('change', _pcSaveToBP);
    }
  });

  // ③ احسب القيم الحالية
  calcProductCost();

  // ④ اعرض المقارنة المحفوظة
  renderProductComparison();

  // ⑤ حاول التحميل من Supabase (ثم حدّث المقارنة — واقترح بناءً على الفئة إذا كانت القائمة فارغة)
  pcLoadFromDB().then(() => {
    const _bpType = window._businessProfile?.biz_type;
    console.log('[Tawakkad][initPC] after DB load — PC_STATE.products=%d | biz_type=%s',
      window.PC_STATE.products.length, _bpType);
    const _allSuggested = window.PC_STATE.products.length === 0 ||
      window.PC_STATE.products.every(p => p._isSuggested);
    if (_bpType && _allSuggested &&
        typeof window.pcSuggestFromCategory === 'function') {
      console.log('[Tawakkad][initPC] all-suggested or empty → force-loading static products for category=%s', _bpType);
      window.pcSuggestFromCategory(_bpType, { force: true });
    } else {
      renderProductComparison();
    }
  });

  // ⑥ اختصار لوحة المفاتيح Ctrl+Enter → حفظ والانتقال للتالي
  if (!window._pcKeyHandlerAdded) {
    window._pcKeyHandlerAdded = true;
    document.addEventListener('keydown', function(e) {
      const page = document.getElementById('page-costcalc');
      if (!page || !page.classList.contains('active')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveAndNextProduct();
      }
    });
  }
}

// ── حفظ والانتقال للمنتج التالي ────────────────────────────────
function saveAndNextProduct() {
  const name = document.getElementById('pc-name')?.value?.trim();
  if (!name) {
    toast('أدخل اسم المنتج أولاً');
    document.getElementById('pc-name')?.focus();
    return;
  }

  // ① احفظ snapshot للتكاليف التشغيلية قبل أي شيء
  const opIds = ['pc-rent','pc-salaries','pc-elec','pc-water',
                 'pc-internet','pc-maintenance','pc-marketing','pc-op-other'];
  const opSnapshot = {};
  opIds.forEach(id => {
    opSnapshot[id] = document.getElementById(id)?.value || '';
  });

  // ② حفظ المنتج الحالي
  saveProductCost();

  // ③ مهلة قصيرة لإتمام الحفظ قبل تنظيف الحقول
  setTimeout(() => {
    // ─ مسح حقول المنتج فقط (بدون dispatchEvent لمنع التأثيرات الجانبية)
    ['pc-name', 'pc-price', 'pc-suggested-price', 'pc-monthly-sales', 'pc-daily-sales']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

    // ─ استعادة التكاليف التشغيلية (ضمان عدم تأثّرها بأي حدث جانبي)
    opIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = opSnapshot[id];
    });

    // ─ مسح المكونات — أبقِ صفاً واحداً فارغاً جاهزاً ───────────────
    const ingContainer = document.getElementById('pc-ingredients');
    if (ingContainer) {
      ingContainer.innerHTML = '';
      addIngredient();
    }

    // ─ إعادة الحساب بالتكاليف التشغيلية المحفوظة ────────────────────
    calcProductCost();

    // ─ ضع المؤشر في حقل اسم المنتج للبدء مباشرة ─────────────────────
    document.getElementById('pc-name')?.focus();

    toast('✅ تم حفظ المنتج — أدخل المنتج التالي');
  }, 80);
}

// ── التصدير للـ window ──────────────────────────────────────────
window.calcProductCost    = calcProductCost;
window.addIngredient      = addIngredient;
window.saveProductCost    = saveProductCost;
window.duplicateProduct   = duplicateProduct;
window.loadProductToForm  = loadProductToForm;
window.renderProductComparison = renderProductComparison;
window.deleteProductCost  = deleteProductCost;
window.updateTargetMargin = updateTargetMargin;
window.calcUnitsForProfit = calcUnitsForProfit;
window.exportProductCostPDF = exportProductCostPDF;
window.saveAndNextProduct   = saveAndNextProduct;
window._pcFillFromBP        = _pcFillFromBP;
window.initProductCostPage  = initProductCostPage;
window.initProductCostPage  = initProductCostPage;
