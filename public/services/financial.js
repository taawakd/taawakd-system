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
  services:    { label: 'خدمات (عام)',   netMargin: { min: 20, max: 40, label: 'هامش الربح الصافي' }, grossMargin: { min: 50, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 30, max: 50, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 40, label: 'تكلفة الخدمة',       lowerIsBetter: true }, mktPct: { min: 5,    max: 12, label: 'نسبة التسويق', lowerIsBetter: true } },
  cloud_kitchen:{ label: 'مطبخ سحابي', netMargin: { min: 18, max: 28, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 15, max: 22, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 27, max: 35, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 8,    max: 15, label: 'نسبة التسويق', lowerIsBetter: true } },
  drive_thru:  { label: 'درايف ثرو (كشك)', netMargin: { min: 18, max: 28, label: 'هامش الربح الصافي' }, grossMargin: { min: 65, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 10, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 15, max: 22, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 27, max: 35, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  hotel:       { label: 'فندق',          netMargin: { min: 10, max: 20, label: 'هامش الربح الصافي' }, grossMargin: { min: 70, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 10,  max: 20, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 25, max: 35, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 30, label: 'تكلفة التشغيل',      lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  logistics:   { label: 'الخدمات اللوجستية', netMargin: { min: 8, max: 15, label: 'هامش الربح الصافي' }, grossMargin: { min: 30, max: 45, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 7,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 20, max: 35, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 55, max: 70, label: 'تكلفة التشغيل',      lowerIsBetter: true }, mktPct: { min: 2,    max: 5,  label: 'نسبة التسويق', lowerIsBetter: true } },
  beauty:      { label: 'صالون تجميل',  netMargin: { min: 15, max: 25, label: 'هامش الربح الصافي' }, grossMargin: { min: 85, max: 90, label: 'هامش الربح الإجمالي' }, rentPct: { min: 15,  max: 25, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 40, max: 50, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 10, max: 15, label: 'تكلفة اللوازم',       lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  carwash:     { label: 'مغسلة سيارات', netMargin: { min: 15, max: 28, label: 'هامش الربح الصافي' }, grossMargin: { min: 80, max: 88, label: 'هامش الربح الإجمالي' }, rentPct: { min: 10,  max: 18, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 30, max: 40, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 12, max: 20, label: 'تكلفة المستلزمات',  lowerIsBetter: true }, mktPct: { min: 3,    max: 7,  label: 'نسبة التسويق', lowerIsBetter: true } },
  services_co: { label: 'شركة خدمات',  netMargin: { min: 15, max: 30, label: 'هامش الربح الصافي' }, grossMargin: { min: 55, max: 75, label: 'هامش الربح الإجمالي' }, rentPct: { min: 3,   max: 8,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 35, max: 55, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 20, max: 35, label: 'تكلفة الخدمة',       lowerIsBetter: true }, mktPct: { min: 5,    max: 10, label: 'نسبة التسويق', lowerIsBetter: true } },
  tech:        { label: 'شركة تقنية',  netMargin: { min: 15, max: 35, label: 'هامش الربح الصافي' }, grossMargin: { min: 60, max: 80, label: 'هامش الربح الإجمالي' }, rentPct: { min: 2,   max: 6,  label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 35, max: 55, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 15, max: 30, label: 'تكلفة التشغيل',      lowerIsBetter: true }, mktPct: { min: 8,    max: 20, label: 'نسبة التسويق', lowerIsBetter: true } },
  dates:       { label: 'تمور',         netMargin: { min: 15, max: 30, label: 'هامش الربح الصافي' }, grossMargin: { min: 40, max: 60, label: 'هامش الربح الإجمالي' }, rentPct: { min: 5,   max: 12, label: 'نسبة الإيجار',        lowerIsBetter: true }, salPct: { min: 10, max: 20, label: 'نسبة الرواتب', lowerIsBetter: true }, cogsPct: { min: 40, max: 60, label: 'تكلفة البضاعة',      lowerIsBetter: true }, mktPct: { min: 5,    max: 15, label: 'نسبة التسويق', lowerIsBetter: true } },
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
  // ── تطبيقات التوصيل ──
  const delTotal   = getN('f-del-total');
  const delNet     = getN('f-del-net');
  const delOrders  = getN('f-del-orders');
  const delCommission = delTotal > 0 ? Math.max(0, delTotal - delNet) : 0;
  const delCommPct    = delTotal > 0 ? parseFloat(pct(delCommission, delTotal)) : 0;
  const delAvgOrder   = delOrders > 0 ? Math.round(delTotal / delOrders) : 0;
  const hasDelivery   = delTotal > 0;
  const totalExpenses = cogs+rent+salaries+marketing+other+utilities+delCommission;
  const netProfit = revenue-totalExpenses;
  const netMargin = parseFloat(pct(netProfit,revenue));
  const grossMargin = parseFloat(pct(revenue-cogs, revenue));
  const rentPct = parseFloat(pct(rent,revenue));
  const salPct = parseFloat(pct(salaries,revenue));
  const cogsPct      = parseFloat(pct(cogs,revenue));
  const mktPct       = parseFloat(pct(marketing,revenue));
  const utilitiesPct = parseFloat(pct(utilities,revenue));
  const otherPct     = parseFloat(pct(other,revenue));

  const bizName = document.getElementById('f-name').value || 'مشروعك';
  const bizType = document.getElementById('f-type').value || 'غير محدد';
  const period = getPeriodLabel();
  const employees = getN('f-emp');
  const notes = document.getElementById('f-notes').value;
  const products = collectProducts();

  // getSectorKey يُعيد null إذا لم يُطابق أي قطاع — لا يُعيد 'restaurant' أبداً
  const sectorKey = getSectorKey(bizType);
  console.log('[Tawakkad][runAnalysis] bizType=%s → sectorKey=%s', bizType, sectorKey);

  // ── ضريبة القيمة المضافة (VAT) — يُقرأ من vat-config.js ─────────────────
  // الأرباح لا تتغير: revenue و totalExpenses يمثلان الأسعار بدون ضريبة
  // الضريبة تُتتبع بشكل منفصل فقط
  const { vatEnabled, vatOutput, vatInput, netVAT } =
    (typeof window.calcVAT === 'function')
      ? window.calcVAT(revenue, totalExpenses)
      : { vatEnabled: false, vatOutput: 0, vatInput: 0, netVAT: 0 };

  const metrics = { revenue, cogs, rent, salaries, marketing, other, utilities, totalExpenses, netProfit, netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct, utilitiesPct, otherPct,
    delTotal, delNet, delOrders, delCommission, delCommPct, delAvgOrder, hasDelivery,
    // VAT fields — صفر إذا vatEnabled = false
    vatEnabled, vatOutput, vatInput, netVAT };
  const scoreData = calcScore({ netMargin, grossMargin, rentPct, salPct, cogsPct });
  const alerts = generateAlerts({ ...metrics, netMargin, grossMargin, rentPct, salPct, cogsPct }, sectorKey);
  const scenarios = buildScenarios({ revenue, totalExpenses, netProfit, cogs, salaries, rent });

  const productsText = products.length ? products.map(p=>{const m=p.price>0?(((p.price-p.cost)/p.price)*100).toFixed(0):0;return `- ${p.name}: سعر ${p.price}ر تكلفة ${p.cost}ر كمية ${p.qty} هامش ${m}%`;}).join('\n') : 'لا توجد بيانات منتجات.';

  // ── تسمية حقل COGS بناءً على نوع النشاط لمنع تسرب مصطلحات المطعم ──────────
  // الأنشطة الغذائية: food_cost | الخدمية: service_cost | التجارية: cogs
  const _foodSectors    = new Set(['restaurant','cafe','bakery','cloud_kitchen','drive_thru','food_truck','juice_kiosk']);
  const _serviceSectors = new Set(['barber','beauty','clinic','laundry','carwash','services','services_co','tech','logistics','fitness','hotel']);
  const _cogsKey = _foodSectors.has(sectorKey)
    ? 'food_cost'
    : _serviceSectors.has(sectorKey)
      ? 'service_cost'
      : 'cogs';   // retail / grocery / pharmacy / perfumes / ecom / dates / other

  // ── إجمالي العملاء الشهريين = مجموع كميات المنتجات ────────────────────────
  // لا نقسم على موظفين أو أيام — المجموع المباشر هو العدد الصحيح
  const totalMonthlyCustomers = products.reduce((s, p) => s + (p.qty || 0), 0);

  const prompt = JSON.stringify({
    business_type: bizType || 'غير محدد',
    business_name: bizName,
    period: period,
    team_size: employees,
    revenue: revenue,
    [_cogsKey]: cogs,
    [_cogsKey + '_percent']: cogsPct,          // نسبة COGS من الإيرادات (صحيحة — ليست grossMargin)
    gross_margin_percent: grossMargin,           // هامش الربح الإجمالي (مكمّل لـ cogsPct)
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
    health_score: scoreData ? scoreData.total : null,
    ...(totalMonthlyCustomers > 0 ? { monthly_customers: totalMonthlyCustomers } : {}),
    products: productsText || null,
    notes: notes || null,
    ...(hasDelivery ? {
      delivery_apps: {
        total_sales: delTotal,
        net_received: delNet,
        orders_count: delOrders,
        commission_amount: delCommission,
        commission_percent: delCommPct,
        avg_order_value: delAvgOrder
      }
    } : {}),
    sector_key: sectorKey || null,
    request: 'حلل بيانات المشروع وأعطني التشخيص ونقاط القوة والمشاكل وأفضل 3 إجراءات لتحسين الربح مع أرقام محددة'
  }, null, 2);

  // ── System prompt مخصص لنوع النشاط (يمنع تسرب مصطلحات قطاع آخر) ──────────
  // يُرسَل كـ messages[0] مع role:'system' حتى يستخرجه analyze.js ويضعه كـ system field
  // هذا يضمن أن النموذج يحلل النشاط بالمعايير الصحيحة لقطاعه دون افتراض قطاع المطاعم
  const _bizSectorDesc = sectorKey
    ? `نشاط: ${bizType} | قطاع: ${sectorKey}`
    : `نشاط: ${bizType || 'غير محدد'}`;
  const _analysisSystemPrompt =
`أنت مستشار مالي خبير في المشاريع السعودية الصغيرة والمتوسطة.
${_bizSectorDesc}

تعليمات إلزامية — لا تتجاهلها:
• حلّل البيانات بناءً على طبيعة "${bizType}" فقط — استخدم مصطلحات ومعايير هذا القطاع.
• إذا ظهر حقل service_cost → فهو تكلفة الخدمة / المستلزمات (لا علاقة له بالطعام).
• إذا ظهر حقل food_cost → فهو تكلفة الخامات الغذائية (للمطاعم والمقاهي فقط).
• إذا ظهر حقل cogs → فهو تكلفة البضاعة التجارية.
• ❌ محظور تماماً: استخدام مصطلحات قطاع المطاعم (وجبات / طعام / قائمة / مطبخ) إلا إذا كان النشاط مطعماً أو مقهى فعلاً.
• تحدث بالعربية. اذهب مباشرةً للتشخيص والتوصيات بدون مقدمات.`;

  let reportText = '';
  try {
    const resp = await fetch('/api/analyze', {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+(window.__AUTH_TOKEN__||'')},
      body:JSON.stringify({
        model:"gpt-4o-mini", max_tokens:1000,
        messages:[
          { role:'system', content: _analysisSystemPrompt },
          { role:'user',   content: prompt }
        ]
      })
    });
    const data = await resp.json();

    // فحص حد الخطة أو انتهاء التجربة
    if (data.limit_reached || data.trial_expired) {
      if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').classList.remove('show');
      if(document.getElementById('analyzeBtnText')) document.getElementById('analyzeBtnText').textContent = 'تحليل المشروع الآن';
      if(document.getElementById('analyzeSpin')) document.getElementById('analyzeSpin').style.display = 'none';
      btn.disabled = false;
      const _errUser = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
      console.log('[Tawakkad][analyze] blocked | plan=%s | trialActive=%s | trial_expired=%s | limit_reached=%s',
        _errUser.plan, _errUser.isTrialActive, !!data.trial_expired, !!data.limit_reached);
      const featureName = data.trial_expired
        ? 'انتهت فترة التجربة المجانية'
        : `حد التحليلات الشهري (${data.used}/${data.limit})`;
      if (typeof showUpgradeModal === 'function') showUpgradeModal(featureName, 'paid');
      else if (typeof window.showLimitModal === 'function') window.showLimitModal(data.used, data.limit);
      return;
    }

    reportText = data.content?.map(i=>i.text||'').join('') || '';

    // ── تحديث الخطة من الـ API (يضمن أن __USER_PLAN__ محدّث حتى بدون إعادة تحميل) ──
    // مثال: المستخدم ترقّى بعد آخر تسجيل دخول — الـ API يعيد الخطة الحقيقية من قاعدة البيانات
    // نُسوِّي مباشرةً: pro / enterprise → 'paid' | غيرها → 'free'
    if (data.plan) {
      window.__USER_PLAN__ = window.normalizePlan(data.plan);
      console.log('[Tawakkad][api] raw plan=%s → normalized=%s', data.plan, window.__USER_PLAN__);
    }

    // ── وقت بدء التجربة: API يُعيده في كل استجابة ──
    // يُخزَّن في window.__TRIAL_STARTED_AT__ ليقرأه canAccessFeature() عند عرض النتائج
    if (data.trial_started_at !== undefined) {
      window.__TRIAL_STARTED_AT__ = data.trial_started_at || null;
      console.log('[Tawakkad][api] trial_started_at=%s', window.__TRIAL_STARTED_AT__);
    }
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

  // ── كل تحليل يُحفظ دائماً — بغض النظر عن الخطة أو حالة التجربة ─────
  // is_saved_for_user = true دائماً: التحليل سجل تاريخي لكل مستخدم
  // قفل التفاصيل يتم في renderResults() عبر canAccessFeature() — لا هنا
  const _isSavedForUser = true;

  // أضف الـ flag للكائن (لاستخدامها في localStorage والفلترة)
  report._is_saved_for_user = true;

  STATE.currentReport = report;

  // أضف للـ STATE.savedReports وalocalStorage — دائماً
  STATE.savedReports.unshift(report);
  if (typeof saveProjectReports === 'function') {
    saveProjectReports(STATE.savedReports);
  } else {
    localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0, 20)));
  }
  console.log('[Tawakkad][analysisSave] added to STATE.savedReports | total=%d | bizName=%s | period=%s',
    STATE.savedReports.length, report.bizName, report.period);

  try {
    const token = window.__AUTH_TOKEN__;
    const _projId = window.__CURRENT_PROJECT_ID__ || 'default';
    // المشاريع الإضافية (غير الافتراضية) تُحفظ في localStorage فقط — لا Supabase
    if (token && _projId === 'default') {
      const { data: { user } } = await window.sb.auth.getUser();
      if (user) {
        const basePayload = {
          user_id: user.id, biz_name: report.bizName, biz_type: report.bizType,
          period: report.period, revenue: report.metrics?.revenue || 0,
          total_expenses: report.metrics?.totalExpenses || 0, net_profit: report.metrics?.netProfit || 0,
          net_margin: report.metrics?.netMargin || 0, health_score: report.scoreData?.total || 0,
          is_saved_for_user: true,  // دائماً true — كل تحليل سجل تاريخي
          report_json: report
        };
        console.log('[Tawakkad][analysisSave] saving to Supabase reports table | user_id=%s | bizName=%s | bizType=%s | revenue=%s',
          user.id, report.bizName, report.bizType, report.metrics?.revenue);
        // Try with all new columns; fallback gracefully if columns don't exist yet
        let { error: insertErr } = await window.sb.from('reports').insert({
          ...basePayload, report_period: report.reportPeriod || null
        });
        if (insertErr) {
          console.error('[Tawakkad] Supabase insert error:', insertErr.message, insertErr);
          // fallback 1: بدون report_period
          if (insertErr.code === '42703' || (insertErr.message?.includes('report_period'))) {
            console.warn('[Tawakkad] report_period missing — retrying without it');
            const { error: e2 } = await window.sb.from('reports').insert(basePayload);
            if (e2) {
              // fallback 2: بدون الأعمدة الجديدة (paid_one_time / is_saved_for_user)
              if (e2.code === '42703') {
                console.warn('[Tawakkad] paid_one_time/is_saved_for_user columns missing — run migration. Retrying with minimal payload');
                const minimalPayload = {
                  user_id: user.id, biz_name: report.bizName, biz_type: report.bizType,
                  period: report.period, revenue: report.metrics?.revenue || 0,
                  total_expenses: report.metrics?.totalExpenses || 0, net_profit: report.metrics?.netProfit || 0,
                  net_margin: report.metrics?.netMargin || 0, health_score: report.scoreData?.total || 0,
                  report_json: report
                };
                const { error: e3 } = await window.sb.from('reports').insert(minimalPayload);
                if (e3) console.error('[Tawakkad] minimal insert error:', e3.message);
                else console.log('[Tawakkad] Insert OK (minimal — flags stored in report_json only)');
              } else {
                console.error('[Tawakkad] Supabase retry error:', e2.message);
              }
            } else {
              console.log('[Tawakkad] Insert OK without report_period');
            }
          }
        } else {
          console.log('[Tawakkad][analysisSave] ✅ Supabase insert OK | is_saved_for_user=true | bizName=%s', report.bizName);
        }
        // ملاحظة: زيادة analyses_used تتم من الـ API مباشرة — لا نكررها هنا
      }
    } // end: default project only
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
  if (typeof saveProjectReports === 'function') saveProjectReports(STATE.savedReports);
  else localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports));
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

      // ── اختر الشيت الصحيح: ابحث عن "إدخال البيانات" أولاً ──────────────
      const dataSheetName = wb.SheetNames.find(n =>
        n.includes('إدخال') || n.includes('بيانات') || n.includes('data') || n.includes('Data')
      ) || wb.SheetNames[0];
      const ws   = wb.Sheets[dataSheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
      if (!rows.length) { toast('الملف فارغ'); return; }

      const clean  = s  => String(s||'').trim().replace(/[★✦•\s]+/g,' ').trim();
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
      // الاستراتيجية 0: قالب توكّد الرسمي — العمود B=التسمية، العمود C=القيمة
      // يتعرف على الشيت بوجود "توكّد" في الصف الثاني
      // ══════════════════════════════════════════════════════════════════════
      const isTawakkadTemplate = rows.slice(0,4).some(r =>
        r.some(cell => String(cell||'').includes('توكّد') || String(cell||'').includes('towkd'))
      );
      if (isTawakkadTemplate) {
        rows.forEach(row => {
          const label = clean(String(row[1]||''));  // العمود B (index 1)
          const val   = row[2];                     // العمود C (index 2)
          if (!label) return;
          const m = matchField(label);
          if (m) {
            if (m.text) {
              const strVal = String(val||'').trim();
              if (strVal) { setFld(m.field, strVal); matched++; }
            } else {
              const n = num(val);
              if (n > 0) { setFld(m.field, n); matched++; }
            }
          }
          // الفترة الزمنية
          const lc = label.replace(/\s+/g,'');
          if (lc.includes('الفترة') || lc.includes('فترة') || lc.includes('period')) {
            if (!window._excelReportPeriod && val) window._excelReportPeriod = String(val).trim();
          }
        });
        if (matched > 0) {
          if (typeof liveCalc === 'function') liveCalc();
          toast('✅ تم قراءة ' + matched + ' حقل من قالب توكّد');
          return;
        }
      }

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
// Fix: deep-clone the results content into a self-contained PDF wrapper
// with all colours set via explicit inline styles so html2canvas sees real values.
async function exportPDF() {
  // فحص الصلاحية — PDF متاح للمشتركين وخلال فترة التجربة
  const _pdfUser   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _pdfAccess = window.canAccessFeature ? window.canAccessFeature(_pdfUser, 'pdf_export') : planAllows('pdf_export');
  console.log('[Tawakkad][exportPDF] plan=%s | trialActive=%s | access=%s',
    _pdfUser.plan, _pdfUser.isTrialActive, _pdfAccess);
  if (!_pdfAccess) {
    if (typeof showUpgradeModal === 'function') showUpgradeModal('تصدير تقرير PDF', 'paid');
    return;
  }
  const rep = STATE.currentReport;
  if (!rep) { alert('لا يوجد تقرير للتصدير. يرجى إجراء تحليل أولاً.'); return; }

  const { bizName, bizType, period, metrics, scoreData, alerts, products, reportText, sectorKey, scenarios } = rep;
  const { revenue, netProfit, netMargin, grossMargin,
          rentPct, salPct, cogsPct, mktPct } = metrics;
  // ?? 0 ensures old reports (before utilities was added to metrics) still render correctly
  const cogs          = metrics.cogs          ?? 0;
  const rent          = metrics.rent          ?? 0;
  const salaries      = metrics.salaries      ?? 0;
  const marketing     = metrics.marketing     ?? 0;
  const utilities     = metrics.utilities     ?? 0;
  const other         = metrics.other         ?? 0;
  const delCommission = metrics.delCommission ?? 0;
  const totalExpenses = metrics.totalExpenses ?? (cogs + rent + salaries + marketing + utilities + other + delCommission);

  const score       = scoreData ? scoreData.total : 0;
  const scoreColor  = score >= 65 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const scoreLabel  = score >= 80 ? 'ممتاز' : score >= 65 ? 'جيد جداً' : score >= 50 ? 'متوسط' : score >= 35 ? 'يحتاج تحسين' : 'خطر';
  const profitColor = netProfit >= 0 ? '#16a34a' : '#dc2626';
  const marginColor = netMargin > 15 ? '#16a34a' : netMargin < 5 ? '#dc2626' : '#d97706';
  const dateStr     = rep.reportPeriod || (rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('ar-SA') : '');
  const f = n => (n || 0).toLocaleString('ar-SA', { maximumFractionDigits: 0 });
  // تعريف محلي لرمز الريال — نستخدم نصاً عادياً داخل PDF لأن html2canvas لا يدعم SVG inline
  // eslint-disable-next-line no-shadow
  const SAR = 'ر.س';

  // ── تسمية COGS بناءً على نوع النشاط (للـ PDF) ──────────────────────────────
  // يمنع ظهور "تكلفة البضاعة / الإنتاج" في تقارير الأنشطة الخدمية
  const _pdfCogsLabel = (typeof window.getBizTerminology === 'function' && bizType)
    ? (window.getBizTerminology(bizType)?.cogsLabel || 'تكلفة البضاعة / الإنتاج')
    : 'تكلفة البضاعة / الإنتاج';

  // ── التنبيهات ──
  const alertsHtml = (alerts || []).slice(0, 8).map(a => {
    const icon   = a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🟢';
    const bg     = a.type === 'danger' ? '#fee2e2' : a.type === 'warning' ? '#fef3c7' : '#dcfce7';
    const border = a.type === 'danger' ? '#fca5a5' : a.type === 'warning' ? '#fcd34d' : '#86efac';
    return `<div style="padding:9px 12px;margin-bottom:7px;border-radius:7px;background:${bg};border-right:4px solid ${border};font-size:12px;color:#1a1a1a;">${icon} ${a.msg || a.message || ''}</div>`;
  }).join('');

  // ── المصاريف (جميع البنود مع ?? 0 للتوافق مع التقارير القديمة) ──
  const expensesRows = [
    { label: _pdfCogsLabel,                  val: cogs          },
    { label: 'الإيجار',                       val: rent          },
    { label: 'الرواتب والأجور',               val: salaries      },
    { label: 'التسويق والإعلان',              val: marketing     },
    { label: 'الكهرباء والمياه',              val: utilities     },
    { label: 'مصاريف أخرى',                  val: other         },
    ...(delCommission > 0 ? [{ label: 'عمولة تطبيقات التوصيل', val: delCommission }] : []),
  ].filter(r => r.val > 0);

  const expensesHtml = expensesRows.map((r, i) => {
    const pRev = revenue       > 0 ? ((r.val / revenue)       * 100).toFixed(1) : '—';
    const pExp = totalExpenses > 0 ? ((r.val / totalExpenses) * 100).toFixed(1) : '—';
    const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 8px;border:1px solid #e5e7eb;color:#374151;font-size:12px;">${r.label}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:#1a1a1a;font-size:12px;">${f(r.val)} ${SAR}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">${pRev}%</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;font-size:12px;font-weight:600;">${pExp}%</td>
    </tr>`;
  }).join('') + `<tr style="background:#f3f4f6;font-weight:700;">
    <td style="padding:7px 8px;border:1px solid #e5e7eb;color:#1a1a1a;font-size:12px;">إجمالي المصاريف</td>
    <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;font-size:12px;">${f(totalExpenses)} ${SAR}</td>
    <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;font-size:12px;">${revenue > 0 ? ((totalExpenses/revenue)*100).toFixed(1) : '—'}%</td>
    <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#374151;font-size:12px;font-weight:700;">100%</td>
  </tr>`;

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
  const bench = (window.BENCHMARKS || BENCHMARKS)[sectorKey || 'services'] || {};
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
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:12px;color:${statusColor};">${val.toFixed(1)}% من الإيرادات</td>
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
        <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${f(bePoint)} ${SAR}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;">نقطة التعادل</div>
      </div>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center;border:1px solid #e5e7eb;">
        <div style="font-size:16px;font-weight:700;color:${beColor};">${beDiff >= 0 ? '+' : ''}${f(beDiff)} ${SAR}</div>
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
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;font-weight:600;color:${s.newProfit>=0?'#16a34a':'#dc2626'};">${f(s.newProfit)} ${SAR}</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">${newMargin}%</td>
      <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:12px;color:#16a34a;font-weight:600;">+${f(delta)} ${SAR}</td>
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
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${f(p.price)} ${SAR}</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${f(p.cost)} ${SAR}</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;color:#1a1a1a;">${p.qty||0}</td>
          <td style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${mc};">${m}%</td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : '';

  // ── تحليل الذكاء الاصطناعي ──
  // نُزيل SECTION tags أولاً ثم نُمرر النص عبر _cleanAIText لإزالة Markdown
  const _rawAI  = (reportText || '').replace(/\[SECTION:[^\]]+\]/g,'').replace(/\[\/SECTION\]/g,'').trim();
  const cleanAI = (typeof window._cleanAIText === 'function') ? window._cleanAIText(_rawAI) : _rawAI;
  const aiHtml = cleanAI ? `
    <h3 style="font-size:15px;font-weight:700;color:#1e40af;margin:0 0 10px 0;direction:rtl;text-align:right;">🤖 تحليل الذكاء الاصطناعي</h3>
    <p style="font-size:12px;color:#374151;line-height:1.9;white-space:pre-wrap;margin:0;direction:rtl;text-align:right;unicode-bidi:embed;">${cleanAI}</p>` : '';

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
        { val: f(revenue)+' '+SAR, label: 'الإيرادات', color: '#1a1a1a' },
        { val: (netProfit>=0?'+':'')+f(netProfit)+' '+SAR, label: 'صافي الربح', color: profitColor },
        { val: netMargin+'% من الإيرادات', label: 'هامش الربح', color: marginColor },
        { val: f(totalExpenses)+' '+SAR, label: 'إجمالي المصاريف', color: '#1a1a1a' },
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
            <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">% من الإيراد</th>
            <th style="padding:7px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">% من المصاريف</th>
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

  // انتظر تحميل الخطوط (IBM Plex Sans Arabic) قبل التقاط الصورة
  // بدون هذا قد يستخدم html2canvas خطاً احتياطياً لا يدعم العربية
  try { await document.fonts.ready; } catch(_) {}
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  try {
    const canvas = await window.html2canvas(wrapper, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#f1f5f9', logging: false, width: 806,
      onclone: (clonedDoc) => {
        // تأكد من أن المستند المستنسخ يحافظ على اتجاه RTL والخط العربي
        clonedDoc.documentElement.setAttribute('dir', 'rtl');
        clonedDoc.documentElement.setAttribute('lang', 'ar');
        const style = clonedDoc.createElement('style');
        style.textContent = "* { font-family: 'IBM Plex Sans Arabic', Arial, sans-serif !important; }";
        clonedDoc.head.appendChild(style);
      },
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

        // المنتجات: يفضّل _PRODUCTS (جدول Supabase) على منتجات التقرير
        const dbProducts  = (window._PRODUCTS || []).map(p => ({
          name: p.name, price: p.selling_price, cost: p.cost, qty: 0, category: p.category,
        }));
        const repProducts = rep.products || [];
        const products = dbProducts.length ? dbProducts : repProducts;

        // ── جمع بنود التكاليف مع ?? 0 لضمان عدم ظهور — في التقارير القديمة ──
        // التقارير المحفوظة قبل إضافة utilities/utilitiesPct قد تحتوي undefined
        const _cogs      = m.cogs       ?? 0;
        const _rent      = m.rent       ?? 0;
        const _salaries  = m.salaries   ?? 0;
        const _marketing = m.marketing  ?? 0;
        const _utilities = m.utilities  ?? 0;
        const _other     = m.other      ?? 0;
        // إجمالي المصاريف التشغيلية الأساسية (6 بنود بدون عمولة توصيل)
        const _baseTotalExp = _cogs + _rent + _salaries + _marketing + _utilities + _other;
        // نسبة كل بند من إجمالي المصاريف (وليس من الإيرادات)
        const _ep = (v) => _baseTotalExp > 0
          ? parseFloat((v / _baseTotalExp * 100).toFixed(1))
          : 0;

        return {
          bizName:       rep.bizName,
          bizType:       rep.bizType,
          revenue:       m.revenue,
          profit:        m.netProfit,
          margin:        m.netMargin,
          grossMargin:   m.grossMargin,
          totalExpenses: m.totalExpenses ?? _baseTotalExp,
          baseTotalExp:  _baseTotalExp,
          // أرقام ريال فعلية — مضمونة لا تكون undefined
          cogs:          _cogs,
          rent:          _rent,
          salaries:      _salaries,
          marketing:     _marketing,
          utilities:     _utilities,
          other:         _other,
          // نسب كل بند من إجمالي المصاريف (expensePct = expense / totalExpenses)
          cogsPct:       _ep(_cogs),
          rentPct:       _ep(_rent),
          salPct:        _ep(_salaries),
          mktPct:        _ep(_marketing),
          utilitiesPct:  _ep(_utilities),
          otherPct:      _ep(_other),
          // نقطة التعادل محسوبة مسبقاً
          fixedCosts:    fixedCosts,
          contribRatio:  parseFloat((contribRatio * 100).toFixed(1)),
          breakEven:     breakEven,
          score:         rep.scoreData?.total,
          period:        rep.reportPeriod || rep.period,
          alerts:        rep.alerts?.map(a => a.msg) || [],
          products,
          // تطبيقات التوصيل
          ...(m.hasDelivery ? {
            delTotal:      m.delTotal,
            delNet:        m.delNet,
            delOrders:     m.delOrders,
            delCommission: m.delCommission,
            delCommPct:    m.delCommPct,
            delAvgOrder:   m.delAvgOrder,
          } : {}),
        };
      })(),
      previous: previousReports,
      trend
    }
  };
}

function buildCFOSystemPrompt(ctx) {
  // مُنسِّق أرقام آمن للـ BP (يُظهر — للقيمة 0 أو null)
  const _fmtBP = v => (v != null && !isNaN(Number(v)) && Number(v) !== 0)
    ? Number(v).toLocaleString('en')
    : '—';

  if (!ctx) {
    const bp = window._businessProfile;
    if (!bp || !bp.biz_name) {
      return `أنت CFO — مدير مالي تنفيذي للمشاريع السعودية الصغيرة والمتوسطة.
لا تتوفر بيانات مشروع محددة حالياً. أجب على الأسئلة المالية فقط بهذا الهيكل الإلزامي:
## التشخيص | ## السبب الحقيقي | ## أخطر 3 مشاكل | ## قرارات مباشرة | ## الأثر المتوقع
❌ لا مقدمات. ❌ لا جمل عامة ("وضعك جيد"). ❌ لا LaTeX (\\frac \\text $).
❌ لا نسبة مئوية بدون مصدرها: اكتب دائماً (X% من الإيرادات) أو (X% من المصاريف).
✅ كل جملة = رقم أو قرار. ✅ عربية مباشرة. ✅ أكمل كل قسم قبل الانتقال للتالي.`;
    }
    // لا يوجد تقارير لكن يوجد ملف مشروع — استخدم بياناته
    const _bpTerms = typeof window.getBizTerminology === 'function'
      ? window.getBizTerminology(bp.biz_type)
      : { cogsShort:'تكلفة الإنتاج', productLabel:'منتج / خدمة' };
    console.log('[Tawakkad][CFO-bp] biz_type=%s | cogsShort="%s" | productLabel="%s"',
      bp.biz_type, _bpTerms.cogsShort, _bpTerms.productLabel);
    const totalFixed = (Number(bp.fixed_rent)||0) + (Number(bp.fixed_salaries)||0)
      + (Number(bp.fixed_utilities)||0) + (Number(bp.fixed_marketing)||0)
      + (Number(bp.fixed_subscriptions)||0) + (Number(bp.fixed_other)||0);
    return `أنت AI CFO لمشروع "${bp.biz_name}" — مستشار مالي متخصص للمشاريع السعودية الصغيرة والمتوسطة.

══ ملف المشروع (البيانات الأساسية) ══
- الاسم: ${bp.biz_name}
- النشاط: ${bp.biz_type || '—'}
- المدينة: ${bp.city || '—'}
- الإيجار: ${_fmtBP(bp.fixed_rent)} ر.س/شهر
- الرواتب: ${_fmtBP(bp.fixed_salaries)} ر.س/شهر
- الكهرباء والمياه: ${_fmtBP(bp.fixed_utilities)} ر.س/شهر
- التسويق الثابت: ${_fmtBP(bp.fixed_marketing)} ر.س/شهر
- الاشتراكات: ${_fmtBP(bp.fixed_subscriptions)} ر.س/شهر
- مصاريف أخرى: ${_fmtBP(bp.fixed_other)} ر.س/شهر
- إجمالي التكاليف الثابتة: ${totalFixed > 0 ? totalFixed.toLocaleString('en') : '—'} ر.س/شهر

══ هيكل الرد — إلزامي ══
أنت CFO تعطي تشخيصاً وأوامر، لا تقريراً. التزم بهذا الهيكل في كل رد:

## التشخيص
جملة واحدة — جوهر المشكلة أو الفرصة.

## السبب الحقيقي
ربط مباشر: رقم → سبب → نتيجة. لا جمل عامة.

## أخطر 3 مشاكل
1. مشكلة — رقم — تأثير على الربح
2. مشكلة — رقم — تأثير على الربح
3. مشكلة — رقم — تأثير على الربح

## قرارات مباشرة
- [افعل/أوقف/ارفع/خفّض] + ماذا + بكم + خلال كم يوم

## الأثر المتوقع
- الربح يرتفع تقريباً بـ +X ريال إذا نُفِّذت القرارات.

❌ لا تكرر الأرقام بدون تفسير سببها وأثرها.
❌ لا مقدمات. لا خاتمات. لا جمل عامة ("وضعك جيد"، "هناك فرص").
❌ لا قسم منقوص أو جملة غير مكتملة.
❌ لا نسبة مئوية بدون مصدرها الصريح — يجب: (X% من الإيرادات) أو (X% من مبيعات التطبيقات) أو (X% من إجمالي المصاريف).
✅ استخدم البيانات الواردة أعلاه حصراً. لا أرقام افتراضية.
✅ إذا كان ${_bpTerms.productLabel} موجوداً في البيانات: حلّله فوراً بأرقامه.
✅ تحدث بالعربية. استخدم **bold** للأرقام والقرارات المهمة.
❌ يُمنع LaTeX: \\frac \\text $ — اكتب الحسابات كنص: 5,000 ÷ 10 = 500 ريال.`;
  }

  const { cfoContext } = ctx;
  const latest             = cfoContext.latest;
  const previous           = cfoContext.previous;
  const trend              = cfoContext.trend || {};
  const hasPreviousReports = previous && previous.length > 0;

  // ── مصطلحات مخصصة لنوع النشاط التجاري (تمنع تسرب مصطلحات المطاعم) ──
  const _terms = typeof window.getBizTerminology === 'function'
    ? window.getBizTerminology(latest.bizType)
    : { cogsLabel:'تكلفة الإنتاج / الخدمات', cogsShort:'تكلفة الإنتاج',
        productLabel:'منتج / خدمة', suppliersLabel:'الموردين',
        inventoryLabel:'جدول الخدمات والمخزون', wasteLabel:'الهدر',
        revenueLabel:'إيرادات المشروع' };
  console.log('[Tawakkad][CFO] biz_type=%s | cogsLabel="%s" | productLabel="%s" | revenueLabel="%s"',
    latest.bizType, _terms.cogsLabel, _terms.productLabel, _terms.revenueLabel);

  // Null-safe number formatter — shows '—' for missing/undefined values instead of 0
  // Prevents the model seeing "إيرادات 0 ر" for old reports with no data
  const fmtN = v => (v != null && !isNaN(Number(v))) ? Number(v).toLocaleString('en') : '—';

  // ══ بناء قسم المنتجات التفصيلي من PC_STATE ══
  // PC_STATE هو المصدر الأغنى: يحتوي على تكلفة المكونات + التشغيل + الهامش الحقيقي
  //
  // ⚠️  مشكلة مُحتملة: PC_STATE يُهيَّأ عند تحميل الصفحة قبل أن يُضبط __CURRENT_PROJECT_ID__
  //     لذا قد يقرأ من مفتاح localStorage خاطئ ويبقى فارغاً.
  //     الحل: نقرأ أيضاً من localStorage مباشرة بالمفتاح الصحيح ونستخدم المصدر الأغنى.
  const _pcKey = typeof projectProductCostsKey === 'function'
    ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default')
    : 'tw_product_costs';
  const _fromState   = (window.PC_STATE?.products || []).filter(p => p && p.name);
  const _fromStorage = (() => {
    try { return JSON.parse(localStorage.getItem(_pcKey) || '[]').filter(p => p && p.name); }
    catch(e) { return []; }
  })();
  // استخدم المصدر الأغنى (أكثر منتجات) وحدّث PC_STATE بالبيانات المقروءة
  const pcProds = _fromStorage.length > _fromState.length ? _fromStorage : _fromState;
  // مزامنة PC_STATE بالبيانات الصحيحة إذا كانت localStorage أغنى
  if (_fromStorage.length > _fromState.length && window.PC_STATE) {
    window.PC_STATE.products = _fromStorage;
  }

  // ═══════════════════════════════════════════════════
  // 🔍 DIAGNOSTIC LOG #2 — داخل buildCFOSystemPrompt
  // ═══════════════════════════════════════════════════
  console.log('%c[CFO DIAG #2] داخل buildCFOSystemPrompt', 'color:#0f0;font-weight:bold');
  console.log('%c[CFO DIAG #2] _pcKey (مفتاح localStorage):', 'color:#0f0', _pcKey);
  console.log('%c[CFO DIAG #2] _fromState (PC_STATE.products):', 'color:#0f0', _fromState);
  console.log('%c[CFO DIAG #2] _fromStorage (localStorage مباشرة):', 'color:#0f0', _fromStorage);
  console.log('%c[CFO DIAG #2] pcProds (المصدر المختار):', 'color:#0f0', pcProds);
  console.log('%c[CFO DIAG #2] عدد المنتجات المرسلة للـ AI:', 'color:#0f0;font-weight:bold', pcProds.length);
  // ═══════════════════════════════════════════════════

  const latestProds = latest.products || [];

  let prodsSection = '';

  if (pcProds.length > 0) {
    // بناء قسم تفصيلي من PC_STATE
    const pcLines = pcProds.map(p => {
      const salePrice   = parseFloat(p.salePrice || p.suggestedPrice || 0);
      const ingCost     = (p.ingredients || []).reduce((s, i) => s + parseFloat(i.total || (i.qty * i.unitCost) || 0), 0);
      const trueCost    = parseFloat(p.trueCost || ingCost || 0);
      const opPerUnit   = Math.max(0, trueCost - ingCost);
      const profitPerUnit = salePrice - trueCost;
      const margin      = salePrice > 0 ? (profitPerUnit / salePrice * 100).toFixed(1) : 0;
      const monthlySales = parseInt(p.monthlySales || 0, 10);
      const monthlyProfit = profitPerUnit * monthlySales;

      let line = `• ${p.name} — سعر البيع: ${fmtN(salePrice)} ر`;
      if (ingCost > 0)      line += ` | تكلفة المكونات: ${fmtN(ingCost.toFixed(2))} ر`;
      if (opPerUnit > 0)    line += ` | التكلفة التشغيلية/وحدة: ${fmtN(opPerUnit.toFixed(2))} ر`;
      if (trueCost > 0)     line += ` | التكلفة الكاملة: ${fmtN(trueCost.toFixed(2))} ر`;
      line += ` | ربح/وحدة: ${fmtN(profitPerUnit.toFixed(2))} ر | هامش: ${margin}%`;
      if (monthlySales > 0) line += ` | مبيعات شهرية: ${monthlySales} وحدة | ربح شهري: ${fmtN(monthlyProfit.toFixed(0))} ر`;
      return line;
    }).join('\n');

    prodsSection = `\n══ بيانات المنتجات الحالية ══
[تعليمات صارمة: عند السؤال عن تسعير أو ربحية أي منتج بالاسم، استخدم أرقامه من هذا القسم حصراً. لا تطلب بيانات إضافية من المستخدم إذا كان المنتج موجوداً هنا.]
${pcLines}\n`;

    // إضافة المنتجات الموجودة في latest.products فقط (غير موجودة في PC_STATE)
    const pcNames = new Set(pcProds.map(p => (p.name||'').trim().toLowerCase()));
    const extraProds = latestProds.filter(p => !pcNames.has((p.name||'').trim().toLowerCase()));
    if (extraProds.length > 0) {
      const extraLines = extraProds.map(p => {
        const sp = parseFloat(p.selling_price ?? p.price ?? 0);
        const mg = sp > 0 ? (((sp - (p.cost||0)) / sp) * 100).toFixed(0) : 0;
        return `• ${p.name} — سعر: ${fmtN(sp)} ر | هامش: ${mg}%`;
      }).join('\n');
      prodsSection += `(منتجات إضافية بيانات أساسية فقط)\n${extraLines}\n`;
    }

  } else if (latestProds.length > 0) {
    // لا يوجد PC_STATE — نستخدم البيانات الأساسية
    const basicLines = latestProds.map(p => {
      const sp = parseFloat(p.selling_price ?? p.price ?? 0);
      const mg = sp > 0 ? (((sp - (p.cost||0)) / sp) * 100).toFixed(0) : 0;
      return `• ${p.name} — سعر: ${fmtN(sp)} ر | هامش: ${mg}%${p.category ? ' | ' + p.category : ''}`;
    }).join('\n');
    prodsSection = `\n══ بيانات المنتجات ══
${basicLines}\n`;
  } else {
    prodsSection = ''; // لا توجد بيانات منتجات — لا نضيف قسماً فارغاً
  }

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
دورك: تحليل الأرقام واتخاذ قرارات مالية مبنية على بيانات المشروع الفعلية.

════════════════════════════════════════
⚡ قاعدة المنتجات — أعلى أولوية في هذا الـ prompt ⚡
════════════════════════════════════════
أسئلة مثل "كم ربح [منتج]؟" أو "هل سعر [منتج] مناسب؟" أو "ما هامش [منتج]؟"
هي أسئلة مالية بامتياز وتقع في صميم عملك كـ CFO.

الحكم الوحيد: هل اسم المنتج موجود في قسم "بيانات المنتجات الحالية" أدناه؟
- نعم موجود  → حلّله فوراً: ربح/وحدة، هامش%، تكلفة كاملة، ربح شهري. لا تتردد.
- لا ليس موجوداً → اطلب من المستخدم إضافته في حاسبة التكاليف أولاً.

✅ مسموح: حساب الربح لكل وحدة، تحليل الهامش، تقييم السعر، اقتراح تعديل السعر، تحليل الربحية الشهرية.
❌ ممنوع فقط: إعطاء أسعار سوقية عامة لمنتج غير موجود في البيانات.
❌ خطأ صريح: قول "لا أستطيع تقديم معلومات عن أرباح المنتجات" إذا كان المنتج موجوداً أدناه.
════════════════════════════════════════

══ آخر تحليل (المرجع الأساسي) ══
- الفترة: ${latest.period}
- النشاط: ${latest.bizType}
- الإيرادات: ${fmtN(latest.revenue)} ريال
- صافي الربح: ${fmtN(latest.profit)} ريال (${latest.margin ?? '—'}% من الإيرادات)
- هامش إجمالي: ${latest.grossMargin ?? '—'}% من الإيرادات
- المصاريف الكلية: ${fmtN(latest.totalExpenses)} ريال

══ تفاصيل المصاريف — أرقام ثابتة لا تُعدَّل إلا بطلب صريح ══
[⚠️ قاعدة إلزامية: هذه الأرقام هي المصدر الوحيد للحقيقة. عند أي سؤال يتعلق بتعديل بند واحد، عدّل ذلك البند فقط واحتفظ بباقي البنود كما هي بالضبط. لا تُقدّر ولا تُعيد توزيع أي رقم.]
- الإيرادات:               ${fmtN(latest.revenue)} ريال  ← ثابت
- ${_terms.cogsShort}:     ${fmtN(latest.cogs)} ريال  ← بند قابل للتعديل عند الطلب
- الإيجار:                  ${fmtN(latest.rent)} ريال  ← ثابت
- الرواتب:                  ${fmtN(latest.salaries)} ريال  ← ثابت
- التسويق والإعلان:         ${fmtN(latest.marketing)} ريال  ← ثابت
- الكهرباء والمياه:         ${fmtN(latest.utilities)} ريال  ← ثابت
- مصاريف أخرى:              ${fmtN(latest.other)} ريال  ← ثابت
- إجمالي المصاريف:          ${fmtN(latest.totalExpenses)} ريال  ← ثابت
- صافي الربح:               ${fmtN(latest.profit)} ريال

══ قواعد تعديل المصاريف — إلزامية صارمة ══
❌ يُمنع منعاً باتاً: تقدير أي بند أو إعادة توزيع المصاريف أو اختراع أرقام غير موجودة في البيانات.
✅ القاعدة الذهبية للتعديل: عند تغيير بند واحد (مثل ${_terms.cogsShort}):
   - البند المُعدَّل: يأخذ القيمة الجديدة كما ذكرها المستخدم
   - كل البنود الأخرى: تبقى بأرقامها الأصلية من الجدول أعلاه بدون أي تغيير
   - إجمالي المصاريف الجديد = البند الجديد + (إجمالي المصاريف الأصلي − البند القديم)
   - صافي الربح الجديد = الإيرادات − إجمالي المصاريف الجديد
✅ مثال صحيح: إذا طُلب تغيير ${_terms.cogsShort} من ${fmtN(latest.cogs)} إلى X:
   - إجمالي المصاريف الجديد = X + (${fmtN(latest.totalExpenses)} − ${fmtN(latest.cogs)})
   - المصاريف الأخرى = ${fmtN(latest.totalExpenses)} − ${fmtN(latest.cogs)} = ${fmtN((latest.totalExpenses||0)-(latest.cogs||0))} ريال (لا تتغير أبداً)

${latest.delTotal ? `══ تطبيقات التوصيل ══
- إجمالي مبيعات التطبيقات: ${fmtN(latest.delTotal)} ريال
- صافي المبلغ المستلم: ${fmtN(latest.delNet)} ريال
- عمولة التطبيقات: ${fmtN(latest.delCommission)} ريال (${latest.delCommPct}% من مبيعات التطبيقات)
- عدد الطلبات: ${latest.delOrders || '—'} | متوسط قيمة الطلب: ${fmtN(latest.delAvgOrder)} ريال
` : ''}══ نقطة التعادل — قيمة جاهزة من التقرير (لا تُعاد حسابها) ══
- التكاليف الثابتة:         ${fmtN(latest.fixedCosts)} ريال
- نسبة هامش المساهمة:       ${latest.contribRatio ?? '—'}%
- نقطة التعادل بالإيرادات:  ${fmtN(latest.breakEven)} ريال  ← استخدم هذا الرقم مباشرة

⚠️ قواعد نقطة التعادل — إلزامية صارمة:
القيمة المرجعية الثابتة: ${fmtN(latest.breakEven)} ريال — هذا الرقم لا يتغير إلا بشرط واحد فقط.

❌ يُمنع إعادة الحساب في هذه الحالات:
   - لم يطلب المستخدم ذلك صراحة
   - تعديل الأسعار فقط (الأسعار تؤثر على الإيرادات والربح فقط، لا على نقطة التعادل)
   - تعديل تكلفة البضاعة وحدها (COGS متغير وليس تكلفة ثابتة)
   - أي سيناريو لم يتغير فيه مجموع التكاليف الثابتة: ${fmtN(latest.fixedCosts)} ريال

✅ يُسمح بإعادة الحساب فقط إذا:
   - طلب المستخدم ذلك صراحة ("احسب نقطة التعادل الجديدة")
   - وتغيّر أحد التكاليف الثابتة فعلاً (إيجار / رواتب / تسويق / كهرباء / أخرى)

✅ عند السؤال عن "الحد الأدنى للإيرادات" أو "نقطة التعادل": الجواب هو ${fmtN(latest.breakEven)} ريال مباشرة.
✅ الفرق عن الإيرادات الحالية: ${fmtN(latest.revenue)} − ${fmtN(latest.breakEven)} = ${fmtN((latest.revenue||0)-(latest.breakEven||0))} ريال (${(latest.revenue||0) >= (latest.breakEven||0) ? 'فوق نقطة التعادل ✅' : 'تحت نقطة التعادل ⚠️'})

✅ عند تعديل الأسعار في سيناريو: عدّل الإيرادات والربح فقط — نقطة التعادل تبقى ${fmtN(latest.breakEven)} ريال بدون تغيير.

══ تحويل نقطة التعادل لعدد طلبات أو وحدات ══
الحالة 1 — عدد الطلبات للمشروع كاملاً:
  عدد الطلبات الشهرية = ${fmtN(latest.breakEven)} ريال ÷ متوسط قيمة الطلب (AOV)
  عدد الطلبات اليومية = النتيجة ÷ 30
  ❌ لا تستخدم سعر منتج واحد بديلاً عن AOV للمشروع كله.
  ✅ إذا ذكر المستخدم AOV استخدمه مباشرة. إذا لم يُذكر، اسأل: "ما متوسط قيمة الطلب الواحد؟"

الحالة 2 — عدد وحدات من منتج محدد:
  نقطة التعادل (وحدات) = ${fmtN(latest.fixedCosts)} ريال ÷ (سعر البيع − التكلفة الكاملة للوحدة)
  ✅ استخدم سعر وتكلفة المنتج من قسم "بيانات المنتجات الحالية" فقط.
  ❌ لا تستخدم التكاليف الكاملة للمشروع مقسومة على سعر منتج منفرد.

القاعدة الذهبية:
  سعر منتج واحد ≠ AOV للمشروع. عدد الطلبات يُحسب من AOV دائماً.

- مؤشر الصحة: ${latest.score ?? '—'}/100
- التنبيهات: ${latest.alerts?.join(' | ') || 'لا توجد'}

${(() => {
  const margin = parseFloat(latest.margin ?? 0);
  const score  = parseFloat(latest.score  ?? 0);
  const isHealthy = margin >= 15 && score >= 70;
  if (isHealthy) {
    return `══ مرحلة المشروع الحالية: جاهز للنمو ══
✅ الهامش (${margin}%) ≥ 15% ومؤشر الصحة (${score}/100) ≥ 70 — المشروع مستقر.
✅ يُسمح بتوصيات التوسع والنمو.
ترتيب الأولويات: (1) تعزيز النمو (2) تحسين الكفاءة (3) خفض التكاليف`;
  } else {
    const reasons = [];
    if (margin < 15) reasons.push(`الهامش ${margin}% أقل من الحد الأدنى الصحي 15%`);
    if (score  < 70) reasons.push(`مؤشر الصحة ${score}/100 أقل من 70`);
    return `══ مرحلة المشروع الحالية: يحتاج تحسين قبل التوسع ══
⚠️ السبب: ${reasons.join(' | ')}
❌ يُمنع منعاً باتاً: التوصية بالتوسع أو النمو أو زيادة المصاريف أو فتح فروع.
✅ التوصية الإلزامية: "تحسين الربحية أولاً قبل التوسع"
ترتيب الأولويات الإلزامي:
  (1) تحسين الهامش — خفض التكاليف المتغيرة أو رفع الأسعار
  (2) تقليل التكاليف الثابتة — مراجعة الإيجار والرواتب والمصاريف
  (3) بعد تحقيق هامش ≥ 15% ومؤشر ≥ 70 فقط → يُسمح بالتوسع`;
  }
})()}
${prodsSection}

══ التقارير السابقة — أرقام فعلية من قاعدة البيانات ══
[تعليمات الاستخدام: استخدم الأرقام التالية فقط ولا تستخدم أمثلة افتراضية. إذا كانت قيمة "—" فهي غير متوفرة ولا تستبدلها بأرقام.]
${prevText}
${trendText}
══ هيكل الرد — إلزامي وثابت لكل رسالة ══

أنت مدير مالي تنفيذي (CFO) — ردك يجب أن يكون تشخيصاً وأوامر، لا تقريراً.
التزم بهذا الهيكل بالضبط في كل رد:

## التشخيص
جملة واحدة تلخّص المشكلة أو الفرصة الجوهرية.
مثال: "هامشك يتآكل بسبب عمولة التطبيقات وليس بسبب ارتفاع التكاليف الثابتة"

## السبب الحقيقي
ربط مباشر بين الأرقام بصيغة: رقم → سبب → نتيجة.
مثال: "عمولة **25%** على مبيعات التطبيقات (**${fmtN(latest.delTotal || 0)} ريال**) تستنزف **${fmtN(latest.delCommission || 0)} ريال** شهرياً مباشرةً من الربح"

## أخطر 3 مشاكل
1. [مشكلة] — [رقم من البيانات] — [تأثيره على الربح أو الهامش]
2. [مشكلة] — [رقم من البيانات] — [تأثيره على الربح أو الهامش]
3. [مشكلة] — [رقم من البيانات] — [تأثيره على الربح أو الهامش]
(استخدم أرقاماً من البيانات فقط — لا تخترع أرقاماً)

## قرارات مباشرة (الأهم أولاً)
- [افعل / أوقف / ارفع / خفّض] + [ماذا] + [بكم] + [خلال كم يوم]
- [افعل / أوقف / ارفع / خفّض] + [ماذا] + [بكم] + [خلال كم يوم]
كل سطر = أمر تنفيذي قابل للتطبيق الفوري.

## الأثر المتوقع
- إذا نُفِّذت القرارات أعلاه: الربح يرتفع تقريباً من [رقم حالي] إلى [رقم متوقع] = فرق **+X ريال/شهر**
(استخدم تقديراً واقعياً من البيانات المتاحة — وضّح أنه تقدير إذا لم تكن الأرقام دقيقة)

══ قواعد الجودة — لا استثناء ══
❌ يُمنع: إعادة عرض أي رقم من التقرير بدون تفسير سببه وأثره — المستخدم يراها بالفعل.
❌ يُمنع: أي جملة لا تحتوي على قرار أو تحليل (رقم → سبب → نتيجة).
❌ يُمنع: العبارات العامة الفارغة مثل "وضعك جيد" / "هناك فرص" / "استمر" / "أحسنت".
❌ يُمنع: مقدمات ترحيبية أو خاتمات تشجيعية.
❌ يُمنع: أي قسم منقوص أو جملة غير مكتملة — أكمل كل قسم قبل الانتقال للتالي.
❌ يُمنع: نسبة مئوية بدون تحديد مصدرها الصريح — يجب دائماً: (X% من الإيرادات) أو (X% من مبيعات التطبيقات) أو (X% من إجمالي المصاريف).
✅ يجب: كل استنتاج بصيغة (رقم → سبب → نتيجة) حتى لو في جملة واحدة.
✅ يجب: الأقسام الخمسة كلها موجودة وكاملة في كل رد.
✅ يجب: استخدام الأرقام من البيانات أعلاه حصراً — لا أرقام افتراضية.
${hasPreviousReports
  ? `✅ يجب: عند السؤال عن اتجاه → استخدم التقارير السابقة للمقارنة.`
  : `✅ لا توجد تقارير سابقة — لا تذكر أي مقارنة تاريخية.`}
✅ إذا سأل عن موضوع غير مالي: "اختصاصي في الاستشارات المالية فقط".
✅ تحدث بالعربية دائماً. استخدم **bold** للأرقام والقرارات المهمة.

══ قواعد تنسيق الحسابات — إلزامية ══
❌ يُمنع منعاً باتاً استخدام أي رموز LaTeX أو تنسيق رياضي مشفر مثل: \\frac \\text \\div \\times $ \\ أو أي رموز مشابهة.
✅ اكتب الحسابات كنص عربي صريح:   مثال: 50,000 − 35,000 = 15,000 ريال ربح
✅ رموز العمليات المسموحة فقط: ÷ × − + =`;
}

// ══════════════════════════════════════════════════════════════
// استيراد المنتجات من حاسبة تكاليف المنتج إلى نموذج التحليل
// ══════════════════════════════════════════════════════════════

/**
 * يحسب التكلفة الحقيقية من بيانات المنتج المحفوظة في حاسبة التكاليف
 * (بديل للتكلفة المحسوبة مباشرة من الـ DOM عند الحفظ)
 */
function _calcTrueCostFromPC(p) {
  // إذا خُزّنت التكلفة الحقيقية مسبقاً عند الحفظ → استخدمها مباشرة
  if (p.trueCost && p.trueCost > 0) return p.trueCost;

  // احسب تكلفة المكونات (تكلفة البضاعة)
  const ingCost = (p.ingredients || []).reduce((s, ing) => {
    return s + ((parseFloat(ing.qty) || 0) * (parseFloat(ing.unitCost) || 0));
  }, 0);

  // إجمالي التكاليف التشغيلية
  const opTotal = Object.values(p.opCosts || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  // التكلفة التشغيلية لكل وحدة (بناءً على حصة المنتج من الإيرادات الكلية)
  const totalProjectSales = p.projectTotalSales || 0;
  const monthlySales      = p.monthlySales || 0;
  let opPerUnit = 0;
  if (totalProjectSales > 0 && monthlySales > 0 && p.salePrice > 0) {
    const productRevShare = (p.salePrice * monthlySales) / totalProjectSales;
    opPerUnit = (opTotal * productRevShare) / monthlySales;
  } else if (monthlySales > 0 && opTotal > 0) {
    opPerUnit = opTotal / monthlySales;
  }

  return Math.round((ingCost + opPerUnit) * 100) / 100;
}

/**
 * يستورد المنتجات المحفوظة في حاسبة التكاليف إلى جدول المنتجات في نموذج التحليل
 */
function importFromProductCostCalc() {
  // اقرأ المنتجات من PC_STATE أو من localStorage مباشرة
  const pcProducts = (window.PC_STATE?.products?.length)
    ? window.PC_STATE.products
    : JSON.parse(localStorage.getItem(typeof projectProductCostsKey === 'function' ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default') : 'tw_product_costs') || '[]');

  if (!pcProducts.length) {
    if (typeof toast === 'function') toast('لا توجد منتجات محفوظة في حاسبة التكاليف');
    return;
  }

  // حوّل بيانات حاسبة التكاليف إلى الصيغة المطلوبة في نموذج التحليل
  const mapped = pcProducts
    .filter(p => p.name)
    .map(p => ({
      name:  p.name,
      price: p.salePrice || 0,
      cost:  _calcTrueCostFromPC(p),
      qty:   p.monthlySales || 0,
    }));

  if (!mapped.length) {
    if (typeof toast === 'function') toast('لا توجد منتجات صالحة للاستيراد');
    return;
  }

  // املأ جدول المنتجات في النموذج
  if (typeof showProductTable === 'function') showProductTable(mapped);
  if (typeof toast === 'function') toast(`✅ تم استيراد ${mapped.length} منتج من حاسبة التكاليف`);
}

/**
 * يُظهر / يُخفي أزرار الاستيراد بناءً على المنتجات المتاحة
 */
function _updateImportBtn() {
  // ── زر حاسبة التكاليف ──
  const btn = document.getElementById('btn-import-from-pc');
  if (btn) {
    const pcProducts = (window.PC_STATE?.products?.length)
      ? window.PC_STATE.products
      : JSON.parse(localStorage.getItem(typeof projectProductCostsKey === 'function' ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default') : 'tw_product_costs') || '[]');
    btn.style.display = pcProducts.length ? '' : 'none';
    if (pcProducts.length) {
      btn.textContent = `📥 استيراد من حاسبة التكاليف (${pcProducts.length})`;
    }
  }

  // ── زر المنتجات المحفوظة (_PRODUCTS من المنيو / قاعدة البيانات) ──
  const dbBtn = document.getElementById('btn-import-from-db');
  if (dbBtn) {
    const dbProds = window._PRODUCTS || [];
    dbBtn.style.display = dbProds.length ? '' : 'none';
    if (dbProds.length) {
      dbBtn.textContent = `🍽 إعادة تحميل المنتجات (${dbProds.length})`;
    }
  }
}

/**
 * يستورد المنتجات من _PRODUCTS (قاعدة البيانات / المنيو) إلى prodsContainer
 */
function importFromDBProducts() {
  // ─── دمج المصدرين: جدول products (_PRODUCTS) + BP_PRODUCTS (القديم / الكاش) ─
  const dbProds = window._PRODUCTS   || [];
  const bpProds = window.BP_PRODUCTS || [];

  if (!dbProds.length && !bpProds.length) {
    if (typeof toast === 'function') toast('لا توجد منتجات محفوظة — ارفع المنيو أولاً');
    return;
  }

  // بناء map موحّد بالاسم (case-insensitive) يأخذ أفضل سعر من أي مصدر
  const mergedMap = new Map();
  // 1. أضف من _PRODUCTS أولاً (المصدر الرئيسي)
  dbProds.forEach(p => {
    const key = (p.name || '').toLowerCase().trim();
    if (!key) return;
    mergedMap.set(key, {
      name:  p.name,
      price: p.selling_price || p.price || 0,
      cost:  p.cost || 0,
    });
  });
  // 2. أضف/حسّن من BP_PRODUCTS (الكاش القديم أو منتجات لم تُحفظ في الجدول)
  bpProds.forEach(p => {
    const key = (p.name || '').toLowerCase().trim();
    if (!key) return;
    const ex = mergedMap.get(key);
    if (!ex) {
      // منتج موجود في BP فقط — أضفه
      mergedMap.set(key, { name: p.name, price: p.price || p.selling_price || 0, cost: p.cost || 0 });
    } else if (ex.price === 0 && (p.price || p.selling_price || 0) > 0) {
      // جدول DB لديه سعر 0 لكن BP لديه سعر — استخدم سعر BP
      mergedMap.set(key, { ...ex, price: p.price || p.selling_price });
    }
  });

  // ─── جلب بيانات المبيعات الشهرية من حاسبة التكاليف (إن توفّرت) ────────
  const pcProds = window.PC_STATE?.products?.length
    ? window.PC_STATE.products
    : (() => {
        try {
          const key = typeof projectProductCostsKey === 'function'
            ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default')
            : 'tw_product_costs';
          return JSON.parse(localStorage.getItem(key) || '[]');
        } catch { return []; }
      })();

  const findPCQty = name => {
    const match = pcProds.find(p => p.name && p.name.toLowerCase() === (name||'').toLowerCase());
    return match?.monthlySales || 0;
  };

  // ─── ترجمة المنتجات — تجاهل فقط التي بلا سعر في كلا المصدرين ───────────
  const mapped = [];
  let zeroPrice = 0;
  mergedMap.forEach(p => {
    if (!p.price) { zeroPrice++; return; }
    mapped.push({ name: p.name, price: p.price, cost: p.cost, qty: findPCQty(p.name) });
  });

  if (!mapped.length) {
    if (typeof toast === 'function') toast('⚠️ جميع المنتجات تفتقر لسعر البيع — أضف الأسعار في صفحة المشروع');
    return;
  }

  if (typeof showProductTable === 'function') showProductTable(mapped);

  const msg = zeroPrice > 0
    ? `✅ تم تحميل ${mapped.length} منتج — تم تجاهل ${zeroPrice} منتج بلا سعر`
    : `✅ تم تحميل ${mapped.length} منتج من المنتجات المحفوظة`;
  if (typeof toast === 'function') toast(msg);
}

window._updateImportBtn = _updateImportBtn;
window.importFromDBProducts = importFromDBProducts;

// expose to window
window.runAnalysis = runAnalysis;
window.handleExcel = handleExcel;
window.exportPDF = exportPDF;
window.importFromProductCostCalc = importFromProductCostCalc;
// window.renderResults → في services/results.js
// window.updateDashboard  → في services/dashboard.js (دالة عامة، لا تكرار)
// window.renderSavedReports → في services/dashboard.js (دالة عامة، لا تكرار)
window.openSavedReport = openSavedReport;
window.deleteSavedReport = deleteSavedReport;
window.getCFOContext = getCFOContext;
window.buildCFOSystemPrompt = buildCFOSystemPrompt;
