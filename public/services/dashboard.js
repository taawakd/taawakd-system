// services/dashboard.js — لوحة التحكم + التقارير المحفوظة
// ✅ المرحلة 3-B: استخراج updateDashboard + loadReportsFromDB + renderSavedReports
// ============================================================

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

  // ✅ إصلاح 2: تعريف صريح لكل المتغيرات المطلوبة بدلاً من استخدامها مباشرة
  const { netMargin, grossMargin, rentPct, salPct, cogsPct } = m;
  const resolvedSectorKey = getSectorKey(rep.bizType || '');
  renderAlerts(
    rep.alerts || generateAlerts({ ...m, netMargin, grossMargin, rentPct, salPct, cogsPct }, resolvedSectorKey),
    'alertsContainer'
  );

  const fixedCosts = (m.rent||0)+(m.salaries||0)+(m.marketing||0)+(m.other||0);
  renderBreakeven(m.revenue, m.cogs||0, fixedCosts, 'breakevenContainer', m.netProfit);

  const forecast3m = m.netProfit * 3;
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
    STATE.savedReports = data.map(r => ({
      id: r.id, bizName: r.biz_name, bizType: r.biz_type, period: r.period,
      metrics: { revenue: r.revenue, totalExpenses: r.total_expenses, netProfit: r.net_profit, netMargin: r.net_margin, healthScore: r.health_score },
      scoreData: r.report_json?.scoreData || { total: r.health_score },
      reportJson: r.report_json, date: r.created_at
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

// expose
window.updateDashboard    = updateDashboard;
window.loadReportsFromDB  = loadReportsFromDB;
window.renderSavedReports = renderSavedReports;
