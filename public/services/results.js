// services/results.js — عرض نتائج التحليل
// ✅ المرحلة 3-A: استخراج renderResults + renderAIBlocks من financial.js
// ============================================================

function renderResults(report) {
  const {bizName, bizType, period, metrics, scoreData, alerts, scenarios, reportText, products, sectorKey} = report;
  const createdAt = report.createdAt || report.date || null;
  const resolvedSectorKey = sectorKey || getSectorKey(bizType);
  const {revenue, netProfit, netMargin, grossMargin, totalExpenses, rentPct, salPct, cogsPct, mktPct, cogs, rent} = metrics;

  document.getElementById('resultTitle').textContent = `تقرير ${bizName}`;
  const dateStr = report.reportPeriod || (createdAt && !isNaN(new Date(createdAt)) ? new Date(createdAt).toLocaleDateString('ar-SA') : '—');
  document.getElementById('resultMeta').textContent = `${bizType} — تحليل ${period} — ${dateStr}`;

  document.getElementById('resultKpis').innerHTML = [
    {val:fmt(revenue)+' ر', label:'الإيرادات', cls:'neu'},
    {val:(netProfit>=0?'+':'')+fmt(netProfit)+' ر', label:'صافي الربح', cls:netProfit>=0?'pos':'neg'},
    {val:netMargin+'%', label:'هامش الربح', cls:netMargin>15?'pos':netMargin<5?'neg':'warn'},
    {val:scoreData.total+'/100', label:'مؤشر الصحة', cls:scoreData.total>=65?'pos':scoreData.total>=40?'warn':'neg'},
  ].map(k=>`<div class="kpi"><div class="kpi-val ${k.cls}">${k.val}</div><div class="kpi-label">${k.label}</div></div>`).join('');

  // ── AI CFO shortcut button ──
  // Remove stale button first (renderResults may be called multiple times)
  document.getElementById('askCFOBtn')?.remove();
  document.getElementById('resultKpis').insertAdjacentHTML('afterend', `
    <div style="text-align:center;margin:20px 0 4px;">
      <button id="askCFOBtn" class="btn btn-primary"
        style="padding:14px 36px;font-size:15px;border-radius:14px;display:inline-flex;align-items:center;gap:10px;">
        🤖 <span>خذ رأي الخبير المالي AI CFO</span>
      </button>
    </div>
  `);
  document.getElementById('askCFOBtn').addEventListener('click', () => {
    const question = "حلّل هذا التقرير وقدّم أهم 3 نقاط قوة، أهم 3 مخاطر، وأهم قرار مالي يجب اتخاذه الآن.";
    showPage('cfo');
    setTimeout(() => {
      if (window.sendCFO) window.sendCFO(question);
    }, 300);
  });

  renderScore('resScoreRing','resScoreVal','resScoreLabel','resScoreBreakdown', scoreData.total);
  document.getElementById('resScoreBreakdown').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px;">
      ${(scoreData.breakdown||[]).map(b=>`
        <div class="progress-wrap">
          <div class="progress-head">
            <span style="font-size:12px;color:var(--gray2);">${b.label}</span>
            <span style="font-size:12px;color:var(--gold);">${b.val}/${b.max}</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${(b.val/b.max)*100}%;background:${b.color};"></div></div>
        </div>`).join('')}
    </div>`;

  const bench = BENCHMARKS[resolvedSectorKey];
  const bMetrics = { netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct };
  renderBenchmarkItems(bMetrics, bench, 'benchmarkContainer');
  renderAlerts(alerts, 'resultAlerts');

  const fixedCosts = (metrics.rent||0)+(metrics.salaries||0)+(metrics.marketing||0)+(metrics.other||0)+(metrics.utilities||0);
  const beNetProfit = metrics.netProfit !== undefined ? metrics.netProfit : (revenue - (cogs||0) - fixedCosts);
  renderBreakeven(revenue, cogs, fixedCosts, 'resultBreakeven', beNetProfit);

  if(products.length) {
    const withMargins = products.map(p=>{
      const margin = p.price>0 ? ((p.price-p.cost)/p.price*100) : 0;
      const profit = (p.price-p.cost)*p.qty;
      return {...p,margin,profit};
    }).sort((a,b)=>b.margin-a.margin);
    const totalProd = withMargins.reduce((s,p)=>s+Math.max(0,p.profit),0);
    document.getElementById('resultProducts').innerHTML = withMargins.map((p,i)=>{
      const contrib = totalProd>0 ? ((p.profit/totalProd)*100).toFixed(0) : 0;
      const suggestion = p.margin < 15 ? `رفع السعر 5% يرفع الربح ${fmt(p.qty*p.cost*0.05)} ﷼` : p.margin > 50 ? 'منتج رابح — ركّز عليه' : 'أداء طبيعي';
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

  renderAIBlocks(reportText, 'aiBlocks');
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

window.renderResults  = renderResults;
window.renderAIBlocks = renderAIBlocks;
