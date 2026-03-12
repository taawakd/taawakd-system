// services/dashboard.js — لوحة التحكم + التقارير المحفوظة
// ✅ المرحلة 3-B: استخراج updateDashboard + loadReportsFromDB + renderSavedReports
// ============================================================

function updateDashboard() {
  const rep = STATE.savedReports[0];
  if(!rep){ return; }
  const m = rep.metrics;

  document.getElementById('dk-rev').textContent = fmt(m.revenue)+' ﷼';

  const pk = document.getElementById('dk-profit');
  pk.textContent = (m.netProfit>=0?'+':'')+fmt(m.netProfit)+' ﷼';
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

  const fixedCosts = (m.rent||0)+(m.salaries||0)+(m.marketing||0)+(m.other||0)+(m.utilities||0);
  renderBreakeven(m.revenue, m.cogs||0, fixedCosts, 'breakevenContainer', m.netProfit);

  const fc = document.getElementById('forecastContainer');
  if (fc) {
    if (!planAllows('forecast')) {
      fc.innerHTML = `
        <div style="text-align:center;padding:32px 20px;border:1px dashed rgba(201,168,76,0.25);border-radius:14px;background:rgba(201,168,76,0.04);">
          <div style="font-size:32px;margin-bottom:10px;">🔮</div>
          <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:6px;">التوقعات الذكية</div>
          <p style="font-size:13px;color:#888;margin:0 0 16px;">متاحة في الخطة الاحترافية فأعلى</p>
          <button onclick="showUpgradeModal('التوقعات الذكية','pro')"
            style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
            ترقية للخطة الاحترافية ←
          </button>
        </div>`;
    } else {
      const forecast3m = m.netProfit * 3;
      const optimistic = (m.netProfit + m.revenue*0.1) * 3;
      fc.innerHTML = `
        <div class="kpi-row kpi-row-2">
          <div class="kpi"><div class="kpi-val ${forecast3m>=0?'pos':'neg'}">${fmt(forecast3m)} ${SAR}</div><div class="kpi-label">متوقع خلال 3 أشهر (الوضع الحالي)</div></div>
          <div class="kpi gold"><div class="kpi-val pos">${fmt(optimistic)} ${SAR}</div><div class="kpi-label">متوقع مع تطبيق التوصيات</div></div>
        </div>
        <div class="alert alert-info" style="margin-top:12px;">
          <span class="alert-icon">🔮</span>
          <span>لو طبّقت توصيات التحليل، ربحك المتوقع أعلى بـ ${fmt(optimistic-forecast3m)} ${SAR} خلال 3 أشهر</span>
        </div>`;
    }
  }
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
    STATE.savedReports = data.map(r => {
      // Restore computed ratio fields from report_json — they are NOT stored
      // as individual Supabase columns (only revenue/expenses/profit/margin/score are)
      const rj  = r.report_json  || {};
      const rjm = rj.metrics     || {};
      return {
        id: r.id, bizName: r.biz_name, bizType: r.biz_type, period: r.period,
        metrics: {
          revenue:       r.revenue,
          totalExpenses: r.total_expenses,
          netProfit:     r.net_profit,
          netMargin:     r.net_margin,
          healthScore:   r.health_score,
          // Restore ratio fields from report_json (required by getCFOContext + system prompt)
          grossMargin:   rjm.grossMargin,
          rentPct:       rjm.rentPct,
          salPct:        rjm.salPct,
          cogsPct:       rjm.cogsPct,
          mktPct:        rjm.mktPct,
          cogs:          rjm.cogs,
          rent:          rjm.rent,
          salaries:      rjm.salaries,
          marketing:     rjm.marketing,
          other:         rjm.other,
        },
        scoreData:   rj.scoreData  || { total: r.health_score },
        alerts:      rj.alerts     || [],
        products:    rj.products   || [],
        scenarios:   rj.scenarios  || [],
        reportText:  rj.reportText || '',
        sectorKey:   rj.sectorKey  || '',
        reportPeriod: r.report_period || rj.reportPeriod || null,
        reportJson:  rj,
        createdAt:   r.created_at,
      };
    });

    // Bug fix: loadReportsFromDB never set STATE.currentReport.
    // Auto-restore from the most recent DB report so CFO has data even when
    // the user hasn't run a fresh analysis this session.
    if (!STATE.currentReport && STATE.savedReports.length) {
      STATE.currentReport = STATE.savedReports[0];
      console.log('[Tawakkad] loadReportsFromDB — auto-set STATE.currentReport:', STATE.currentReport.bizName);
    }

    localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0,20)));
    console.log('[Tawakkad] loadReportsFromDB — loaded', STATE.savedReports.length,
      'reports | currentReport:', STATE.currentReport?.bizName,
      '| grossMargin from report_json:', STATE.savedReports[0]?.metrics?.grossMargin);

    // إعادة رسم الكاردات بعد تحديث STATE.savedReports بـ UUIDs من Supabase
    // (ضروري لأن الكاردات قد بُنيت بـ IDs قديمة من localStorage)
    if (document.getElementById('savedReportsGrid')) renderSavedReports();

  } catch(e) { console.error('[Tawakkad] loadReportsFromDB error:', e); }
}

function renderSavedReports() {
  const grid = document.getElementById('savedReportsGrid');
  if (!grid) return;

  // فحص الخطة — سجل التقارير للخطط المدفوعة فقط
  if (!planAllows('save_reports')) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 24px;border:1px dashed rgba(201,168,76,0.25);border-radius:16px;background:rgba(201,168,76,0.04);">
        <div style="font-size:40px;margin-bottom:12px;">📁</div>
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;">سجل التقارير المحفوظة</div>
        <p style="font-size:13px;color:#888;margin:0 0 20px;">احفظ جميع تحليلاتك وارجع إليها في أي وقت — متاح في الخطة الاحترافية</p>
        <button onclick="showUpgradeModal('حفظ التقارير','pro')"
          style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
          ترقية للخطة الاحترافية ←
        </button>
      </div>`;
    return;
  }

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
        <div class="kpi card-sm"><div class="kpi-val neu" style="font-size:16px;">${fmt(m.revenue)} ${SAR}</div><div class="kpi-label">الإيرادات</div></div>
        <div class="kpi card-sm"><div class="kpi-val ${m.netProfit>=0?'pos':'neg'}" style="font-size:16px;">${m.netProfit>=0?'+':''}${fmt(m.netProfit)} ${SAR}</div><div class="kpi-label">صافي الربح</div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--gray);">${r.reportPeriod || (r.createdAt||r.date ? new Date(r.createdAt||r.date).toLocaleDateString('ar-SA') : '—')}</div>
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
