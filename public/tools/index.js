// tools/index.js — Cash Flow + Pricing + Forecast + Health + BP Products

function calcCashFlow() {
  const cash     = parseNum(document.getElementById('cf-cash')?.value);
  const fixed    = parseNum(document.getElementById('cf-fixed')?.value);
  const variable = parseNum(document.getElementById('cf-variable')?.value);
  const expRev   = parseNum(document.getElementById('cf-expected-rev')?.value);

  if(!cash && !fixed) return;

  const monthlyBurn = fixed + variable;
  const netMonthly  = expRev - monthlyBurn;
  const runway      = monthlyBurn > 0
    ? (netMonthly >= 0 ? Infinity : Math.abs(cash / netMonthly))
    : Infinity;

  const runwayText  = runway === Infinity ? '∞' : runway.toFixed(1);
  const runwayColor = runway === Infinity ? 'var(--green)' : runway < 3 ? 'var(--red)' : runway < 6 ? 'var(--warn)' : 'var(--green)';
  const status      = runway === Infinity ? '✅ التدفق إيجابي' : runway < 3 ? '🔴 خطر — سيولة منخفضة جداً' : runway < 6 ? '⚠️ يحتاج مراقبة' : '✅ وضع جيد';

  // Build 6-month projection
  const months = ['الشهر 1','الشهر 2','الشهر 3','الشهر 4','الشهر 5','الشهر 6'];
  let bal = cash;
  const rows = months.map((m,i) => {
    const inflow  = expRev * (1 + i*0.02);
    const outflow = monthlyBurn;
    const net     = inflow - outflow;
    bal += net;
    return {m, inflow, outflow, net, bal};
  });

  document.getElementById('cashflowContent').innerHTML = `
    <div class="grid-2">
      <div class="cf-runway">
        <div class="cf-runway-num" style="color:${runwayColor};">${runwayText}</div>
        <div class="cf-runway-label">أشهر Cash Runway</div>
        <div style="margin-top:12px;font-size:13px;color:${runwayColor};font-weight:600;">${status}</div>
      </div>
      <div class="card card-sm">
        <div class="card-title"><div class="card-title-icon">📊</div>ملخص التدفق</div>
        <div class="kpi-row kpi-row-2">
          <div class="kpi"><div class="kpi-val neu">${fmt(cash)} ${SAR}</div><div class="kpi-label">الرصيد الحالي</div></div>
          <div class="kpi"><div class="kpi-val ${netMonthly>=0?'pos':'neg'}">${netMonthly>=0?'+':''}${fmt(netMonthly)} ${SAR}</div><div class="kpi-label">صافي شهري</div></div>
          <div class="kpi"><div class="kpi-val neg">${fmt(monthlyBurn)} ${SAR}</div><div class="kpi-label">إجمالي الإنفاق</div></div>
          <div class="kpi"><div class="kpi-val pos">${fmt(expRev)} ${SAR}</div><div class="kpi-label">إيرادات متوقعة</div></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title"><div class="card-title-icon">📅</div>توقع التدفق — 6 أشهر</div>
      <table class="cf-table">
        <tr><th>الشهر</th><th>التدفق الداخل</th><th>التدفق الخارج</th><th>الصافي</th><th>الرصيد</th></tr>
        ${rows.map(r=>`
          <tr>
            <td style="font-weight:600;color:var(--white);">${r.m}</td>
            <td class="cf-in">+${fmt(r.inflow)}</td>
            <td class="cf-out">-${fmt(r.outflow)}</td>
            <td class="cf-net" style="color:${r.net>=0?'var(--green)':'var(--red)'};">${r.net>=0?'+':''}${fmt(r.net)}</td>
            <td style="font-weight:600;color:${r.bal>=0?'var(--white)':'var(--red)'};">${fmt(r.bal)}</td>
          </tr>`).join('')}
      </table>
    </div>`;
}

// Auto-fill from last report
function prefillCashFlowFromReport() {
  const rep = STATE.currentReport;
  if(!rep) return;
  const m = rep.metrics;
  const fixed = (m.rent||0) + (m.salaries||0);
  const variable = (m.cogs||0) + (m.marketing||0) + (m.other||0);
  if(document.getElementById('cf-fixed')) document.getElementById('cf-fixed').value = fixed.toLocaleString('en');
  if(document.getElementById('cf-variable')) document.getElementById('cf-variable').value = variable.toLocaleString('en');
  if(document.getElementById('cf-expected-rev')) document.getElementById('cf-expected-rev').value = m.revenue.toLocaleString('en');
  calcCashFlow();
}

// ══════════════════════════════════════════
// INTEGRATIONS
// ══════════════════════════════════════════
function connectIntegration(type) {
  if(type === 'google-sheets') {
    document.getElementById('gsheetPanel').style.display = 'block';
    document.getElementById('gsheetPanel').scrollIntoView({behavior:'smooth'});
  } else if(type === 'excel') {
    showPage('analysis');
    toast('ارفع ملف Excel من صفحة التحليل');
  } else if(type === 'manual') {
    showPage('analysis');
  } else {
    toast('هذا الربط سيكون متاحاً قريباً 🚀');
  }
}

async function importFromSheets() {
  const url = document.getElementById('gsheet-url').value.trim();
  if(!url) { showMsg('gsheetMsg','من فضلك أدخل رابط الجدول'); return; }

  // Extract sheet ID and convert to CSV export URL
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if(!match) { showMsg('gsheetMsg','الرابط غير صحيح'); return; }

  const sheetId = match[1];
  const csvUrl  = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  showMsg('gsheetMsg','⏳ جاري الاستيراد...','success');

  try {
    const resp = await fetch(csvUrl);
    if(!resp.ok) throw new Error('تعذّر الوصول');
    const text = await resp.text();

    // Parse CSV
    const rows = text.split('\n').map(r=>r.split(',').map(c=>c.trim().replace(/"/g,'')));
    const flat = [];
    rows.forEach(row => {
      for(let i=0;i<row.length-1;i++) flat.push({k:row[i].toLowerCase(), v:row[i+1]});
    });

    const map=[
      {ids:['إيرادات','مبيعات','revenue','sales'], field:'f-rev'},
      {ids:['تكلفة','cogs'], field:'f-cogs'},
      {ids:['إيجار','rent'], field:'f-rent'},
      {ids:['رواتب','salaries'], field:'f-sal'},
      {ids:['تسويق','marketing'], field:'f-mkt'},
      {ids:['أخرى','other'], field:'f-other'},
    ];
    let filled=0;
    map.forEach(m=>{
      const match=flat.find(p=>m.ids.some(id=>p.k.includes(id)));
      if(match){const el=document.getElementById(m.field);if(el){el.value=(parseFloat(match.v)||0).toLocaleString('en');filled++;}}
    });

    showMsg('gsheetMsg', `✓ تم استيراد ${filled} حقل من Google Sheets`, 'success');
    setTimeout(()=>showPage('analysis'), 1500);
  } catch(e) {
    showMsg('gsheetMsg','تأكد أن الجدول مشارَك للعموم (Anyone with the link)','error');
  }
}

// ══════════════════════════════════════════
// PRICING ANALYSIS
// ══════════════════════════════════════════
function renderPricingPage() {
  const rep = STATE.currentReport;
  if(!rep || !rep.products?.length) {
    document.getElementById('pricingContent').innerHTML =
      '<div class="feature-empty"><div class="fe-icon">💲</div><p>أضف منتجات في التحليل لتفعيل هذه الصفحة</p></div>';
    return;
  }

  const m = rep.metrics;
  const products = rep.products.filter(p=>p.price>0);

  let html = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title"><div class="card-title-icon">📊</div>تأثير تغيير الأسعار على الربح</div>
      <div class="pricing-row-head">
        <span>المنتج</span><span style="text-align:center;">السعر الحالي</span>
        <span style="text-align:center;">التغيير %</span>
        <span style="text-align:center;">السعر الجديد</span>
        <span style="text-align:center;">تأثير الربح</span>
      </div>`;

  products.forEach((p,i) => {
    const margin = p.price>0 ? ((p.price-p.cost)/p.price*100) : 0;
    html += `
      <div class="pricing-row" id="pr-row-${i}">
        <div>
          <div class="pr-name">${p.name}</div>
          <div style="font-size:11px;color:${margin>30?'var(--green)':margin<10?'var(--red)':'var(--warn)'};">هامش ${margin.toFixed(0)}%</div>
        </div>
        <div class="pr-val">${p.price} ${SAR}</div>
        <div style="text-align:center;">
          <input type="range" class="price-slider" id="pslider-${i}" min="-20" max="30" value="0"
            oninput="updatePricingRow(${i},${p.price},${p.cost},${p.qty||1})">
          <div style="font-size:12px;color:var(--gold);margin-top:4px;" id="pslider-val-${i}">0%</div>
        </div>
        <div class="pr-val" id="pr-new-${i}">${p.price} ${SAR}</div>
        <div class="pr-impact" id="pr-impact-${i}">+0 ${SAR}</div>
      </div>`;
  });

  html += `</div>
    <div class="pr-suggestion" id="pricingSuggestion">
      💡 حرّك السلايدر لأي منتج وشوف تأثيره على الربح فوراً
    </div>`;

  document.getElementById('pricingContent').innerHTML = html;
}

function updatePricingRow(i, origPrice, cost, qty) {
  const slider    = document.getElementById('pslider-'+i);
  const sliderPct = parseInt(slider.value);
  const newPrice  = origPrice * (1 + sliderPct/100);
  const oldProfit = (origPrice - cost) * qty;
  const newProfit = (newPrice - cost) * qty;
  const delta     = newProfit - oldProfit;
  const newMargin = newPrice > 0 ? ((newPrice-cost)/newPrice*100).toFixed(0) : 0;

  document.getElementById('pslider-val-'+i).textContent = (sliderPct>=0?'+':'')+sliderPct+'%';
  document.getElementById('pr-new-'+i).textContent      = newPrice.toFixed(0)+' ﷼';
  document.getElementById('pr-impact-'+i).textContent   = (delta>=0?'+':'')+fmt(delta)+' ﷼';
  document.getElementById('pr-impact-'+i).style.color   = delta>=0?'var(--green)':'var(--red)';

  document.getElementById('pricingSuggestion').innerHTML =
    `💡 <strong>${sliderPct>=0?'رفع':'خفض'} ${Math.abs(sliderPct)}%</strong> — السعر الجديد <strong>${newPrice.toFixed(0)} ${SAR}</strong> — هامش <strong>${newMargin}%</strong> — تأثير على الربح: <strong style="color:${delta>=0?'var(--green)':'var(--red)'};">${delta>=0?'+':''}${fmt(delta)} ${SAR}</strong>`;
}

// ══════════════════════════════════════════
// SMART FORECAST
// ══════════════════════════════════════════
function renderSmartForecast() {
  const rep = STATE.currentReport;
  if(!rep) return;
  const m = rep.metrics;

  const monthly    = m.netProfit;
  const revenue    = m.revenue;
  const totalExp   = m.totalExpenses;
  const growthRate = 0.03; // assumed 3% monthly

  // 6-month forecast scenarios
  const scenarios = {
    pessimistic: { growth: -0.02, costChange: 0.02 },
    base:        { growth: growthRate, costChange: 0 },
    optimistic:  { growth: 0.07, costChange: -0.03 },
  };

  const calc6m = (s) => {
    let rev = revenue, exp = totalExp, totalProfit = 0;
    for(let i=0;i<6;i++) {
      rev *= (1+s.growth); exp *= (1+s.costChange);
      totalProfit += (rev-exp);
    }
    return totalProfit;
  };

  const p6m = calc6m(scenarios.pessimistic);
  const b6m = calc6m(scenarios.base);
  const o6m = calc6m(scenarios.optimistic);

  // Loss probability — based on margin and trend
  const lossPct = Math.max(0, Math.min(100,
    m.netMargin < 0 ? 95 :
    m.netMargin < 5 ? 70 :
    m.netMargin < 10 ? 40 :
    m.netMargin < 15 ? 20 : 8
  ));

  const lossColor = lossPct > 60 ? 'var(--red)' : lossPct > 30 ? 'var(--warn)' : 'var(--green)';

  // Monthly projection table
  let bal = monthly, rows = [];
  for(let i=1;i<=6;i++){
    const rev = revenue * Math.pow(1.03, i);
    const exp = totalExp * Math.pow(1.005, i);
    rows.push({m:i, rev, exp, profit:rev-exp, margin:((rev-exp)/rev*100).toFixed(1)});
  }

  document.getElementById('forecastPageContent').innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title"><div class="card-title-icon">⚠️</div>احتمالية الخسارة خلال 4 أشهر</div>
        <div class="loss-meter">
          <div class="loss-prob" style="color:${lossColor};">${lossPct}%</div>
          <div class="loss-label">احتمالية الخسارة</div>
          <div style="margin-top:14px;">
            <div class="progress-track"><div class="progress-fill" style="width:${lossPct}%;background:${lossColor};"></div></div>
          </div>
          <div style="font-size:12px;color:${lossColor};margin-top:10px;font-weight:600;">
            ${lossPct>60?'🔴 خطر مرتفع — اتخذ إجراء فوري':lossPct>30?'⚠️ خطر متوسط — راقب الوضع':'✅ خطر منخفض — الوضع مستقر'}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><div class="card-title-icon">🎯</div>سيناريوهات 6 أشهر</div>
        <div class="scenario-tab">
          <div class="sc-tab-item">
            <div class="sc-tab-label">تشاؤمي</div>
            <div class="sc-tab-val ${p6m>=0?'':''}  " style="color:${p6m>=0?'var(--warn)':'var(--red)'};">${fmt(p6m)} ${SAR}</div>
          </div>
          <div class="sc-tab-item active">
            <div class="sc-tab-label">الوضع الحالي</div>
            <div class="sc-tab-val">${fmt(b6m)} ${SAR}</div>
          </div>
          <div class="sc-tab-item">
            <div class="sc-tab-label">تفاؤلي</div>
            <div class="sc-tab-val" style="color:var(--green);">${fmt(o6m)} ${SAR}</div>
          </div>
        </div>
        <div class="alert alert-info">
          <span class="alert-icon">💡</span>
          <span>الفرق بين التشاؤمي والتفاؤلي: <strong>${fmt(o6m-p6m)} ${SAR}</strong> خلال 6 أشهر — القرارات الآن تحدد الفرق.</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-title"><div class="card-title-icon">📈</div>توقع الأداء الشهري — 6 أشهر قادمة</div>
      <table class="cf-table">
        <tr><th>الشهر</th><th>الإيرادات المتوقعة</th><th>المصاريف</th><th>الربح المتوقع</th><th>الهامش</th></tr>
        ${rows.map(r=>`
          <tr>
            <td style="font-weight:600;color:var(--white);">شهر ${r.m}</td>
            <td class="cf-in">+${fmt(r.rev)}</td>
            <td class="cf-out">-${fmt(r.exp)}</td>
            <td class="cf-net" style="color:${r.profit>=0?'var(--green)':'var(--red)'};">${fmt(r.profit)}</td>
            <td style="color:${parseFloat(r.margin)>15?'var(--green)':parseFloat(r.margin)<5?'var(--red)':'var(--warn)'};">${r.margin}%</td>
          </tr>`).join('')}
      </table>
    </div>`;
}

// ══════════════════════════════════════════
// HEALTH ADVISOR — أهم 3 قرارات
// ══════════════════════════════════════════
async function renderHealthAdvisor() {
  const rep = STATE.currentReport;
  if(!rep) return;

  const c = document.getElementById('healthAdvisorContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray);">⏳ يحلل AI أهم قراراتك...</div>';

  const m = rep.metrics;
  const prompt = `أنت مستشار مالي خبير. بناءً على بيانات "${rep.bizName}":
هامش الربح: ${m.netMargin}% | تكلفة البضاعة: ${m.cogsPct}% | الإيجار: ${m.rentPct}% | الرواتب: ${m.salPct}%
مؤشر الصحة: ${rep.scoreData?.total}/100
التنبيهات: ${rep.alerts?.map(a=>a.msg).join(' | ')||'لا يوجد'}

أعطني أهم 3 قرارات يجب اتخاذها الآن بتنسيق JSON فقط:
{
  "decisions": [
    {
      "rank": 1,
      "title": "عنوان القرار",
      "why": "لماذا هذا مهم الآن مع أرقام",
      "steps": ["خطوة 1", "خطوة 2", "خطوة 3"],
      "impact": "التأثير المتوقع مثل: زيادة الربح 15% خلال شهر"
    }
  ]
}`;

  try {
    const resp = await fetch('/api/analyze', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+(window.__AUTH_TOKEN__||'')},
      body: JSON.stringify({
        model:'gpt-4o-mini', max_tokens:800,
        messages:[{role:'user',content:prompt}]
      })
    });
    const data = await resp.json();
    let text = data.content?.map(i=>i.text||'').join('') || '';
    text = text.replace(/```json|```/g,'').trim();
    const result = JSON.parse(text);
    drawHealthAdvisor(result.decisions);
  } catch(e) {
    drawHealthAdvisor(defaultDecisions(rep));
  }
}

function defaultDecisions(rep) {
  const m = rep.metrics;
  const decisions = [];
  if(m.cogsPct > 45)
    decisions.push({rank:1,title:'تكلفة البضاعة مرتفعة',why:`تكلفة البضاعة ${m.cogsPct}% من إيراداتك — أعلى من المعدل الطبيعي بـ ${(m.cogsPct-40).toFixed(0)}%`,steps:['راجع عقود الموردين الحاليين','ابحث عن موردين بديلين','فاوض على خصم كمية'],impact:`تخفيض 5% يوفر ${fmt(m.revenue*0.05)} ${SAR} شهرياً`});
  if(m.netMargin < 10)
    decisions.push({rank:decisions.length+1,title:'هامش الربح منخفض',why:`هامش ${m.netMargin}% أقل من المعدل الطبيعي ${m.bizType?.includes('مطعم')?'15-25%':'10-20%'}`,steps:['حدّد المنتجات ذات الهامش المنخفض','ارفع أسعارها 5-8%','أوقف المنتجات الخاسرة'],impact:`رفع الهامش 3% يضيف ${fmt(m.revenue*0.03)} ${SAR} شهرياً`});
  if(m.salPct > 35)
    decisions.push({rank:decisions.length+1,title:'الرواتب مرتفعة',why:`الرواتب ${m.salPct}% من الإيرادات — أعلى من المعدل`,steps:['راجع جداول الدوام','حدّد ساعات الذروة','فكّر في أتمتة بعض المهام'],impact:`تخفيض 10% يوفر ${fmt(m.salaries*0.1)} ${SAR} شهرياً`});
  if(decisions.length === 0)
    decisions.push({rank:1,title:'ركّز على النمو',why:`مشروعك بصحة جيدة (${rep.scoreData?.total}/100) — الآن وقت التوسع`,steps:['زِد ميزانية التسويق 20%','افتح قناة مبيعات جديدة','اطلق منتج جديد بهامش عالٍ'],impact:`نمو 10% يضيف ${fmt(m.revenue*0.1)} ${SAR} شهرياً`});
  return decisions.slice(0,3);
}

function drawHealthAdvisor(decisions) {
  const rankColors = ['rank-1-bg','rank-2-bg','rank-3-bg'];
  const borderColors = ['var(--gold)','var(--warn)','var(--red)'];

  document.getElementById('healthAdvisorContent').innerHTML = `
    <div class="kpi-row kpi-row-3" style="margin-bottom:20px;">
      ${decisions.map((d,i)=>`
        <div class="kpi" style="border-right:3px solid ${borderColors[i]||'var(--gold)'};">
          <div style="font-size:22px;margin-bottom:6px;">${i===0?'1️⃣':i===1?'2️⃣':'3️⃣'}</div>
          <div class="kpi-label" style="font-size:13px;color:var(--white);font-weight:600;">${d.title}</div>
        </div>`).join('')}
    </div>
    ${decisions.map((d,i)=>`
      <div class="decision-card" style="border-right-color:${borderColors[i]||'var(--gold)'};">
        <div class="decision-rank">
          <div class="rank-badge ${rankColors[i]||'rank-1-bg'}">${d.rank}</div>
          <div class="decision-title">${d.title}</div>
        </div>
        <div class="decision-why">${d.why}</div>
        <div class="decision-actions">
          ${(d.steps||[]).map((s,j)=>`<div class="da-step"><div class="da-num">${j+1}</div><span>${s}</span></div>`).join('')}
        </div>
        <div class="decision-impact">📈 ${d.impact}</div>
      </div>`).join('')}`;
}

// ══════════════════════════════════════════
// PATCH showPage to trigger page-specific logic
// ══════════════════════════════════════════

// CSS animation
const style=document.createElement('style');
style.textContent='@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
document.head.appendChild(style);

// ============ ملف المشروع ============
window.BP_PRODUCTS = window.BP_PRODUCTS || []; // قائمة المنتجات — مشتركة عبر السكريبتات
var BP_PRODUCTS = window.BP_PRODUCTS;          // alias for local use in this script

function calcBPFixed() {
  const ids = ['bp-rent','bp-salaries','bp-utilities','bp-subscriptions','bp-marketing-fixed','bp-fixed-other'];
  // parseNum يتعامل مع الفواصل (5,000 → 5000) بدلاً من parseFloat الذي يقرأ 5 فقط
  const total = ids.reduce((s,id) => s + parseNum(document.getElementById(id)?.value||''), 0);
  const el = document.getElementById('bp-fixed-total');
  if (el) el.innerHTML = SAR + ' ' + total.toLocaleString('en');
}
window.calcBPFixed = calcBPFixed;

// event delegation — يعمل حتى بعد حقن pages.html في DOM (SPA)
// querySelectorAll المباشر كان يُنفَّذ قبل وجود العناصر فلا يجد شيئاً
const _bpFixedIds = new Set(['bp-rent','bp-salaries','bp-utilities','bp-subscriptions','bp-marketing-fixed','bp-fixed-other']);
document.addEventListener('input', e => {
  if (_bpFixedIds.has(e.target?.id)) calcBPFixed();
});

function renderBPProducts() {
  const el = document.getElementById('bp-products-table');
  if (!el) return;
  if (!BP_PRODUCTS.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:13px">لا يوجد منتجات بعد</div>';
    return;
  }
  el.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#1a1a1a;color:#aaa">' +
    '<th style="padding:6px 8px;text-align:right;border-bottom:1px solid #222">المنتج</th>' +
    '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #222">التكلفة (' + SAR + ')</th>' +
    '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #222">السعر (' + SAR + ')</th>' +
    '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #222">الهامش %</th>' +
    '<th style="padding:6px 8px;border-bottom:1px solid #222"></th>' +
    '</tr></thead><tbody>' +
    BP_PRODUCTS.map((p,i) => {
      const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(1) : 0;
      const color  = margin >= 50 ? '#4caf82' : margin >= 30 ? '#d4af37' : '#d95f5f';
      return '<tr style="background:' + (i%2===0?'#111':'#0d0d0d') + '">' +
        '<td style="padding:6px 8px;color:#eee">' + p.name + '</td>' +
        '<td style="padding:6px 8px;text-align:center;color:#aaa">' + p.cost + '</td>' +
        '<td style="padding:6px 8px;text-align:center;color:#d4af37">' + p.price + '</td>' +
        '<td style="padding:6px 8px;text-align:center;color:' + color + ';font-weight:700">' + margin + '%</td>' +
        '<td style="padding:6px 8px;text-align:center"><button onclick="removeBPProduct(' + i + ')" style="background:none;border:none;color:#d95f5f;cursor:pointer;font-size:14px">🗑</button></td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>';
}

async function addBPProduct() {
  const name  = document.getElementById('bp-prod-name')?.value.trim();
  const cost  = parseFloat(document.getElementById('bp-prod-cost')?.value) || 0;
  const price = parseFloat(document.getElementById('bp-prod-price')?.value) || 0;
  if (!name)    { toast('أدخل اسم المنتج'); return; }
  if (price <= 0) { toast('أدخل سعر البيع'); return; }

  // تجنب التكرار
  const inBP = BP_PRODUCTS.some(p => p.name.toLowerCase() === name.toLowerCase());
  const inDB = (window._PRODUCTS || []).some(p => p.name.toLowerCase() === name.toLowerCase());
  if (inBP || inDB) { toast('⚠️ المنتج موجود مسبقاً'); return; }

  BP_PRODUCTS.push({ name, cost, price });
  document.getElementById('bp-prod-name').value  = '';
  document.getElementById('bp-prod-cost').value  = '';
  document.getElementById('bp-prod-price').value = '';
  renderBPProducts();

  // حفظ فوري في Supabase ليبقى بعد التنقل
  if (typeof upsertProductsToDB === 'function') {
    try {
      await upsertProductsToDB([{ name, selling_price: price, cost, category: '' }]);
      if (typeof loadProductsFromDB === 'function') await loadProductsFromDB();
    } catch(e) { console.warn('addBPProduct save error:', e); }
  }
}

function removeBPProduct(i) {
  BP_PRODUCTS.splice(i, 1);
  renderBPProducts();
}

function importBPProducts(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb   = XLSX.read(e.target.result, {type:'binary'});
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
      if (!data.length) { toast('❌ الملف فارغ'); input.value=''; return; }

      // lowercase for case-insensitive matching (يحل مشكلة "Product Name" vs "name")
      const headers = (data[0]||[]).map(h => String(h||'').trim().toLowerCase());

      // اسم المنتج
      const nameIdx = headers.findIndex(h =>
        h.includes('product name') || h.includes('اسم') || h.includes('منتج') ||
        h.includes('صنف') || h.includes('item name') || h === 'name' || h.includes('product')
      );

      // سعر البيع — يفضّل "retail" على "buy" لتجنب قراءة سعر الشراء عوضاً عن البيع
      let priceIdx = headers.findIndex(h => h.includes('retail') || h.includes('sell price') ||
        h.includes('سعر بيع') || h.includes('سعر البيع'));
      if (priceIdx < 0) priceIdx = headers.findIndex(h =>
        h.includes('price') && !h.includes('buy') && !h.includes('wholesale') && !h.includes('جملة'));
      if (priceIdx < 0) priceIdx = headers.findIndex(h => h.includes('سعر') || h.includes('price'));

      // سعر التكلفة — يفضّل "buy price" ثم "cost"
      let costIdx = headers.findIndex(h =>
        h.includes('buy price') || h.includes('تكلفة') || h.includes('سعر الشراء'));
      if (costIdx < 0) costIdx = headers.findIndex(h => h === 'cost' || h.includes('cost'));

      if (nameIdx < 0)  { toast('❌ لم يُعثر على عمود اسم المنتج في الملف'); input.value=''; return; }
      if (priceIdx < 0) { toast('❌ لم يُعثر على عمود السعر في الملف');       input.value=''; return; }

      const parseN = v => { const n = parseFloat(String(v||'').replace(/[,،\s]/g,'')); return isNaN(n) ? 0 : n; };

      const newProds = [];
      data.slice(1).forEach(row => {
        const name  = String(row[nameIdx]||'').trim();
        const cost  = costIdx >= 0 ? parseN(row[costIdx]) : 0;
        const price = parseN(row[priceIdx]);
        if (!name || price <= 0) return;
        const inBP = BP_PRODUCTS.some(p => p.name.toLowerCase() === name.toLowerCase());
        const inDB = (window._PRODUCTS||[]).some(p => p.name.toLowerCase() === name.toLowerCase());
        if (!inBP && !inDB) newProds.push({ name, cost, price });
      });

      if (!newProds.length) {
        toast('⚠️ لم يتم إضافة أي منتج — تأكد أن الملف يحتوي أعمدة اسم وسعر');
        input.value=''; return;
      }

      newProds.forEach(p => BP_PRODUCTS.push(p));
      renderBPProducts();
      input.value = '';
      toast('✅ تم استيراد ' + newProds.length + ' منتج — جاري الحفظ...');

      // حفظ في Supabase ليبقى بعد التنقل
      if (typeof upsertProductsToDB === 'function') {
        const dbProds = newProds.map(p => ({ name: p.name, selling_price: p.price, cost: p.cost, category: '' }));
        upsertProductsToDB(dbProds).then(async ({ error }) => {
          if (!error && typeof loadProductsFromDB === 'function') {
            await loadProductsFromDB();
            renderBPProducts();
          }
        }).catch(e => console.warn('importBPProducts save error:', e));
      }
    } catch(err) {
      toast('❌ خطأ في قراءة الملف: ' + err.message);
      input.value = '';
    }
  };
  reader.readAsBinaryString(file);
}

window.calcCashFlow = calcCashFlow;
window.prefillCashFlowFromReport = prefillCashFlowFromReport;
window.connectIntegration = connectIntegration;
window.importFromSheets = importFromSheets;
window.renderPricingPage = renderPricingPage;
window.updatePricingRow = updatePricingRow;
window.renderSmartForecast = renderSmartForecast;
window.renderHealthAdvisor = renderHealthAdvisor;
window.renderBPProducts = renderBPProducts;
window.addBPProduct = addBPProduct;
window.removeBPProduct = removeBPProduct;
window.importBPProducts = importBPProducts;

// ══════════════════════════════════════════════════════════════════
// رفع المنيو في ملف المشروع — صورة / PDF / Excel (موجّه تلقائي)
// ══════════════════════════════════════════════════════════════════

function importBPMenuAuto(input) {
  const file = input.files?.[0];
  if (!file) return;
  input.value = ''; // reset لقبول نفس الملف مجدداً

  const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (imageTypes.includes(file.type) || file.type === 'application/pdf') {
    _importBPMenuImage(file);
  } else {
    // Excel / CSV → السلوك القديم
    importBPProducts({ files: [file] });
  }
}
window.importBPMenuAuto = importBPMenuAuto;

// ─── أدوات داخلية لـ OCR في صفحة الملف ─────────────────────────

function _bpOcrSetState(state) {
  // state: 'loading' | 'table' | 'error' | 'hidden'
  const preview  = document.getElementById('bp-ocr-preview');
  const loading  = document.getElementById('bp-ocr-loading');
  const tableW   = document.getElementById('bp-ocr-table-wrap');
  const errEl    = document.getElementById('bp-ocr-error');
  if (!preview) return;

  preview.style.display  = state === 'hidden' ? 'none' : 'block';
  if (loading) loading.style.display  = state === 'loading' ? 'block' : 'none';
  if (tableW)  tableW.style.display   = state === 'table'   ? 'block' : 'none';
  if (errEl)   errEl.style.display    = state === 'error'   ? 'block' : 'none';
}

function _bpOcrSetMsg(msg) {
  const el = document.getElementById('bp-ocr-loading-msg');
  if (el) el.textContent = msg;
}

function _bpOcrShowError(msg) {
  _bpOcrSetState('error');
  const el = document.getElementById('bp-ocr-error');
  if (el) el.textContent = '⚠️ ' + msg;
}

function _bpOcrRenderTable(products) {
  const rows = document.getElementById('bp-ocr-rows');
  const cnt  = document.getElementById('bp-ocr-count');
  if (!rows) return;

  const inpStyle = 'background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:6px 8px;font-size:12px;width:100%;font-family:inherit;box-sizing:border-box;color:#eee';

  rows.innerHTML = '';
  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'bp-ocr-row';
    row.style.cssText = 'display:grid;grid-template-columns:1.8fr 72px 72px 36px;gap:6px;align-items:center';
    const price = p.price ?? p.selling_price ?? 0;
    const cost  = p.cost ?? 0;
    row.innerHTML = `
      <input type="text" value="${_escapeHtml(p.name || '')}" placeholder="اسم المنتج"
             style="${inpStyle};direction:rtl">
      <input type="number" value="${price > 0 ? price : ''}" placeholder="0" min="0"
             style="${inpStyle};color:#d4af37;text-align:center">
      <input type="number" value="${cost > 0 ? cost : ''}" placeholder="0" min="0"
             style="${inpStyle};color:#4caf82;text-align:center">
      <button onclick="this.closest('.bp-ocr-row').remove();_bpOcrUpdateCount()"
              style="background:none;border:none;color:#555;font-size:14px;cursor:pointer;padding:4px;transition:color 0.2s"
              onmouseover="this.style.color='#d95f5f'" onmouseout="this.style.color='#555'">🗑</button>
    `;
    rows.appendChild(row);
  });

  if (cnt) cnt.textContent = products.length + ' منتج';
  _bpOcrSetState('table');
}

function _bpOcrUpdateCount() {
  const cnt = document.getElementById('bp-ocr-count');
  if (cnt) cnt.textContent = document.querySelectorAll('.bp-ocr-row').length + ' منتج';
}

async function _confirmBPOcrProducts() {
  const rowEls = document.querySelectorAll('.bp-ocr-row');
  if (!rowEls.length) { toast('لا توجد منتجات'); return; }

  // ─── جمع المنتجات الجديدة من الجدول ────────────────────────────────
  const toAdd = [];
  rowEls.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const name  = inputs[0]?.value.trim();
    const price = parseFloat(inputs[1]?.value) || 0;
    const cost  = parseFloat(inputs[2]?.value) || 0;
    if (!name) return;
    // تجنب التكرار مع BP_PRODUCTS و _PRODUCTS
    const inBP = BP_PRODUCTS.some(p => p.name.toLowerCase() === name.toLowerCase());
    const inDB = (window._PRODUCTS || []).some(p => p.name.toLowerCase() === name.toLowerCase());
    if (!inBP && !inDB) toAdd.push({ name, price, cost });
  });

  _bpOcrSetState('hidden');
  const fileInput = document.getElementById('bp-products-file');
  if (fileInput) fileInput.value = '';

  if (!toAdd.length) { toast('⚠️ جميع المنتجات موجودة مسبقاً'); return; }

  // ─── Bug fix: استخدم 'price' وليس 'selling_price' ليتوافق مع renderBPProducts ─
  toAdd.forEach(p => BP_PRODUCTS.push({ name: p.name, price: p.price, cost: p.cost }));
  renderBPProducts();

  // ─── الحفظ في Supabase products table لتستمر بعد التنقل ─────────────
  if (typeof upsertProductsToDB === 'function') {
    try {
      const dbProds = toAdd.map(p => ({ name: p.name, selling_price: p.price, cost: p.cost, category: '' }));
      const { error } = await upsertProductsToDB(dbProds);
      if (!error && typeof loadProductsFromDB === 'function') {
        await loadProductsFromDB();   // تحديث الكاش العالمي _PRODUCTS
        renderBPProducts();           // إعادة الرسم بالبيانات المحدّثة
      }
    } catch(e) { console.warn('_confirmBPOcrProducts save error:', e); }
  }

  toast(`✅ تمت إضافة ${toAdd.length} منتج وحُفظت`);
}
window._confirmBPOcrProducts = _confirmBPOcrProducts;

function _cancelBPOcr() {
  _bpOcrSetState('hidden');
  const input = document.getElementById('bp-products-file');
  if (input) input.value = '';
}
window._cancelBPOcr = _cancelBPOcr;

async function _importBPMenuImage(file) {
  _bpOcrSetState('loading');
  _bpOcrSetMsg('جاري قراءة الملف...');

  try {
    let response;

    if (file.type === 'application/pdf') {
      _bpOcrSetMsg('جاري استخراج النص من PDF...');
      const extractedText = await _extractPdfText(file);
      if (!extractedText || extractedText.trim().length < 20) {
        _bpOcrShowError('لم يُعثر على نص في PDF. تأكد أنه ليس ملفاً ممسوحاً ضوئياً.');
        return;
      }
      _bpOcrSetMsg('جاري تحليل المنيو بالذكاء الاصطناعي...');
      response = await _callMenuOCR({ extractedText });
    } else {
      _bpOcrSetMsg('جاري إرسال الصورة للتحليل...');
      const { base64, mimeType } = await _fileToBase64(file);
      response = await _callMenuOCR({ fileBase64: base64, mimeType });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      _bpOcrShowError(errData.error || 'فشل تحليل الملف — حاول مرة أخرى.');
      return;
    }

    const data = await response.json();
    const products = data.products || [];

    if (!products.length) {
      _bpOcrShowError('لم يُعثر على منتجات في هذا الملف.');
      return;
    }

    _bpOcrRenderTable(products);

  } catch(ex) {
    console.error('BP OCR error:', ex);
    _bpOcrShowError('خطأ غير متوقع: ' + (ex.message || 'تحقق من الاتصال'));
  }
}

// ══════════════════════════════════════════════════════════════════
// رفع المنيو — Menu OCR Feature
// ══════════════════════════════════════════════════════════════════

function openMenuUpload() {
  const modal = document.getElementById('menu-upload-modal');
  if (!modal) return;
  // إعادة تعيين الحالة
  _menuResetState();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMenuUpload() {
  const modal = document.getElementById('menu-upload-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  // إعادة تعيين input الملف
  const inp = document.getElementById('menu-file-input');
  if (inp) inp.value = '';
}

function _menuResetState() {
  _menuSetSection('drop');
  const fn = document.getElementById('menu-file-name');
  if (fn) { fn.textContent = ''; fn.style.display = 'none'; }
  const err = document.getElementById('menu-error');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  const rows = document.getElementById('menu-products-rows');
  if (rows) rows.innerHTML = '';
  const wrap = document.getElementById('menu-table-wrap');
  if (wrap) wrap.style.display = 'none';
  const cnt = document.getElementById('menu-products-count');
  if (cnt) cnt.textContent = '';
  const icon = document.getElementById('menu-drop-icon');
  if (icon) icon.textContent = '📁';
  const dz = document.getElementById('menu-drop-zone');
  if (dz) dz.style.borderColor = '#333';
}

function _menuSetSection(section) {
  // section: 'drop' | 'loading' | 'table'
  const loading = document.getElementById('menu-loading');
  const wrap = document.getElementById('menu-table-wrap');
  const dz = document.getElementById('menu-drop-zone');
  const fn = document.getElementById('menu-file-name');
  if (loading) loading.style.display = section === 'loading' ? 'block' : 'none';
  if (wrap)    wrap.style.display    = section === 'table'   ? 'block' : 'none';
  if (dz)      dz.style.display      = section === 'drop'    ? 'block' : 'none';
  if (fn && section === 'drop') { fn.style.display = 'none'; }
}

function _menuShowError(msg) {
  _menuSetSection('drop');
  const err = document.getElementById('menu-error');
  if (err) { err.textContent = '⚠️ ' + msg; err.style.display = 'block'; }
}

function handleMenuDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('menu-drop-zone');
  if (dz) dz.style.borderColor = '#333';
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  _processMenuFile(file);
}

function handleMenuFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  _processMenuFile(file);
}

async function _processMenuFile(file) {
  const err = document.getElementById('menu-error');
  if (err) { err.textContent = ''; err.style.display = 'none'; }

  // ─ التحقق من نوع الملف ──────────────────────────────────────────
  const validTypes = ['image/png','image/jpeg','image/jpg','application/pdf'];
  if (!validTypes.includes(file.type)) {
    _menuShowError('نوع الملف غير مدعوم. يُرجى رفع PNG أو JPG أو PDF فقط.');
    return;
  }

  // ─ التحقق من الحجم (10MB) ───────────────────────────────────────
  if (file.size > 10 * 1024 * 1024) {
    _menuShowError('حجم الملف كبير جداً. الحجم الأقصى 10MB.');
    return;
  }

  // ─ عرض اسم الملف ────────────────────────────────────────────────
  const fn = document.getElementById('menu-file-name');
  if (fn) { fn.textContent = '📎 ' + file.name; fn.style.display = 'block'; }

  // ─ إخفاء منطقة الرفع وإظهار التحميل ────────────────────────────
  _menuSetSection('loading');
  _menuSetLoadingMsg('جاري قراءة الملف...');

  try {
    let response;

    if (file.type === 'application/pdf') {
      // ─ استخراج النص من PDF على جهة العميل ──────────────────────
      _menuSetLoadingMsg('جاري استخراج النص من PDF...');
      const extractedText = await _extractPdfText(file);
      if (!extractedText || extractedText.trim().length < 20) {
        _menuShowError('لم يتم العثور على نص في ملف PDF. تأكد أنه ليس ملفاً ممسوحاً ضوئياً.');
        return;
      }
      _menuSetLoadingMsg('جاري تحليل المنيو بالذكاء الاصطناعي...');
      response = await _callMenuOCR({ extractedText });
    } else {
      // ─ صورة: تحويل إلى base64 ────────────────────────────────────
      _menuSetLoadingMsg('جاري إرسال الصورة للتحليل...');
      const { base64, mimeType } = await _fileToBase64(file);
      response = await _callMenuOCR({ fileBase64: base64, mimeType });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      _menuShowError(errData.error || 'فشل تحليل الملف. حاول مرة أخرى.');
      return;
    }

    const data = await response.json();
    const products = data.products || [];

    if (!products.length) {
      _menuShowError('لم يتم العثور على منتجات في هذا الملف.');
      return;
    }

    // ─ عرض الجدول القابل للتعديل ─────────────────────────────────
    _menuRenderTable(products);

  } catch (ex) {
    console.error('Menu OCR error:', ex);
    _menuShowError('حدث خطأ غير متوقع: ' + (ex.message || 'تحقق من الاتصال بالإنترنت'));
  }
}

function _menuSetLoadingMsg(msg) {
  const el = document.getElementById('menu-loading-msg');
  if (el) el.textContent = msg;
}

async function _extractPdfText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (typeof pdfjsLib === 'undefined') {
          // fallback: إرجاع نص فارغ إذا لم تكن المكتبة موجودة
          resolve('');
          return;
        }
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        resolve(fullText);
      } catch (ex) {
        console.warn('PDF text extraction failed:', ex);
        resolve('');
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result; // data:image/png;base64,XXXX
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function _callMenuOCR(payload) {
  // __AUTH_TOKEN__ يُعيَّن عند تسجيل الدخول (مثل ai-cfo.js و admin.js)
  let authToken = window.__AUTH_TOKEN__;
  if (!authToken && window.sb) {
    try {
      const { data } = await window.sb.auth.getSession();
      authToken = data?.session?.access_token;
    } catch (_) {}
  }

  return fetch('/api/menu-ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {}),
    },
    body: JSON.stringify(payload),
  });
}

// قائمة تصنيفات المنتجات الشائعة
const _MENU_CATEGORIES = ['','مقبلات','طاسات وشوربات','مشويات','رئيسية','سلطات','وجبات جانبية','مشروبات باردة','مشروبات ساخنة','عصائر','حلويات','إضافات','وجبات خاصة','أطفال','إفطار','غداء','عشاء','أخرى'];

function _menuRenderTable(products) {
  const rows = document.getElementById('menu-products-rows');
  const cnt  = document.getElementById('menu-products-count');
  if (!rows) return;

  rows.innerHTML = '';
  products.forEach((p, i) => {
    rows.appendChild(_menuCreateRow(p.name, p.price ?? p.selling_price ?? 0, p.cost ?? 0, p.category ?? ''));
  });
  if (cnt) cnt.textContent = products.length + ' منتج';

  _menuSetSection('table');
}

function _menuCreateRow(name, price, cost, category) {
  const row = document.createElement('div');
  row.className = 'menu-prod-row';
  row.style.cssText = 'display:grid;grid-template-columns:1.8fr 75px 75px 100px 36px;gap:6px;align-items:center';

  const inpStyle = 'background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:7px 8px;font-size:12px;width:100%;font-family:inherit;box-sizing:border-box';
  const catOptions = _MENU_CATEGORIES.map(c =>
    `<option value="${c}" ${c === (category||'') ? 'selected' : ''}>${c || '— تصنيف —'}</option>`
  ).join('');

  row.innerHTML = `
    <input type="text" value="${_escapeHtml(name)}"
           style="${inpStyle};color:#eee;direction:rtl" placeholder="اسم المنتج">
    <input type="number" value="${price > 0 ? price : ''}"
           style="${inpStyle};color:#d4af37;text-align:center" placeholder="0" min="0">
    <input type="number" value="${cost > 0 ? cost : ''}"
           style="${inpStyle};color:#4caf82;text-align:center" placeholder="0" min="0">
    <select style="${inpStyle};color:#999;cursor:pointer">
      ${catOptions}
    </select>
    <button onclick="this.closest('.menu-prod-row').remove(); _updateMenuCount()"
            style="background:none;border:none;color:#555;font-size:15px;cursor:pointer;padding:4px;transition:color 0.2s"
            onmouseover="this.style.color='#d95f5f'" onmouseout="this.style.color='#555'">🗑</button>
  `;
  return row;
}

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _updateMenuCount() {
  const rows = document.querySelectorAll('.menu-prod-row');
  const cnt  = document.getElementById('menu-products-count');
  if (cnt) cnt.textContent = rows.length + ' منتج';
}

function addMenuProductRow() {
  const rows = document.getElementById('menu-products-rows');
  if (!rows) return;
  const newRow = _menuCreateRow('', 0, 0, '');
  rows.appendChild(newRow);
  _updateMenuCount();
  newRow.querySelector('input')?.focus();
}

async function saveMenuProducts() {
  const rowEls = document.querySelectorAll('.menu-prod-row');
  if (!rowEls.length) { toast('لا توجد منتجات للحفظ'); return; }

  // ─ جمع البيانات من الجدول (name, selling_price, cost, category) ──
  const products = [];
  rowEls.forEach(row => {
    const inputs  = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');
    const name          = inputs[0]?.value.trim();
    const selling_price = parseFloat(inputs[1]?.value) || 0;
    const cost          = parseFloat(inputs[2]?.value) || 0;
    const category      = selects[0]?.value || '';
    if (name) products.push({ name, selling_price, cost, category });
  });

  if (!products.length) { toast('أضف اسم منتج واحد على الأقل'); return; }

  // ─ تفعيل حالة التحميل ────────────────────────────────────────────
  const btn  = document.getElementById('menu-save-btn');
  const txt  = document.getElementById('menu-save-text');
  const spin = document.getElementById('menu-save-spin');
  if (btn)  btn.disabled  = true;
  if (txt)  txt.style.display = 'none';
  if (spin) spin.style.display = 'block';

  try {
    // ─ تجنب التكرار بالاسم ──────────────────────────────────────────
    const existingNames = new Set((window._PRODUCTS || []).map(p => p.name.toLowerCase()));
    const newProducts = products.filter(p => !existingNames.has(p.name.toLowerCase()));
    const dupCount = products.length - newProducts.length;

    if (!newProducts.length) {
      toast('⚠️ جميع المنتجات موجودة مسبقاً');
      return;
    }

    // ─ الحفظ في جدول products في Supabase ───────────────────────────
    if (typeof upsertProductsToDB === 'function') {
      const { error } = await upsertProductsToDB(newProducts);
      if (error) {
        console.warn('upsertProductsToDB error:', error);
        toast('❌ فشل الحفظ: ' + (error.message || 'خطأ غير معروف'));
        return;
      }
    }

    // ─ مزامنة BP_PRODUCTS من الكاش الجديد ───────────────────────────
    if (typeof renderBPProducts === 'function') renderBPProducts();

    // ─ تحديث prodsContainer في نموذج التحليل بالمنتجات الجديدة ──────
    const prodsC = document.getElementById('prodsContainer');
    if (prodsC) {
      prodsC.innerHTML = '';
      if (typeof initProdsSection === 'function') initProdsSection();
    }

    // ─ تحديث زر الاستيراد ───────────────────────────────────────────
    if (typeof window._updateImportBtn === 'function') window._updateImportBtn();

    const msg = '✅ تم حفظ ' + newProducts.length + ' منتج' +
      (dupCount > 0 ? ` (تجاهل ${dupCount} مكرر)` : '');
    toast(msg);
    closeMenuUpload();

  } catch (ex) {
    console.error('saveMenuProducts error:', ex);
    toast('❌ فشل الحفظ: ' + (ex.message || 'حاول مرة أخرى'));
  } finally {
    if (btn)  btn.disabled  = false;
    if (txt)  txt.style.display = 'inline';
    if (spin) spin.style.display = 'none';
  }
}

window.openMenuUpload     = openMenuUpload;
window.closeMenuUpload    = closeMenuUpload;
window.handleMenuDrop     = handleMenuDrop;
window.handleMenuFile     = handleMenuFile;
window.addMenuProductRow  = addMenuProductRow;
window.saveMenuProducts   = saveMenuProducts;
window._updateMenuCount   = _updateMenuCount;
