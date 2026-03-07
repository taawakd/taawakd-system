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
  renderBreakeven(revenue, cogs, fixedCosts, 'resultBreakeven');

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
    return `<div class="card" style="cursor:pointer;transition:all 0.2s;animation:fadeUp 0.4s ease ${i*0.06}s forwards;opacity:0;" onmouseenter="this.style.borderColor='var(--gold-b)'" onmouseleave="this.style.borderColor='var(--border)'" onclick="openSavedReport(${r.id})">
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
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSavedReport(${r.id})">عرض</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSavedReport(${r.id})">حذف</button>
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

async function sendCFO(quickMsg) {
  const input = document.getElementById('cfoInput');
  const msg = quickMsg || input.value.trim();
  if (!msg) return;

  input.value = '';
  input.style.height = 'auto';

  // Hide suggestions after first message
  document.getElementById('cfoSuggestions').style.display = 'none';

  // Add user message
  appendCFOMessage('user', msg);

  // Add to history
  CFO_HISTORY.push({ role: 'user', content: msg });

  // Show typing
  const typingId = appendCFOTyping();

  document.getElementById('cfoSendBtn').disabled = true;

  const ctx = getCFOContext();

  // Update context bar
  if (ctx) {
    document.getElementById('cfoContextBar').style.display = 'flex';
    document.getElementById('cfoContextText').textContent =
      `متصل بـ ${ctx.bizName} — هامش الربح ${ctx.netMargin}% — مؤشر الصحة ${ctx.healthScore}/100`;
  }

  try {
    // ✅ إصلاح 401: تأكد من وجود التوكن قبل الإرسال
    // التوكن محفوظ من onAuthStateChange — نستخدمه مباشرة
    if (!window.__AUTH_TOKEN__) { window.location.href = '/auth.html'; return; }

    const systemPrompt = buildCFOSystemPrompt(ctx);

    // Keep last 10 messages for context
    const messages = CFO_HISTORY.slice(-10);

    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.__AUTH_TOKEN__
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await resp.json();
    const reply = data.content?.map(i => i.text || '').join('') || 'عذراً، حدث خطأ. حاول مجدداً.';

    // Add to history
    CFO_HISTORY.push({ role: 'assistant', content: reply });

    removeTyping(typingId);
    appendCFOMessage('ai', reply);

  } catch(e) {
    removeTyping(typingId);
    appendCFOMessage('ai', '⚠️ تعذّر الاتصال. تأكد من الإنترنت وحاول مجدداً.');
  } finally {
    document.getElementById('cfoSendBtn').disabled = false;
    input.focus();
  }
}

function appendCFOMessage(role, text) {
  const msgs = document.getElementById('cfoMessages');
  const div = document.createElement('div');
  div.className = `cfo-msg ${role}`;

  // Format text: bold **text**, newlines
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
    .replace(/^[-•]\s*/gm, '• ');

  div.innerHTML = `
    <div class="cfo-avatar ${role}">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="cfo-bubble ${role}">${formatted}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function appendCFOTyping() {
  const msgs = document.getElementById('cfoMessages');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'cfo-msg';
  div.id = id;
  div.innerHTML = `
    <div class="cfo-avatar ai">🤖</div>
    <div class="cfo-bubble ai">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}


// ══════════════════════════════════════════
// ACTION PLAN
// ══════════════════════════════════════════
async function generateActionPlan() {
  const rep = STATE.currentReport;
  if (!rep) { toast('أجرِ تحليلاً أولاً'); showPage('analysis'); return; }

  const c = document.getElementById('actionPlanContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray);">⏳ جاري توليد الخطة...</div>';

  const m = rep.metrics;
  const prompt = `أنت مستشار مالي. بناءً على بيانات "${rep.bizName}":
- الإيرادات: ${m.revenue?.toLocaleString()} ﷼ | صافي الربح: ${m.netProfit?.toLocaleString()} ﷼ | هامش: ${m.netMargin}%
- تكاليف البضاعة: ${m.cogsPct}% | الإيجار: ${m.rentPct}% | الرواتب: ${m.salPct}%
- مؤشر الصحة: ${rep.scoreData?.total}/100
- التنبيهات: ${rep.alerts?.map(a=>a.msg).join(' | ') || 'لا يوجد'}

أعطني خطة عمل 4 أسابيع بالتنسيق التالي بالضبط (JSON فقط بدون أي نص آخر):
{
  "weeks": [
    {
      "week": 1,
      "focus": "عنوان التركيز",
      "actions": [
        {"text": "الإجراء", "impact": "التأثير المتوقع مثل يوفر 2000 ﷼ شهرياً", "priority": "high|med|low"}
      ]
    }
  ]
}`;

  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (window.__AUTH_TOKEN__ || '')
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    let text = data.content?.map(i=>i.text||'').join('') || '';
    text = text.replace(/```json|```/g,'').trim();
    const plan = JSON.parse(text);
    renderActionPlan(plan.weeks);
  } catch(e) {
    renderActionPlan(defaultActionPlan(rep));
  }
}

function defaultActionPlan(rep) {
  const m = rep.metrics;
  return [
    { week:1, focus:'تخفيض التكاليف الفورية', actions:[
      {text:'راجع عقود الموردين وطلب تخفيض 5-10%', impact:'وفر تصل '+fmt(m.cogs*0.07)+' ر', priority:'high'},
      {text:'حدّد المصاريف غير الضرورية وأوقفها فوراً', impact:'تخفيض مباشر للتكاليف', priority:'high'},
      {text:'راجع ساعات العمل وتوزيع الموظفين', impact:'تحسين الكفاءة التشغيلية', priority:'med'},
    ]},
    { week:2, focus:'تحسين الإيرادات', actions:[
      {text:'رفع أسعار المنتجات ذات الهامش المنخفض 5-8%', impact:'زيادة الهامش '+m.netMargin+'%→'+(parseFloat(m.netMargin)+3)+'%', priority:'high'},
      {text:'فعّل حملة تسويقية للمنتج الأكثر ربحاً', impact:'زيادة المبيعات 10-15%', priority:'high'},
      {text:'اطلق عروض الولاء للعملاء الحاليين', impact:'تحسين الاحتفاظ بالعملاء', priority:'med'},
    ]},
    { week:3, focus:'تحسين العمليات', actions:[
      {text:'راجع جدول الطلبات والمخزون لتقليل الهدر', impact:'تخفيض COGS 3-5%', priority:'med'},
      {text:'أتمت العمليات المتكررة قدر الإمكان', impact:'توفير وقت وتكاليف', priority:'low'},
      {text:'حلّل ساعات الذروة وضع طاقم كافٍ', impact:'تحسين خدمة العملاء والمبيعات', priority:'med'},
    ]},
    { week:4, focus:'قياس النتائج والتخطيط', actions:[
      {text:'قارن أرقام هذا الشهر بالشهر الماضي', impact:'قياس أثر التحسينات', priority:'high'},
      {text:'حدّد 3 أهداف للشهر القادم بأرقام واضحة', impact:'توجيه استراتيجي واضح', priority:'high'},
      {text:'اعمل تحليل جديد على توكّد لقياس التحسن', impact:'متابعة دقيقة للأداء', priority:'med'},
    ]},
  ];
}

function renderActionPlan(weeks) {
  const c = document.getElementById('actionPlanContent');
  let progress = JSON.parse(localStorage.getItem('tw_plan_progress') || '{}');

  c.innerHTML = weeks.map(w => `
    <div class="week-card">
      <div class="week-header">
        <div class="week-num">أ${w.week}</div>
        <div><div class="week-title">الأسبوع ${w.week}</div><div class="week-focus">${w.focus}</div></div>
        <div style="margin-right:auto;font-size:12px;color:var(--gray);">
          ${w.actions.filter((_,i)=>progress[w.week+'-'+i]).length}/${w.actions.length} مكتمل
        </div>
      </div>
      ${w.actions.map((a,i) => {
        const key = w.week+'-'+i;
        const done = !!progress[key];
        const priLabel = a.priority==='high'?'عالي':a.priority==='med'?'متوسط':'منخفض';
        const priClass = a.priority==='high'?'pri-high':a.priority==='med'?'pri-med':'pri-low';
        return `<div class="action-item ${done?'done':''}" onclick="toggleAction(${w.week},${i},this)">
          <div class="ai-check">${done?'✓':''}</div>
          <div style="flex:1;">
            <div class="ai-text">${a.text}</div>
            <div class="ai-impact">📈 ${a.impact}</div>
          </div>
          <div class="ai-priority ${priClass}">${priLabel}</div>
        </div>`;
      }).join('')}
    </div>`).join('');

  STATE._actionPlanWeeks = weeks;
}

function toggleAction(week, idx, el) {
  let progress = JSON.parse(localStorage.getItem('tw_plan_progress') || '{}');
  const key = week+'-'+idx;
  progress[key] = !progress[key];
  localStorage.setItem('tw_plan_progress', JSON.stringify(progress));
  el.classList.toggle('done');
  const check = el.querySelector('.ai-check');
  if(el.classList.contains('done')){check.textContent='✓';} else {check.textContent='';}
}

function exportActionPlanPDF() {
  toast('جاري تصدير الخطة...');
  // Uses same jsPDF logic
  if(!STATE._actionPlanWeeks){toast('لا توجد خطة لتصديرها');return;}
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({unit:'mm',format:'a4'});
  doc.setFillColor(7,8,10); doc.rect(0,0,210,297,'F');
  doc.setFillColor(200,164,90); doc.rect(0,0,210,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(200,164,90);
  doc.text('Action Plan — ' + (STATE.currentReport?.bizName||''), 105, 20, {align:'center'});
  let y = 35;
  STATE._actionPlanWeeks.forEach(w => {
    doc.setFontSize(12); doc.setTextColor(200,164,90);
    doc.text('Week '+w.week+': '+w.focus, 20, y); y+=8;
    w.actions.forEach(a => {
      doc.setFontSize(9); doc.setTextColor(160,155,145);
      doc.text('• '+a.text, 25, y); y+=6;
      doc.setFontSize(8); doc.setTextColor(100,95,88);
      doc.text('  → '+a.impact, 28, y); y+=7;
      if(y>270){doc.addPage();doc.setFillColor(7,8,10);doc.rect(0,0,210,297,'F');y=20;}
    });
    y+=5;
  });
  doc.save('tawakkad-action-plan.pdf');
}

// ══════════════════════════════════════════
// CASH FLOW
// ══════════════════════════════════════════
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

async function saveBusinessProfile() {
  const statusEl = document.getElementById('bp-save-status');
  if (statusEl) statusEl.textContent = 'جاري الحفظ...';
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { toast('يجب تسجيل الدخول أولاً'); return; }
    const profile = {
      user_id: user.id,
      biz_name: document.getElementById('bp-name')?.value || '',
      biz_type: document.getElementById('bp-type')?.value || '',
      fixed_rent:          parseFloat(document.getElementById('bp-rent')?.value)          || 0,
      fixed_salaries:      parseFloat(document.getElementById('bp-salaries')?.value)      || 0,
      fixed_utilities:     parseFloat(document.getElementById('bp-utilities')?.value)     || 0,
      fixed_subscriptions: parseFloat(document.getElementById('bp-subscriptions')?.value) || 0,
      fixed_other:         parseFloat(document.getElementById('bp-fixed-other')?.value)   || 0,
      var_cogs_pct:        parseFloat(document.getElementById('bp-cogs')?.value)          || 0,
      var_delivery_pct:    parseFloat(document.getElementById('bp-delivery')?.value)      || 0,
      var_marketing_pct:   parseFloat(document.getElementById('bp-marketing')?.value)     || 0,
      var_other_pct:       parseFloat(document.getElementById('bp-var-other')?.value)     || 0,
      products: BP_PRODUCTS,
    };
    const { error } = await sb.from('business_profile')
      .upsert(profile, { onConflict: 'user_id' });
    if (error) throw error;
    window._businessProfile = profile;
    if (statusEl) statusEl.textContent = '✅ تم الحفظ في ' + new Date().toLocaleTimeString('ar-SA');
    toast('✅ تم حفظ ملف المشروع');
  } catch(err) {
    console.error(err);
    if (statusEl) statusEl.textContent = '❌ خطأ في الحفظ';
    toast('❌ خطأ: ' + err.message);
  }
}

async function loadBusinessProfile() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data, error } = await sb.from('business_profile')
      .select('*').eq('user_id', user.id).single();
    if (error || !data) return;
    window._businessProfile = data;
    BP_PRODUCTS = data.products || [];
    // ملء الحقول
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('bp-name', data.biz_name);
    set('bp-type', data.biz_type);
    set('bp-rent', data.fixed_rent);
    set('bp-salaries', data.fixed_salaries);
    set('bp-utilities', data.fixed_utilities);
    set('bp-subscriptions', data.fixed_subscriptions);
    set('bp-fixed-other', data.fixed_other);
    set('bp-cogs', data.var_cogs_pct);
    set('bp-delivery', data.var_delivery_pct);
    set('bp-marketing', data.var_marketing_pct);
    set('bp-var-other', data.var_other_pct);
    calcBPFixed();
    renderBPProducts();
  } catch(e) { console.warn('loadBusinessProfile:', e); }
}
// ============ نهاية ملف المشروع ============