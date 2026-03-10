// services/financial.js — تحليل مالي + Excel + PDF + CFO context
const BENCHMARKS = {
  restaurant: { label: 'مطعم', netMargin: { min: 10, max: 18, label: 'هامش الربح الصافي' }, grossMargin: { min: 55, max: 70, label: 'هامش الربح الإجمالي' }, rentPct: { min: 6, max: 12, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 22, max: 35, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 28, max: 40, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 2, max: 6, label: 'نسبة التسويق', lowerIsBetter: true }, },
  cafe: { label: 'مقهى / كافيه', netMargin: { min: 18, max: 32, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 8, max: 15, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 18, max: 28, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 18, max: 30, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 3, max: 8, label: 'نسبة التسويق', lowerIsBetter: true }, },
  juice_kiosk: { label: 'كيوسك عصائر', netMargin: { min: 20, max: 35, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5, max: 12, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 15, max: 25, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 18, max: 30, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 2, max: 6, label: 'نسبة التسويق', lowerIsBetter: true }, },
  bakery: { label: 'مخبز / حلويات', netMargin: { min: 12, max: 22, label: 'هامش الربح الصافي' }, grossMargin: { min: 55, max: 72, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5, max: 10, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 20, max: 30, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 25, max: 38, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 2, max: 6, label: 'نسبة التسويق', lowerIsBetter: true }, },
  food_truck: { label: 'فود ترك', netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 60, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 0, max: 5, label: 'نسبة الإيجار / موقع', lowerIsBetter: true }, salPct: { min: 15, max: 25, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 25, max: 38, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 3, max: 8, label: 'نسبة التسويق', lowerIsBetter: true }, },
  retail: { label: 'متجر تجزئة', netMargin: { min: 10, max: 20, label: 'هامش الربح الصافي' }, grossMargin: { min: 30, max: 50, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5, max: 10, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 10, max: 20, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 50, max: 70, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 2, max: 5, label: 'نسبة التسويق', lowerIsBetter: true }, },
  services: { label: 'خدمات', netMargin: { min: 20, max: 40, label: 'هامش الربح الصافي' }, grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3, max: 8, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 30, max: 50, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 40, label: 'تكلفة الخدمة', lowerIsBetter: true }, mktPct: { min: 5, max: 12, label: 'نسبة التسويق', lowerIsBetter: true }, },
  barber: { label: 'حلاقة وتجميل', netMargin: { min: 18, max: 30, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 10, max: 18, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 25, max: 40, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 15, max: 30, label: 'تكلفة اللوازم', lowerIsBetter: true }, mktPct: { min: 2, max: 6, label: 'نسبة التسويق', lowerIsBetter: true }, },
  ecom: { label: 'تجارة إلكترونية', netMargin: { min: 8, max: 20, label: 'هامش الربح الصافي' }, grossMargin: { min: 30, max: 55, label: 'هامش الربح الإجمالي' }, rentPct: { min: 0, max: 3, label: 'نسبة الإيجار', lowerIsBetter: true }, salPct: { min: 10, max: 25, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 45, max: 65, label: 'تكلفة البضاعة', lowerIsBetter: true }, mktPct: { min: 10, max: 20, label: 'نسبة التسويق', lowerIsBetter: true }, },
};

// expose BENCHMARKS for results.js and reports.js (loaded before financial.js)
window.BENCHMARKS = BENCHMARKS;

// ============================================================
// التحليل المالي الرئيسي
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
  const salPct = parseFloat(pct(salaries,revenue));
  const cogsPct = parseFloat(pct(cogs,revenue));
  const mktPct = parseFloat(pct(marketing,revenue));

  const bizName = document.getElementById('f-name').value || 'مشروعك';
  const bizType = document.getElementById('f-type').value || 'غير محدد';
  const period = getPeriodLabel();
  const employees = getN('f-emp');
  const notes = document.getElementById('f-notes').value;
  const products = collectProducts();

  const sectorKey = getSectorKey(bizType);
  // ✅ إصلاح 1: استخدام sectorKey المعرّف بدلاً من resolvedSectorKey غير المعرّف
  const bench = BENCHMARKS[sectorKey];

  const metrics = { revenue, cogs, rent, salaries, marketing, other, utilities, totalExpenses, netProfit, netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
  const scoreData = calcScore({ netMargin, grossMargin, rentPct, salPct, cogsPct });
  const alerts = generateAlerts({ ...metrics, netMargin, grossMargin, rentPct, salPct, cogsPct }, sectorKey);
  const scenarios = buildScenarios({ revenue, totalExpenses, netProfit, cogs, salaries, rent });

  const productsText = products.length ? products.map(p=>{const m=p.price>0?(((p.price-p.cost)/p.price)*100).toFixed(0):0;return `- ${p.name}: سعر ${p.price}ر تكلفة ${p.cost}ر كمية ${p.qty} هامش ${m}%`;}).join('\n') : 'لا توجد بيانات منتجات.';

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
      body:JSON.stringify({ model:"gpt-4o-mini", max_tokens:1000, messages:[{role:"user",content:prompt}] })
    });
    const data = await resp.json();
    reportText = data.content?.map(i=>i.text||'').join('') || '';
  } catch(e) { reportText = ''; }

  console.log('[Tawakkad] runAnalysis — window._excelReportPeriod before report build:', window._excelReportPeriod);
  const report = {
    id: Date.now(), bizName, bizType, period, metrics,
    scoreData, alerts, scenarios, reportText, products, sectorKey,
    createdAt: new Date().toISOString(),
    reportPeriod: window._excelReportPeriod || null
  };
  console.log('[Tawakkad] report.reportPeriod:', report.reportPeriod);
  window._excelReportPeriod = null;

  STATE.currentReport = report;
  STATE.savedReports.unshift(report);
  localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0,20)));

  try {
    const token = window.__AUTH_TOKEN__;
    if (token) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const basePayload = {
          user_id: user.id, biz_name: report.bizName, biz_type: report.bizType,
          period: report.period, revenue: report.metrics?.revenue || 0,
          total_expenses: report.metrics?.totalExpenses || 0, net_profit: report.metrics?.netProfit || 0,
          net_margin: report.metrics?.netMargin || 0, health_score: report.scoreData?.total || 0,
          report_json: report
        };
        // Try with report_period column; if column doesn't exist yet, fall back without it
        // (reportPeriod is always present inside report_json as a safe fallback)
        let { error: insertErr } = await sb.from('reports').insert({
          ...basePayload, report_period: report.reportPeriod || null
        });
        if (insertErr) {
          console.error('[Tawakkad] Supabase insert error:', insertErr.message, insertErr);
          // If the error is a missing column, retry without report_period
          if (insertErr.code === '42703' || (insertErr.message && insertErr.message.includes('report_period'))) {
            console.warn('[Tawakkad] report_period column missing — run SQL migration. Retrying without column...');
            const { error: retryErr } = await sb.from('reports').insert(basePayload);
            if (retryErr) console.error('[Tawakkad] Supabase retry insert error:', retryErr.message, retryErr);
            else console.log('[Tawakkad] Insert succeeded without report_period (reportPeriod stored in report_json)');
          }
        } else {
          console.log('[Tawakkad] Supabase insert OK — report_period:', report.reportPeriod);
        }
        await sb.from('profiles').update({ analyses_used: (window._profileUsed || 0) + 1 }).eq('id', user.id);
      }
    }
  } catch(saveErr) { console.error('[Tawakkad] Supabase save exception:', saveErr); }

  if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').classList.remove('show');
  renderResults(report);
  showPage('results');
  document.getElementById('analyzeBtnText').textContent = 'تحليل المشروع الآن';
  if(document.getElementById('analyzeSpin')) document.getElementById('analyzeSpin').style.display = 'none';
  btn.disabled = false;
  toast('تم حفظ التقرير ✓');
}


// ✅ المرحلة 3-A: renderResults → services/results.js



// ✅ المرحلة 3-A: renderAIBlocks → services/results.js


// ══════════════════════════════════════════
// DASHBOARD UPDATE
// ══════════════════════════════════════════

// ✅ المرحلة 3-B: updateDashboard+loadReportsFromDB+renderSavedReports → dashboard.js


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

      const hasDate=headers.some(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم'));
      const hasSales=headers.some(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
      if(hasDate&&hasSales){
        const dI=headers.findIndex(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم'));
        const sI=headers.findIndex(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
        // parseExcelDate: handles both ISO/string dates AND Excel serial numbers (e.g. 45292)
        const parseExcelDate = rawVal => {
          const n = parseFloat(rawVal);
          // Excel serial numbers are integers > 1000; convert via epoch anchor 1899-12-30
          if (!isNaN(n) && n > 1000 && Number.isInteger(n)) {
            return new Date(Date.UTC(1899, 11, 30) + n * 86400000);
          }
          // Fallback: try direct string parse (ISO, DD/MM/YYYY formatted strings)
          return new Date(String(rawVal||'').trim());
        };
        // Preserve raw cell value (rawDate) alongside cleaned string for date parsing
        const data=rows.slice(1).filter(r=>r[sI]).map(r=>({rawDate:r[dI],date:clean(r[dI]),sales:num(r[sI])}));
        if(data.length){
          const total=data.reduce((s,r)=>s+r.sales,0);
          set('f-rev',total);
          // Extract date range for reportPeriod using raw values to handle serial numbers
          const validDates=data.map(r=>parseExcelDate(r.rawDate)).filter(d=>!isNaN(d));
          console.log('[Tawakkad] handleExcel date+sales: rawDate samples=',
            data.slice(0,3).map(r=>r.rawDate), '| validDates=', validDates.length,
            validDates.length ? '| first='+validDates[0].toISOString().slice(0,10) : '');
          if(validDates.length>=2){
            const minD=new Date(Math.min(...validDates.map(d=>d.getTime())));
            const maxD=new Date(Math.max(...validDates.map(d=>d.getTime())));
            window._excelReportPeriod=minD.toLocaleDateString('ar-SA')+' ← '+maxD.toLocaleDateString('ar-SA');
          } else if(validDates.length===1){
            window._excelReportPeriod=validDates[0].toLocaleDateString('ar-SA');
          }
          console.log('[Tawakkad] window._excelReportPeriod after handleExcel:', window._excelReportPeriod);
          toast('✅ إجمالي '+data.length+' يوم: ﷼'+total.toLocaleString('en')); return;
        }
      }

      const pairs=[];
      rows.forEach(row=>{const k=clean(row[0]),v=row[1];if(k&&v!==''&&v!==undefined)pairs.push([k,v]);});
      const fieldMap=[
        {field:'f-name', keys:['اسم المشروع','اسم مشروع','اسم النشاط','المشروع','اسم الكافيه','اسم المطعم','اسم المتجر']},
        {field:'f-type', keys:['نوع النشاط','نوع المشروع','القطاع','النشاط','نوع']},
        {field:'f-rev', keys:['الإيرادات','إيرادات','المبيعات','مبيعات','إجمالي المبيعات','إجمالي الإيرادات','الدخل','revenue','sales']},
        {field:'f-cogs', keys:['تكلفة المواد','تكلفة البضاعة','تكلفة المنتجات','تكلفة الخامات','cogs','تكلفة المبيعات','تكلفة البضائع']},
        {field:'f-sal', keys:['رواتب الموظفين','الرواتب','رواتب','أجور','salaries','wages']},
        {field:'f-rent', keys:['الإيجار','إيجار','rent','اجار']},
        {field:'f-utilities',keys:['الكهرباء والماء','الكهرباء والمياه','كهرباء وماء','كهرباء','utilities']},
        {field:'f-mkt', keys:['التسويق','تسويق','إعلانات','دعاية وإعلان','marketing']},
        {field:'f-other', keys:['مصروفات أخرى','مصاريف أخرى','أخرى','متنوع','other']},
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
        if(k.includes('الفترة')||k.includes('فترة')){ const el=document.getElementById('f-period'); if(el){el.value=String(v).trim();el.dispatchEvent(new Event('change'));if(typeof togglePeriod==='function')togglePeriod();} }
        if(k.includes('الشهر')||k.includes('شهر')){ const el=document.getElementById('f-month');if(el)set('f-month',String(v).trim()); }
        // Scan for date-range indicators to build reportPeriod
        const kL=k.toLowerCase().replace(/\s+/g,'');
        if(kL==='period'||kL==='الفترة'||kL==='فترة'){if(!window._excelReportPeriod)window._excelReportPeriod=String(v).trim();}
        if(kL.includes('from')||kL.includes('startdate')||kL.includes('start')||k.includes('من')){window._excelPStart=String(v).trim();}
        if(kL.includes('to')||kL.includes('enddate')||kL.includes('end')||k.includes('إلى')||k.includes('الى')){window._excelPEnd=String(v).trim();}
      });
      if(!window._excelReportPeriod && window._excelPStart && window._excelPEnd){
        window._excelReportPeriod=window._excelPStart+' ← '+window._excelPEnd;
      }
      delete window._excelPStart; delete window._excelPEnd;
      if(matched>0){if(typeof liveCalc==='function')liveCalc();toast('✅ تم قراءة '+matched+' حقل من الملف');}
      else toast('⚠️ تنسيق الملف غير معروف — استخدم عمودين: البند والمبلغ');
    } catch(err){console.error('handleExcel:',err);toast('❌ خطأ: '+err.message);}
  };
  reader.readAsBinaryString(file);
}

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
  const _d = r.createdAt||r.date; const _ds = _d&&!isNaN(new Date(_d))?new Date(_d).toLocaleDateString('ar-SA'):'—';
  doc.text(`${_ds} | Health Score: ${r.scoreData.total}/100`,105,39,{align:'center'});
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
// AI CFO CONTEXT
// ══════════════════════════════════════════
window.CFO_HISTORY = window.CFO_HISTORY || [];

function getCFOContext() {
  const rep = STATE.currentReport;
  if (!rep) return null;
  const m = rep.metrics || {};

  // Distil one saved report into a compact comparable summary
  const summarize = r => {
    if (!r) return null;
    const rm = r.metrics || {};
    return {
      bizName: r.bizName,
      revenue: rm.revenue,
      profit:  rm.netProfit,
      margin:  rm.netMargin,
      score:   r.scoreData?.total,
      period:  r.reportPeriod || r.period || (r.createdAt ? r.createdAt.slice(0, 10) : '—')
    };
  };

  // Bug fix (was slice(1,6)): slice assumed currentReport is always savedReports[0],
  // which breaks when the user opens a non-latest report or when loadReportsFromDB
  // sets currentReport to savedReports[0] but reports are later unshifted.
  // Filter by id so the current report is always excluded regardless of position.
  const previousReports = (STATE.savedReports || [])
    .filter(r => r.id !== rep.id)
    .slice(0, 5)
    .map(summarize)
    .filter(Boolean);

  console.log('[Tawakkad] getCFOContext — STATE.savedReports.length:', (STATE.savedReports || []).length);
  console.log('[Tawakkad] getCFOContext — currentReport.id:', rep.id, '| bizName:', rep.bizName);
  console.log('[Tawakkad] CFO previous reports:', previousReports);

  // ── Trend: span from oldest of last-5 reports to latest (current) ──
  // history[0] = most recent previous, history[last] = oldest in window
  const history = previousReports.slice(0, 5);
  const trend   = {};
  if (history.length > 0) {
    const first = history[history.length - 1]; // oldest report in the window
    // latest values come straight from the current report's metrics
    const lastRevenue = m.revenue;
    const lastProfit  = m.netProfit;
    const lastScore   = rep.scoreData?.total;

    if (first.revenue != null && lastRevenue != null) {
      trend.revenueChange = lastRevenue - first.revenue;
      trend.revenuePct    = first.revenue !== 0
        ? ((lastRevenue - first.revenue) / first.revenue) * 100
        : null;
    }

    if (first.profit != null && lastProfit != null) {
      trend.profitChange = lastProfit - first.profit;
      trend.profitPct    = first.profit !== 0
        ? ((lastProfit - first.profit) / first.profit) * 100
        : null;
    }

    if (first.score != null && lastScore != null) {
      trend.healthChange = lastScore - first.score;
    }

    // +1 counts the current (latest) report itself
    trend.reportsAnalyzed = history.length + 1;
  }
  console.log('[Tawakkad] CFO trend:', trend);

  return {
    // ── flat fields kept for context bar UI in ai-cfo.js ──
    bizName: rep.bizName, bizType: rep.bizType, period: rep.period,
    revenue: m.revenue, netProfit: m.netProfit, netMargin: m.netMargin,
    grossMargin: m.grossMargin, totalExpenses: m.totalExpenses,
    rentPct: m.rentPct, salPct: m.salPct, cogsPct: m.cogsPct, mktPct: m.mktPct,
    healthScore: rep.scoreData?.total, products: rep.products || [],
    alerts: rep.alerts?.map(a => a.msg) || [],

    // ── structured multi-report context for the AI system prompt ──
    cfoContext: {
      latest: {
        bizName:       rep.bizName,
        bizType:       rep.bizType,
        revenue:       m.revenue,
        profit:        m.netProfit,
        margin:        m.netMargin,
        grossMargin:   m.grossMargin,
        totalExpenses: m.totalExpenses,
        rentPct:       m.rentPct,
        salPct:        m.salPct,
        cogsPct:       m.cogsPct,
        mktPct:        m.mktPct,
        score:         rep.scoreData?.total,
        period:        rep.reportPeriod || rep.period,
        alerts:        rep.alerts?.map(a => a.msg) || [],
        products:      rep.products || []
      },
      previous: previousReports,
      trend
    }
  };
}

function buildCFOSystemPrompt(ctx) {
  if (!ctx) {
    return `أنت AI CFO — مستشار مالي ذكي للمشاريع الصغيرة والمتوسطة السعودية.
لا تتوفر بيانات مشروع حالياً. أجب على الأسئلة المالية المتعلقة بالمشاريع التجارية فقط.
تحدث بالعربية دائماً. كن موجزاً ومباشراً.
إذا سأل المستخدم عن موضوع لا علاقة له بالتحليل المالي أو المشاريع، رد فقط بـ: "هذا السؤال خارج نطاق تحليل المشروع."`;
  }

  const { cfoContext } = ctx;
  const latest             = cfoContext.latest;
  const previous           = cfoContext.previous;
  const trend              = cfoContext.trend || {};
  const hasPreviousReports = previous && previous.length > 0;

  // Build product line
  const prodsText = (latest.products || []).length
    ? latest.products.map(p => {
        const mg = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0;
        return `${p.name} (هامش ${mg}%, كمية ${p.qty})`;
      }).join('، ')
    : 'لا توجد بيانات منتجات';

  // Null-safe number formatter — shows '—' for missing/undefined values instead of 0
  // Prevents the model seeing "إيرادات 0 ر" for old reports with no data
  const fmtN = v => (v != null && !isNaN(Number(v))) ? Number(v).toLocaleString('en') : '—';

  // Build previous-reports comparison table with concrete numbers
  const prevText = previous.length
    ? previous.map((r, i) =>
        `  ${i + 1}. ${r.period || '—'}: إيرادات ${fmtN(r.revenue)} ر | ربح ${fmtN(r.profit)} ر | هامش ${r.margin ?? '—'}% | مؤشر الصحة ${r.score ?? '—'}/100`
      ).join('\n')
    : '  لا توجد تقارير كافية للمقارنة.';

  // Build trend block — only rendered when previous reports exist and produced a diff
  const hasTrend = Object.keys(trend).length > 0;
  const fmtChg  = v => (v != null && !isNaN(Number(v)))
    ? (Number(v) >= 0 ? '+' : '') + Number(v).toLocaleString('en', { maximumFractionDigits: 0 })
    : '—';
  const fmtPct  = v => (v != null && !isNaN(Number(v)))
    ? (Number(v) >= 0 ? '+' : '') + Number(v).toFixed(1) + '%'
    : '—';
  const trendText = hasTrend
    ? `\n══ الاتجاه العام (آخر ${trend.reportsAnalyzed} تقارير) ══
[اعتمد على جميع التقارير المذكورة لاكتشاف الاتجاه العام (صعود، هبوط، استقرار).]
- الإيرادات: ${fmtChg(trend.revenueChange)} ريال (${fmtPct(trend.revenuePct)})
- الربح: ${fmtChg(trend.profitChange)} ريال (${fmtPct(trend.profitPct)})
- مؤشر الصحة: ${trend.healthChange != null ? fmtChg(trend.healthChange) + ' نقطة' : '—'}\n`
    : '';

  return `أنت AI CFO لمشروع "${latest.bizName}" — مستشار مالي متخصص للمشاريع السعودية الصغيرة والمتوسطة.

══ آخر تحليل (المرجع الأساسي) ══
- الفترة: ${latest.period}
- النشاط: ${latest.bizType}
- الإيرادات: ${fmtN(latest.revenue)} ريال
- صافي الربح: ${fmtN(latest.profit)} ريال (${latest.margin ?? '—'}%)
- هامش إجمالي: ${latest.grossMargin ?? '—'}%
- المصاريف الكلية: ${fmtN(latest.totalExpenses)} ريال
- الإيجار: ${latest.rentPct ?? '—'}% | الرواتب: ${latest.salPct ?? '—'}% | تكلفة البضاعة: ${latest.cogsPct ?? '—'}% | التسويق: ${latest.mktPct ?? '—'}%
- مؤشر الصحة: ${latest.score ?? '—'}/100
- المنتجات: ${prodsText}
- التنبيهات: ${latest.alerts?.join(' | ') || 'لا توجد'}

══ التقارير السابقة — أرقام فعلية من قاعدة البيانات ══
[تعليمات الاستخدام: استخدم الأرقام التالية فقط ولا تستخدم أمثلة افتراضية. إذا كانت قيمة "—" فهي غير متوفرة ولا تستبدلها بأرقام.]
${prevText}
${trendText}
══ تعليمات العمل ══
- أنت المستشار المالي الحصري لهذا المشروع — ردودك مقيّدة بنطاق التحليل المالي فقط.
- استخدم الأرقام الواردة أعلاه حصراً. لا تستخدم أمثلة افتراضية أو أرقاماً من خارج هذا النص.
${hasPreviousReports
  ? `- استخدم آخر تحليل كمرجع أساسي، وقارن مع أرقام التقارير السابقة الواردة أعلاه لتحديد الاتجاه (تحسن / تراجع / ثبات).
- حلّل الاتجاه عبر جميع التقارير المتاحة في قسم 'التقارير السابقة' وليس فقط آخر تقرير. إذا كان هناك أكثر من تقريرين، استخرج الاتجاه العام عبرها.`
  : `- لا توجد تقارير سابقة متاحة، لذلك لا تذكر أي مقارنة تاريخية أو تغير في الأداء.`}
- كن مباشراً وموجزاً (3-6 جمل)، اذكر الأرقام بالريال والنسب كما هي في البيانات.
- أعطِ توصيات قابلة للتطبيق فوراً مع تأثيرها المتوقع بأرقام واقعية.
- تحدث بالعربية دائماً بأسلوب مستشار محترف، لا روبوت.
- استخدم **bold** للأرقام المهمة والنقاط الرئيسية.
- إذا سأل المستخدم عن أي موضوع لا علاقة له بالمشروع أو التحليل المالي، رد فقط بالجملة التالية دون أي إضافة: "هذا السؤال خارج نطاق تحليل المشروع."`;
}

// expose to window
window.runAnalysis = runAnalysis;
window.handleExcel = handleExcel;
window.exportPDF = exportPDF;
// window.renderResults → في services/results.js
window.updateDashboard = updateDashboard;
window.renderSavedReports = renderSavedReports;
window.openSavedReport = openSavedReport;
window.deleteSavedReport = deleteSavedReport;
window.getCFOContext = getCFOContext;
window.buildCFOSystemPrompt = buildCFOSystemPrompt;
