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
