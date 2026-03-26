// services/results.js — عرض نتائج التحليل
// ✅ المرحلة 3-A: استخراج renderResults + renderAIBlocks من financial.js
// ============================================================

function renderResultsPreview(report) {
  const {bizName, bizType, period, metrics, scoreData} = report;
  const createdAt = report.createdAt || report.date || null;
  const {revenue, netProfit, netMargin} = metrics;

  document.getElementById('resultTitle').textContent = `تقرير ${bizName}`;
  const dateStr = report.reportPeriod || (createdAt && !isNaN(new Date(createdAt)) ? new Date(createdAt).toLocaleDateString('ar-SA') : '—');
  document.getElementById('resultMeta').textContent = `${bizType} — تحليل ${period} — ${dateStr}`;

  // ── KPIs: عرض البطاقات الحقيقية + backdrop-filter overlay يبهمها ────
  const kpiContainer = document.getElementById('resultKpis');
  kpiContainer.innerHTML = '';
  kpiContainer.style.cssText += ';position:relative;overflow:hidden;';

  const scoreCls  = scoreData.total >= 65 ? 'pos' : scoreData.total >= 40 ? 'warn' : 'neg';
  const marginCls = netMargin > 15 ? 'pos' : netMargin < 5 ? 'neg' : 'warn';

  // بطاقتان حقيقيتان تُرسمان تحت الطبقة
  const kpiScoreCard = document.createElement('div');
  kpiScoreCard.className = 'kpi';
  kpiScoreCard.innerHTML = `<div class="kpi-val ${scoreCls}">${scoreData.total}/100</div><div class="kpi-label">مؤشر الصحة</div>`;
  const kpiMarginCard = document.createElement('div');
  kpiMarginCard.className = 'kpi';
  kpiMarginCard.innerHTML = `<div class="kpi-val ${marginCls}">${netMargin.toFixed(1)}%</div><div class="kpi-label">هامش الربح</div>`;
  kpiContainer.appendChild(kpiScoreCard);
  kpiContainer.appendChild(kpiMarginCard);

  // overlay بـ backdrop-filter يبهم كل ما خلفه
  const kpiLock = document.createElement('div');
  kpiLock.style.cssText = 'position:absolute;inset:0;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(13,13,20,0.4);display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;border-radius:inherit;';
  kpiLock.innerHTML = `<span style="font-size:20px;">🔒</span><span style="font-size:14px;color:#c9a84c;font-weight:600;">اضغط لرؤية النتائج</span>`;
  kpiLock.onclick = () => showUpgradeModal('التقرير الكامل', 'paid');
  kpiContainer.appendChild(kpiLock);

  // ── حلقة مؤشر الصحة: تُرسم حقيقية + backdrop-filter overlay فوقها ─
  renderScore('resScoreRing','resScoreVal','resScoreLabel','resScoreBreakdown', scoreData.total);
  const bdEl = document.getElementById('resScoreBreakdown');
  bdEl.innerHTML = '';
  const bdWrap = document.createElement('div');
  bdWrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:16px;';
  (scoreData.breakdown || []).forEach(b => {
    const pwrap = document.createElement('div'); pwrap.className = 'progress-wrap';
    const phead = document.createElement('div'); phead.className = 'progress-head';
    const lblSpan = document.createElement('span');
    lblSpan.style.cssText = 'font-size:12px;color:var(--gray2);';
    lblSpan.textContent = b.label;
    const valSpan = document.createElement('span');
    valSpan.style.cssText = 'font-size:12px;color:var(--gold);';
    valSpan.textContent = `${b.val}/${b.max}`;
    phead.appendChild(lblSpan); phead.appendChild(valSpan);
    const ptrack = document.createElement('div'); ptrack.className = 'progress-track';
    const pfill = document.createElement('div'); pfill.className = 'progress-fill';
    pfill.style.cssText = `width:${(b.val / b.max) * 100}%;background:${b.color};`;
    ptrack.appendChild(pfill);
    pwrap.appendChild(phead); pwrap.appendChild(ptrack);
    bdWrap.appendChild(pwrap);
  });
  bdEl.appendChild(bdWrap);

  // overlay فوق كارد الحلقة (يبهم المحتوى — يبدأ بعد عنوان الكارد)
  const scoreCardEl = document.getElementById('resScoreVal')?.closest('.card');
  if (scoreCardEl) {
    scoreCardEl.style.position = 'relative';
    scoreCardEl.style.overflow = 'hidden';
    const scoreLockEl = document.createElement('div');
    scoreLockEl.style.cssText = 'position:absolute;inset:0;top:48px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:rgba(13,13,20,0.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;';
    scoreLockEl.innerHTML = `
      <span style="font-size:36px;">🔒</span>
      <span style="font-size:15px;color:#c9a84c;font-weight:700;">فتح التحليل الكامل</span>
      <span style="font-size:12px;color:#888;">اشترك للوصول الكامل</span>`;
    scoreLockEl.onclick = () => showUpgradeModal('التقرير الكامل', 'paid');
    scoreCardEl.appendChild(scoreLockEl);
  }

  // ── رسالة ديناميكية تحت حلقة المؤشر ────────────────────────────────
  const _scoreHint = (() => {
    const s = scoreData.total;
    if (s >= 65) return {
      icon: '👀',
      headline: 'وضعك يبدو جيداً…',
      sub: 'لكن هناك فرص تحسين مخفية لم تراها بعد',
    };
    if (s >= 40) return {
      icon: '⚠️',
      headline: 'أداء متوسط',
      sub: 'التقرير يكشف أين تتسرب أرباحك بالضبط',
    };
    return {
      icon: '🚨',
      headline: 'مشروعك يخسر بدون ما تدري',
      sub: 'التقرير يحدد المشكلة الجذرية قبل فوات الأوان',
    };
  })();

  // الرسالة الديناميكية ستظهر ضمن الـ CTA أسفل الصفحة (bdEl مبهم ولا نضيف له شيء)

  // ── CTA block — فضول + نقص معلومات ────────────────────────────────
  const _cta = (() => {
    const s = scoreData.total;
    const nm = netMargin;
    if (nm < 5 || s < 40) return {
      emoji: '🚨',
      title: 'مشروعك في خطر',
      body: 'الأرقام تشير لمشكلة حقيقية — التقرير يحدد المشكلة الجذرية ويعطيك خطة واضحة للخروج منها.',
    };
    if (s >= 65 && nm >= 15) return {
      emoji: '🔍',
      title: 'وضعك جيد… لكن هل تعرف كم تخسر من فرص التحسين؟',
      body: 'المشاريع "الجيدة" غالباً تخسر 20-30% من أرباحها الممكنة بدون ما تعرف. التقرير يكشف أين بالضبط.',
    };
    return {
      emoji: '🔒',
      title: 'في أرقام مهمة مخفية',
      body: 'المؤشر وحده لا يكفي — التقرير الكامل يريك تفاصيل المصاريف، نقطة التعادل، وأين يمكن رفع الربح.',
    };
  })();

  const ctaHTML = `
    <div style="margin:28px 0;padding:28px 20px;border-radius:16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03));border:1px solid rgba(201,168,76,0.2);text-align:center;">
      <div style="font-size:28px;margin-bottom:10px;">${_scoreHint.icon}</div>
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">${_scoreHint.headline}</div>
      <p style="font-size:13px;color:#888;margin:0 0 4px;line-height:1.7;">${_scoreHint.sub}</p>
      <p style="font-size:13px;color:#888;margin:0 0 6px;line-height:1.7;">${_cta.body}</p>
      <p style="font-size:12px;color:rgba(201,168,76,0.55);margin:0 0 20px;font-style:italic;">التفاصيل الكاملة متاحة بالاشتراك أو خلال فترة التجربة</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button onclick="showUpgradeModal('الاشتراك المدفوع','paid')"
          style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
          اشترك — 79 ر.س/شهر
        </button>
      </div>
    </div>`;

  // Locked sections placeholder
  const lockedHTML = `
    <div style="position:relative;border-radius:14px;overflow:hidden;margin-bottom:20px;">
      <div style="filter:blur(4px);pointer-events:none;opacity:0.45;padding:20px;border:1px solid rgba(255,255,255,0.06);border-radius:14px;background:rgba(255,255,255,0.02);">
        <div style="height:14px;background:rgba(255,255,255,0.1);border-radius:6px;margin-bottom:10px;width:60%;"></div>
        <div style="height:10px;background:rgba(255,255,255,0.07);border-radius:6px;margin-bottom:8px;width:80%;"></div>
        <div style="height:10px;background:rgba(255,255,255,0.07);border-radius:6px;width:50%;"></div>
      </div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:20px;">🔒</span>
      </div>
    </div>`;

  // Render CTA + locked placeholders into the sections that would normally appear
  const alertsEl = document.getElementById('resultAlerts');
  if (alertsEl) alertsEl.innerHTML = ctaHTML;

  const expEl = document.getElementById('resultExpenses');
  if (expEl) expEl.innerHTML = lockedHTML;

  const beEl = document.getElementById('resultBreakeven');
  if (beEl) beEl.innerHTML = lockedHTML;

  const prodEl = document.getElementById('resultProducts');
  if (prodEl) prodEl.innerHTML = lockedHTML;

  const aiEl = document.getElementById('aiBlocks');
  if (aiEl) aiEl.innerHTML = lockedHTML;

  const scenEl = document.getElementById('scenariosContainer');
  if (scenEl) scenEl.innerHTML = lockedHTML;

  const benchEl = document.getElementById('benchmarkContainer');
  if (benchEl) benchEl.innerHTML = lockedHTML;
}

function renderResults(report) {
  // ── ACCESS DECISION LOG ────────────────────────────────────────────────
  const _rrUser   = window.getAccessUser ? window.getAccessUser() : { plan: window.__USER_PLAN__ || 'free', isTrialActive: false };
  const _rrAccess = window.canAccessFeature ? window.canAccessFeature(_rrUser, 'full_report') : false;
  console.log('[Tawakkad][renderResults] plan=%s | trialActive=%s | access=%s',
    _rrUser.plan, _rrUser.isTrialActive, _rrAccess);
  // ─────────────────────────────────────────────────────────────────────

  if (!_rrAccess) {
    console.log('[Tawakkad][renderResults] → locked → renderResultsPreview');
    renderResultsPreview(report);
    return;
  }
  console.log('[Tawakkad][renderResults] → full report rendering');
  const {bizName, bizType, period, metrics, scoreData, alerts, scenarios, reportText, products, sectorKey} = report;
  const createdAt = report.createdAt || report.date || null;
  const resolvedSectorKey = sectorKey || getSectorKey(bizType);
  const {revenue, netProfit, netMargin, grossMargin, totalExpenses, rentPct, salPct, cogsPct, mktPct,
         cogs, rent, salaries, marketing, other, utilities,
         delTotal, delCommission, hasDelivery} = metrics;

  document.getElementById('resultTitle').textContent = `تقرير ${bizName}`;
  const dateStr = report.reportPeriod || (createdAt && !isNaN(new Date(createdAt)) ? new Date(createdAt).toLocaleDateString('ar-SA') : '—');
  document.getElementById('resultMeta').textContent = `${bizType} — تحليل ${period} — ${dateStr}`;

  // resultKpis — built with DOM so Arabic labels never pass through innerHTML
  const kpiContainer = document.getElementById('resultKpis');
  kpiContainer.innerHTML = '';
  [
    {val: fmt(revenue) + ' ﷼',                               label: 'الإيرادات',   cls: 'neu'},
    {val: (netProfit >= 0 ? '+' : '') + fmt(netProfit) + ' ﷼', label: 'صافي الربح', cls: netProfit >= 0 ? 'pos' : 'neg'},
    {val: netMargin + '%',                                    label: 'هامش الربح',  cls: netMargin > 15 ? 'pos' : netMargin < 5 ? 'neg' : 'warn'},
    {val: scoreData.total + '/100',                           label: 'مؤشر الصحة', cls: scoreData.total >= 65 ? 'pos' : scoreData.total >= 40 ? 'warn' : 'neg'},
  ].forEach(k => {
    const card   = document.createElement('div');
    card.className = 'kpi';
    const valEl  = document.createElement('div');
    valEl.className = `kpi-val ${k.cls}`;
    valEl.textContent = k.val;               // ← textContent (was innerHTML)
    const lblEl  = document.createElement('div');
    lblEl.className = 'kpi-label';
    lblEl.textContent = k.label;             // ← textContent (was innerHTML)
    card.appendChild(valEl);
    card.appendChild(lblEl);
    kpiContainer.appendChild(card);
  });

  renderScore('resScoreRing','resScoreVal','resScoreLabel','resScoreBreakdown', scoreData.total);
  // resScoreBreakdown — DOM only so b.label never passes through innerHTML
  const bdEl = document.getElementById('resScoreBreakdown');
  bdEl.innerHTML = '';
  const bdWrap = document.createElement('div');
  bdWrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:16px;';
  (scoreData.breakdown || []).forEach(b => {
    const pwrap = document.createElement('div');
    pwrap.className = 'progress-wrap';

    const phead = document.createElement('div');
    phead.className = 'progress-head';

    const lblSpan = document.createElement('span');
    lblSpan.style.cssText = 'font-size:12px;color:var(--gray2);';
    lblSpan.textContent = b.label;          // ← textContent (was innerHTML)

    const valSpan = document.createElement('span');
    valSpan.style.cssText = 'font-size:12px;color:var(--gold);';
    valSpan.textContent = `${b.val}/${b.max}`;

    phead.appendChild(lblSpan);
    phead.appendChild(valSpan);

    const ptrack = document.createElement('div');
    ptrack.className = 'progress-track';
    const pfill  = document.createElement('div');
    pfill.className = 'progress-fill';
    pfill.style.cssText = `width:${(b.val / b.max) * 100}%;background:${b.color};`;
    ptrack.appendChild(pfill);

    pwrap.appendChild(phead);
    pwrap.appendChild(ptrack);
    bdWrap.appendChild(pwrap);
  });
  bdEl.appendChild(bdWrap);

  const benchEl = document.getElementById('benchmarkContainer');
  if (benchEl) {
    const _benchAccess = window.canAccessFeature
      ? window.canAccessFeature(window.getAccessUser(), 'market_compare')
      : planAllows('market_compare');
    console.log('[Tawakkad][marketCompare] access=%s', _benchAccess);
    if (!_benchAccess) {
      benchEl.innerHTML = `
        <div style="text-align:center;padding:32px 20px;border:1px dashed rgba(201,168,76,0.25);border-radius:14px;background:rgba(201,168,76,0.04);">
          <div style="font-size:32px;margin-bottom:10px;">📈</div>
          <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:6px;">مقارنة بمعايير السوق</div>
          <p style="font-size:13px;color:#888;margin:0 0 16px;">متاحة بالاشتراك أو خلال فترة التجربة</p>
          <button onclick="showUpgradeModal('مقارنة السوق','paid')"
            style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
            اشترك للوصول ←
          </button>
        </div>`;
    } else {
      const bench = BENCHMARKS[resolvedSectorKey];
      const bMetrics = { netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
      renderBenchmarkItems(bMetrics, bench, 'benchmarkContainer');
    }
  }
  renderAlerts(alerts, 'resultAlerts');
  renderExpenseTable(metrics, 'resultExpenses');

  const fixedCosts = (metrics.rent||0)+(metrics.salaries||0)+(metrics.marketing||0)+(metrics.other||0)+(metrics.utilities||0);
  const beNetProfit = metrics.netProfit !== undefined ? metrics.netProfit : (revenue - (cogs||0) - fixedCosts);
  renderBreakeven(revenue, cogs, fixedCosts, 'resultBreakeven', beNetProfit);

  const prodContainer = document.getElementById('resultProducts');
  prodContainer.innerHTML = '';
  if (products.length) {
    const withMargins = products.map(p => {
      const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0;
      const profit = (p.price - p.cost) * p.qty;
      return {...p, margin, profit};
    }).sort((a, b) => b.margin - a.margin);
    const totalProd = withMargins.reduce((s, p) => s + Math.max(0, p.profit), 0);

    withMargins.forEach((p, i) => {
      const contrib     = totalProd > 0 ? ((p.profit / totalProd) * 100).toFixed(0) : 0;
      const suggestion  = p.margin < 15
        ? `رفع السعر 5% يرفع الربح ${fmt(p.qty * p.cost * 0.05)} ${SAR}`
        : p.margin > 50 ? 'منتج رابح — ركّز عليه' : 'أداء طبيعي';
      const mColor = p.margin > 30 ? 'var(--green)' : p.margin < 10 ? 'var(--red)' : 'var(--warn)';

      const row = document.createElement('div');
      row.className = 'prod-analysis-row';

      // Rank badge
      const rankEl = document.createElement('div');
      rankEl.className = `prod-rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : 'rank-3'}`;
      rankEl.textContent = i + 1;

      // Info column — p.name is user input; use textContent to avoid innerHTML injection
      const infoEl = document.createElement('div');
      infoEl.style.flex = '1';

      const nameEl = document.createElement('div');
      nameEl.className = 'prod-an-name';
      nameEl.textContent = p.name;                     // ← textContent (was innerHTML)

      const suggEl = document.createElement('div');
      suggEl.style.cssText = 'font-size:11px;color:var(--gray);margin-top:2px;';
      suggEl.innerHTML = suggestion;                   // ← innerHTML (suggestion contains SAR SVG)

      const barWrap = document.createElement('div');
      barWrap.className = 'prod-an-bar';
      barWrap.style.marginTop = '6px';
      const barFill = document.createElement('div');
      barFill.className = 'prod-an-fill';
      barFill.style.cssText = `width:${Math.min(100, p.margin)}%;background:${mColor};`;
      barWrap.appendChild(barFill);

      infoEl.appendChild(nameEl);
      infoEl.appendChild(suggEl);
      infoEl.appendChild(barWrap);

      // Margin column
      const marginCol = document.createElement('div');
      marginCol.style.cssText = 'text-align:center;margin-right:12px;';
      const marginVal = document.createElement('div');
      marginVal.style.cssText = `font-size:16px;font-weight:700;color:${mColor};`;
      marginVal.textContent = p.margin.toFixed(0) + '%';
      const marginLbl = document.createElement('div');
      marginLbl.style.cssText = 'font-size:10px;color:var(--gray);';
      marginLbl.textContent = 'هامش';
      marginCol.appendChild(marginVal);
      marginCol.appendChild(marginLbl);

      // Contrib column
      const contribCol = document.createElement('div');
      contribCol.style.textAlign = 'center';
      const contribVal = document.createElement('div');
      contribVal.style.cssText = 'font-size:16px;font-weight:700;color:var(--gold);';
      contribVal.textContent = contrib + '%';
      const contribLbl = document.createElement('div');
      contribLbl.style.cssText = 'font-size:10px;color:var(--gray);';
      contribLbl.textContent = 'مساهمة';
      contribCol.appendChild(contribVal);
      contribCol.appendChild(contribLbl);

      row.appendChild(rankEl);
      row.appendChild(infoEl);
      row.appendChild(marginCol);
      row.appendChild(contribCol);
      prodContainer.appendChild(row);
    });
  } else {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--gray);font-size:13px;text-align:center;padding:20px;';
    empty.textContent = 'لم يتم إدخال منتجات';
    prodContainer.appendChild(empty);
  }

  renderAIBlocks(reportText, 'aiBlocks');
  renderScenarios(scenarios, revenue, 'scenariosContainer');

  // ── AI CFO shortcut button — injected after all rendering is complete ──
  console.log("CFO button injection running");
  const kpis = document.querySelector('#resultKpis');
  if (kpis && !document.getElementById('askCFOBtn')) {
    const btn = document.createElement('button');
    btn.id          = 'askCFOBtn';
    btn.className   = 'btn btn-primary';
    btn.textContent = 'خذ رأي الخبير المالي AI CFO';
    btn.style.display = 'block';
    btn.style.margin  = '24px auto';
    kpis.after(btn);
    btn.onclick = () => {
      const question = 'حلّل هذا التقرير وقدّم أهم 3 نقاط قوة، أهم 3 مخاطر، وأهم قرار مالي يجب اتخاذه الآن.';
      showPage('cfo');
      setTimeout(() => {
        if (window.sendCFO) window.sendCFO(question);
      }, 300);
    };
  }
}

function renderAIBlocks(text, containerId) {
  const _aiAccess = window.canAccessFeature
    ? window.canAccessFeature(window.getAccessUser(), 'full_report')
    : planAllows('full_report');
  console.log('[Tawakkad][renderAIBlocks] access=%s', _aiAccess);
  if (!_aiAccess) return;   // حراسة دفاعية — منع الاستدعاء المباشر
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';

  if (!text) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--gray);font-size:13px;text-align:center;padding:20px;';
    empty.textContent = 'التحليل الذكي غير متاح حالياً';
    wrap.appendChild(empty);
    return;
  }

  const sections = [...text.matchAll(/\[SECTION:(.*?)\]([\s\S]*?)\[\/SECTION\]/g)];
  const icons = {
    'التشخيص العام':'🩺','نقاط القوة':'✅','نقاط الخطر':'⚠️',
    'تحليل المنتجات':'📊','توصيات عملية':'🎯','توقع الأداء':'📈'
  };

  if (!sections.length) {
    // No sections — render AI-generated text safely via DOM nodes (no innerHTML)
    const div = document.createElement('div');
    div.style.cssText = 'font-size:14px;line-height:1.9;color:var(--gray2);';
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      div.appendChild(document.createTextNode(line));    // ← createTextNode
      if (idx < lines.length - 1) div.appendChild(document.createElement('br'));
    });
    wrap.appendChild(div);
    return;
  }

  // Build each section using DOM so AI-generated Arabic never touches innerHTML
  sections.forEach((s, i) => {
    const title   = s[1].trim();
    const content = s[2].trim();
    const lines   = content.split('\n').filter(l => l.trim());
    const isGood  = title === 'نقاط القوة';
    const isBad   = title === 'نقاط الخطر';
    const isWarn  = title === 'توصيات عملية';
    const isList  = isGood || isBad || isWarn;

    // Outer wrapper
    const section = document.createElement('div');
    section.style.cssText = `margin-bottom:20px;animation:fadeUp 0.4s ease ${i * 0.08}s forwards;opacity:0;`;

    // Section header
    const header = document.createElement('div');
    header.style.cssText = 'font-size:13px;font-weight:700;color:var(--gold);margin-bottom:12px;display:flex;align-items:center;gap:8px;';

    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'width:28px;height:28px;background:var(--gold-d);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;';
    iconSpan.textContent = icons[title] || '📌';      // emoji — safe, hardcoded

    header.appendChild(iconSpan);
    header.appendChild(document.createTextNode(title)); // ← createTextNode (was innerHTML)
    section.appendChild(header);

    if (isList) {
      // Build list items; each line is AI-generated Arabic — use textContent
      const listDiv = document.createElement('div');
      listDiv.className = 'insight-list';
      lines.forEach(l => {
        const li = document.createElement('li');
        li.className = `insight-item ${isGood ? 'g' : isBad ? 'r' : 'w'}`;

        const iconEl = document.createElement('span');
        iconEl.className = 'ii-icon';
        iconEl.textContent = isGood ? '✓' : isBad ? '!' : '→'; // hardcoded

        const textEl = document.createElement('span');
        textEl.textContent = l.replace(/^[-•\d.]\s*/, '');      // ← textContent (was innerHTML)

        li.appendChild(iconEl);
        li.appendChild(textEl);
        listDiv.appendChild(li);
      });
      section.appendChild(listDiv);
    } else {
      // Plain-text section — render via text nodes with <br> for line breaks
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'font-size:14px;line-height:1.9;color:var(--gray2);';
      lines.forEach((line, idx) => {
        contentDiv.appendChild(document.createTextNode(line));   // ← createTextNode
        if (idx < lines.length - 1) contentDiv.appendChild(document.createElement('br'));
      });
      section.appendChild(contentDiv);
    }

    wrap.appendChild(section);
  });
}

// ── جدول تحليل المصاريف ──────────────────────────────────────────────
function renderExpenseTable(metrics, containerId) {
  const _expAccess = window.canAccessFeature
    ? window.canAccessFeature(window.getAccessUser(), 'full_report')
    : planAllows('full_report');
  if (!_expAccess) return;   // حراسة دفاعية — منع الاستدعاء المباشر
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';

  const m = metrics || {};
  const revenue       = m.revenue       ?? 0;
  const cogs          = m.cogs          ?? 0;
  const rent          = m.rent          ?? 0;
  const salaries      = m.salaries      ?? 0;
  const marketing     = m.marketing     ?? 0;
  const utilities     = m.utilities     ?? 0;
  const other         = m.other         ?? 0;
  const delCommission = m.delCommission ?? 0;
  const totalExpenses = m.totalExpenses ?? (cogs + rent + salaries + marketing + utilities + other + delCommission);

  const rows = [
    { label: 'تكلفة البضاعة / الإنتاج', val: cogs,          icon: '🛒' },
    { label: 'الإيجار',                  val: rent,          icon: '🏠' },
    { label: 'الرواتب والأجور',          val: salaries,      icon: '👥' },
    { label: 'التسويق والإعلان',         val: marketing,     icon: '📣' },
    { label: 'الكهرباء والمياه',         val: utilities,     icon: '💡' },
    { label: 'مصاريف أخرى',             val: other,         icon: '📦' },
    ...(delCommission > 0 ? [{ label: 'عمولة تطبيقات التوصيل', val: delCommission, icon: '🚗' }] : []),
  ].filter(r => r.val > 0);

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--gray);font-size:13px;text-align:center;padding:20px;';
    empty.textContent = 'لم يتم إدخال مصاريف';
    wrap.appendChild(empty);
    return;
  }

  // جدول المصاريف
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

  // رأس الجدول
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['البند', 'المبلغ', 'من الإيرادات', 'من المصاريف'].forEach(h => {
    const th = document.createElement('th');
    th.style.cssText = 'padding:8px 10px;border-bottom:2px solid var(--border);text-align:right;color:var(--gray2);font-size:11px;font-weight:600;';
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // صفوف المصاريف
  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const pctOfRev  = revenue      > 0 ? ((r.val / revenue)      * 100).toFixed(1) : '—';
    const pctOfExp  = totalExpenses > 0 ? ((r.val / totalExpenses) * 100).toFixed(1) : '—';
    const barW      = totalExpenses > 0 ? Math.min(100, (r.val / totalExpenses) * 100) : 0;

    const tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--border);';

    // عمود الاسم
    const tdLabel = document.createElement('td');
    tdLabel.style.cssText = 'padding:10px;';
    const labelWrap = document.createElement('div');
    labelWrap.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const iconEl = document.createElement('span');
    iconEl.style.cssText = 'font-size:16px;';
    iconEl.textContent = r.icon;
    const nameEl = document.createElement('span');
    nameEl.style.cssText = 'color:var(--white);font-size:13px;';
    nameEl.textContent = r.label;
    labelWrap.appendChild(iconEl);
    labelWrap.appendChild(nameEl);

    // شريط التقدم
    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'height:4px;background:var(--border);border-radius:2px;margin-top:5px;';
    const barFill = document.createElement('div');
    barFill.style.cssText = `height:4px;width:${barW}%;background:var(--gold);border-radius:2px;`;
    barWrap.appendChild(barFill);
    tdLabel.appendChild(labelWrap);
    tdLabel.appendChild(barWrap);

    // عمود المبلغ
    const tdVal = document.createElement('td');
    tdVal.style.cssText = 'padding:10px;font-weight:700;color:var(--white);font-size:13px;white-space:nowrap;';
    tdVal.innerHTML = fmt(r.val) + ' ' + (window.SAR || 'ر.س');

    // عمود % من الإيرادات
    const tdPctRev = document.createElement('td');
    tdPctRev.style.cssText = 'padding:10px;color:var(--gray2);font-size:12px;';
    tdPctRev.textContent = pctOfRev + '%';

    // عمود % من المصاريف
    const tdPctExp = document.createElement('td');
    tdPctExp.style.cssText = 'padding:10px;color:var(--gold);font-size:12px;font-weight:600;';
    tdPctExp.textContent = pctOfExp + '%';

    tr.appendChild(tdLabel);
    tr.appendChild(tdVal);
    tr.appendChild(tdPctRev);
    tr.appendChild(tdPctExp);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // صف الإجمالي
  const totalRow = document.createElement('tr');
  totalRow.style.cssText = 'border-top:2px solid var(--gold-d);';
  const tdTotalLabel = document.createElement('td');
  tdTotalLabel.style.cssText = 'padding:10px;font-weight:700;color:var(--gold);font-size:13px;';
  tdTotalLabel.textContent = 'إجمالي المصاريف';
  const tdTotalVal = document.createElement('td');
  tdTotalVal.style.cssText = 'padding:10px;font-weight:800;color:var(--gold);font-size:14px;white-space:nowrap;';
  tdTotalVal.innerHTML = fmt(totalExpenses) + ' ' + (window.SAR || 'ر.س');
  const tdTotalPctRev = document.createElement('td');
  tdTotalPctRev.style.cssText = 'padding:10px;font-weight:700;color:var(--warn);font-size:12px;';
  tdTotalPctRev.textContent = (revenue > 0 ? ((totalExpenses / revenue) * 100).toFixed(1) : '—') + '%';
  const tdTotalPctExp = document.createElement('td');
  tdTotalPctExp.style.cssText = 'padding:10px;font-weight:700;color:var(--gold);font-size:12px;';
  tdTotalPctExp.textContent = '100%';
  totalRow.appendChild(tdTotalLabel);
  totalRow.appendChild(tdTotalVal);
  totalRow.appendChild(tdTotalPctRev);
  totalRow.appendChild(tdTotalPctExp);
  tbody.appendChild(totalRow);

  wrap.appendChild(table);
}

window.renderResults      = renderResults;
window.renderAIBlocks     = renderAIBlocks;
window.renderExpenseTable = renderExpenseTable;
