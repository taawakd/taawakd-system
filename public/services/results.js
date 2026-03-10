// services/results.js — عرض نتائج التحليل
// ✅ المرحلة 3-A: استخراج renderResults + renderAIBlocks من financial.js
// ============================================================

function renderResults(report) {
  console.log("renderResults executed");
  const {bizName, bizType, period, metrics, scoreData, alerts, scenarios, reportText, products, sectorKey} = report;
  const createdAt = report.createdAt || report.date || null;
  const resolvedSectorKey = sectorKey || getSectorKey(bizType);
  const {revenue, netProfit, netMargin, grossMargin, totalExpenses, rentPct, salPct, cogsPct, mktPct, cogs, rent} = metrics;

  document.getElementById('resultTitle').textContent = `تقرير ${bizName}`;
  const dateStr = report.reportPeriod || (createdAt && !isNaN(new Date(createdAt)) ? new Date(createdAt).toLocaleDateString('ar-SA') : '—');
  document.getElementById('resultMeta').textContent = `${bizType} — تحليل ${period} — ${dateStr}`;

  // resultKpis — built with DOM so Arabic labels never pass through innerHTML
  const kpiContainer = document.getElementById('resultKpis');
  kpiContainer.innerHTML = '';
  [
    {val: fmt(revenue) + ' ر',                               label: 'الإيرادات',   cls: 'neu'},
    {val: (netProfit >= 0 ? '+' : '') + fmt(netProfit) + ' ر', label: 'صافي الربح', cls: netProfit >= 0 ? 'pos' : 'neg'},
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

  const bench = BENCHMARKS[resolvedSectorKey];
  const bMetrics = { netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
  renderBenchmarkItems(bMetrics, bench, 'benchmarkContainer');
  renderAlerts(alerts, 'resultAlerts');

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
        ? `رفع السعر 5% يرفع الربح ${fmt(p.qty * p.cost * 0.05)} ﷼`
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
      suggEl.textContent = suggestion;                 // ← textContent (was innerHTML)

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

window.renderResults  = renderResults;
window.renderAIBlocks = renderAIBlocks;
