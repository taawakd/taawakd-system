// services/financial.js — تحليل مالي + Excel + PDF + CFO context
const BENCHMARKS = {
  // ══ مطاعم ومقاهي ══
  restaurant:  { label: 'مطعم',           netMargin: { min: 12, max: 22, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 72, label: 'هامش الربح الإجمالي' }, rentPct: { min: 8,   max: 15, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 18, max: 25, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 28, max: 35, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 3,    max: 7,  label: 'نسبة التسويق', lowerIsBetter: true } },
  cafe:        { label: 'مقهى / كافيه',   netMargin: { min: 12, max: 22, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 72, label: 'هامش الربح الإجمالي' }, rentPct: { min: 8,   max: 15, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 18, max: 25, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 28, max: 35, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 3,    max: 7,  label: 'نسبة التسويق', lowerIsBetter: true } },
  juice_kiosk: { label: 'كيوسك عصائر',   netMargin: { min: 20, max: 30, label: 'هامش الربح الصافي' }, grossMargin: { min: 70, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 10,  max: 15, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 15, max: 22, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 30, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 3,    max: 5,  label: 'نسبة التسويق', lowerIsBetter: true } },
  bakery:      { label: 'مخبز / حلويات', netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 7,   max: 12, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 20, max: 30, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 25, max: 35, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 2,    max: 5,  label: 'نسبة التسويق', lowerIsBetter: true } },
  food_truck:  { label: 'فود ترك',        netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 62, max: 70, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 10, label: 'نسبة الإيجار / موقع', lowerIsBetter: true }, salPct: { min: 15, max: 20, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 30, max: 38, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 5,    max: 8,  label: 'نسبة التسويق', lowerIsBetter: true } },
  // ══ تجارة ══
  retail:      { label: 'متجر تجزئة',    netMargin: { min: 10, max: 20, label: 'هامش الربح الصافي' }, grossMargin: { min: 30, max: 50, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 10, max: 20, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 50, max: 70, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 2,    max: 5,  label: 'نسبة التسويق', lowerIsBetter: true } },
  grocery:     { label: 'بقالة',          netMargin: { min: 3,  max: 7,  label: 'هامش الربح الصافي' }, grossMargin: { min: 12, max: 18, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 6,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 4,  max: 7,  label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 82, max: 88, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 0.5,  max: 1,  label: 'نسبة التسويق', lowerIsBetter: true } },
  vegetables:  { label: 'محل خضار',      netMargin: { min: 5,  max: 10, label: 'هامش الربح الصافي' }, grossMargin: { min: 20, max: 30, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 5,  max: 10, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 70, max: 80, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 1,    max: 3,  label: 'نسبة التسويق', lowerIsBetter: true } },
  perfumes:    { label: 'عطور',           netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 75, max: 85, label: 'هامش الربح الإجمالي' }, rentPct: { min: 10,  max: 20, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 10, max: 15, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 15, max: 25, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 20,   max: 40, label: 'نسبة التسويق', lowerIsBetter: true } },
  ecom:        { label: 'تجارة إلكترونية', netMargin: { min: 10, max: 20, label: 'هامش الربح الصافي' }, grossMargin: { min: 40, max: 60, label: 'هامش الربح الإجمالي' }, rentPct: { min: 2,   max: 5,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 10, max: 15, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 40, max: 60, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 15,   max: 30, label: 'نسبة التسويق', lowerIsBetter: true } },
  // ══ خدمات ══
  barber:      { label: 'حلاقة وتجميل', netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 85, max: 90, label: 'هامش الربح الإجمالي' }, rentPct: { min: 15,  max: 25, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 40, max: 50, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 10, max: 15, label: 'تكلفة اللوازم',       lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  laundry:     { label: 'مغسلة',          netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 85, max: 90, label: 'هامش الربح الإجمالي' }, rentPct: { min: 15,  max: 25, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 35, max: 45, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 10, max: 15, label: 'تكلفة المستلزمات',  lowerIsBetter: true }, mktPct: { min: 2,    max: 5,  label: 'نسبة التسويق', lowerIsBetter: true } },
  clinic:      { label: 'عيادة',          netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 75, max: 85, label: 'هامش الربح الإجمالي' }, rentPct: { min: 8,   max: 15, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 40, max: 55, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 15, max: 25, label: 'تكلفة المستلزمات',  lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  pharmacy:    { label: 'صيدلية',         netMargin: { min: 4,  max: 8,  label: 'هامش الربح الصافي' }, grossMargin: { min: 18, max: 25, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 5,  max: 8,  label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 75, max: 82, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 1,    max: 3,  label: 'نسبة التسويق', lowerIsBetter: true } },
  services:    { label: 'خدمات عامة',    netMargin: { min: 20, max: 40, label: 'هامش الربح الصافي' }, grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 30, max: 50, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 40, label: 'تكلفة الخدمة',       lowerIsBetter: true }, mktPct: { min: 5,    max: 12, label: 'نسبة التسويق', lowerIsBetter: true } },
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

    // فحص حد الخطة
    if (data.limit_reached) {
      if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').classList.remove('show');
      if(document.getElementById('analyzeBtnText')) document.getElementById('analyzeBtnText').textContent = 'تحليل المشروع الآن';
      if(document.getElementById('analyzeSpin')) document.getElementById('analyzeSpin').style.display = 'none';
      btn.disabled = false;
      const plan = window.__USER_PLAN__ || 'free';
      const featureName = plan === 'free'
        ? `التحليلات (استخدمت ${data.used} من ${data.limit})`
        : `حد التحليلات الشهري (${data.used}/${data.limit})`;
      if (typeof showUpgradeModal === 'function') showUpgradeModal(featureName, plan === 'free' ? 'pro' : 'enterprise');
      else if (typeof window.showLimitModal === 'function') window.showLimitModal(data.used, data.limit);
      return;
    }

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
        // ملاحظة: زيادة analyses_used تتم من الـ API مباشرة — لا نكررها هنا
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
  // مقارنة مرنة تدعم الـ UUIDs من Supabase والأرقام الزمنية القديمة من localStorage
  const rep = STATE.savedReports.find(r => String(r.id) === String(id));
  if(!rep) { toast('⚠️ لم يتم العثور على التقرير، حاول مرة أخرى'); return; }
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
// خريطة الحقول الشاملة — تشمل كل أنواع التقارير العربية والإنجليزية
const _FIELD_MAP = [
  { field:'f-name', text:true, keys:['اسم المشروع','اسم مشروع','اسم النشاط','اسم الشركة','اسم المتجر','اسم المطعم','اسم الكافيه','اسم الصالون','اسم العيادة','المشروع','الشركة','النشاط التجاري','business name','company name'] },
  { field:'f-type', text:true, keys:['نوع النشاط','نوع المشروع','نوع الشركة','القطاع','النشاط','sector','industry','type'] },
  { field:'f-rev',  keys:['الإيرادات','إيرادات','إجمالي المبيعات','إجمالي الإيرادات','مجموع المبيعات','إجمالي مبيعات','صافي المبيعات','المبيعات الصافية','المبيعات','مبيعات','الدخل','دخل','revenue','sales','total sales','net sales','gross sales','إجمالي قيمة الربح','قيمة الربح'] },
  { field:'f-cogs', keys:['تكلفة البضاعة المباعة','تكلفة البضائع المباعة','تكلفة المبيعات','تكلفة البضاعة','تكلفة البضائع','تكلفة المنتجات','تكلفة المواد','تكلفة الخامات','تكلفة الإنتاج','إجمالي تكلفة البضاعة','cogs','cost of goods','cost of sales','cost of products'] },
  { field:'f-sal',  keys:['رواتب الموظفين','رواتب وأجور','الرواتب والأجور','الرواتب','رواتب','أجور الموظفين','أجور','مرتبات','salaries','wages','payroll','staff cost'] },
  { field:'f-rent', keys:['الإيجار','إيجار المحل','إيجار المقر','إيجار المستودع','إيجار','اجار','rent','lease'] },
  { field:'f-utilities', keys:['الكهرباء والماء','الكهرباء والمياه','كهرباء وماء','كهرباء ومياه','المرافق','كهرباء','ماء','مياه','utilities','electricity','water','electric'] },
  { field:'f-mkt',  keys:['التسويق والإعلان','مصاريف التسويق','الإعلان والتسويق','التسويق','إعلانات','دعاية وإعلان','دعاية','marketing','advertising','ads','promotion'] },
  { field:'f-other',keys:['مصروفات أخرى','مصاريف أخرى','مصروفات متنوعة','مصاريف عمومية','أخرى','متنوع','مصروفات إدارية','تشغيل','other expenses','general expenses','overhead','miscellaneous','other'] },
];

// استخراج الفترة من اسم الملف (مثال: "01 Feb 2026-28 Feb 2026")
function _extractPeriodFromFilename(filename) {
  const months = {'jan':'يناير','feb':'فبراير','mar':'مارس','apr':'أبريل','may':'مايو','jun':'يونيو',
    'jul':'يوليو','aug':'أغسطس','sep':'سبتمبر','oct':'أكتوبر','nov':'نوفمبر','dec':'ديسمبر'};
  const m = filename.toLowerCase().match(/(\d{1,2})\s*([a-z]{3})\s*(\d{4})[^\d]+(\d{1,2})\s*([a-z]{3})\s*(\d{4})/);
  if (m) {
    const from = `${m[1]} ${months[m[2]]||m[2]} ${m[3]}`;
    const to   = `${m[4]} ${months[m[5]]||m[5]} ${m[6]}`;
    return `${from} ← ${to}`;
  }
  const m2 = filename.match(/([a-zA-Z]{3,})\s*(\d{4})/i);
  if (m2) { const mn=m2[1].slice(0,3).toLowerCase(); return `${months[mn]||m2[1]} ${m2[2]}`; }
  return null;
}

// يُعبئ حقول المنتجات في نموذج التقرير من بيانات مُحلَّلة
function showProductTable(products) {
  const c = document.getElementById('prodsContainer');
  if (!c) return;
  // امسح الصفوف الحالية
  c.innerHTML = '';
  products.forEach(p => {
    if (typeof addProdRow === 'function') addProdRow();
    const allRows = c.querySelectorAll('.prod-row');
    const row = allRows[allRows.length - 1];
    if (!row) return;
    const ins = row.querySelectorAll('input');
    if (ins[0]) ins[0].value = p.name;
    if (ins[1] && p.price > 0) { ins[1].value = p.price; ins[1].dispatchEvent(new Event('input')); }
    if (ins[2] && p.cost  > 0)   ins[2].value = p.cost;
    if (ins[3] && p.qty   > 0)   ins[3].value = p.qty;
    if (ins[1] && typeof calcRowMargin === 'function') calcRowMargin(ins[1]);
  });
}

function handleExcel(input) {
  const file = input.files[0];
  if (!file) return;

  // حاول استخراج الفترة من اسم الملف
  const periodFromName = _extractPeriodFromFilename(file.name);
  if (periodFromName && !window._excelReportPeriod) window._excelReportPeriod = periodFromName;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb   = XLSX.read(e.target.result, { type:'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
      if (!rows.length) { toast('الملف فارغ'); return; }

      const clean  = s  => String(s||'').trim().replace(/\s+/g,' ');
      const num    = v  => { const n=parseFloat(String(v).replace(/[,،\s]/g,'')); return isNaN(n)?0:n; };
      const isNum  = v  => !isNaN(parseFloat(String(v).replace(/[,،]/g,'')));
      const setFld = (id,v) => { const el=document.getElementById(id); if(el){el.value=v;el.dispatchEvent(new Event('input'));} };

      // ── مطابقة حقل مع خريطة الحقول ──────────────────────────────────────
      function matchField(label) {
        const lc = label.replace(/\s+/g,'').toLowerCase();
        for (const {field,keys,text} of _FIELD_MAP) {
          if (keys.some(k => {
            const kc = k.replace(/\s+/g,'').toLowerCase();
            return lc.includes(kc) || kc.includes(lc);
          })) return {field,text:!!text};
        }
        return null;
      }

      // ── دالة فحص / تعيين التواريخ ─────────────────────────────────────────
      const parseExcelDate = raw => {
        const n = parseFloat(raw);
        if (!isNaN(n) && n > 1000 && Number.isInteger(n))
          return new Date(Date.UTC(1899,11,30) + n*86400000);
        return new Date(String(raw||'').trim());
      };

      let matched = 0;

      // ══════════════════════════════════════════════════════════════════════
      // الاستراتيجية 1: جدول منتجات (أعمدة: اسم المنتج، كمية، سعر، تكلفة)
      // ══════════════════════════════════════════════════════════════════════
      const h0 = rows[0].map(h => clean(h).toLowerCase());
      const hasProduct = h0.some(h=>h.includes('منتج')||h.includes('product')||h.includes('صنف')||h.includes('سلعة')||h.includes('خدمة'));
      const hasQty     = h0.some(h=>h.includes('كمية')||h.includes('qty')||h.includes('عدد')||h.includes('quantity'));
      const hasRevH    = h0.some(h=>h.includes('إيراد')||h.includes('ايراد')||h.includes('مبيعات')||h.includes('revenue')||h.includes('سعر')||h.includes('retail')||h.includes('price'));

      if (hasProduct && (hasQty || hasRevH)) {
        const nI = h0.findIndex(h=>h.includes('product name')||h.includes('منتج')||h.includes('product')||h.includes('صنف')||h.includes('سلعة')||h.includes('خدمة'));
        const qI = h0.findIndex(h=>h.includes('كمية')||h.includes('qty')||h.includes('عدد')||h.includes('quantity'));
        // يفضّل "retail price" على "buy price" لاستخدامه سعر البيع
        let rI = h0.findIndex(h=>h.includes('retail')||h.includes('سعر بيع')||h.includes('سعر البيع'));
        if (rI<0) rI = h0.findIndex(h=>h.includes('إيراد')||h.includes('ايراد')||h.includes('مبيعات')||h.includes('revenue')||h.includes('سعر'));
        if (rI<0) rI = h0.findIndex(h=>h.includes('price')&&!h.includes('buy')&&!h.includes('wholesale'));
        if (rI<0) rI = h0.findIndex(h=>h.includes('price'));
        // يفضّل "buy price" للتكلفة
        let cI = h0.findIndex(h=>h.includes('buy price')||h.includes('تكلفة')||h.includes('سعر الشراء'));
        if (cI<0) cI = h0.findIndex(h=>h.includes('cost'));
        const products = rows.slice(1).filter(r=>clean(r[nI])).map(r=>({
          name:clean(r[nI]), qty:qI>=0?num(r[qI]):0, price:rI>=0?num(r[rI]):0, cost:cI>=0?num(r[cI]):0,
          revenue: (qI>=0?num(r[qI]):0) * (rI>=0?num(r[rI]):0)
        })).filter(p=>p.qty>0||p.price>0);
        if (products.length) { showProductTable(products); toast('✅ تم قراءة '+products.length+' منتج/خدمة'); return; }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الاستراتيجية 2: جدول تاريخ + مبيعات يومية
      // ══════════════════════════════════════════════════════════════════════
      const hasDate  = h0.some(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم')||h.includes('day'));
      const hasSalesH= h0.some(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
      if (hasDate && hasSalesH) {
        const dI = h0.findIndex(h=>h.includes('تاريخ')||h.includes('date')||h.includes('يوم')||h.includes('day'));
        const sI = h0.findIndex(h=>h.includes('مبيعات')||h.includes('إيراد')||h.includes('ايراد')||h.includes('sales'));
        const data = rows.slice(1).filter(r=>r[sI]).map(r=>({rawDate:r[dI],sales:num(r[sI])}));
        if (data.length) {
          const total = data.reduce((s,r)=>s+r.sales,0);
          setFld('f-rev', total);
          const validDates = data.map(r=>parseExcelDate(r.rawDate)).filter(d=>!isNaN(d.getTime()));
          if (validDates.length >= 2) {
            const minD=new Date(Math.min(...validDates.map(d=>d.getTime())));
            const maxD=new Date(Math.max(...validDates.map(d=>d.getTime())));
            window._excelReportPeriod = minD.toLocaleDateString('ar-SA')+' ← '+maxD.toLocaleDateString('ar-SA');
          } else if (validDates.length===1) {
            window._excelReportPeriod = validDates[0].toLocaleDateString('ar-SA');
          }
          toast('✅ إجمالي '+data.length+' يوم: '+total.toLocaleString('ar-SA')+' ﷼');
          return;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الاستراتيجية 3: تنسيق عرضي (Wide) — الرؤوس في صف 0، البيانات في صف 1
      // (مثال: ملخص المبيعات — كل حقل في عمود مستقل)
      // ══════════════════════════════════════════════════════════════════════
      const row1IsData = rows.length >= 2 && rows[0].some(h=>clean(h).length>2) &&
                         rows[1].some(v=>isNum(v));
      const wideMatchCount = rows[0].filter(h => matchField(clean(h))).length;

      if (row1IsData && wideMatchCount >= 1) {
        // بناء أزواج (اسم الحقل، القيمة) من الأعمدة
        rows[0].forEach((header, i) => {
          const label = clean(header);
          if (!label) return;
          // اجمع كل صفوف البيانات (قد يكون أكثر من صف إذا كانت فترات متعددة)
          const vals = rows.slice(1).map(r=>r[i]).filter(v=>v!==''&&v!==undefined);
          if (!vals.length) return;
          const val = vals.reduce((s,v)=>s+num(v),0); // جمع كل القيم

          const m = matchField(label);
          if (m) {
            if (m.text) setFld(m.field, String(vals[0]).trim());
            else if (val > 0 || num(vals[0]) !== 0) { setFld(m.field, val); matched++; }
          }
          // تحقق من الفترة الزمنية
          const lc = label.toLowerCase().replace(/\s+/g,'');
          if (lc.includes('فترة')||lc.includes('period')||lc.includes('شهر')||lc.includes('month')) {
            if (!window._excelReportPeriod) window._excelReportPeriod = String(vals[0]).trim();
          }
        });

        // إذا COGS = 0 لكن في الملف "تكلفة البضاعة" صفر — ابحث عن الربح لاستنتاجها
        const revEl = document.getElementById('f-rev');
        const cogsEl= document.getElementById('f-cogs');
        if (revEl && cogsEl && num(revEl.value)>0 && num(cogsEl.value)===0) {
          // حاول إيجاد "الربح" وحساب التكلفة منه
          rows[0].forEach((header,i)=>{
            const label=clean(header).toLowerCase().replace(/\s+/g,'');
            const isProfit=label.includes('ربح')||label.includes('profit');
            if(isProfit && rows[1] && rows[1][i]){
              const profit=num(rows[1][i]);
              const rev=num(revEl.value);
              if(profit>0 && rev>=profit){ setFld('f-cogs', rev-profit); }
            }
          });
        }

        if (matched > 0) {
          if (typeof liveCalc==='function') liveCalc();
          toast('✅ تم قراءة '+matched+' حقل (تنسيق عرضي)');
          return;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الاستراتيجية 4: جدول متعدد الصفوف — كل صف = فئة مع قيمة (شامل صفوف مدمجة)
      // (مثال: تقرير قائمة الدخل بأعمدة متعددة)
      // ══════════════════════════════════════════════════════════════════════
      const multiColHeaders = rows[0].filter(h=>clean(h).length>2);
      if (multiColHeaders.length >= 3 && rows.length >= 3) {
        // ابحث عن عمود الأسماء وعمود الأرقام
        let labelCol=-1, valCol=-1;
        for(let c=0;c<rows[0].length;c++){
          const hasTextRows=rows.slice(1).filter(r=>clean(r[c]).length>2&&!isNum(r[c])).length;
          if(hasTextRows >= 2){labelCol=c;break;}
        }
        for(let c=rows[0].length-1;c>=0;c--){
          const hasNumRows=rows.slice(1).filter(r=>isNum(r[c])&&num(r[c])>0).length;
          if(hasNumRows >= 2){valCol=c;break;}
        }
        if(labelCol>=0 && valCol>=0 && labelCol!==valCol){
          rows.slice(1).forEach(row=>{
            const lbl=clean(row[labelCol]);
            const v=row[valCol];
            if(!lbl || !isNum(v)) return;
            const m=matchField(lbl);
            if(m){
              if(m.text) setFld(m.field,lbl);
              else { setFld(m.field,num(v)); matched++; }
            }
          });
          if(matched>0){if(typeof liveCalc==='function')liveCalc();toast('✅ تم قراءة '+matched+' حقل (جدول متعدد)');return;}
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الاستراتيجية 5: أزواج عمودية (col A = الاسم، col B = القيمة) — الأصلي
      // ══════════════════════════════════════════════════════════════════════
      const pairs = [];
      rows.forEach(row=>{
        const k=clean(row[0]), v=row[1];
        if(k && v!=='' && v!==undefined) pairs.push([k,v]);
      });
      pairs.forEach(([k,v])=>{
        const m=matchField(k);
        if(m){
          if(m.text) setFld(m.field,String(v).trim());
          else { setFld(m.field,num(v)); matched++; }
        }
        // فترة زمنية
        const kL=k.toLowerCase().replace(/\s+/g,'');
        if(kL.includes('فترة')||kL.includes('period')||kL==='شهر'||kL==='month'){
          if(!window._excelReportPeriod) window._excelReportPeriod=String(v).trim();
        }
        if(kL.includes('from')||kL.includes('start')||kL.includes('من')){window._excelPStart=String(v).trim();}
        if(kL.includes('to')||kL.includes('end')||kL.includes('إلى')||kL.includes('الى')){window._excelPEnd=String(v).trim();}
      });
      if(!window._excelReportPeriod && window._excelPStart && window._excelPEnd)
        window._excelReportPeriod=window._excelPStart+' ← '+window._excelPEnd;
      delete window._excelPStart; delete window._excelPEnd;

      if(matched>0){if(typeof liveCalc==='function')liveCalc();toast('✅ تم قراءة '+matched+' حقل من الملف');}
      else toast('⚠️ تم قراءة الملف لكن لم يُطابق أي حقل مالي — تأكد من وجود أعمدة مثل: المبيعات، التكلفة، الرواتب');

    } catch(err){console.error('handleExcel:',err);toast('❌ خطأ في قراءة الملف: '+err.message);}
  };
  reader.readAsBinaryString(file);
}

// ══════════════════════════════════════════
// PDF EXPORT
// ══════════════════════════════════════════

// ── exportPDF ─────────────────────────────────────────────────────────────
// NOTE: The app uses a dark theme with CSS custom properties (var(--s1), var(--white), etc.).
// html2canvas cannot resolve these correctly, producing a blank white PDF.
// Fix: deep-clone the results content into a self-contained light-mode wrapper
// with all colours set via explicit inline styles so html2canvas sees real values.
async function exportPDF() {
  // فحص الخطة — PDF للخطط المدفوعة فقط
  if (!planAllows('pdf_export')) {
    if (typeof showUpgradeModal === 'function') showUpgradeModal('تصدير تقرير PDF', 'pro');
    return;
  }
  const rep = STATE.currentReport;
  if (!rep) { alert('لا يوجد تقرير للتصدير. يرجى إجراء تحليل أولاً.'); return; }

  const { bizName, bizType, period, metrics, scoreData, alerts, products, reportText, sectorKey, scenarios } = rep;
  const { revenue, netProfit, netMargin, grossMargin, totalExpenses,
          rentPct, salPct, cogsPct, mktPct, cogs, rent, salaries, marketing, other, utilities } = metrics;

  const score       = scoreData ? scoreData.total : 0;
  const scoreColor  = score >= 65 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const scoreLabel  = score >= 80 ? 'ممتاز' : score >= 65 ? 'جيد جداً' : score >= 50 ? 'متوسط' : score >= 35 ? 'يحتاج تحسين' : 'خطر';
  const profitColor = netProfit >= 0 ? '#16a34a' : '#dc2626';
  const marginColor = netMargin > 15 ? '#16a34a' : netMargin < 5 ? '#dc2626' : '#d97706';
  const dateStr     = rep.reportPeriod || (rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('ar-SA') : '');
  const f = n => (n || 0).toLocaleString('ar-SA', { maximumFractionDigits: 0 });

  // ── التنبيهات ──
  const alertsHtml = (alerts || []).slice(0, 8).map(a => {
    const icon   = a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🟢';
    const bg     = a.type === 'danger' ? '#fee2e2' : a.type === 'warning' ? '#fef3c7' : '#dcfce7';
    const border = a.type === 'danger' ? '#fca5a5' : a.type === 'warning' ? '#fcd34d' : '#86efac';
    return `<div style="padding:9px 12px;margin-bottom:7px;border-radius:7px;background:${bg};border-right:4px solid ${border};font-size:12px;color:#1a1a1a;">${icon} ${a.msg || a.message || ''}</div>`;
  }).join('');

  // ── المصاريف ──
  const expensesRows = [
    { label: 'تكلفة البضاعة', val: cogs },
    { label: 'الإيجار', val: rent },
    { label: 'الرواتب', val: salaries },
    { label: 'التسويق', val: marketing },
    { label: 'المرافق', val: utilities },
    { label: 'مصاريف أخرى', val: other },
  ].filter(r => r.val > 0);

  const expensesHtml = expensesRows.map((r, i) => {
    const p  = revenue > 0 ? ((r.val / revenue) * 100).toFixed(1) : 0;
    const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 8px;border:1px solid #e5e7eb;color:#374151;font-size:12px;">${r.label}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:#1a1a1a;font-size:12px;">${f(r.val)} ر</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">${p}%</td>
    </tr>`;
  }).join('');

  // ── مؤشر الصحة ──
  const scoreBreakdownHtml = (scoreData && scoreData.breakdown) ? scoreData.breakdown.map(b => {
    const w = Math.round((b.val / b.max) * 100);
    const barColor = b.color && !b.color.includes('var(') ? b.color : '#3b82f6';
    return `<div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;color:#4b5563;">${b.label}</span>
        <span style="font-size:12px;font-weight:600;color:#1a1a1a;">${b.val}/${b.max}</span>
      </div>
      <div style="height:8px;background:#e5e7eb;border-radius:4px;">
        <div style="height:8px;width:${w}%;background:${barColor};border-radius:4px;"></div>
      </div>
    </div>`;
  }).join('') : '';

  // ── المقارنات المرجعية ──
  const bench = (window.BENCHMARKS || BENCHMARKS)[sectorKey || 'restaurant'];
  const bMetrics = { netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
  const benchKeys = ['netMargin','grossMargin','rentPct','salPct','cogsPct','mktPct'];
  const benchHtml = bench ? benchKeys.filter(k => bench[k] && bMetrics[k] !== undefined).map((k, i) => {
    const val = parseFloat(bMetrics[k] || 0);
    const { min, max, label, lowerIsBetter } = bench[k];
    let status, statusColor, statusText;
    if (lowerIsBetter) {
      status = val <= max ? 'good' : val > max * 1.5 ? 'bad' : 'warn';
    } else {
      status = (val >= min && val <= max) ? 'good' : (val < min * 0.7 || val > max * 1.3) ? 'bad' : 'warn';
    }
    statusColor = status === 'good' ? '#16a34a' : status === 'warn' ? '#d97706' : '#dc2626';
    statusText  = status === 'good' ? '✅ ضمن الطبيعي' : status === 'warn' ? '⚠️ قريب من الحد' : '❌ خارج النطاق';
    const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 8px;border:1px solid #e5e7eb;font-size:12px;color:#374151;">${label}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">${min}%–${max}%</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:12px;color:${statusColor};">${val.toFixed(1)}%</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:${statusColor};">${statusText}</td>
    </tr>`;
  }).join('') : '';

  // ── نقطة التعادل ──
  const fixedCosts  = (rent||0)+(salaries||0)+(marketing||0)+(other||0)+(utilities||0);
  const contribRatio = revenue > 0 ? (revenue - (cogs||0)) / revenue : 1;
  const bePoint     = contribRatio > 0 ? Math.round(fixedCosts / contribRatio) : 0;
  const beDiff      = revenue - bePoint;
  const bePct       = bePoint > 0 ? Math.min(100, Math.round((revenue / bePoint) * 100)) : 100;
  const beGood      = beDiff >= 0;
  const beColor     = beGood ? '#16a34a' : '#dc2626';
  const breakevenHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center;border:1px solid #e5e7eb;">
        <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${f(bePoint)} ر</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;">نقطة التعادل</div>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center;border:1px solid #e5e7eb;">
        <div style="font-size:16px;font-weight:700;color:${beColor};">${beDiff >= 0 ? '+' : ''}${f(beDiff)} ر</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;">${beGood ? 'فوق نقطة التعادل' : 'تحت نقطة التعادل'}</div>
      </div>
    </div>
    <div style="padding:10px 14px;border-radius:8px;background:${beGood ? '#dcfce7' : '#fee2e2'};border-right:4px solid ${beGood ? '#86efac' : '#fca5a5'};font-size:12px;color:#1a1a1a;margin-bottom:10px;">
      ${beGood ? `✅ مبيعاتك أعلى من نقطة التعادل بـ ${f(beDiff)} ${SAR} — المشروع مربح.` : `⚠️ تحتاج ${f(Math.abs(beDiff))} ${SAR} إضافية للوصول لنقطة التعادل.`}
    </div>
    <div style="margin-bottom:4px;display:flex;justify-content:space-between;">
      <span style="font-size:11px;color:#6b7280;">التقدم نحو نقطة التعادل</span>
      <span style="font-size:11px;color:#1a1a1a;font-weight:600;">${bePct}%</span>
    </div>
    <div style="height:8px;background:#e5e7eb;border-radius:4px;">
      <div style="height:8px;width:${bePct}%;background:${beColor};border-radius:4px;"></div>
    </div>`;

  // ── السيناريوهات ──
  const scenList = scenarios || [];
  const scenHtml = scenList.length ? scenList.map((s, i) => {
    const newMargin = revenue > 0 ? ((s.newProfit / revenue) * 100).toFixed(1) : 0;
    const delta     = s.delta || 0;
    const bg        = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 8px;border:1px solid #e5e7eb;font-size:12px;color:#374151;">${s.title}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;font-weight:600;color:${s.newProfit>=0?'#16a34a':'#dc2626'};">${f(s.newProfit)} ر</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">${newMargin}%</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#16a34a;font-weight:600;">+${f(delta)} ر</td>
    </tr>`;
  }).join('') : '';

  // ── المنتجات ──
  const productsHtml = (products && products.length) ? `
    <h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 12px 0;padding-bottom:6px;border-bottom:2px solid #e5e7eb;">🛍️ تحليل المنتجات</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:#374151;">المنتج</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">السعر</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">التكلفة</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الكمية</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الهامش</th>
      </tr></thead>
      <tbody>${products.map((p, i) => {
        const m  = p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(0) : 0;
        const mc = m > 40 ? '#16a34a' : m > 20 ? '#d97706' : '#dc2626';
        const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
        return `<tr style="background:${bg};">
          <td style="padding:7px 8px;border:1px solid #e5e7eb;color:#1a1a1a;">${p.name||''}</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${f(p.price)} ر</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${f(p.cost)} ر</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${p.qty||0}</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${mc};">${m}%</td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : '';

  // ── تحليل الذكاء الاصطناعي ──
  const cleanAI = (reportText || '').replace(/\[SECTION:[^\]]+\]/g,'').replace(/\[\/SECTION\]/g,'').trim();
  const aiHtml = cleanAI ? `
    <h3 style="font-size:15px;font-weight:700;color:#1e40af;margin:0 0 10px 0;">🤖 تحليل الذكاء الاصطناعي</h3>
    <p style="font-size:12px;color:#374151;line-height:1.9;white-space:pre-wrap;margin:0;">${cleanAI}</p>` : '';

  // ══════════════════════════════
  // HTML الكامل للتقرير
  // ══════════════════════════════
  const sec = (title, content) => content ? `
    <div style="margin-bottom:24px;padding:18px;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;">
      <h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 14px 0;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">${title}</h3>
      ${content}
    </div>` : '';

  const htmlContent = `
  <div style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;direction:rtl;background:#f1f5f9;color:#1a1a1a;padding:28px;width:750px;box-sizing:border-box;">

    <!-- الرأس -->
    <div style="background:#1a1a1a;border-radius:14px;padding:24px 28px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-bottom:4px;">${bizName}</div>
        <div style="font-size:13px;color:#9ca3af;">${bizType} · ${period} · ${dateStr}</div>
      </div>
      <div style="text-align:center;background:rgba(255,255,255,0.08);padding:14px 20px;border-radius:10px;">
        <div style="font-size:32px;font-weight:800;color:${scoreColor};">${score}</div>
        <div style="font-size:11px;color:#9ca3af;">مؤشر الصحة / 100</div>
        <div style="font-size:11px;color:${scoreColor};font-weight:600;">${scoreLabel}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${[
        { val: f(revenue)+' ﷼', label: 'الإيرادات', color: '#1a1a1a' },
        { val: (netProfit>=0?'+':'')+f(netProfit)+' ﷼', label: 'صافي الربح', color: profitColor },
        { val: netMargin+'%', label: 'هامش الربح', color: marginColor },
        { val: f(totalExpenses)+' ﷼', label: 'إجمالي المصاريف', color: '#1a1a1a' },
      ].map(k => `<div style="background:#ffffff;border-radius:10px;padding:14px;text-align:center;border:1px solid #e5e7eb;">
        <div style="font-size:15px;font-weight:700;color:${k.color};">${k.val}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:5px;">${k.label}</div>
      </div>`).join('')}
    </div>

    <!-- التنبيهات -->
    ${alertsHtml ? sec('⚡ أبرز التنبيهات', alertsHtml) : ''}

    <!-- المصاريف + مؤشر الصحة -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #e5e7eb;">
        <h3 style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">📊 تحليل المصاريف</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f3f4f6;">
            <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:right;font-size:11px;color:#374151;">البند</th>
            <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">المبلغ</th>
            <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">%</th>
          </tr></thead>
          <tbody>${expensesHtml}</tbody>
        </table>
      </div>
      <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #e5e7eb;">
        <h3 style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">🏆 تفاصيل مؤشر الصحة</h3>
        ${scoreBreakdownHtml}
      </div>
    </div>

    <!-- المقارنات المرجعية -->
    ${benchHtml ? sec('📈 المقارنة بمعايير القطاع', `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:right;color:#374151;">المؤشر</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">المعدل الطبيعي</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">لديك</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">التقييم</th>
        </tr></thead>
        <tbody>${benchHtml}</tbody>
      </table>`) : ''}

    <!-- نقطة التعادل -->
    ${sec('⚖️ تحليل نقطة التعادل', breakevenHtml)}

    <!-- السيناريوهات -->
    ${scenHtml ? sec('🔮 سيناريوهات التحسين', `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:right;color:#374151;">السيناريو</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الربح المتوقع</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الهامش</th>
          <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;">الزيادة</th>
        </tr></thead>
        <tbody>${scenHtml}</tbody>
      </table>`) : ''}

    <!-- المنتجات -->
    ${productsHtml ? `<div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #e5e7eb;margin-bottom:20px;">${productsHtml}</div>` : ''}

    <!-- تحليل الذكاء الاصطناعي -->
    ${aiHtml ? `<div style="background:#eff6ff;border-radius:10px;padding:18px;border:1px solid #bfdbfe;margin-bottom:20px;">${aiHtml}</div>` : ''}

    <!-- تذييل -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">تم إنشاء هذا التقرير بواسطة توكّد · ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
  </div>`;

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
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297;
    const imgW  = pageW;
    const imgH  = (canvas.height * pageW) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let yOffset = 0, pageNum = 0;
    while (yOffset < imgH) {
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH);
      yOffset += pageH;
      pageNum++;
    }
    pdf.save('tawakkad-report.pdf');
  } finally {
    document.body.removeChild(wrapper);
  }
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
      latest: (() => {
        // حساب نقطة التعادل مرة واحدة وإرسالها جاهزة للـ AI
        const fixedCosts = (m.rent||0)+(m.salaries||0)+(m.marketing||0)+(m.utilities||0)+(m.other||0);
        const contribRatio = m.revenue > 0 ? (m.revenue - (m.cogs||0)) / m.revenue : 1;
        const breakEven = contribRatio > 0 ? Math.round(fixedCosts / contribRatio) : 0;
        return {
          bizName:       rep.bizName,
          bizType:       rep.bizType,
          revenue:       m.revenue,
          profit:        m.netProfit,
          margin:        m.netMargin,
          grossMargin:   m.grossMargin,
          totalExpenses: m.totalExpenses,
          // أرقام ريال فعلية لكل بند (ليس فقط النسب)
          rent:          m.rent,
          salaries:      m.salaries,
          cogs:          m.cogs,
          marketing:     m.marketing,
          utilities:     m.utilities,
          other:         m.other,
          // نسب مئوية
          rentPct:       m.rentPct,
          salPct:        m.salPct,
          cogsPct:       m.cogsPct,
          mktPct:        m.mktPct,
          // نقطة التعادل محسوبة مسبقاً
          fixedCosts:    fixedCosts,
          contribRatio:  parseFloat((contribRatio * 100).toFixed(1)),
          breakEven:     breakEven,
          score:         rep.scoreData?.total,
          period:        rep.reportPeriod || rep.period,
          alerts:        rep.alerts?.map(a => a.msg) || [],
          products:      rep.products || []
        };
      })(),
      previous: previousReports,
      trend
    }
  };
}

function buildCFOSystemPrompt(ctx) {
  if (!ctx) {
    return `أنت AI CFO — مستشار مالي ذكي للمشاريع الصغيرة والمتوسطة السعودية.
لا تتوفر بيانات مشروع محددة حالياً، لكن يمكنك الإجابة على أي سؤال مالي أو تجاري.
تحدث بالعربية دائماً. اذهب مباشرة للإجابة بدون مقدمات أو خاتمات. كن موجزاً (3-5 جمل).
إذا سأل عن موضوع لا علاقة له بالمال أو الأعمال التجارية (كالطبخ أو الرياضة)، قل باختصار أن اختصاصك في الاستشارات المالية والتجارية فقط.`;
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

══ تفاصيل المصاريف (أرقام فعلية) ══
- تكلفة البضاعة: ${fmtN(latest.cogs)} ريال (${latest.cogsPct ?? '—'}%)
- الإيجار: ${fmtN(latest.rent)} ريال (${latest.rentPct ?? '—'}%)
- الرواتب: ${fmtN(latest.salaries)} ريال (${latest.salPct ?? '—'}%)
- التسويق: ${fmtN(latest.marketing)} ريال (${latest.mktPct ?? '—'}%)
- الكهرباء والمياه: ${fmtN(latest.utilities)} ريال
- مصاريف أخرى: ${fmtN(latest.other)} ريال

══ نقطة التعادل (محسوبة) ══
- التكاليف الثابتة = إيجار + رواتب + تسويق + كهرباء + أخرى = ${fmtN(latest.fixedCosts)} ريال
- نسبة هامش المساهمة = (إيرادات − تكلفة البضاعة) ÷ إيرادات = ${latest.contribRatio ?? '—'}%
- نقطة التعادل = ${fmtN(latest.breakEven)} ريال
[تعليمات صارمة: عند سؤالك عن نقطة التعادل، استخدم هذه الأرقام فقط. لا تعيد الحساب ولا تستخدم أرقاماً مختلفة.]

- مؤشر الصحة: ${latest.score ?? '—'}/100
- المنتجات: ${prodsText}
- التنبيهات: ${latest.alerts?.join(' | ') || 'لا توجد'}

══ التقارير السابقة — أرقام فعلية من قاعدة البيانات ══
[تعليمات الاستخدام: استخدم الأرقام التالية فقط ولا تستخدم أمثلة افتراضية. إذا كانت قيمة "—" فهي غير متوفرة ولا تستبدلها بأرقام.]
${prevText}
${trendText}
══ تعليمات العمل ══
- أنت مستشار مالي ذكي — يمكنك الإجابة على أي سؤال مالي أو تجاري أو يتعلق بالمشروع أو التحليل.
- عند الإجابة على أسئلة تخص المشروع، استخدم الأرقام الواردة أعلاه حصراً. لا تستخدم أمثلة افتراضية أو أرقاماً من خارج هذا النص.
${hasPreviousReports
  ? `- استخدم آخر تحليل كمرجع أساسي، وقارن مع أرقام التقارير السابقة الواردة أعلاه لتحديد الاتجاه (تحسن / تراجع / ثبات).
- حلّل الاتجاه عبر جميع التقارير المتاحة في قسم 'التقارير السابقة' وليس فقط آخر تقرير. إذا كان هناك أكثر من تقريرين، استخرج الاتجاه العام عبرها.`
  : `- لا توجد تقارير سابقة متاحة، لذلك لا تذكر أي مقارنة تاريخية أو تغير في الأداء.`}
- اذهب مباشرة للإجابة — لا تبدأ بمقدمة ترحيبية ولا تنهِ بجملة تشجيعية. لا حشو.
- كن موجزاً (3-5 جمل كحد أقصى إلا إذا طُلب منك التفصيل).
- اذكر الأرقام بالريال والنسب كما هي في البيانات. استخدم **bold** للأرقام المهمة.
- أعطِ توصيات قابلة للتطبيق فوراً مع تأثيرها المتوقع بأرقام واقعية.
- تحدث بالعربية دائماً بأسلوب مستشار محترف مباشر.
- إذا سأل عن موضوع لا علاقة له بالمال أو الأعمال (كالطبخ أو الرياضة)، قل باختصار أن اختصاصك في الاستشارات المالية والتجارية فقط.`;
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
