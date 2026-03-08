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
          <div class="kpi"><div class="kpi-val neu">${fmt(cash)} ﷼</div><div class="kpi-label">الرصيد الحالي</div></div>
          <div class="kpi"><div class="kpi-val ${netMonthly>=0?'pos':'neg'}">${netMonthly>=0?'+':''}${fmt(netMonthly)} ﷼</div><div class="kpi-label">صافي شهري</div></div>
          <div class="kpi"><div class="kpi-val neg">${fmt(monthlyBurn)} ﷼</div><div class="kpi-label">إجمالي الإنفاق</div></div>
          <div class="kpi"><div class="kpi-val pos">${fmt(expRev)} ﷼</div><div class="kpi-label">إيرادات متوقعة</div></div>
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
        <div class="pr-val">${p.price} ﷼</div>
        <div style="text-align:center;">
          <input type="range" class="price-slider" id="pslider-${i}" min="-20" max="30" value="0"
            oninput="updatePricingRow(${i},${p.price},${p.cost},${p.qty||1})">
          <div style="font-size:12px;color:var(--gold);margin-top:4px;" id="pslider-val-${i}">0%</div>
        </div>
        <div class="pr-val" id="pr-new-${i}">${p.price} ﷼</div>
        <div class="pr-impact" id="pr-impact-${i}">+0 ﷼</div>
      </div>`;
  });

  html += `</div>
    <div class="pr-suggestion" id="pricingSuggestion">
      💡 حرّك السلايدر لأي منتج وشوف تأثيره على الربح فوراً
    </div>`;

  document.getElementById('pricingContent').innerHTML = html;
}

function updatePricingRow(i, origPrice, cost, qty) {
  const slider = document.getElementById('pslider-'+i);
  const pct = parseInt(slider.value);
  const newPrice = origPrice * (1 + pct/100);
  const oldProfit = (origPrice - cost) * qty;
  const newProfit = (newPrice - cost) * qty;
  const delta     = newProfit - oldProfit;
  const newMargin = ((newPrice-cost)/newPrice*100).toFixed(0);

  document.getElementById('pslider-val-'+i).textContent = (pct>=0?'+':'')+pct+'%';
  document.getElementById('pr-new-'+i).textContent      = newPrice.toFixed(0)+' ر';
  document.getElementById('pr-impact-'+i).textContent   = (delta>=0?'+':'')+fmt(delta)+' ر';
  document.getElementById('pr-impact-'+i).style.color   = delta>=0?'var(--green)':'var(--red)';

  document.getElementById('pricingSuggestion').innerHTML =
    `💡 رفع سعر <strong>${pct>=0?'رفع':'خفض'} ${Math.abs(pct)}%</strong> — السعر الجديد <strong>${newPrice.toFixed(0)} ﷼</strong> — هامش <strong>${newMargin}%</strong> — تأثير على الربح: <strong style="color:${delta>=0?'var(--green)':'var(--red)'};">${delta>=0?'+':''}${fmt(delta)} ﷼</strong>`;
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
            <div class="sc-tab-val ${p6m>=0?'':''}  " style="color:${p6m>=0?'var(--warn)':'var(--red)'};">${fmt(p6m)} ﷼</div>
          </div>
          <div class="sc-tab-item active">
            <div class="sc-tab-label">الوضع الحالي</div>
            <div class="sc-tab-val">${fmt(b6m)} ﷼</div>
          </div>
          <div class="sc-tab-item">
            <div class="sc-tab-label">تفاؤلي</div>
            <div class="sc-tab-val" style="color:var(--green);">${fmt(o6m)} ﷼</div>
          </div>
        </div>
        <div class="alert alert-info">
          <span class="alert-icon">💡</span>
          <span>الفرق بين التشاؤمي والتفاؤلي: <strong>${fmt(o6m-p6m)} ﷼</strong> خلال 6 أشهر — القرارات الآن تحدد الفرق.</span>
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
    decisions.push({rank:1,title:'تكلفة البضاعة مرتفعة',why:`تكلفة البضاعة ${m.cogsPct}% من إيراداتك — أعلى من المعدل الطبيعي بـ ${(m.cogsPct-40).toFixed(0)}%`,steps:['راجع عقود الموردين الحاليين','ابحث عن موردين بديلين','فاوض على خصم كمية'],impact:`تخفيض 5% يوفر ${fmt(m.revenue*0.05)} ﷼ شهرياً`});
  if(m.netMargin < 10)
    decisions.push({rank:decisions.length+1,title:'هامش الربح منخفض',why:`هامش ${m.netMargin}% أقل من المعدل الطبيعي ${m.bizType?.includes('مطعم')?'15-25%':'10-20%'}`,steps:['حدّد المنتجات ذات الهامش المنخفض','ارفع أسعارها 5-8%','أوقف المنتجات الخاسرة'],impact:`رفع الهامش 3% يضيف ${fmt(m.revenue*0.03)} ﷼ شهرياً`});
  if(m.salPct > 35)
    decisions.push({rank:decisions.length+1,title:'الرواتب مرتفعة',why:`الرواتب ${m.salPct}% من الإيرادات — أعلى من المعدل`,steps:['راجع جداول الدوام','حدّد ساعات الذروة','فكّر في أتمتة بعض المهام'],impact:`تخفيض 10% يوفر ${fmt(m.salaries*0.1)} ﷼ شهرياً`});
  if(decisions.length === 0)
    decisions.push({rank:1,title:'ركّز على النمو',why:`مشروعك بصحة جيدة (${rep.scoreData?.total}/100) — الآن وقت التوسع`,steps:['زِد ميزانية التسويق 20%','افتح قناة مبيعات جديدة','اطلق منتج جديد بهامش عالٍ'],impact:`نمو 10% يضيف ${fmt(m.revenue*0.1)} ﷼ شهرياً`});
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
let BP_PRODUCTS = []; // قائمة المنتجات في الذاكرة

function calcBPFixed() {
  const ids = ['bp-rent','bp-salaries','bp-utilities','bp-subscriptions','bp-fixed-other'];
  const total = ids.reduce((s,id) => s + (parseFloat(document.getElementById(id)?.value)||0), 0);
  const el = document.getElementById('bp-fixed-total');
  if (el) el.textContent = '﷼ ' + total.toLocaleString('en');
}
document.querySelectorAll('#bp-rent,#bp-salaries,#bp-utilities,#bp-subscriptions,#bp-fixed-other')
  .forEach(el => el?.addEventListener('input', calcBPFixed));

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
    '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #222">التكلفة ﷼</th>' +
    '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #222">السعر ﷼</th>' +
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

function addBPProduct() {
  const name  = document.getElementById('bp-prod-name')?.value.trim();
  const cost  = parseFloat(document.getElementById('bp-prod-cost')?.value) || 0;
  const price = parseFloat(document.getElementById('bp-prod-price')?.value) || 0;
  if (!name) { toast('أدخل اسم المنتج'); return; }
  if (price <= 0) { toast('أدخل سعر البيع'); return; }
  BP_PRODUCTS.push({ name, cost, price });
  document.getElementById('bp-prod-name').value  = '';
  document.getElementById('bp-prod-cost').value  = '';
  document.getElementById('bp-prod-price').value = '';
  renderBPProducts();
}

function removeBPProduct(i) {
  BP_PRODUCTS.splice(i, 1);
  renderBPProducts();
}

function importBPProducts(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const wb   = XLSX.read(e.target.result, {type:'binary'});
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, {header:1});
    const headers = (data[0]||[]).map(h => String(h||'').trim());
    const nameIdx  = headers.findIndex(h => h.includes('اسم') || h.includes('منتج') || h.includes('name'));
    const costIdx  = headers.findIndex(h => h.includes('تكلفة') || h.includes('cost') || h.includes('Cost'));
    const priceIdx = headers.findIndex(h => h.includes('سعر') || h.includes('price') || h.includes('Price') || h.includes('بيع'));
    let added = 0;
    data.slice(1).forEach(row => {
      const name  = String(row[nameIdx]||'').trim();
      const cost  = parseFloat(row[costIdx])  || 0;
      const price = parseFloat(row[priceIdx]) || 0;
      if (name && price > 0) { BP_PRODUCTS.push({name, cost, price}); added++; }
    });
    renderBPProducts();
    toast('✅ تم استيراد ' + added + ' منتج');
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
