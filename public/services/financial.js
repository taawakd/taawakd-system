// services/financial.js — تحليل مالي + Excel + PDF + CFO context

const BENCHMARKS = {
  restaurant: {
    label: 'مطعم',
    netMargin:   { min: 10, max: 18, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 70, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 6,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 22, max: 35, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 28, max: 40, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  cafe: {
    label: 'مقهى / كافيه',
    netMargin:   { min: 18, max: 32, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 8,  max: 15, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 18, max: 28, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  juice_kiosk: {
    label: 'كيوسك عصائر',
    netMargin:   { min: 20, max: 35, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 12, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 18, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  bakery: {
    label: 'مخبز / حلويات',
    netMargin:   { min: 12, max: 22, label: 'هامش الربح الصافي' },
    grossMargin: { min: 55, max: 72, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',       lowerIsBetter: true },
    salPct:      { min: 20, max: 30, label: 'نسبة الرواتب',       lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',      lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',       lowerIsBetter: true },
  },
  food_truck: {
    label: 'فود ترك',
    netMargin:   { min: 15, max: 25, label: 'هامش الربح الصافي' },
    grossMargin: { min: 60, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 5,  label: 'نسبة الإيجار / موقع', lowerIsBetter: true },
    salPct:      { min: 15, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 25, max: 38, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 3,  max: 8,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  retail: {
    label: 'متجر تجزئة',
    netMargin:   { min: 10, max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 50, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 5,  max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 20, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 50, max: 70, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 5,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  services: {
    label: 'خدمات',
    netMargin:   { min: 20, max: 40, label: 'هامش الربح الصافي' },
    grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 3,  max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 30, max: 50, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 20, max: 40, label: 'تكلفة الخدمة',        lowerIsBetter: true },
    mktPct:      { min: 5,  max: 12, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  barber: {
    label: 'حلاقة وتجميل',
    netMargin:   { min: 18, max: 30, label: 'هامش الربح الصافي' },
    grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 10, max: 18, label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 25, max: 40, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 15, max: 30, label: 'تكلفة اللوازم',       lowerIsBetter: true },
    mktPct:      { min: 2,  max: 6,  label: 'نسبة التسويق',        lowerIsBetter: true },
  },
  ecom: {
    label: 'تجارة إلكترونية',
    netMargin:   { min: 8,  max: 20, label: 'هامش الربح الصافي' },
    grossMargin: { min: 30, max: 55, label: 'هامش الربح الإجمالي' },
    rentPct:     { min: 0,  max: 3,  label: 'نسبة الإيجار',        lowerIsBetter: true },
    salPct:      { min: 10, max: 25, label: 'نسبة الرواتب',        lowerIsBetter: true },
    cogsPct:     { min: 45, max: 65, label: 'تكلفة البضاعة',       lowerIsBetter: true },
    mktPct:      { min: 10, max: 20, label: 'نسبة التسويق',        lowerIsBetter: true },
  },
};


// ============================================================
// ai.js — التحليل المالي، عرض النتائج، AI CFO
// ============================================================

async function runAnalysis() {
  const revenue = getN('f-rev');
  if(!revenue){ showMsg('analysisError','من فضلك أدخل إجمالي الإيرادات'); return; }

  const btn = document.getElementById('analyzeBtn');
  if(document.getElementById('analyzeBtnText')) document.getElementById('analyzeBtnText').textContent = 'جاري التحليل...';
  if(document.getElementById('analyzeSpin')) document.getElementById('analyzeSpin').style.display = 'block';
  
  btn.disabled = true;
  if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').classList.add('show');

  const cogs=getN('f-cogs'), rent=getN('f-rent'), salaries=getN('f-sal');
  const marketing=getN('f-mkt'), other=getN('f-other'), utilities=getN('f-utilities');
  const totalExpenses = cogs+rent+salaries+marketing+other+utilities;
  const netProfit = revenue-totalExpenses;
  const netMargin = parseFloat(pct(netProfit,revenue));
  const grossMargin = parseFloat(pct(revenue-cogs, revenue));
  const rentPct = parseFloat(pct(rent,revenue));
  const salPct  = parseFloat(pct(salaries,revenue));
  const cogsPct = parseFloat(pct(cogs,revenue));
  const mktPct  = parseFloat(pct(marketing,revenue));

  const bizName   = document.getElementById('f-name').value || 'مشروعك';
  const bizType   = document.getElementById('f-type').value || 'غير محدد';
  const period    = getPeriodLabel();
  const employees = getN('f-emp');
  const notes     = document.getElementById('f-notes').value;
  const products  = collectProducts();
  const sectorKey = getSectorKey(bizType);
  const bench     = BENCHMARKS[sectorKey];

  const metrics = { revenue, cogs, rent, salaries, marketing, other, totalExpenses,
    netProfit, netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };

  const scoreData = calcScore({ netMargin, grossMargin, rentPct, salPct, cogsPct });
  const alerts = generateAlerts({ ...metrics, netMargin, grossMargin, rentPct, salPct, cogsPct }, sectorKey);
  const scenarios = buildScenarios({ revenue, totalExpenses, netProfit, cogs, salaries, rent });

  const productsText = products.length
    ? products.map(p=>{const m=p.price>0?(((p.price-p.cost)/p.price)*100).toFixed(0):0;return `- ${p.name}: سعر ${p.price}ر تكلفة ${p.cost}ر كمية ${p.qty} هامش ${m}%`;}).join('\n')
    : 'لا توجد بيانات منتجات.';

  const prompt = JSON.stringify({
    business_type: bizType || 'غير محدد',
    business_name: bizName,
    period: period,
    team_size: employees,
    revenue: revenue,
    food_cost: cogs,
    food_cost_percent: grossMargin,
    salary: salaries,
    salary_percent: salPct,
    rent: rent,
    rent_percent: rentPct,
    utilities: utilities,
    marketing: marketing,
    marketing_percent: mktPct,
    other_expenses: other,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    profit_margin: netMargin,
    gross_margin: grossMargin,
    health_score: scoreData ? scoreData.total : null,
    products: productsText || null,
    notes: notes || null,
    request: 'حلل بيانات المشروع وأعطني التشخيص ونقاط القوة والمشاكل وأفضل 3 إجراءات لتحسين الربح مع أرقام محددة'
  }, null, 2);

  let reportText = '';
  try {
    const resp = await fetch('/api/analyze', {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+(window.__AUTH_TOKEN__||'')},
      body:JSON.stringify({
        model:"gpt-4o-mini",
        max_tokens:1000,
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await resp.json();
    reportText = data.content?.map(i=>i.text||'').join('') || '';
  } catch(e) {
    reportText = '';
  }

  // Build report object
  const report = {
    id: Date.now(),
    bizName, bizType, period,
    metrics, scoreData, alerts, scenarios,
    reportText, products, sectorKey,
    createdAt: new Date().toISOString()
  };

  STATE.currentReport = report;
  STATE.savedReports.unshift(report);
  localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0,20)));

  // حفظ في Supabase
  try {
    const token = window.__AUTH_TOKEN__;
    if (token) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        await sb.from('reports').insert({
          user_id:        user.id,
          biz_name:       report.bizName,
          biz_type:       report.bizType,
          period:         report.period,
          revenue:        report.metrics?.revenue || 0,
          total_expenses: report.metrics?.totalExpenses || 0,
          net_profit:     report.metrics?.netProfit || 0,
          net_margin:     report.metrics?.netMargin || 0,
          health_score:   report.scoreData?.total || 0,
          report_json:    report
        });
        await sb.from('profiles').update({
          analyses_used: (window._profileUsed || 0) + 1
        }).eq('id', user.id);
      }
    }
  } catch(saveErr) { console.warn('Supabase save error:', saveErr); }

  if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').classList.remove('show');

  // Render results
  renderResults(report);
  showPage('results');

  document.getElementById('analyzeBtnText').textContent = 'تحليل المشروع الآن';
  if(document.getElementById('analyzeSpin')) document.getElementById('analyzeSpin').style.display = 'none';
    btn.disabled = false;

  toast('تم حفظ التقرير ✓');
}


function renderResults(report) {
  const {bizName, bizType, period, metrics, scoreData, alerts, scenarios, reportText, products, sectorKey, createdAt} = report;
  const {revenue, netProfit, netMargin, grossMargin, totalExpenses, rentPct, salPct, cogsPct, mktPct, cogs, rent} = metrics;

  document.getElementById('resultTitle').textContent = `تقرير ${bizName}`;
  document.getElementById('resultMeta').textContent  = `${bizType} — تحليل ${period} — ${new Date(createdAt).toLocaleDateString('ar-SA')}`;

  // KPIs
  document.getElementById('resultKpis').innerHTML = [
    {val:fmt(revenue)+' ر', label:'الإيرادات', cls:'neu'},
    {val:(netProfit>=0?'+':'')+fmt(netProfit)+' ر', label:'صافي الربح', cls:netProfit>=0?'pos':'neg'},
    {val:netMargin+'%', label:'هامش الربح', cls:netMargin>15?'pos':netMargin<5?'neg':'warn'},
    {val:scoreData.total+'/100', label:'مؤشر الصحة', cls:scoreData.total>=65?'pos':scoreData.total>=40?'warn':'neg'},
  ].map(k=>`<div class="kpi"><div class="kpi-val ${k.cls}">${k.val}</div><div class="kpi-label">${k.label}</div></div>`).join('');

  // Score
  renderScore('resScoreRing','resScoreVal','resScoreLabel','resScoreBreakdown', scoreData.total);
  document.getElementById('resScoreBreakdown').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px;">
      ${scoreData.breakdown.map(b=>`
        <div class="progress-wrap">
          <div class="progress-head">
            <span style="font-size:12px;color:var(--gray2);">${b.label}</span>
            <span style="font-size:12px;color:var(--gold);">${b.val}/${b.max}</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${(b.val/b.max)*100}%;background:${b.color};"></div></div>
        </div>`).join('')}
    </div>`;

  // Benchmark
  const bench = BENCHMARKS[sectorKey];
  const bMetrics = { netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
  renderBenchmarkItems(bMetrics, bench, 'benchmarkContainer');

  // Alerts
  renderAlerts(alerts, 'resultAlerts');

  // Breakeven
  const fixedCosts = (metrics.rent||0)+(metrics.salaries||0)+(metrics.marketing||0)+(metrics.other||0);
  const beNetProfit = metrics.netProfit !== undefined ? metrics.netProfit : (revenue - (cogs||0) - fixedCosts);
  renderBreakeven(revenue, cogs, fixedCosts, 'resultBreakeven', beNetProfit);

  // Products analysis
  if(products.length) {
    const withMargins = products.map(p=>{
      const margin = p.price>0 ? ((p.price-p.cost)/p.price*100) : 0;
      const profit = (p.price-p.cost)*p.qty;
      return {...p,margin,profit};
    }).sort((a,b)=>b.margin-a.margin);
    const totalProd = withMargins.reduce((s,p)=>s+Math.max(0,p.profit),0);

    document.getElementById('resultProducts').innerHTML = withMargins.map((p,i)=>{
      const contrib = totalProd>0 ? ((p.profit/totalProd)*100).toFixed(0) : 0;
      const suggestion = p.margin < 15
        ? `رفع السعر 5% يرفع الربح ${fmt(p.qty*p.cost*0.05)} ﷼`
        : p.margin > 50 ? 'منتج رابح — ركّز عليه' : 'أداء طبيعي';
      return `<div class="prod-analysis-row">
        <div class="prod-rank ${i===0?'rank-1':i===1?'rank-2':'rank-3'}">${i+1}</div>
        <div style="flex:1;">
          <div class="prod-an-name">${p.name}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px;">${suggestion}</div>
          <div class="prod-an-bar" style="margin-top:6px;"><div class="prod-an-fill" style="width:${Math.min(100,p.margin)}%;background:${p.margin>30?'var(--green)':p.margin<10?'var(--red)':'var(--warn)'};"></div></div>
        </div>
        <div style="text-align:center;margin-right:12px;">
          <div style="font-size:16px;font-weight:700;color:${p.margin>30?'var(--green)':p.margin<10?'var(--red)':'var(--warn)'};">${p.margin.toFixed(0)}%</div>
          <div style="font-size:10px;color:var(--gray);">هامش</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:16px;font-weight:700;color:var(--gold);">${contrib}%</div>
          <div style="font-size:10px;color:var(--gray);">مساهمة</div>
        </div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('resultProducts').innerHTML = '<div style="color:var(--gray);font-size:13px;text-align:center;padding:20px;">لم يتم إدخال منتجات</div>';
  }

  // AI Analysis
  renderAIBlocks(reportText, 'aiBlocks');

  // Scenarios
  renderScenarios(scenarios, revenue, 'scenariosContainer');
}

function renderAIBlocks(text, containerId) {
  const wrap = document.getElementById(containerId);
  if(!text){wrap.innerHTML='<div style="color:var(--gray);font-size:13px;text-align:center;padding:20px;">التحليل الذكي غير متاح حالياً</div>';return;}
  const sections = [...text.matchAll(/\[SECTION:(.*?)\]([\s\S]*?)\[\/SECTION\]/g)];
  const icons={'التشخيص العام':'🩺','نقاط القوة':'✅','نقاط الخطر':'⚠️','تحليل المنتجات':'📊','توصيات عملية':'🎯','توقع الأداء':'📈'};
  if(!sections.length){wrap.innerHTML=`<div style="font-size:14px;line-height:1.9;color:var(--gray2);">${text.replace(/\n/g,'<br>')}</div>`;return;}
  wrap.innerHTML = sections.map((s,i)=>{
    const title=s[1].trim(), content=s[2].trim();
    const lines=content.split('\n').filter(l=>l.trim());
    const isGood=title==='نقاط القوة', isBad=title==='نقاط الخطر', isWarn=title==='توصيات عملية';
    const listHtml = (isGood||isBad||isWarn)
      ? `<div class="insight-list">${lines.map(l=>`<li class="insight-item ${isGood?'g':isBad?'r':'w'}"><span class="ii-icon">${isGood?'✓':isBad?'!':'→'}</span><span>${l.replace(/^[-•\d.]\s*/,'')}</span></li>`).join('')}</div>`
      : `<div style="font-size:14px;line-height:1.9;color:var(--gray2);">${content.replace(/\n/g,'<br>')}</div>`;
    return `<div style="margin-bottom:20px;animation:fadeUp 0.4s ease ${i*0.08}s forwards;opacity:0;">
      <div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="width:28px;height:28px;background:var(--gold-d);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">${icons[title]||'📌'}</span>${title}
      </div>${listHtml}</div>`;
  }).join('');
}

// ══════════════════════════════════════════
// DASHBOARD UPDATE
// ══════════════════════════════════════════
function updateDashboard() {
  const rep = STATE.savedReports[0];
  if(!rep){ return; }
  const m = rep.metrics;
  document.getElementById('dk-rev').textContent = fmt(m.revenue)+' ر';
  const pk = document.getElementById('dk-profit');
  pk.textContent = (m.netProfit>=0?'+':'')+fmt(m.netProfit)+' ر';
  pk.className = 'kpi-val '+(m.netProfit>=0?'pos':'neg');
  const mk = document.getElementById('dk-margin');
  mk.textContent = m.netMargin+'%';
  mk.className = 'kpi-val '+(m.netMargin>15?'pos':m.netMargin<5?'neg':'warn');
  document.getElementById('dk-health').textContent = rep.scoreData.total+'/100';

  renderScore('scoreRingFill','scoreVal','scoreLabel','scoreBreakdown', rep.scoreData.total);
  renderAlerts(rep.alerts, 'alertsContainer');

  const fixedCosts = (m.rent||0)+(m.salaries||0)+(m.marketing||0)+(m.other||0);
  renderBreakeven(m.revenue, m.cogs||0, fixedCosts, 'breakevenContainer');

  // Forecast
  const monthly = m.netProfit;
  const forecast3m = monthly * 3;
  const optimistic = (m.netProfit + m.revenue*0.1) * 3;
  document.getElementById('forecastContainer').innerHTML = `
    <div class="kpi-row kpi-row-2">
      <div class="kpi"><div class="kpi-val ${forecast3m>=0?'pos':'neg'}">${fmt(forecast3m)} ﷼</div><div class="kpi-label">متوقع خلال 3 أشهر (الوضع الحالي)</div></div>
      <div class="kpi gold"><div class="kpi-val pos">${fmt(optimistic)} ﷼</div><div class="kpi-label">متوقع مع تطبيق التوصيات</div></div>
    </div>
    <div class="alert alert-info" style="margin-top:12px;">
      <span class="alert-icon">🔮</span>
      <span>لو طبّقت توصيات التحليل، ربحك المتوقع أعلى بـ ${fmt(optimistic-forecast3m)} ريال خلال 3 أشهر</span>
    </div>`;
}

// ══════════════════════════════════════════
// SAVED REPORTS
// ══════════════════════════════════════════
async function loadReportsFromDB() {
  try {
    const user = window.__USER__;
    if (!user) return;
    const userId = typeof user === 'string' ? user : user.id;
    const { data, error } = await sb
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) return;
    // تحويل البيانات لشكل STATE
    STATE.savedReports = data.map(r => ({
      id: r.id,
      bizName: r.biz_name,
      bizType: r.biz_type,
      period: r.period,
      metrics: { revenue: r.revenue, totalExpenses: r.total_expenses, netProfit: r.net_profit, netMargin: r.net_margin, healthScore: r.health_score },
      scoreData: { total: r.health_score },
      reportJson: r.report_json,
      date: r.created_at
    }));
    localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0,20)));
  } catch(e) { console.warn('loadReportsFromDB error:', e); }
}

function renderSavedReports() {
  const grid = document.getElementById('savedReportsGrid');
  if(!STATE.savedReports.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;background:var(--s1);border:1px dashed var(--border);border-radius:16px;">
      <div style="font-size:40px;margin-bottom:12px;opacity:0.3;">📭</div>
      <div style="color:var(--gray2);font-size:14px;">لا توجد تقارير محفوظة</div>
      <div style="color:var(--gray);font-size:13px;margin-top:6px;">ابدأ بتحليل مشروعك الأول</div>
    </div>`;
    return;
  }
  grid.innerHTML = STATE.savedReports.map((r,i)=>{
    const m = r.metrics;
    return `<div class="card" style="cursor:pointer;transition:all 0.2s;animation:fadeUp 0.4s ease ${i*0.06}s forwards;opacity:0;" onmouseenter="this.style.borderColor='var(--gold-b)'" onmouseleave="this.style.borderColor='var(--border)'" onclick="openSavedReport('${r.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div style="font-size:15px;font-weight:700;color:var(--white);">${r.bizName}</div>
        <div style="font-size:11px;padding:3px 10px;background:var(--gold-d);color:var(--gold);border:1px solid var(--gold-b);border-radius:20px;">${r.bizType||'—'}</div>
      </div>
      <div class="kpi-row kpi-row-2" style="margin-bottom:12px;">
        <div class="kpi card-sm"><div class="kpi-val neu" style="font-size:16px;">${fmt(m.revenue)} ﷼</div><div class="kpi-label">الإيرادات</div></div>
        <div class="kpi card-sm"><div class="kpi-val ${m.netProfit>=0?'pos':'neg'}" style="font-size:16px;">${m.netProfit>=0?'+':''}${fmt(m.netProfit)} ﷼</div><div class="kpi-label">صافي الربح</div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--gray);">${new Date(r.createdAt).toLocaleDateString('ar-SA')}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSavedReport('${r.id}')">عرض</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSavedReport('${r.id}')">حذف</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openSavedReport(id) {
  const rep = STATE.savedReports.find(r=>r.id===id);
  if(!rep) return;
  STATE.currentReport = rep;
  renderResults(rep);
  showPage('results');
}

function deleteSavedReport(id) {
  if(!confirm('حذف هذا التقرير؟')) return;
  STATE.savedReports = STATE.savedReports.filter(r=>r.id!==id);
  localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports));
  renderSavedReports();
  toast('تم الحذف');
}

// ══════════════════════════════════════════
// EXCEL IMPORT
// ══════════════════════════════════════════
function handleExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, {type:'binary'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
      if (!rows.length) { toast('الملف فارغ'); return; }

      const clean = s => String(s||'').trim().replace(/\s+/g,' ');
      const num = v => { const n=parseFloat(String(v).replace(/[,،\s]/g,'')); return isNaN(n)?0:n; };
      const set = (id,v) => { const el=document.getElementById(id); if(el){el.value=v; el.dispatchEvent(new Event('input'));} };

      // النوع ١: جدول منتجات (أعمدة)
      const headers = rows[0].map(h => clean(h).toLowerCase());
      const hasProduct = headers.some(h=>h.includes('منتج')||h.includes('product')||h.includes('صنف'));
      const hasQty = headers.some(h=>h.includes('كمية')||h.includes('qty')||h.includes('عدد'));
      const hasRev = headers.some(h=>h.includes('إيراد')||h.includes('ايراد')||h.includes('مبيعات')||h.includes('revenue'));
      if (hasProduct && (hasQty||hasRev)) {
        const nI=headers.findIndex(h=>h.includes('منتج')||h.includes('product')||h.includes('صنف'));
        const qI=headers.findIndex(h=>h.includes('كمية')||h.includes('qty')||h.includes('عدد'));
        const rI=headers.findIndex(h=>h.includes('إيراد')||h.includes('ايراد')||h.includes('مبيعات')||h.includes('revenue'));
        const cI=headers.findIndex(h=>h.includes('تكلفة')||h.includes('cost'));
        const products=rows.slice(1).filter(r=>clean(r[nI])).map(r=>({
          name:clean(r[nI]), qty:qI>=0?num(r[qI]):0, revenue:rI>=0?num(r[rI]):0, cost:cI>=0?num(r[cI]):0
        })).filter(p=>p.qty>0||p.revenue>0);
        if(products.length){showProductTable(products);toast('✅ تم قراءة '+products.length+' منتج');return;}
      }

      // النوع ٢: تقرير يومي
      const hasDate=headers.some(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم'));
      const hasSales=headers.some(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
      if(hasDate&&hasSales){
        const dI=headers.findIndex(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم'));
        const sI=headers.findIndex(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
        const data=rows.slice(1).filter(r=>r[sI]).map(r=>({date:clean(r[dI]),sales:num(r[sI])}));
        if(data.length){
          const total=data.reduce((s,r)=>s+r.sales,0);
          set('f-rev',total);
          toast('✅ إجمالي '+data.length+' يوم: ﷼'+total.toLocaleString('en'));
          return;
        }
      }

      // النوع ٣: key-value — البيانات الرئيسية
      const pairs=[];
      rows.forEach(row=>{const k=clean(row[0]),v=row[1];if(k&&v!==''&&v!==undefined)pairs.push([k,v]);});

      const fieldMap=[
        {field:'f-name',    keys:['اسم المشروع','اسم مشروع','اسم النشاط','المشروع','اسم الكافيه','اسم المطعم','اسم المتجر']},
        {field:'f-type',    keys:['نوع النشاط','نوع المشروع','القطاع','النشاط','نوع']},
        {field:'f-rev',     keys:['الإيرادات','إيرادات','المبيعات','مبيعات','إجمالي المبيعات','إجمالي الإيرادات','الدخل','revenue','sales']},
        {field:'f-cogs',    keys:['تكلفة المواد','تكلفة البضاعة','تكلفة المنتجات','تكلفة الخامات','cogs','تكلفة المبيعات','تكلفة البضائع']},
        {field:'f-sal',     keys:['رواتب الموظفين','الرواتب','رواتب','أجور','salaries','wages']},
        {field:'f-rent',    keys:['الإيجار','إيجار','rent','اجار']},
        {field:'f-utilities',keys:['الكهرباء والماء','الكهرباء والمياه','كهرباء وماء','كهرباء','utilities']},
        {field:'f-mkt',     keys:['التسويق','تسويق','إعلانات','دعاية وإعلان','marketing']},
        {field:'f-other',   keys:['مصروفات أخرى','مصاريف أخرى','أخرى','متنوع','other']},
      ];

      let matched=0;
      pairs.forEach(([k,v])=>{
        const kC=k.replace(/\s+/g,'');
        for(const {field,keys} of fieldMap){
          if(keys.some(key=>kC.includes(key.replace(/\s+/g,''))||key.replace(/\s+/g,'').includes(kC))){
            if(field==='f-name'||field==='f-type') set(field,String(v).trim());
            else set(field,num(v));
            matched++; break;
          }
        }
        if(k.includes('الفترة')||k.includes('فترة')){
          const el=document.getElementById('f-period');
          if(el){el.value=String(v).trim();el.dispatchEvent(new Event('change'));if(typeof togglePeriod==='function')togglePeriod();}
        }
        if(k.includes('الشهر')||k.includes('شهر')){
          const el=document.getElementById('f-month');if(el)set('f-month',String(v).trim());
        }
      });

      if(matched>0){if(typeof liveCalc==='function')liveCalc();toast('✅ تم قراءة '+matched+' حقل من الملف');}
      else toast('⚠️ تنسيق الملف غير معروف — استخدم عمودين: البند والمبلغ');

    } catch(err){console.error('handleExcel:',err);toast('❌ خطأ: '+err.message);}
  };
  reader.readAsBinaryString(file);
}

// excelZone drag-drop removed — using excel-input directly

// ══════════════════════════════════════════
// PDF EXPORT
// ══════════════════════════════════════════
async function exportPDF() {
  if(!STATE.currentReport){toast('لا يوجد تقرير لتصديره');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const r=STATE.currentReport, m=r.metrics;

  doc.setFillColor(7,8,10); doc.rect(0,0,210,297,'F');
  doc.setFillColor(200,164,90); doc.rect(0,0,210,3,'F');

  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(200,164,90);
  doc.text('Tawakkad Financial Report',105,22,{align:'center'});
  doc.setFontSize(11); doc.setTextColor(180,175,165);
  doc.text(`${r.bizName} — ${r.bizType} — ${r.period}`,105,31,{align:'center'});
  doc.setFontSize(9); doc.setTextColor(100,95,88);
  doc.text(`${new Date(r.createdAt).toLocaleDateString('ar-SA')}  |  Health Score: ${r.scoreData.total}/100`,105,39,{align:'center'});
  doc.setDrawColor(200,164,90); doc.setLineWidth(0.3); doc.line(20,44,190,44);

  let y=55;
  const kpis=[['Revenue',fmt(m.revenue)+' SAR'],['Net Profit',(m.netProfit>=0?'+':'')+fmt(m.netProfit)+' SAR'],['Net Margin',m.netMargin+'%'],['Gross Margin',m.grossMargin+'%']];
  kpis.forEach((k,i)=>{
    const x=20+(i*46);
    doc.setFillColor(22,23,28); doc.roundedRect(x,y,42,22,3,3,'F');
    doc.setFontSize(13); doc.setTextColor(200,164,90); doc.text(k[1],x+21,y+10,{align:'center'});
    doc.setFontSize(8); doc.setTextColor(100,95,88); doc.text(k[0],x+21,y+17,{align:'center'});
  });
  y+=32;
  doc.setDrawColor(30,30,30); doc.line(20,y,190,y); y+=10;

  if(r.reportText){
    const sections=[...r.reportText.matchAll(/\[SECTION:(.*?)\]([\s\S]*?)\[\/SECTION\]/g)];
    sections.forEach(s=>{
      if(y>265){doc.addPage();doc.setFillColor(7,8,10);doc.rect(0,0,210,297,'F');y=20;}
      doc.setFontSize(10); doc.setTextColor(200,164,90); doc.text(s[1].trim(),20,y); y+=7;
      doc.setFontSize(8.5); doc.setTextColor(160,155,145);
      s[2].trim().split('\n').filter(l=>l.trim()).slice(0,5).forEach(line=>{
        if(y>272){doc.addPage();doc.setFillColor(7,8,10);doc.rect(0,0,210,297,'F');y=20;}
        doc.text('• '+line.replace(/^[-•]\s*/,'').substring(0,100),22,y); y+=6;
      });
      y+=5;
    });
  }
  doc.setFillColor(200,164,90); doc.rect(0,293,210,4,'F');
  doc.setFontSize(7); doc.setTextColor(80,75,70);
  doc.text('Generated by Tawakkad — Certainty Before Investment — tawakkad.sa',105,291,{align:'center'});
  doc.save(`tawakkad-${r.bizName}-${new Date().toISOString().slice(0,10)}.pdf`);
  toast('تم تحميل PDF ✓');
}


// ══════════════════════════════════════════
// AI CFO
// ══════════════════════════════════════════
let CFO_HISTORY = [];

function getCFOContext() {
  const rep = STATE.currentReport;
  if (!rep) return null;
  const m = rep.metrics;
  return {
    bizName: rep.bizName,
    bizType: rep.bizType,
    period: rep.period,
    revenue: m.revenue,
    netProfit: m.netProfit,
    netMargin: m.netMargin,
    grossMargin: m.grossMargin,
    totalExpenses: m.totalExpenses,
    rentPct: m.rentPct,
    salPct: m.salPct,
    cogsPct: m.cogsPct,
    mktPct: m.mktPct,
    healthScore: rep.scoreData?.total,
    products: rep.products || [],
    alerts: rep.alerts?.map(a => a.msg) || [],
  };
}

function buildCFOSystemPrompt(ctx) {
  if (!ctx) {
    return `أنت AI CFO — مستشار مالي ذكي للمشاريع الصغيرة والمتوسطة السعودية.
لا تتوفر بيانات مشروع حالياً. أجب على الأسئلة المالية بشكل عام ومفيد.
تحدث بالعربية دائماً. كن موجزاً ومباشراً. استخدم الأرقام والأمثلة.`;
  }

  const prodsText = ctx.products.length
    ? ctx.products.map(p => {
        const m = p.price > 0 ? (((p.price-p.cost)/p.price)*100).toFixed(0) : 0;
        return `${p.name} (هامش ${m}%, كمية ${p.qty})`;
      }).join('، ')
    : 'لا توجد بيانات';

  return `أنت AI CFO لمشروع "${ctx.bizName}" — مستشار مالي متخصص.

بيانات المشروع الحالية:
- النشاط: ${ctx.bizType} | الفترة: ${ctx.period}
- الإيرادات: ${ctx.revenue?.toLocaleString()} ريال
- صافي الربح: ${ctx.netProfit?.toLocaleString()} ريال (${ctx.netMargin}%)
- هامش إجمالي: ${ctx.grossMargin}%
- المصاريف: ${ctx.totalExpenses?.toLocaleString()} ريال
- الإيجار: ${ctx.rentPct}% | الرواتب: ${ctx.salPct}% | تكلفة البضاعة: ${ctx.cogsPct}% | التسويق: ${ctx.mktPct}%
- مؤشر الصحة: ${ctx.healthScore}/100
- المنتجات: ${prodsText}
- التنبيهات: ${ctx.alerts?.join(' | ') || 'لا توجد'}

أنت تعرف هذه البيانات بشكل كامل. أجب على أسئلة المستخدم كمستشار مالي خبير:
- كن مباشراً وموجزاً (3-5 جمل في الغالب)
- استخدم أرقام المشروع الفعلية في إجاباتك
- أعطِ توصيات قابلة للتطبيق فوراً
- إذا كان السؤال خارج نطاق البيانات، أجب بشكل عام مفيد
- تحدث بالعربية دائماً بأسلوب مستشار محترف وليس روبوت
- استخدم **bold** للأرقام المهمة والنقاط الرئيسية`;
}


// expose to window
window.runAnalysis = runAnalysis;
window.handleExcel = handleExcel;
window.exportPDF = exportPDF;
window.renderResults = renderResults;
window.updateDashboard = updateDashboard;
window.renderSavedReports = renderSavedReports;
window.openSavedReport = openSavedReport;
window.deleteSavedReport = deleteSavedReport;
window.getCFOContext = getCFOContext;
window.buildCFOSystemPrompt = buildCFOSystemPrompt;
