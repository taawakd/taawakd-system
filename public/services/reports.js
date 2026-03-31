// services/reports.js — تقارير + مقارنة + معيارية

// ============================================================
// reports.js — الحسابات، الرسوم، السيناريوهات، التقارير
// ============================================================

// ══════════════════════════════════════════
// حسابات تطبيقات التوصيل (تلقائية)
// ══════════════════════════════════════════
function calcDeliveryApps() {
  const delTotal  = getN('f-del-total');
  const delNet    = getN('f-del-net');
  const delOrders = getN('f-del-orders');
  const resultsEl = document.getElementById('del-results');
  if (!resultsEl) return;
  if (!delTotal) { resultsEl.style.display = 'none'; return; }
  resultsEl.style.display = 'block';
  const commission = Math.max(0, delTotal - delNet);
  const commPct    = delTotal > 0 ? (commission / delTotal * 100).toFixed(1) : 0;
  const avgOrder   = delOrders > 0 ? Math.round(delTotal / delOrders) : 0;
  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setEl('del-commission',     commission > 0 ? fmt(commission) + ' ﷼' : '—');
  setEl('del-commission-pct', delTotal > 0   ? commPct + '%'           : '—');
  setEl('del-avg-order',      avgOrder > 0   ? fmt(avgOrder) + ' ﷼'   : '—');
}

function liveCalc() {
// ✅ getN / fmt / pct تأتي من helpers.js

  const rev  = getN('f-rev');
  const cogs = getN('f-cogs');
  // عمولة تطبيقات التوصيل — تُضاف كتكلفة إضافية تلقائياً
  const delTotal     = getN('f-del-total');
  const delNet       = getN('f-del-net');
  const delCommission = delTotal > 0 ? Math.max(0, delTotal - delNet) : 0;
  const exp  = cogs+getN('f-rent')+getN('f-sal')+getN('f-utilities')+getN('f-mkt')+getN('f-other')+delCommission;

  // ── ضريبة القيمة المضافة (VAT) — حساب صافي الإيراد للحسابات الداخلية ─────
  // vatResult.netRevenue = grossRevenue ÷ 1.15 إذا VAT مفعّل (وضع شامل)
  const vatResult = (typeof window.calcVATInclusive === 'function')
    ? window.calcVATInclusive(rev)
    : { netRevenue: rev, vatAmount: 0, vatPct: 0 };
  const vatEnabled = window.__VAT_ENABLED__ === true;
  const netRev  = vatEnabled ? vatResult.netRevenue : rev;
  const vatAmt  = vatEnabled ? vatResult.vatAmount  : 0;

  const profit = netRev - exp;
  const margin = pct(profit, netRev);
  // نقطة التعادل = التكاليف الثابتة ÷ نسبة هامش المساهمة
  const fixedCostsLive = getN('f-rent')+getN('f-sal')+getN('f-utilities')+getN('f-mkt')+getN('f-other');
  const contribRatioLive = netRev > 0 ? (netRev - cogs) / netRev : 1;
  const be = contribRatioLive > 0 ? Math.round(fixedCostsLive / contribRatioLive) : 0;

  const setEl = (id, text, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (color) el.style.color = color;
  };

  setEl('lv-total-exp', fmt(exp) + ' ﷼', 'var(--white)');
  setEl('lv-profit',    (profit>0?'+':profit<0?'-':'') + fmt(Math.abs(profit)) + ' ﷼', profit>0 ? 'var(--green)' : profit<0 ? 'var(--red)' : 'var(--gray2)');
  setEl('lv-margin',    margin + '%', margin>=15 ? 'var(--green)' : margin>=0 ? 'var(--gold)' : 'var(--red)');
  setEl('lv-be',        fmt(be) + ' ﷼', 'var(--white)');

  // ── عرض / إخفاء صف الضريبة في شريط النتائج الحية ──────────────────────────
  const vatRow = document.getElementById('lv-vat-row');
  const vatBar = document.getElementById('lv-vat-bar');
  const vatSpan = document.getElementById('lv-vat');  // الـ span بجانب الـ toggle
  if (vatRow)  vatRow.style.display  = (vatEnabled && vatAmt > 0) ? 'block' : 'none';
  if (vatBar)  vatBar.textContent    = vatAmt > 0 ? fmt(Math.round(vatAmt)) + ' ﷼' : '';
  if (vatSpan) vatSpan.textContent   = (vatEnabled && rev > 0)
    ? fmt(Math.round(vatAmt)) + ' ﷼ (' + vatResult.vatPct.toFixed(1) + '%)'
    : '';

  // backward compat — العناصر القديمة إن وجدت
  setEl('lv-exp',    fmt(exp) + ' ﷼');
  const liveBar = document.getElementById('liveBar');
  if (liveBar) liveBar.style.display = 'grid';
}

// ══════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════
function addProdRow() {
  const c = document.getElementById('prodsContainer');
  const r = document.createElement('div');
  r.className = 'prod-row';
  r.innerHTML = `
    <input class="input" type="text" placeholder="اسم المنتج">
    <input class="input num-input" inputmode="numeric" placeholder="0" oninput="calcRowMargin(this)">
    <input class="input num-input" inputmode="numeric" placeholder="0" oninput="calcRowMargin(this)">
    <input class="input num-input" inputmode="numeric" placeholder="0">
    <input class="input" type="text" placeholder="—" readonly style="color:var(--gold);font-weight:700;">
    <button class="btn-rm" onclick="removeRow(this)">×</button>`;
  c.appendChild(r);
  r.querySelectorAll('.num-input').forEach(el=>{
    el.addEventListener('input',function(){
      const val = this.value;
      // إذا احتوت القيمة على نقطة عشرية → ادعم الإدخال العشري مباشرة (0.5 / 10.75)
      if (val.includes('.')) {
        const parts = val.replace(/[^0-9.]/g,'').split('.');
        this.value = parts[0] + '.' + parts.slice(1).join('');
        return;
      }
      // للأعداد الصحيحة: نسّق بفواصل الآلاف
      const raw = val.replace(/[^0-9]/g,'');
      if (!raw) { this.value=''; return; }
      this.value = parseInt(raw,10).toLocaleString('en');
    });
  });
}

function removeRow(btn){
  const c=document.getElementById('prodsContainer');
  if(c.children.length>1) btn.closest('.prod-row').remove();
}

function calcRowMargin(inp) {
  const row = inp.closest('.prod-row');
  const ins = row.querySelectorAll('input');
  const price = parseNum(ins[1].value);
  const cost  = parseNum(ins[2].value);
  if(price>0){
    const m = (((price-cost)/price)*100).toFixed(0);
    ins[4].value = m+'%';
    ins[4].style.color = parseInt(m)>30 ? 'var(--green)' : parseInt(m)<10 ? 'var(--red)' : 'var(--warn)';
  }
}

function collectProducts(){
  return [...document.querySelectorAll('.prod-row')].reduce((a,row)=>{
    const ins=row.querySelectorAll('input');
    if(ins[0].value.trim()) a.push({
      name:ins[0].value.trim(),
      price:parseNum(ins[1].value),
      cost:parseNum(ins[2].value),
      qty:parseNum(ins[3].value)
    });
    return a;
  },[]);
}

function updateProductAnalysis(products) {
  const el = document.getElementById('prodAnalysis');
  const ranking = document.getElementById('prodRanking');
  if (!el || !ranking) return; // العناصر غير موجودة في هذه الصفحة
  if (!products || !products.length) { el.style.display='none'; return; }
  el.style.display = 'block';
  const sorted = [...products].sort((a,b)=>(b.revenue||0)-(a.revenue||0));
  const total = sorted.reduce((s,p)=>s+(p.revenue||0),0);
  const medals = ['🥇','🥈','🥉'];
  ranking.innerHTML = '';
  sorted.forEach((p, i) => {
    const pct    = total > 0 ? ((p.revenue / total) * 100).toFixed(1) : 0;
    const margin = p.price > 0
      ? (((p.price - p.cost) / p.price) * 100).toFixed(1)
      : (p.cost > 0 && p.revenue > 0 ? (((p.revenue - p.cost) / p.revenue) * 100).toFixed(1) : 0);

    const item = document.createElement('div');
    item.className = 'prod-rank-item';

    // p.name is user input — use textContent to keep it UTF-8 clean (was innerHTML)
    const nameSpan = document.createElement('span');
    nameSpan.textContent = (medals[i] || '▪️') + ' ' + p.name;

    const pctSpan = document.createElement('span');
    pctSpan.style.color = 'var(--gold)';
    pctSpan.textContent = pct + '%';

    const marginSpan = document.createElement('span');
    marginSpan.style.color = '#4caf82';
    marginSpan.textContent = 'هامش ' + margin + '%';

    item.appendChild(nameSpan);
    item.appendChild(pctSpan);
    item.appendChild(marginSpan);
    ranking.appendChild(item);
  });
}

// ══════════════════════════════════════════
// SCORE CALCULATOR
// ══════════════════════════════════════════
function calcScore(data) {
  const { netMargin, grossMargin, rentPct, salPct, cogsPct } = data;
  let score = 0, breakdown = [];

  // Profitability (40pts)
  const profScore = Math.min(40, Math.max(0, (netMargin/25)*40));
  score += profScore;
  breakdown.push({ label:'الربحية', val:Math.round(profScore), max:40, color:'var(--gold)' });

  // Cost control (30pts)
  const costScore = Math.min(30, Math.max(0, ((100-cogsPct)/100)*30));
  score += costScore;
  breakdown.push({ label:'التحكم في التكاليف', val:Math.round(costScore), max:30, color:'var(--blue)' });

  // Efficiency (30pts)
  const effScore = Math.min(30, Math.max(0, ((grossMargin)/75)*30));
  score += effScore;
  breakdown.push({ label:'كفاءة التشغيل', val:Math.round(effScore), max:30, color:'var(--green)' });

  return { total: Math.round(score), breakdown };
}

function scoreColor(s){
  if(s>=75) return 'var(--green)';
  if(s>=50) return 'var(--warn)';
  return 'var(--red)';
}

function scoreText(s){
  if(s>=80) return 'ممتاز 🌟';
  if(s>=65) return 'جيد جداً ✅';
  if(s>=50) return 'متوسط ⚠️';
  if(s>=35) return 'يحتاج تحسين 🔧';
  return 'خطر ❗';
}

function renderScore(ringId, valId, labelId, bkId, score) {
  const color = scoreColor(score);
  const circumference = 377;
  const offset = circumference - (score/100)*circumference;

  // ── null-safe DOM access — prevents crash when score card isn't rendered ──
  const ring = document.getElementById(ringId);
  if (ring) {
    ring.style.stroke = color;
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
  }

  const valEl = document.getElementById(valId);
  if (valEl) { valEl.textContent = score; valEl.style.color = color; }

  const labelEl = document.getElementById(labelId);
  if (labelEl) labelEl.textContent = scoreText(score);
}

// ══════════════════════════════════════════
// BENCHMARKS
// ══════════════════════════════════════════
function getSectorKey(bizType) {
  const map = {
    // مطاعم ومقاهي
    'مطعم': 'restaurant', 'restaurant': 'restaurant',
    'مقهى': 'cafe', 'كافيه': 'cafe', 'cafe': 'cafe', 'مقهى / كافيه': 'cafe', 'قهوة': 'cafe',
    'كيوسك عصائر': 'juice_kiosk', 'juice_kiosk': 'juice_kiosk', 'عصائر': 'juice_kiosk', 'عصير': 'juice_kiosk',
    'مخبز': 'bakery', 'حلويات': 'bakery', 'bakery': 'bakery', 'مخبز / حلويات': 'bakery', 'كيك': 'bakery', 'معجنات': 'bakery',
    'فود ترك': 'food_truck', 'food_truck': 'food_truck',
    'مطبخ سحابي': 'cloud_kitchen', 'cloud_kitchen': 'cloud_kitchen', 'كلاود كيتشن': 'cloud_kitchen',
    'درايف ثرو': 'drive_thru', 'drive_thru': 'drive_thru', 'كشك': 'drive_thru',
    // تجارة
    'متجر تجزئة': 'retail', 'retail': 'retail', 'متجر': 'retail',
    'بقالة': 'grocery', 'grocery': 'grocery', 'سوبرماركت': 'grocery', 'ميني ماركت': 'grocery',
    'خضار': 'vegetables', 'خضروات': 'vegetables', 'vegetables': 'vegetables', 'محل خضار': 'vegetables', 'فواكه': 'vegetables',
    'عطور': 'perfumes', 'perfumes': 'perfumes', 'عطر': 'perfumes', 'بخور': 'perfumes',
    'تجارة إلكترونية': 'ecom', 'ecom': 'ecom', 'متجر إلكتروني': 'ecom', 'أونلاين': 'ecom',
    'تمور': 'dates', 'dates': 'dates', 'تمر': 'dates',
    // خدمات تجميل وصحة
    'حلاقة': 'barber', 'barber': 'barber', 'حلاقة وتجميل': 'barber', 'صالون حلاقة': 'barber',
    'تجميل': 'beauty', 'beauty': 'beauty', 'صالون تجميل': 'beauty', 'صالون': 'beauty', 'سبا': 'beauty',
    'عيادة': 'clinic', 'clinic': 'clinic', 'كلينيك': 'clinic', 'طبيب': 'clinic', 'أسنان': 'clinic',
    'صيدلية': 'pharmacy', 'pharmacy': 'pharmacy', 'دواء': 'pharmacy',
    // خدمات تشغيلية
    'مغسلة': 'laundry', 'laundry': 'laundry', 'غسيل': 'laundry', 'كوي': 'laundry', 'مغسلة ملابس': 'laundry',
    'مغسلة سيارات': 'carwash', 'carwash': 'carwash', 'غسيل سيارات': 'carwash',
    'لوجستي': 'logistics', 'logistics': 'logistics', 'شحن': 'logistics', 'توصيل': 'logistics', 'الخدمات اللوجستية': 'logistics',
    // ضيافة
    'فندق': 'hotel', 'hotel': 'hotel', 'شقق فندقية': 'hotel',
    // خدمات أعمال
    'خدمات': 'services', 'services': 'services', 'خدمات عامة': 'services',
    'شركة خدمات': 'services_co', 'services_co': 'services_co', 'مقاول': 'services_co',
    'تقنية': 'tech', 'tech': 'tech', 'شركة تقنية': 'tech', 'برمجة': 'tech', 'تطبيق': 'tech', 'سوفتوير': 'tech',
  };
  // بحث مباشر أولاً، ثم بحث جزئي، ثم 'services' كاحتياطي محايد (لا 'restaurant')
  const result = map[bizType] || map[Object.keys(map).find(k => bizType?.includes(k))] || null;
  console.log('[Tawakkad][getSectorKey] bizType=%s → sectorKey=%s', bizType, result);
  return result;
}

function benchStatus(value, min, max, lowerIsBetter) {
  if (lowerIsBetter) {
    if (value <= max) return 'good';           // أقل من الحد الأعلى = ممتاز
    return value > max * 1.5 ? 'bad' : 'warn'; // أعلى بكثير = سيء
  }
  if (value >= min && value <= max) return 'good';
  if (value < min) return value < min * 0.7 ? 'bad' : 'warn';
  return value > max * 1.3 ? 'bad' : 'warn';
}

function renderBenchmarkItems(metrics, bench, container) {
  const keys = ['netMargin','grossMargin','rentPct','salPct','cogsPct','mktPct'];
  let html = '';
  keys.forEach(k => {
    if(bench[k] && metrics[k] !== undefined) {
      const val = metrics[k];
      const {min,max,label,lowerIsBetter} = bench[k];
      const status = benchStatus(val, min, max, lowerIsBetter);
      const badgeText = status==='good'?'ضمن الطبيعي':status==='warn'?'قريب من الحد':'خارج النطاق';
      const badgeClass = status==='good'?'badge-good':status==='warn'?'badge-warn':'badge-bad';
      html += `<div class="bench-item ${status}">
        <div style="flex:1;">
          <div class="bench-label">${label}</div>
          <div class="bench-range">المعدل الطبيعي: ${min}%–${max}%</div>
        </div>
        <div style="text-align:center;margin:0 12px;">
          <div class="bench-yours" style="color:${status==='good'?'var(--green)':status==='warn'?'var(--warn)':'var(--red)'};">${parseFloat(val).toFixed(1)}%</div>
          <div style="font-size:10px;color:var(--gray);">من الإيرادات</div>
        </div>
        <div class="bench-badge ${badgeClass}">${badgeText}</div>
      </div>`;
    }
  });
  document.getElementById(container).innerHTML = html || '<div style="color:var(--gray);font-size:13px;">أدخل بياناتك لعرض المقارنة</div>';
}

function renderBenchmarkPage() {
  // القيمة الافتراضية: biz_type المحفوظة → سيكتور التحليل الأخير → null
  const _savedBizType = window._businessProfile?.biz_type;
  const _fallbackSector = _savedBizType
    ? (typeof getSectorKey === 'function' ? getSectorKey(_savedBizType) : _savedBizType)
    : (STATE.currentReport?.sectorKey || null);
  const sector = document.getElementById('bench-sector')?.value || _fallbackSector;
  console.log('[Tawakkad][benchmarkPage] category=%s | sectorKey=%s', _savedBizType, sector);
  const bench = BENCHMARKS[sector] || {};
  const metrics = STATE.currentReport?.metrics || {};

  const c = document.getElementById('benchPageContent');
  const keys = ['netMargin','grossMargin','rentPct','salPct','cogsPct','mktPct'];
  let html = '<div style="display:flex;flex-direction:column;gap:10px;">';
  keys.forEach(k => {
    if(!bench[k]) return;
    const {min,max,label,lowerIsBetter} = bench[k];
    const val = metrics[k];
    const hasData = val !== undefined;
    const status = hasData ? benchStatus(val, min, max, lowerIsBetter) : 'none';
    const badgeClass = status==='good'?'badge-good':status==='warn'?'badge-warn':status==='bad'?'badge-bad':'';

    html += `<div class="bench-item ${hasData?status:''}">
      <div style="flex:1;">
        <div class="bench-label">${label}</div>
        <div class="bench-range">المعدل الطبيعي في ${bench.label}: ${min}% – ${max}%</div>
      </div>
      ${hasData ? `
      <div style="text-align:center;margin:0 16px;">
        <div class="bench-yours" style="color:${status==='good'?'var(--green)':status==='warn'?'var(--warn)':'var(--red)'};">${parseFloat(val).toFixed(1)}%</div>
        <div style="font-size:10px;color:var(--gray);">من الإيرادات</div>
      </div>
      <div class="bench-badge ${badgeClass}">${status==='good'?'✓ طبيعي':status==='warn'?'⚠ قريب':'✗ خارج النطاق'}</div>
      ` : `<div style="font-size:12px;color:var(--gray);">أجرِ تحليلاً لرؤية مقارنة مشروعك</div>`}
    </div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// ══════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════
function generateAlerts(data, sectorKey) {
  const bench = (window.BENCHMARKS || BENCHMARKS)[sectorKey] || (window.BENCHMARKS || BENCHMARKS).services || {};
  const alerts = [];
  const { netMargin, rentPct, salPct, cogsPct, mktPct, netProfit } = data;
  const rnt  = parseFloat(rentPct).toFixed(1);
  const sal  = parseFloat(salPct).toFixed(1);
  const cogs = parseFloat(cogsPct).toFixed(1);
  const mkt  = parseFloat(mktPct).toFixed(1);
  const nm   = parseFloat(netMargin).toFixed(1);

  // ── تنبيهات الخسارة والربح ────────────────────────────────────────
  if (netProfit < 0)
    alerts.push({ type:'danger', icon:'🔴', msg:`المشروع يعمل بخسارة ${fmt(Math.abs(netProfit))} ريال — يجب اتخاذ إجراء فوري لمعالجة هذا الوضع` });

  // ── التنبيهات الذكية الأساسية ─────────────────────────────────────
  // 1. هامش الربح < 5%
  if (netProfit >= 0 && netMargin < 5)
    alerts.push({ type:'danger', icon:'⛔', msg:`غير مجدٍ — هامش الربح ${nm}% من الإيرادات يعني أنك تعمل لصالح الآخرين. راجع تكاليفك الثابتة فوراً` });

  // 2. الإيجار > 20%
  if (rentPct > 20)
    alerts.push({ type:'danger', icon:'🏚️', msg:`انتحار مالي — الإيجار ${rnt}% من الإيرادات، لا يوجد مشروع يتحمل هذا العبء على المدى البعيد` });

  // 3. الرواتب > 50%
  if (salPct > 50)
    alerts.push({ type:'danger', icon:'⚙️', msg:`خلل تشغيلي — الرواتب ${sal}% من الإيرادات تستهلك كل القيمة المضافة. ابحث عن حلول أتمتة أو إعادة هيكلة` });

  // 4. التسويق > 20% (ما عدا العطور التي معدلها 20-40%)
  if (mktPct > 20 && sectorKey !== 'perfumes')
    alerts.push({ type:'warn', icon:'🔥', msg:`حرق مال — الإنفاق التسويقي ${mkt}% من الإيرادات مرتفع جداً. راجع كفاءة قنوات التسويق` });

  // ── تنبيهات المعايير القطاعية ─────────────────────────────────────
  if (bench.rentPct && rentPct > bench.rentPct.max * 1.2 && rentPct <= 20)
    alerts.push({ type:'warn', icon:'🏠', msg:`الإيجار ${rnt}% من الإيرادات أعلى من المعدل الطبيعي لنشاطك (${bench.rentPct.min}–${bench.rentPct.max}%)` });

  if (bench.salPct && salPct > bench.salPct.max * 1.1 && salPct <= 50)
    alerts.push({ type:'warn', icon:'👥', msg:`الرواتب ${sal}% من الإيرادات أعلى من المعدل الطبيعي لنشاطك (${bench.salPct.min}–${bench.salPct.max}%)` });

  if (bench.cogsPct && cogsPct > bench.cogsPct.max * 1.1)
    alerts.push({ type:'warn', icon:'📦', msg:`${bench.cogsPct.label} ${cogs}% من الإيرادات أعلى من المعدل الطبيعي لنشاطك (${bench.cogsPct.min}–${bench.cogsPct.max}%)` });

  if (bench.mktPct && mktPct > bench.mktPct.max * 1.3 && sectorKey !== 'perfumes')
    alerts.push({ type:'warn', icon:'📢', msg:`التسويق ${mkt}% من الإيرادات أعلى من المعدل الطبيعي لنشاطك (${bench.mktPct.min}–${bench.mktPct.max}%)` });

  // ── تنبيه إيجابي ──────────────────────────────────────────────────
  if (netMargin >= bench.netMargin?.max)
    alerts.push({ type:'good', icon:'🌟', msg:`هامش الربح ${nm}% من الإيرادات ممتاز ويتجاوز المعدل العلوي لنشاطك (${bench.netMargin.max}%) — استمر في هذا المسار` });
  else if (netMargin >= 20 && netProfit >= 0)
    alerts.push({ type:'good', icon:'✅', msg:`هامش الربح ${nm}% من الإيرادات جيد جداً — المشروع في وضع صحي` });

  return alerts;
}

function renderAlerts(alerts, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!alerts.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--gray);font-size:13px;text-align:center;padding:16px;';
    empty.textContent = 'لا توجد تنبيهات';    // ← textContent (was innerHTML)
    container.appendChild(empty);
    return;
  }

  // Build each alert with DOM methods so a.msg never passes through innerHTML
  alerts.forEach(a => {
    const cls = a.type === 'danger' ? 'danger' : a.type === 'good' ? 'good' : 'warn';
    const div = document.createElement('div');
    div.className = `alert alert-${cls}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'alert-icon';
    iconSpan.textContent = a.icon;             // ← textContent (was innerHTML)

    const msgSpan = document.createElement('span');
    msgSpan.textContent = a.msg;               // ← textContent (was innerHTML)

    div.appendChild(iconSpan);
    div.appendChild(msgSpan);
    container.appendChild(div);
  });
}

// ══════════════════════════════════════════
// BREAKEVEN
// ══════════════════════════════════════════
function calcBreakeven(revenue, cogs, fixedCosts) {
  const variableRatio = revenue > 0 ? cogs/revenue : 0;
  const contribution = 1 - variableRatio;
  const be = contribution > 0 ? fixedCosts/contribution : 0;
  return { be, contribution: (contribution*100).toFixed(1), variableRatio: (variableRatio*100).toFixed(1) };
}

function renderBreakeven(revenue, cogs, fixedCosts, containerId, netProfitOverride) {
  const { be, contribution } = calcBreakeven(revenue, cogs, fixedCosts);
  const diff = revenue - be;
  const pctAbove = be > 0 ? ((diff/be)*100).toFixed(1) : 0;
  const status = (netProfitOverride !== undefined ? netProfitOverride >= 0 : diff >= 0) ? 'good' : 'bad';

  const html = `
    <div class="kpi-row kpi-row-2" style="margin-bottom:14px;">
      <div class="kpi ${status==='good'?'':''}">
        <div class="kpi-val neu">${fmt(be)} ${SAR}</div>
        <div class="kpi-label">نقطة التعادل</div>
      </div>
      <div class="kpi ${status==='good'?'gold':''}">
        <div class="kpi-val ${diff>=0?'pos':'neg'}">${diff>=0?'+':''}${fmt(diff)} ${SAR}</div>
        <div class="kpi-label">${diff>=0?'فوق نقطة التعادل':'تحت نقطة التعادل'}</div>
      </div>
    </div>
    <div class="alert alert-${status==='good'?'good':'danger'}">
      <span class="alert-icon">${status==='good'?'✅':'⚠️'}</span>
      <span>${status==='good'
        ? `مبيعاتك أعلى من نقطة التعادل بـ ${fmt(diff)} ${SAR} (${pctAbove}%) — المشروع مربح.`
        : `تحتاج ${fmt(Math.abs(diff))} ${SAR} إضافية للوصول لنقطة التعادل.`
      }</span>
    </div>
    <div style="margin-top:12px;">
      <div class="progress-head"><span style="font-size:12px;color:var(--gray);">التقدم نحو نقطة التعادل</span><span style="font-size:12px;color:var(--gold);">${Math.min(100,Math.round((revenue/be)*100))}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,(revenue/be)*100)}%;background:${diff>=0?'var(--green)':'var(--red)'};"></div></div>
    </div>`;
  document.getElementById(containerId).innerHTML = html;
}

// ══════════════════════════════════════════
// SCENARIOS
// ══════════════════════════════════════════
function buildScenarios(data) {
  const {revenue, totalExpenses, netProfit, cogs, salaries, rent} = data;
  return [
    {
      title: 'رفع المبيعات 10%',
      desc: 'ماذا لو زادت مبيعاتك 10% مع نفس التكاليف؟',
      newProfit: netProfit + revenue*0.10,
      delta: revenue*0.10,
    },
    {
      title: 'رفع المبيعات 20%',
      desc: 'هدف نمو أكثر طموحاً مع نفس الهيكل التشغيلي',
      newProfit: netProfit + revenue*0.20,
      delta: revenue*0.20,
    },
    {
      title: 'تخفيض الرواتب 10%',
      desc: 'تحسين كفاءة الفريق أو إعادة هيكلة',
      newProfit: netProfit + salaries*0.10,
      delta: salaries*0.10,
    },
    {
      title: 'تخفيض تكاليف البضاعة 5%',
      desc: 'التفاوض مع الموردين أو البحث عن بدائل',
      newProfit: netProfit + cogs*0.05,
      delta: cogs*0.05,
    },
    {
      title: 'تخفيض الإيجار 15%',
      desc: 'إعادة التفاوض على عقد الإيجار',
      newProfit: netProfit + rent*0.15,
      delta: rent*0.15,
    },
    {
      title: 'رفع المبيعات 10% + تخفيض تكاليف 5%',
      desc: 'مزيج متوازن من النمو وترشيد التكاليف',
      newProfit: netProfit + revenue*0.10 + totalExpenses*0.05,
      delta: revenue*0.10 + totalExpenses*0.05,
    },
  ];
}

function renderScenarios(scenarios, revenue, containerId) {
  document.getElementById(containerId).innerHTML = scenarios.map(s => {
    const newMargin = revenue > 0 ? ((s.newProfit/revenue)*100).toFixed(1) : 0;
    const deltaSign = s.delta >= 0 ? '+' : '';
    return `<div class="scenario-card">
      <div class="sc-title">${s.title}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-result ${s.newProfit>=0?'pos':'neg'}">${fmt(s.newProfit)} ${SAR}</div>
      <div class="sc-delta" style="color:${s.delta>=0?'var(--green)':'var(--red)'};">
        ${deltaSign}${fmt(s.delta)} ${SAR} • هامش ${newMargin}%
      </div>
    </div>`;
  }).join('');
}

function renderScenariosPage() {
  if(!STATE.currentReport) return;
  const {metrics} = STATE.currentReport;
  const scenarios = buildScenarios(metrics);

  // ── فحص الصلاحية: canAccessFeature هو المرجع الوحيد ─────────────
  const _scenUser   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _scenAccess = window.canAccessFeature ? window.canAccessFeature(_scenUser, 'full_report') : planAllows('full_report');
  console.log('[Tawakkad][scenarios] plan=%s | trialActive=%s | access=%s',
    _scenUser.plan, _scenUser.isTrialActive, _scenAccess);

  if (!_scenAccess) {
    const first = scenarios[0];
    const _lockedCard = `
      <div style="position:relative;border-radius:12px;overflow:hidden;">
        <div style="filter:blur(4px);pointer-events:none;opacity:0.2;padding:20px;border:1px solid rgba(255,255,255,0.06);border-radius:12px;background:rgba(255,255,255,0.01);">
          <div style="height:12px;background:rgba(255,255,255,0.15);border-radius:4px;margin-bottom:10px;width:70%;"></div>
          <div style="height:9px;background:rgba(255,255,255,0.1);border-radius:4px;margin-bottom:8px;width:90%;"></div>
          <div style="height:14px;background:rgba(100,200,100,0.2);border-radius:4px;width:55%;"></div>
        </div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span style="font-size:16px;">🔒</span>
          <button onclick="showUpgradeModal('سيناريوهات ماذا لو','paid')"
            style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">
            اشترك للوصول
          </button>
        </div>
      </div>`;

    document.getElementById('scenariosPageContent').innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title"><div class="card-title-icon">🎯</div>سيناريوهات "ماذا لو؟"</div>
        <div class="grid-3">
          <!-- السيناريو الأول ظاهر جزئياً -->
          <div class="scenario-card">
            <div class="sc-title">${first.title}</div>
            <div class="sc-desc">${first.desc}</div>
            <div class="sc-result" style="color:var(--gray);filter:blur(4px);user-select:none;">🔒🔒🔒</div>
            <div style="font-size:11px;color:rgba(201,168,76,0.5);margin-top:4px;font-style:italic;">النتيجة مخفية</div>
          </div>
          <!-- الباقي مقفل -->
          ${scenarios.slice(1).map(() => _lockedCard).join('')}
        </div>
        <div style="text-align:center;margin-top:16px;padding:16px;border-radius:10px;background:rgba(201,168,76,0.04);border:1px dashed rgba(201,168,76,0.2);">
          <p style="font-size:12px;color:rgba(201,168,76,0.5);margin:0 0 12px;font-style:italic;">متاح بالاشتراك أو خلال فترة التجربة</p>
          <button onclick="showUpgradeModal('سيناريوهات ماذا لو','paid')"
            style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
            اشترك — 79 ر.س/شهر
          </button>
        </div>
      </div>`;
    return;
  }

  // ── عرض كامل للخطط المدفوعة ──────────────────────────────────
  const html = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title"><div class="card-title-icon">🎯</div>سيناريوهات "ماذا لو؟"</div>
      <div class="grid-3">${scenarios.map(s=>{
        const newMargin = metrics.revenue > 0 ? ((s.newProfit/metrics.revenue)*100).toFixed(1) : 0;
        return `<div class="scenario-card">
          <div class="sc-title">${s.title}</div>
          <div class="sc-desc">${s.desc}</div>
          <div class="sc-result ${s.newProfit>=0?'pos':'neg'}">${fmt(s.newProfit)} ${SAR}</div>
          <div class="sc-delta" style="color:${s.delta>=0?'var(--green)':'var(--red)'};">
            ${s.delta>=0?'+':''}${fmt(s.delta)} ${SAR} • هامش ${newMargin}%
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  document.getElementById('scenariosPageContent').innerHTML = html;
}

// ══════════════════════════════════════════
// COMPARE PERIODS
// ══════════════════════════════════════════
function renderComparePage() {
  const reports = STATE.savedReports;
  if(reports.length < 2){
    document.getElementById('comparePageContent').innerHTML = '<div style="text-align:center;padding:60px;color:var(--gray);font-size:14px;">تحتاج تقريرين على الأقل للمقارنة</div>';
    return;
  }
  const r1 = reports[0], r2 = reports[1];
  const m1 = r1.metrics, m2 = r2.metrics;
  const delta = (a,b) => b>0 ? (((a-b)/b)*100).toFixed(1) : 0;
  const dColor = v => parseFloat(v)>0?'var(--green)':parseFloat(v)<0?'var(--red)':'var(--gray)';
  const dSign  = v => parseFloat(v)>0?'↑':'↓';

  document.getElementById('comparePageContent').innerHTML = `
    <div class="card">
      <div class="compare-row" style="grid-template-columns:1fr auto 1fr;margin-bottom:20px;">
        <div class="compare-period">
          <div class="compare-period-label">📅 ${r2.bizName} — ${r2.reportPeriod||(d=>d&&!isNaN(d)?d.toLocaleDateString('ar-SA'):'—')(new Date(r2.createdAt||r2.date))}</div>
          <div class="compare-metric"><span>الإيرادات</span><span class="compare-metric-val">${fmt(m2.revenue)} ${SAR}</span></div>
          <div class="compare-metric"><span>صافي الربح</span><span class="compare-metric-val">${fmt(m2.netProfit)} ${SAR}</span></div>
          <div class="compare-metric"><span>هامش الربح</span><span class="compare-metric-val">${m2.netMargin}%</span></div>
          <div class="compare-metric"><span>المصاريف</span><span class="compare-metric-val">${fmt(m2.totalExpenses)} ${SAR}</span></div>
        </div>
        <div class="compare-arrow">⇄</div>
        <div class="compare-period">
          <div class="compare-period-label">📅 ${r1.bizName} — ${r1.reportPeriod||(d=>d&&!isNaN(d)?d.toLocaleDateString('ar-SA'):'—')(new Date(r1.createdAt||r1.date))}</div>
          <div class="compare-metric"><span>الإيرادات</span><span class="compare-metric-val">${fmt(m1.revenue)} ${SAR}</span></div>
          <div class="compare-metric"><span>صافي الربح</span><span class="compare-metric-val">${fmt(m1.netProfit)} ${SAR}</span></div>
          <div class="compare-metric"><span>هامش الربح</span><span class="compare-metric-val">${m1.netMargin}%</span></div>
          <div class="compare-metric"><span>المصاريف</span><span class="compare-metric-val">${fmt(m1.totalExpenses)} ${SAR}</span></div>
        </div>
      </div>
      <div class="card-title" style="margin-bottom:14px;"><div class="card-title-icon">📊</div>التغيير بين الفترتين</div>
      <div class="kpi-row kpi-row-4">
        ${[
          {label:'الإيرادات', d:delta(m1.revenue,m2.revenue)},
          {label:'صافي الربح', d:delta(m1.netProfit,m2.netProfit)},
          {label:'هامش الربح', d:(m1.netMargin-m2.netMargin).toFixed(1)},
          {label:'المصاريف', d:delta(m1.totalExpenses,m2.totalExpenses)},
        ].map(k=>`
          <div class="kpi">
            <div class="kpi-val" style="color:${dColor(k.d)};">${dSign(k.d)} ${Math.abs(k.d)}%</div>
            <div class="kpi-label">${k.label}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════
// CHART
// ══════════════════════════════════════════
// ── helper: بناء بيانات الرسم من التقارير المحفوظة ─────────────
// يُرجع { labels, rev, prf, isReal } — isReal=false → بيانات تجريبية
function _buildChartFromReports(maxPoints) {
  const reports = (STATE.savedReports || [])
    .filter(r => r.metrics?.revenue > 0)
    .sort((a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0));
  if (reports.length < 2) return null;
  const slice = maxPoints ? reports.slice(-maxPoints) : reports;
  return {
    labels: slice.map(r => r.reportPeriod || r.bizName || '—'),
    rev:    slice.map(r => r.metrics.revenue    || 0),
    prf:    slice.map(r => r.metrics.netProfit  || 0),
    isReal: true,
  };
}

function initChart() {
  const ctx = document.getElementById('perfChart')?.getContext('2d');
  if(!ctx) return;

  // حاول استخدام بيانات حقيقية أولاً
  const real = _buildChartFromReports(6);
  const labels6m = real ? real.labels : ['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس'];
  const revData  = real ? real.rev    : [65,72,68,80,75,85].map(v=>v*1000);
  const prfData  = real ? real.prf    : [12,15,11,18,14,17].map(v=>v*1000);

  // أبلغ المستخدم إذا كانت البيانات تجريبية
  const labelEl = document.getElementById('chartRangeLabel');
  if (labelEl) labelEl.textContent = real ? '' : '⚠️ بيانات تجريبية — أجرِ تحليلاً لرؤية بياناتك الحقيقية';

  STATE.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels6m,
      datasets: [
        {
          label:'الإيرادات',
          data: revData,
          borderColor:'var(--gold)',
          backgroundColor:'rgba(200,164,90,0.08)',
          borderWidth:2, fill:true, tension:0.4, pointRadius:4,
          pointBackgroundColor:'var(--gold)',
        },
        {
          label:'الأرباح',
          data: prfData,
          borderColor:'var(--green)',
          backgroundColor:'rgba(76,175,130,0.06)',
          borderWidth:2, fill:true, tension:0.4, pointRadius:4,
          pointBackgroundColor:'var(--green)',
        }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'var(--gray2)', font:{size:12}, boxWidth:12 } } },
      scales:{
        x:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'var(--gray)',font:{size:11}} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'var(--gray)',font:{size:11},
          callback: v => v>=1000 ? (v/1000).toFixed(0)+' ألف' : v
        }}
      }
    }
  });
}

function togglePeriod() {
  const v = (document.getElementById('f-period')||{}).value || 'شهري';
  const map = {
    'شهري':'month','يومي':'day','أسبوعي':'week',
    'سنوي':'year','ربع سنوي':'quarter','نصف سنوي':'half','مخصص':'custom',
    'month':'month','day':'day','week':'week','year':'year',
    'quarter':'quarter','half':'half','custom':'custom'
  };
  const key = map[v] || 'month';
  const all = ['pi-month','pi-day','pi-week','pi-year','pi-quarter','pi-half','pi-custom'];
  all.forEach(id => { const e = document.getElementById(id); if(e) e.style.display='none'; });
  const show = document.getElementById('pi-' + key);
  if(show) show.style.display = '';
  if (typeof window._prefillFromBP === 'function') window._prefillFromBP({ force: true });
}

function updateCustomPeriodLabel() {
  const from = document.getElementById('f-date-from').value;
  const to   = document.getElementById('f-date-to').value;
  if(!from || !to) return;
  const f = new Date(from), t = new Date(to);
  const days = Math.round((t-f)/(1000*60*60*24));
  document.getElementById('customPeriodLabel').textContent = `الفترة: ${days} يوم (${f.toLocaleDateString('ar-SA')} — ${t.toLocaleDateString('ar-SA')})`;
}

document.addEventListener('change', e => {
  if(e.target.id === 'f-date-from' || e.target.id === 'f-date-to') updateCustomPeriodLabel();
});

function getPeriodLabel() {
  const val = document.getElementById('f-period').value;
  if (val === 'مخصص') {
    const from = document.getElementById('f-date-from').value;
    const to   = document.getElementById('f-date-to').value;
    if (!from || !to) return 'مخصص';
    const f = new Date(from), t = new Date(to);
    const days = Math.round((t-f)/(1000*60*60*24));
    return `${days} يوم (${f.toLocaleDateString('ar-SA')} — ${t.toLocaleDateString('ar-SA')})`;
  }
  if (val === 'يومي') {
    const date = document.getElementById('f-single-date')?.value;
    if (!date) return 'يومي';
    return new Date(date).toLocaleDateString('ar-SA', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }
  if (val === 'أسبوعي') {
    const week = document.getElementById('f-week')?.value;
    if (!week) return 'أسبوعي';
    return 'أسبوع: ' + week;
  }
  if (val === 'شهري') {
    const month = document.getElementById('f-month')?.value;
    if (!month) return 'شهري';
    const [y, m] = month.split('-');
    return new Date(y, m-1).toLocaleDateString('ar-SA', {year:'numeric', month:'long'});
  }
  if (val === 'ربع سنوي') {
    const q = document.getElementById('f-quarter')?.value;
    const qy = document.getElementById('f-quarter-year')?.value;
    if (!q || !qy) return 'ربع سنوي';
    return `الربع ${q} - ${qy}`;
  }
  if (val === 'نصف سنوي') {
    const h = document.getElementById('f-half')?.value;
    const hy = document.getElementById('f-half-year')?.value;
    if (!h || !hy) return 'نصف سنوي';
    return `النصف ${h} - ${hy}`;
  }
  if (val === 'سنوي') {
    const year = document.getElementById('f-year')?.value;
    if (!year) return 'سنوي';
    return 'سنة ' + year;
  }
  return val;
}

function toggleCustomChart() {
  const wrap = document.getElementById('chartCustomRange');
  const isOpen = wrap.style.display !== 'none';
  wrap.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) {
    const today = new Date();
    const from  = new Date(today); from.setDate(today.getDate()-30);
    document.getElementById('chartTo').value   = today.toISOString().slice(0,10);
    document.getElementById('chartFrom').value = from.toISOString().slice(0,10);
    // deactivate other buttons
    ['day','week','month','6m','year'].forEach(m => {
      const btn = document.getElementById('chartBtn-'+m);
      if(btn) btn.className = 'btn btn-ghost btn-sm';
    });
    document.getElementById('chartBtn-custom').className = 'btn btn-primary btn-sm';
  }
}

function applyCustomChart() {
  const from = document.getElementById('chartFrom').value;
  const to   = document.getElementById('chartTo').value;
  if(!from || !to) return;

  const f = new Date(from), t = new Date(to);
  if(f >= t) { document.getElementById('chartRangeLabel').textContent = '⚠️ تاريخ البداية يجب أن يكون قبل النهاية'; return; }

  const days = Math.round((t-f)/(1000*60*60*24));
  document.getElementById('chartRangeLabel').textContent =
    `✓ عرض ${days} يوم — من ${f.toLocaleDateString('ar-SA')} إلى ${t.toLocaleDateString('ar-SA')}`;

  // Generate labels + data for the custom range
  const labels = [], revData = [], prfData = [];
  const step = days <= 14 ? 1 : days <= 60 ? 7 : days <= 180 ? 14 : 30;
  const stepLabel = step === 1 ? 'يوم' : step === 7 ? 'أسبوع' : step === 14 ? 'أسبوعين' : 'شهر';
  let cur = new Date(f);
  let i = 0;
  while(cur <= t && labels.length < 24) {
    labels.push(cur.toLocaleDateString('ar-SA', {month:'short', day:'numeric'}));
    // Simulated data — replace with real data from STATE.savedReports in production
    const base = 70000 + Math.sin(i*0.5)*15000 + Math.random()*10000;
    revData.push(Math.round(base));
    prfData.push(Math.round(base * (0.12 + Math.sin(i*0.3)*0.05)));
    cur.setDate(cur.getDate()+step); i++;
  }
  STATE.chartInstance.data.labels = labels;
  STATE.chartInstance.data.datasets[0].data = revData;
  STATE.chartInstance.data.datasets[1].data = prfData;
  STATE.chartInstance.update();
}

function switchChart(mode) {
  STATE.chartMode = mode;
  // Reset all buttons
  ['day','week','month','6m','year','custom'].forEach(m=>{
    const btn = document.getElementById('chartBtn-'+m);
    if(btn) btn.className = m===mode ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
  });
  // Hide custom range if switching to preset
  if(mode !== 'custom') document.getElementById('chartCustomRange').style.display = 'none';

  // بيانات تجريبية للاحتياط
  const demoData = {
    day:   { labels:['12ص','3ص','6ص','9ص','12ظ','3م','6م','9م'], rev:[2,1.5,1,3,8,12,9,6].map(v=>v*1000), prf:[0.3,0.2,0.1,0.5,1.4,2.2,1.6,1].map(v=>v*1000) },
    week:  { labels:['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'], rev:[8,12,9,14,11,16,13].map(v=>v*1000), prf:[1.5,2.2,1.8,3,2,3.5,2.5].map(v=>v*1000) },
    month: { labels:['الأسبوع 1','الأسبوع 2','الأسبوع 3','الأسبوع 4'], rev:[18,22,20,25].map(v=>v*1000), prf:[3.5,4.2,3.8,5].map(v=>v*1000) },
    '6m':  { labels:['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس'], rev:[65,72,68,80,75,85].map(v=>v*1000), prf:[12,15,11,18,14,17].map(v=>v*1000) },
    year:  { labels:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'], rev:[60,65,70,68,75,80,78,85,82,88,90,95].map(v=>v*1000), prf:[10,12,14,11,15,17,16,18,17,19,20,22].map(v=>v*1000) },
  };

  // للوضعيات التاريخية: حاول استخدام التقارير المحفوظة أولاً
  let d = null;
  const labelEl = document.getElementById('chartRangeLabel');
  if (mode === '6m' || mode === 'year') {
    const maxPoints = mode === '6m' ? 6 : 12;
    const real = _buildChartFromReports(maxPoints);
    if (real) {
      d = { labels: real.labels, rev: real.rev, prf: real.prf };
      if (labelEl) labelEl.textContent = '';
    }
  }
  if (!d) {
    d = demoData[mode];
    if (labelEl && mode !== 'custom')
      labelEl.textContent = '⚠️ بيانات تجريبية — أجرِ تحليلاً لرؤية بياناتك الحقيقية';
  }
  if(!d) return;
  STATE.chartInstance.data.labels = d.labels;
  STATE.chartInstance.data.datasets[0].data = d.rev;
  STATE.chartInstance.data.datasets[1].data = d.prf;
  STATE.chartInstance.update();
}

// ══════════════════════════════════════════
// ANALYSIS
// ══════════════════════════════════════════

window.liveCalc = liveCalc;
window.calcDeliveryApps = calcDeliveryApps;
window.renderBenchmarkPage = renderBenchmarkPage;
window.switchChart = switchChart;
window.applyCustomChart = applyCustomChart;
window.addProdRow = addProdRow;
window.removeRow = removeRow;
window.togglePeriod = togglePeriod;

// ── تهيئة قسم المنتجات في نموذج التحليل ──────────────────────
function initProdsSection() {
  const c = document.getElementById('prodsContainer');
  if (!c) return;

  // ── إذا كان الحاوي فارغاً وهناك منتجات محفوظة — ملأها تلقائياً ──
  // دمج _PRODUCTS (جدول Supabase) + BP_PRODUCTS (الكاش القديم) لضمان ظهور جميع المنتجات
  const dbProdsRaw = window._PRODUCTS   || [];
  const bpProdsRaw = window.BP_PRODUCTS || [];

  const mergedMap = new Map();
  dbProdsRaw.forEach(p => {
    const key = (p.name || '').toLowerCase().trim();
    if (!key) return;
    mergedMap.set(key, { name: p.name, selling_price: p.selling_price || p.price || 0, cost: p.cost || 0 });
  });
  bpProdsRaw.forEach(p => {
    const key = (p.name || '').toLowerCase().trim();
    if (!key) return;
    const ex = mergedMap.get(key);
    if (!ex) {
      mergedMap.set(key, { name: p.name, selling_price: p.price || p.selling_price || 0, cost: p.cost || 0 });
    } else if (ex.selling_price === 0 && (p.price || p.selling_price || 0) > 0) {
      mergedMap.set(key, { ...ex, selling_price: p.price || p.selling_price });
    }
  });

  const validDBProds = [...mergedMap.values()]; // كل المنتجات بدون فلتر السعر

  if (c.children.length === 0 && validDBProds.length > 0) {
    // جلب بيانات المبيعات الشهرية من حاسبة التكاليف (إن توفّرت)
    const pcProds = (() => {
      try {
        const key = typeof projectProductCostsKey === 'function'
          ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default')
          : 'tw_product_costs';
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch { return []; }
    })();
    const findPCQty = name => {
      const m = pcProds.find(p => p.name && p.name.toLowerCase() === (name||'').toLowerCase());
      return m?.monthlySales || 0;
    };

    validDBProds.forEach(p => {
      addProdRow();
      const allRows = c.querySelectorAll('.prod-row');
      const row = allRows[allRows.length - 1];
      if (!row) return;
      const ins = row.querySelectorAll('input');
      ins[0].value = p.name || '';
      // ضع القيمة كنص ثم شغّل حدث input لتنسيق الأرقام
      const priceVal = Math.round(p.selling_price || p.price || 0);
      const costVal  = Math.round(p.cost || 0);
      const qtyVal   = findPCQty(p.name);
      ins[1].value = priceVal > 0 ? priceVal.toLocaleString('en') : '';
      ins[2].value = costVal  > 0 ? costVal.toLocaleString('en')  : '';
      ins[3].value = qtyVal   > 0 ? qtyVal.toLocaleString('en')   : '';
      if (priceVal > 0) calcRowMargin(ins[1]);
    });
  } else if (c.children.length === 0) {
    addProdRow();
  }

  // أظهر / أخفِ أزرار الاستيراد
  if (typeof window._updateImportBtn === 'function') window._updateImportBtn();
}
window.initProdsSection = initProdsSection;

// ── تصدير الدوال المشتركة إلى window ────────────────────────────────────────
// getSectorKey: تُستخدم في financial.js, tools/index.js, ai-cfo.js لتحديد القطاع
// generateAlerts: تُستخدم في financial.js لتوليد التنبيهات المرتبطة بالقطاع
// calcScore: تُستخدم في financial.js لحساب مؤشر الصحة المالية
window.getSectorKey    = getSectorKey;
window.generateAlerts  = generateAlerts;
window.calcScore       = calcScore;
