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

// ── الحالة العامة ──────────────────────────────────────────────
var PC_STATE = {
  products: JSON.parse(localStorage.getItem('tw_product_costs') || '[]'),
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

  const productType   = document.getElementById('pc-type')?.value || 'طعام';
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

  // معيار النشاط
  const bench = PC_BENCHMARKS[productType] || PC_BENCHMARKS['طعام'];

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

// ── تحديث حقول النتائج ─────────────────────────────────────────
function _pcSetResults(d) {
  const setEl    = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  const setColor = (id, c)   => { const e = document.getElementById(id); if (e) e.style.color = c; };

  setEl('res-ing-cost',      d.ingCost.toFixed(2) + ' ﷼');
  setEl('res-op-cost-unit',  d.opPerUnit.toFixed(2) + ' ﷼');
  setEl('res-true-cost',     d.trueCost.toFixed(2) + ' ﷼');

  setEl('res-profit-unit',   (d.profitPerUnit >= 0 ? '+' : '') + d.profitPerUnit.toFixed(2) + ' ﷼');
  setColor('res-profit-unit', d.profitPerUnit >= 0 ? 'var(--green)' : 'var(--red)');

  setEl('res-margin',  d.margin.toFixed(1) + '%');
  setColor('res-margin', d.margin >= d.bench.min ? 'var(--green)' : d.margin >= 0 ? 'var(--warn)' : 'var(--red)');

  setEl('res-monthly-profit', fmt(Math.round(d.monthlyProfit)) + ' ﷼');
  setColor('res-monthly-profit', d.monthlyProfit >= 0 ? 'var(--green)' : 'var(--red)');

  setEl('res-be-units', d.beUnits === Infinity ? '—' : d.beUnits.toLocaleString('ar-SA'));
  setEl('res-product-share', (d.sharePct * 100).toFixed(1) + '%');
  setEl('res-sales-count', d.actualSales > 0 ? Math.round(d.actualSales) + ' وحدة' : '—');

  // تقييم الربحية
  let rating = '—', rColor = 'var(--gray)';
  if (d.salePrice > 0) {
    if      (d.margin >= d.bench.good) { rating = '⭐ ممتاز';  rColor = 'var(--green)'; }
    else if (d.margin >= d.bench.min)  { rating = '✅ صحي';    rColor = 'var(--green)'; }
    else if (d.margin >= d.bench.min * 0.6) { rating = '⚠️ ضعيف'; rColor = 'var(--warn)'; }
    else                               { rating = '🔴 خطر';   rColor = 'var(--red)';  }
  }
  const rEl = document.getElementById('res-rating');
  if (rEl) { rEl.textContent = rating; rEl.style.color = rColor; }

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
  const name = document.getElementById('pc-name')?.value?.trim();
  if (!name) { toast('أدخل اسم المنتج أولاً'); return; }

  const monthlySales = parseNum(document.getElementById('pc-monthly-sales')?.value || '') ||
                       parseNum(document.getElementById('pc-daily-sales')?.value || '') * 30;

  const productData = {
    id:           (PC_STATE.products.find(p => p.name === name)?.id) || Date.now().toString(),
    name,
    type:         document.getElementById('pc-type')?.value || 'طعام',
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
    savedAt:      new Date().toISOString(),
  };

  const idx = PC_STATE.products.findIndex(p => p.id === productData.id);
  if (idx >= 0) PC_STATE.products[idx] = productData;
  else PC_STATE.products.push(productData);

  localStorage.setItem('tw_product_costs', JSON.stringify(PC_STATE.products));

  const statusEl = document.getElementById('pc-save-status');
  if (statusEl) statusEl.textContent = '✅ تم الحفظ في ' + new Date().toLocaleTimeString('ar-SA');

  pcSyncToDB();
  renderProductComparison();
  toast('✅ تم حفظ المنتج: ' + name);
}

// ── مزامنة مع Supabase ──────────────────────────────────────────
async function pcSyncToDB() {
  try {
    if (!window.sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('business_profile').upsert(
      { user_id: user.id, product_costs: PC_STATE.products },
      { onConflict: 'user_id' }
    );
  } catch(e) { console.warn('product-cost DB sync:', e); }
}

// ── تحميل من Supabase ───────────────────────────────────────────
async function pcLoadFromDB() {
  try {
    if (!window.sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data, error } = await sb.from('business_profile')
      .select('product_costs').eq('user_id', user.id).single();
    if (!error && Array.isArray(data?.product_costs) && data.product_costs.length) {
      PC_STATE.products = data.product_costs;
      localStorage.setItem('tw_product_costs', JSON.stringify(PC_STATE.products));
    }
  } catch(e) { console.warn('product-cost DB load:', e); }
}

// ── تحميل منتج في النموذج ──────────────────────────────────────
function loadProductToForm(p) {
  if (!p) return;
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
  localStorage.setItem('tw_product_costs', JSON.stringify(PC_STATE.products));
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

// ── تصدير PDF ──────────────────────────────────────────────────
async function exportProductCostPDF() {
  const el = document.getElementById('pc-printable');
  if (!el) { toast('❌ لم يُعثر على محتوى للتصدير'); return; }

  const statusEl = document.getElementById('pc-save-status');
  if (statusEl) statusEl.textContent = 'جاري إنشاء PDF...';
  toast('⏳ جاري إنشاء PDF...');

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#07080a',
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (clonedDoc) => {
        // تأكيد اتجاه RTL على جميع عناصر النص قبل الرسم
        clonedDoc.documentElement.setAttribute('dir', 'rtl');
        clonedDoc.documentElement.setAttribute('lang', 'ar');
        const clonedEl = clonedDoc.getElementById('pc-printable');
        if (clonedEl) {
          clonedEl.setAttribute('dir', 'rtl');
          // تطبيق RTL على كل عنصر نصي داخل المقطع
          clonedEl.querySelectorAll('*').forEach(node => {
            const cs = window.getComputedStyle(node);
            if (cs.direction === 'rtl' || node.textContent.trim()) {
              node.style.direction  = 'rtl';
              node.style.unicodeBidi = 'plaintext';
            }
          });
        }
      },
    });
    const { jsPDF } = window.jspdf;
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW   = 210, pageH = 297, margin = 10;
    const imgW    = pageW - margin * 2;
    const ratio   = canvas.width / canvas.height;
    const imgH    = imgW / ratio;

    const addPageImg = (srcCanvas, srcY, srcH) => {
      const tmp = document.createElement('canvas');
      tmp.width = srcCanvas.width; tmp.height = srcH;
      tmp.getContext('2d').drawImage(srcCanvas, 0, srcY, srcCanvas.width, srcH, 0, 0, srcCanvas.width, srcH);
      return tmp.toDataURL('image/jpeg', 0.92);
    };

    const sliceH    = Math.floor((canvas.width / imgW) * (pageH - margin * 2));
    let   remaining = canvas.height, srcY = 0, first = true;

    while (remaining > 0) {
      const chunk = Math.min(sliceH, remaining);
      const chunkImgH = (chunk / canvas.width) * imgW;
      if (!first) pdf.addPage();
      pdf.addImage(addPageImg(canvas, srcY, chunk), 'JPEG', margin, margin, imgW, chunkImgH);
      srcY += chunk; remaining -= chunk; first = false;
    }

    const productName = document.getElementById('pc-name')?.value?.trim() || 'منتج';
    pdf.save(`تكلفة_المنتج_${productName}.pdf`);
    if (statusEl) statusEl.textContent = '✅ تم تنزيل PDF';
    toast('✅ تم تنزيل PDF');
  } catch(err) {
    console.error(err);
    if (statusEl) statusEl.textContent = '❌ خطأ في PDF';
    toast('❌ خطأ في إنشاء PDF: ' + err.message);
  }
}

// ── تهيئة الصفحة عند الدخول إليها ─────────────────────────────
function initProductCostPage() {
  // أضف مكوّناً افتراضياً إذا كان الجدول فارغاً
  const container = document.getElementById('pc-ingredients');
  if (container && container.children.length === 0) addIngredient();

  // احسب القيم الحالية
  calcProductCost();

  // اعرض المقارنة المحفوظة
  renderProductComparison();

  // حاول التحميل من Supabase (ثم حدّث المقارنة)
  pcLoadFromDB().then(() => renderProductComparison());
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
window.initProductCostPage  = initProductCostPage;
