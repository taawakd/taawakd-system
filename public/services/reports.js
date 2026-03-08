// services/reports.js — تقارير + مقارنة + معيارية

// ============================================================
// reports.js — الحسابات، الرسوم، السيناريوهات، التقارير
// ============================================================

function liveCalc() {
  const getN = id => { const e = document.getElementById(id); return e ? parseFloat(e.value)||0 : 0; };
  const fmt = n => Math.abs(n).toLocaleString('en');
  const pct = (a,b) => b===0 ? 0 : Math.round(a/b*100);

  const rev  = getN('f-rev');
  const exp  = getN('f-cogs')+getN('f-rent')+getN('f-sal')+getN('f-utilities')+getN('f-mkt')+getN('f-other');
  const profit = rev - exp;
  const margin = pct(profit, rev);
  const be = exp;

  const setEl = (id, text, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (color) el.style.color = color;
  };

  setEl('lv-total-exp', fmt(exp) + ' ر', 'var(--white)');
  setEl('lv-profit',    (profit>=0?'+':'-') + fmt(profit) + ' ر', profit>=0 ? 'var(--green)' : 'var(--red)');
  setEl('lv-margin',    margin + '%', margin>=15 ? 'var(--green)' : margin>=0 ? 'var(--gold)' : 'var(--red)');
  setEl('lv-be',        fmt(be) + ' ر', 'var(--white)');

  // backward compat — العناصر القديمة إن وجدت
  setEl('lv-exp',    fmt(exp) + ' ر');
  const liveBar = document.getElementById('liveBar');
  if (liveBar) liveBar.style.display = 'grid';
}

// ══════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════
function addProdRow() {
  const c = document.getElementById('prodsContainer');
  const r = document.createElement('div');
  r.className = 'prod-row';
  r.innerHTML = `
    <input class="input" type="text" placeholder="اسم المنتج">
    <input class="input num-input" inputmode="numeric" placeholder="0" oninput="calcRowMargin(this)">
    <input class="input num-input" inputmode="numeric" placeholder="0" oninput="calcRowMargin(this)">
    <input class="input num-input" inputmode="numeric" placeholder="0">
    <input class="input" type="text" placeholder="—" readonly style="color:var(--gold);font-weight:700;">
    <button class="btn-rm" onclick="removeRow(this)">×</button>`;
  c.appendChild(r);
  r.querySelectorAll('.num-input').forEach(el=>{
    el.addEventListener('input',function(){
      const raw=this.value.replace(/[^0-9]/g,'');
      if(!raw){this.value='';return;}
      this.value=parseInt(raw,10).toLocaleString('en');
    });
  });
}

function removeRow(btn){
  const c=document.getElementById('prodsContainer');
  if(c.children.length>1) btn.closest('.prod-row').remove();
}

function calcRowMargin(inp) {
  const row = inp.closest('.prod-row');
  const ins = row.querySelectorAll('input');
  const price = parseNum(ins[1].value);
  const cost  = parseNum(ins[2].value);
  if(price>0){
    const m = (((price-cost)/price)*100).toFixed(0);
    ins[4].value = m+'%';
    ins[4].style.color = parseInt(m)>30 ? 'var(--green)' : parseInt(m)<10 ? 'var(--red)' : 'var(--warn)';
  }
}

function collectProducts(){
  return [...document.querySelectorAll('.prod-row')].reduce((a,row)=>{
    const ins=row.querySelectorAll('input');
    if(ins[0].value.trim()) a.push({
      name:ins[0].value.trim(),
      price:parseNum(ins[1].value),
      cost:parseNum(ins[2].value),
      qty:parseNum(ins[3].value)
    });
    return a;
  },[]);
}

function updateProductAnalysis(products) {
  const el = document.getElementById('prodAnalysis');
  const ranking = document.getElementById('prodRanking');
  if (!el || !ranking) return; // العناصر غير موجودة في هذه الصفحة
  if (!products || !products.length) { el.style.display='none'; return; }
  el.style.display = 'block';
  const sorted = [...products].sort((a,b)=>(b.revenue||0)-(a.revenue||0));
  const total = sorted.reduce((s,p)=>s+(p.revenue||0),0);
  const medals = ['🥇','🥈','🥉'];
  ranking.innerHTML = sorted.map((p,i) => {
    const pct = total>0 ? ((p.revenue/total)*100).toFixed(1) : 0;
    const margin = p.price>0 ? (((p.price-p.cost)/p.price)*100).toFixed(1) : (p.cost>0&&p.revenue>0 ? (((p.revenue-p.cost)/p.revenue)*100).toFixed(1) : 0);
    return '<div class="prod-rank-item"><span>'+(medals[i]||'▪️')+' '+p.name+'</span><span style="color:var(--gold)">'+pct+'%</span><span style="color:#4caf82">هامش '+margin+'%</span></div>';
  }).join('');
}

// ══════════════════════════════════════════
// SCORE CALCULATOR
// ══════════════════════════════════════════
function calcScore(data) {
  const { netMargin, grossMargin, rentPct, salPct, cogsPct } = data;
  let score = 0, breakdown = [];

  // Profitability (40pts)
  const profScore = Math.min(40, Math.max(0, (netMargin/25)*40));
  score += profScore;
  breakdown.push({ label:'الربحية', val:Math.round(profScore), max:40, color:'var(--gold)' });

  // Cost control (30pts)
  const costScore = Math.min(30, Math.max(0, ((100-cogsPct)/100)*30));
  score += costScore;
  breakdown.push({ label:'التحكم في التكاليف', val:Math.round(costScore), max:30, color:'var(--blue)' });

  // Efficiency (30pts)
  const effScore = Math.min(30, Math.max(0, ((grossMargin)/75)*30));
  score += effScore;
  breakdown.push({ label:'كفاءة التشغيل', val:Math.round(effScore), max:30, color:'var(--green)' });

  return { total: Math.round(score), breakdown };
}

function scoreColor(s){
  if(s>=75) return 'var(--green)';
  if(s>=50) return 'var(--warn)';
  return 'var(--red)';
}

function scoreText(s){
  if(s>=80) return 'ممتاز 🌟';
  if(s>=65) return 'جيد جداً ✅';
  if(s>=50) return 'متوسط ⚠️';
  if(s>=35) return 'يحتاج تحسين 🔧';
  return 'خطر ❗';
}

function renderScore(ringId, valId, labelId, bkId, score) {
  const color = scoreColor(score);
  const circumference = 377;
  const offset = circumference - (score/100)*circumference;

  const ring = document.getElementById(ringId);
  ring.style.stroke = color;
  setTimeout(()=>ring.style.strokeDashoffset = offset, 100);

  document.getElementById(valId).textContent = score;
  document.getElementById(valId).style.color = color;
  document.getElementById(labelId).textContent = scoreText(score);
}

// ══════════════════════════════════════════
// BENCHMARKS
// ══════════════════════════════════════════
function getSectorKey(bizType) {
  const map = {
    'مطعم': 'restaurant', 'restaurant': 'restaurant',
    'مقهى': 'cafe', 'كافيه': 'cafe', 'cafe': 'cafe', 'مقهى / كافيه': 'cafe',
    'كيوسك عصائر': 'juice_kiosk', 'juice_kiosk': 'juice_kiosk', 'عصائر': 'juice_kiosk',
    'مخبز': 'bakery', 'حلويات': 'bakery', 'bakery': 'bakery', 'مخبز / حلويات': 'bakery',
    'فود ترك': 'food_truck', 'food_truck': 'food_truck',
    'متجر تجزئة': 'retail', 'retail': 'retail',
    'خدمات': 'services', 'services': 'services',
    'حلاقة': 'barber', 'تجميل': 'barber', 'barber': 'barber', 'حلاقة وتجميل': 'barber',
    'تجارة إلكترونية': 'ecom', 'ecom': 'ecom',
  };
  return map[bizType] || map[Object.keys(map).find(k => bizType?.includes(k))] || 'restaurant';
}

function benchStatus(value, min, max, lowerIsBetter) {
  if (lowerIsBetter) {
    if (value <= max) return 'good';           // أقل من الحد الأعلى = ممتاز
    return value > max * 1.5 ? 'bad' : 'warn'; // أعلى بكثير = سيء
  }
  if (value >= min && value <= max) return 'good';
  if (value < min) return value < min * 0.7 ? 'bad' : 'warn';
  return value > max * 1.3 ? 'bad' : 'warn';
}

function renderBenchmarkItems(metrics, bench, container) {
  const keys = ['netMargin','grossMargin','rentPct','salPct','cogsPct','mktPct'];
  let html = '';
  keys.forEach(k => {
    if(bench[k] && metrics[k] !== undefined) {
      const val = metrics[k];
      const {min,max,label,lowerIsBetter} = bench[k];
      const status = benchStatus(val, min, max, lowerIsBetter);
      const badgeText = status==='good'?'ضمن الطبيعي':status==='warn'?'قريب من الحد':'خارج النطاق';
      const badgeClass = status==='good'?'badge-good':status==='warn'?'badge-warn':'badge-bad';
      html += `<div class="bench-item ${status}">
        <div style="flex:1;">
          <div class="bench-label">${label}</div>
          <div class="bench-range">المعدل الطبيعي: ${min}%–${max}%</div>
        </div>
        <div style="text-align:center;margin:0 12px;">
          <div class="bench-yours" style="color:${status==='good'?'var(--green)':status==='warn'?'var(--warn)':'var(--red)'};">${parseFloat(val).toFixed(1)}%</div>
          <div style="font-size:10px;color:var(--gray);">لديك</div>
        </div>
        <div class="bench-badge ${badgeClass}">${badgeText}</div>
      </div>`;
    }
  });
  document.getElementById(container).innerHTML = html || '<div style="color:var(--gray);font-size:13px;">أدخل بياناتك لعرض المقارنة</div>';
}

function renderBenchmarkPage() {
  const sector = document.getElementById('bench-sector')?.value || 'restaurant';
  const bench = BENCHMARKS[sector];
  const metrics = STATE.currentReport?.metrics || {};

  const c = document.getElementById('benchPageContent');
  const keys = ['netMargin','grossMargin','rentPct','salPct','cogsPct','mktPct'];
  let html = '<div style="display:flex;flex-direction:column;gap:10px;">';
  keys.forEach(k => {
    if(!bench[k]) return;
    const {min,max,label} = bench[k];
    const val = metrics[k];
    const hasData = val !== undefined;
    const status = hasData ? benchStatus(val, min, max) : 'none';
    const badgeClass = status==='good'?'badge-good':status==='warn'?'badge-warn':status==='bad'?'badge-bad':'';

    html += `<div class="bench-item ${hasData?status:''}">
      <div style="flex:1;">
        <div class="bench-label">${label}</div>
        <div class="bench-range">المعدل الطبيعي في ${bench.label}: ${min}% – ${max}%</div>
      </div>
      ${hasData ? `
      <div style="text-align:center;margin:0 16px;">
        <div class="bench-yours" style="color:${status==='good'?'var(--green)':status==='warn'?'var(--warn)':'var(--red)'};">${parseFloat(val).toFixed(1)}%</div>
        <div style="font-size:10px;color:var(--gray);">مشروعك</div>
      </div>
      <div class="bench-badge ${badgeClass}">${status==='good'?'✓ طبيعي':status==='warn'?'⚠ قريب':'✗ خارج النطاق'}</div>
      ` : `<div style="font-size:12px;color:var(--gray);">أجرِ تحليلاً لرؤية مقارنة مشروعك</div>`}
    </div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}

// ══════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════
function generateAlerts(data, sectorKey) {
  const bench = BENCHMARKS[sectorKey] || BENCHMARKS.restaurant;
  const alerts = [];
  const {revenue, netMargin, grossMargin, rentPct, salPct, cogsPct, mktPct, netProfit} = data;

  if(netProfit < 0) alerts.push({type:'danger', icon:'🔴', msg:`المشروع يعمل بخسارة ${fmt(Math.abs(netProfit))} ريال — يجب اتخاذ إجراء فوري`});
  if(netMargin < 5 && netProfit >= 0) alerts.push({type:'warn', icon:'⚠️', msg:`هامش الربح ${netMargin}% منخفض جداً — أقل من الحد الآمن`});

  if(bench.rentPct && rentPct > bench.rentPct.max*1.2)
    alerts.push({type:'warn', icon:'🏠', msg:`الإيجار ${parseFloat(rentPct).toFixed(1)}% من الإيرادات — المعدل الطبيعي ${bench.rentPct.min}–${bench.rentPct.max}%`});

  if(bench.salPct && salPct > bench.salPct.max*1.1)
    alerts.push({type:'warn', icon:'👥', msg:`الرواتب ${parseFloat(salPct).toFixed(1)}% من الإيرادات — أعلى من الطبيعي (${bench.salPct.min}–${bench.salPct.max}%)`});

  if(bench.cogsPct && cogsPct > bench.cogsPct.max*1.1)
    alerts.push({type:'warn', icon:'📦', msg:`تكلفة البضاعة ${parseFloat(cogsPct).toFixed(1)}% — أعلى من المعدل (${bench.cogsPct.min}–${bench.cogsPct.max}%)`});

  if(netMargin >= 20)
    alerts.push({type:'good', icon:'🌟', msg:`هامش الربح ${netMargin}% ممتاز — أعلى من المتوسط في القطاع`});

  return alerts;
}

function renderAlerts(alerts, containerId) {
  if(!alerts.length){
    document.getElementById(containerId).innerHTML = '<div style="color:var(--gray);font-size:13px;text-align:center;padding:16px;">لا توجد تنبيهات</div>';
    return;
  }
  document.getElementById(containerId).innerHTML = alerts.map(a=>`
    <div class="alert alert-${a.type==='danger'?'danger':a.type==='good'?'good':'warn'}">
      <span class="alert-icon">${a.icon}</span>
      <span>${a.msg}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════
// BREAKEVEN
// ══════════════════════════════════════════
function calcBreakeven(revenue, cogs, fixedCosts) {
  const variableRatio = revenue > 0 ? cogs/revenue : 0;
  const contribution = 1 - variableRatio;
  const be = contribution > 0 ? fixedCosts/contribution : 0;
  return { be, contribution: (contribution*100).toFixed(1), variableRatio: (variableRatio*100).toFixed(1) };
}

function renderBreakeven(revenue, cogs, fixedCosts, containerId, netProfitOverride) {
  const { be, contribution } = calcBreakeven(revenue, cogs, fixedCosts);
  const diff = revenue - be;
  const pctAbove = be > 0 ? ((diff/be)*100).toFixed(1) : 0;
  const status = (netProfitOverride !== undefined ? netProfitOverride >= 0 : diff >= 0) ? 'good' : 'bad';

  const html = `
    <div class="kpi-row kpi-row-2" style="margin-bottom:14px;">
      <div class="kpi ${status==='good'?'':''}">
        <div class="kpi-val neu">${fmt(be)} ﷼</div>
        <div class="kpi-label">نقطة التعادل</div>
      </div>
      <div class="kpi ${status==='good'?'gold':''}">
        <div class="kpi-val ${diff>=0?'pos':'neg'}">${diff>=0?'+':''}${fmt(diff)} ﷼</div>
        <div class="kpi-label">${diff>=0?'فوق نقطة التعادل':'تحت نقطة التعادل'}</div>
      </div>
    </div>
    <div class="alert alert-${status==='good'?'good':'danger'}">
      <span class="alert-icon">${status==='good'?'✅':'⚠️'}</span>
      <span>${status==='good'
        ? `مبيعاتك أعلى من نقطة التعادل بـ ${fmt(diff)} ريال (${pctAbove}%) — المشروع مربح.`
        : `تحتاج ${fmt(Math.abs(diff))} ريال إضافية للوصول لنقطة التعادل.`
      }</span>
    </div>
    <div style="margin-top:12px;">
      <div class="progress-head"><span style="font-size:12px;color:var(--gray);">التقدم نحو نقطة التعادل</span><span style="font-size:12px;color:var(--gold);">${Math.min(100,Math.round((revenue/be)*100))}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,(revenue/be)*100)}%;background:${diff>=0?'var(--green)':'var(--red)'};"></div></div>
    </div>`;
  document.getElementById(containerId).innerHTML = html;
}

// ══════════════════════════════════════════
// SCENARIOS
// ══════════════════════════════════════════
function buildScenarios(data) {
  const {revenue, totalExpenses, netProfit, cogs, salaries, rent} = data;
  return [
    {
      title: 'رفع المبيعات 10%',
      desc: 'ماذا لو زادت مبيعاتك 10% مع نفس التكاليف؟',
      newProfit: netProfit + revenue*0.10,
      delta: revenue*0.10,
    },
    {
      title: 'رفع المبيعات 20%',
      desc: 'هدف نمو أكثر طموحاً مع نفس الهيكل التشغيلي',
      newProfit: netProfit + revenue*0.20,
      delta: revenue*0.20,
    },
    {
      title: 'تخفيض الرواتب 10%',
      desc: 'تحسين كفاءة الفريق أو إعادة هيكلة',
      newProfit: netProfit + salaries*0.10,
      delta: salaries*0.10,
    },
    {
      title: 'تخفيض تكاليف البضاعة 5%',
      desc: 'التفاوض مع الموردين أو البحث عن بدائل',
      newProfit: netProfit + cogs*0.05,
      delta: cogs*0.05,
    },
    {
      title: 'تخفيض الإيجار 15%',
      desc: 'إعادة التفاوض على عقد الإيجار',
      newProfit: netProfit + rent*0.15,
      delta: rent*0.15,
    },
    {
      title: 'رفع المبيعات 10% + تخفيض تكاليف 5%',
      desc: 'مزيج متوازن من النمو وترشيد التكاليف',
      newProfit: netProfit + revenue*0.10 + totalExpenses*0.05,
      delta: revenue*0.10 + totalExpenses*0.05,
    },
  ];
}

function renderScenarios(scenarios, revenue, containerId) {
  document.getElementById(containerId).innerHTML = scenarios.map(s => {
    const newMargin = revenue > 0 ? ((s.newProfit/revenue)*100).toFixed(1) : 0;
    const deltaSign = s.delta >= 0 ? '+' : '';
    return `<div class="scenario-card">
      <div class="sc-title">${s.title}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-result ${s.newProfit>=0?'pos':'neg'}">${fmt(s.newProfit)} ﷼</div>
      <div class="sc-delta" style="color:${s.delta>=0?'var(--green)':'var(--red)'};">
        ${deltaSign}${fmt(s.delta)} ريال • هامش ${newMargin}%
      </div>
    </div>`;
  }).join('');
}

function renderScenariosPage() {
  if(!STATE.currentReport) return;
  const {metrics} = STATE.currentReport;
  const scenarios = buildScenarios(metrics);
  const html = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title"><div class="card-title-icon">🎯</div>سيناريوهات "ماذا لو؟"</div>
      <div class="grid-3">${scenarios.map(s=>{
        const newMargin = metrics.revenue > 0 ? ((s.newProfit/metrics.revenue)*100).toFixed(1) : 0;
        return `<div class="scenario-card">
          <div class="sc-title">${s.title}</div>
          <div class="sc-desc">${s.desc}</div>
          <div class="sc-result ${s.newProfit>=0?'pos':'neg'}">${fmt(s.newProfit)} ﷼</div>
          <div class="sc-delta" style="color:${s.delta>=0?'var(--green)':'var(--red)'};">
            +${fmt(s.delta)} ريال • هامش ${newMargin}%
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  document.getElementById('scenariosPageContent').innerHTML = html;
}

// ══════════════════════════════════════════
// COMPARE PERIODS
// ══════════════════════════════════════════
function renderComparePage() {
  const reports = STATE.savedReports;
  if(reports.length < 2){
    document.getElementById('comparePageContent').innerHTML = '<div style="text-align:center;padding:60px;color:var(--gray);font-size:14px;">تحتاج تقريرين على الأقل للمقارنة</div>';
    return;
  }
  const r1 = reports[0], r2 = reports[1];
  const m1 = r1.metrics, m2 = r2.metrics;
  const delta = (a,b) => b>0 ? (((a-b)/b)*100).toFixed(1) : 0;
  const dColor = v => parseFloat(v)>0?'var(--green)':parseFloat(v)<0?'var(--red)':'var(--gray)';
  const dSign  = v => parseFloat(v)>0?'↑':'↓';

  document.getElementById('comparePageContent').innerHTML = `
    <div class="card">
      <div class="compare-row" style="grid-template-columns:1fr auto 1fr;margin-bottom:20px;">
        <div class="compare-period">
          <div class="compare-period-label">📅 ${r2.bizName} — ${new Date(r2.createdAt).toLocaleDateString('ar-SA')}</div>
          <div class="compare-metric"><span>الإيرادات</span><span class="compare-metric-val">${fmt(m2.revenue)} ﷼</span></div>
          <div class="compare-metric"><span>صافي الربح</span><span class="compare-metric-val">${fmt(m2.netProfit)} ﷼</span></div>
          <div class="compare-metric"><span>هامش الربح</span><span class="compare-metric-val">${m2.netMargin}%</span></div>
          <div class="compare-metric"><span>المصاريف</span><span class="compare-metric-val">${fmt(m2.totalExpenses)} ﷼</span></div>
        </div>
        <div class="compare-arrow">⇄</div>
        <div class="compare-period">
          <div class="compare-period-label">📅 ${r1.bizName} — ${new Date(r1.createdAt).toLocaleDateString('ar-SA')}</div>
          <div class="compare-metric"><span>الإيرادات</span><span class="compare-metric-val">${fmt(m1.revenue)} ﷼</span></div>
          <div class="compare-metric"><span>صافي الربح</span><span class="compare-metric-val">${fmt(m1.netProfit)} ﷼</span></div>
          <div class="compare-metric"><span>هامش الربح</span><span class="compare-metric-val">${m1.netMargin}%</span></div>
          <div class="compare-metric"><span>المصاريف</span><span class="compare-metric-val">${fmt(m1.totalExpenses)} ﷼</span></div>
        </div>
      </div>
      <div class="card-title" style="margin-bottom:14px;"><div class="card-title-icon">📊</div>التغيير بين الفترتين</div>
      <div class="kpi-row kpi-row-4">
        ${[
          {label:'الإيرادات', d:delta(m1.revenue,m2.revenue)},
          {label:'صافي الربح', d:delta(m1.netProfit,m2.netProfit)},
          {label:'هامش الربح', d:(m1.netMargin-m2.netMargin).toFixed(1)},
          {label:'المصاريف', d:delta(m1.totalExpenses,m2.totalExpenses)},
        ].map(k=>`
          <div class="kpi">
            <div class="kpi-val" style="color:${dColor(k.d)};">${dSign(k.d)} ${Math.abs(k.d)}%</div>
            <div class="kpi-label">${k.label}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════
// CHART
// ══════════════════════════════════════════
function initChart() {
  const ctx = document.getElementById('perfChart')?.getContext('2d');
  if(!ctx) return;
  const labels6m = ['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس'];
  STATE.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels6m,
      datasets: [
        {
          label:'الإيرادات',
          data:[65,72,68,80,75,85].map(v=>v*1000),
          borderColor:'var(--gold)',
          backgroundColor:'rgba(200,164,90,0.08)',
          borderWidth:2, fill:true, tension:0.4, pointRadius:4,
          pointBackgroundColor:'var(--gold)',
        },
        {
          label:'الأرباح',
          data:[12,15,11,18,14,17].map(v=>v*1000),
          borderColor:'var(--green)',
          backgroundColor:'rgba(76,175,130,0.06)',
          borderWidth:2, fill:true, tension:0.4, pointRadius:4,
          pointBackgroundColor:'var(--green)',
        }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'var(--gray2)', font:{size:12}, boxWidth:12 } } },
      scales:{
        x:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'var(--gray)',font:{size:11}} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'var(--gray)',font:{size:11},
          callback: v => v>=1000 ? (v/1000).toFixed(0)+'ك' : v
        }}
      }
    }
  });
}

function togglePeriod() {
  const v = (document.getElementById('f-period')||{}).value || 'شهري';
  const map = {
    'شهري':'month','يومي':'day','أسبوعي':'week',
    'سنوي':'year','ربع سنوي':'quarter','نصف سنوي':'half','مخصص':'custom',
    'month':'month','day':'day','week':'week','year':'year',
    'quarter':'quarter','half':'half','custom':'custom'
  };
  const key = map[v] || 'month';
  const all = ['pi-month','pi-day','pi-week','pi-year','pi-quarter','pi-half','pi-custom'];
  all.forEach(id => { const e = document.getElementById(id); if(e) e.style.display='none'; });
  const show = document.getElementById('pi-' + key);
  if(show) show.style.display = '';
}

function updateCustomPeriodLabel() {
  const from = document.getElementById('f-date-from').value;
  const to   = document.getElementById('f-date-to').value;
  if(!from || !to) return;
  const f = new Date(from), t = new Date(to);
  const days = Math.round((t-f)/(1000*60*60*24));
  document.getElementById('customPeriodLabel').textContent = `الفترة: ${days} يوم (${f.toLocaleDateString('ar-SA')} — ${t.toLocaleDateString('ar-SA')})`;
}

document.addEventListener('change', e => {
  if(e.target.id === 'f-date-from' || e.target.id === 'f-date-to') updateCustomPeriodLabel();
});

function getPeriodLabel() {
  const val = document.getElementById('f-period').value;
  if (val === 'مخصص') {
    const from = document.getElementById('f-date-from').value;
    const to   = document.getElementById('f-date-to').value;
    if (!from || !to) return 'مخصص';
    const f = new Date(from), t = new Date(to);
    const days = Math.round((t-f)/(1000*60*60*24));
    return `${days} يوم (${f.toLocaleDateString('ar-SA')} — ${t.toLocaleDateString('ar-SA')})`;
  }
  if (val === 'يومي') {
    const date = document.getElementById('f-single-date')?.value;
    if (!date) return 'يومي';
    return new Date(date).toLocaleDateString('ar-SA', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }
  if (val === 'أسبوعي') {
    const week = document.getElementById('f-week')?.value;
    if (!week) return 'أسبوعي';
    return 'أسبوع: ' + week;
  }
  if (val === 'شهري') {
    const month = document.getElementById('f-month')?.value;
    if (!month) return 'شهري';
    const [y, m] = month.split('-');
    return new Date(y, m-1).toLocaleDateString('ar-SA', {year:'numeric', month:'long'});
  }
  if (val === 'ربع سنوي') {
    const q = document.getElementById('f-quarter')?.value;
    const qy = document.getElementById('f-quarter-year')?.value;
    if (!q || !qy) return 'ربع سنوي';
    return `الربع ${q} - ${qy}`;
  }
  if (val === 'نصف سنوي') {
    const h = document.getElementById('f-half')?.value;
    const hy = document.getElementById('f-half-year')?.value;
    if (!h || !hy) return 'نصف سنوي';
    return `النصف ${h} - ${hy}`;
  }
  if (val === 'سنوي') {
    const year = document.getElementById('f-year')?.value;
    if (!year) return 'سنوي';
    return 'سنة ' + year;
  }
  return val;
}

function toggleCustomChart() {
  const wrap = document.getElementById('chartCustomRange');
  const isOpen = wrap.style.display !== 'none';
  wrap.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) {
    const today = new Date();
    const from  = new Date(today); from.setDate(today.getDate()-30);
    document.getElementById('chartTo').value   = today.toISOString().slice(0,10);
    document.getElementById('chartFrom').value = from.toISOString().slice(0,10);
    // deactivate other buttons
    ['day','week','month','6m','year'].forEach(m => {
      const btn = document.getElementById('chartBtn-'+m);
      if(btn) btn.className = 'btn btn-ghost btn-sm';
    });
    document.getElementById('chartBtn-custom').className = 'btn btn-primary btn-sm';
  }
}

function applyCustomChart() {
  const from = document.getElementById('chartFrom').value;
  const to   = document.getElementById('chartTo').value;
  if(!from || !to) return;

  const f = new Date(from), t = new Date(to);
  if(f >= t) { document.getElementById('chartRangeLabel').textContent = '⚠️ تاريخ البداية يجب أن يكون قبل النهاية'; return; }

  const days = Math.round((t-f)/(1000*60*60*24));
  document.getElementById('chartRangeLabel').textContent =
    `✓ عرض ${days} يوم — من ${f.toLocaleDateString('ar-SA')} إلى ${t.toLocaleDateString('ar-SA')}`;

  // Generate labels + data for the custom range
  const labels = [], revData = [], prfData = [];
  const step = days <= 14 ? 1 : days <= 60 ? 7 : days <= 180 ? 14 : 30;
  const stepLabel = step === 1 ? 'يوم' : step === 7 ? 'أسبوع' : step === 14 ? 'أسبوعين' : 'شهر';
  let cur = new Date(f);
  let i = 0;
  while(cur <= t && labels.length < 24) {
    labels.push(cur.toLocaleDateString('ar-SA', {month:'short', day:'numeric'}));
    // Simulated data — replace with real data from STATE.savedReports in production
    const base = 70000 + Math.sin(i*0.5)*15000 + Math.random()*10000;
    revData.push(Math.round(base));
    prfData.push(Math.round(base * (0.12 + Math.sin(i*0.3)*0.05)));
    cur.setDate(cur.getDate()+step); i++;
  }
  STATE.chartInstance.data.labels = labels;
  STATE.chartInstance.data.datasets[0].data = revData;
  STATE.chartInstance.data.datasets[1].data = prfData;
  STATE.chartInstance.update();
}

function switchChart(mode) {
  STATE.chartMode = mode;
  // Reset all buttons
  ['day','week','month','6m','year','custom'].forEach(m=>{
    const btn = document.getElementById('chartBtn-'+m);
    if(btn) btn.className = m===mode ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
  });
  // Hide custom range if switching to preset
  if(mode !== 'custom') document.getElementById('chartCustomRange').style.display = 'none';

  const data = {
    day:   { labels:['12ص','3ص','6ص','9ص','12ظ','3م','6م','9م'], rev:[2,1.5,1,3,8,12,9,6].map(v=>v*1000), prf:[0.3,0.2,0.1,0.5,1.4,2.2,1.6,1].map(v=>v*1000) },
    week:  { labels:['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'], rev:[8,12,9,14,11,16,13].map(v=>v*1000), prf:[1.5,2.2,1.8,3,2,3.5,2.5].map(v=>v*1000) },
    month: { labels:['الأسبوع 1','الأسبوع 2','الأسبوع 3','الأسبوع 4'], rev:[18,22,20,25].map(v=>v*1000), prf:[3.5,4.2,3.8,5].map(v=>v*1000) },
    '6m':  { labels:['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس'], rev:[65,72,68,80,75,85].map(v=>v*1000), prf:[12,15,11,18,14,17].map(v=>v*1000) },
    year:  { labels:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'], rev:[60,65,70,68,75,80,78,85,82,88,90,95].map(v=>v*1000), prf:[10,12,14,11,15,17,16,18,17,19,20,22].map(v=>v*1000) },
  };
  const d = data[mode];
  if(!d) return;
  STATE.chartInstance.data.labels = d.labels;
  STATE.chartInstance.data.datasets[0].data = d.rev;
  STATE.chartInstance.data.datasets[1].data = d.prf;
  STATE.chartInstance.update();
}

// ══════════════════════════════════════════
// ANALYSIS
// ══════════════════════════════════════════

window.liveCalc = liveCalc;
window.renderBenchmarkPage = renderBenchmarkPage;
window.switchChart = switchChart;
window.applyCustomChart = applyCustomChart;
window.addProdRow = addProdRow;
window.removeRow = removeRow;
window.togglePeriod = togglePeriod;
