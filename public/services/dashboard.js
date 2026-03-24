// services/dashboard.js — لوحة التحكم + التقارير المحفوظة
// ✅ المرحلة 3-B: استخراج updateDashboard + loadReportsFromDB + renderSavedReports
// ============================================================

function _clearDashboard() {
  // مسح كل عناصر لوحة التحكم عند التبديل لمشروع فارغ
  const _empty = id => { const el = document.getElementById(id); if(el) el.textContent = '—'; };
  _empty('dk-rev'); _empty('dk-profit'); _empty('dk-margin'); _empty('dk-health');
  ['dk-profit','dk-margin'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.className = 'kpi-val';
  });
  const ac = document.getElementById('alertsContainer');
  if(ac) ac.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">أجرِ تحليلاً لمشروعك لرؤية التنبيهات</div>';
  const bc = document.getElementById('breakevenContainer');
  if(bc) bc.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">أجرِ تحليلاً لحساب نقطة التعادل</div>';
  const fc = document.getElementById('forecastContainer');
  if(fc) fc.innerHTML = '';
  // مسح حلقة النتيجة
  const fill = document.getElementById('scoreRingFill');
  const val  = document.getElementById('scoreVal');
  const lbl  = document.getElementById('scoreLabel');
  const brk  = document.getElementById('scoreBreakdown');
  if(fill) fill.style.strokeDasharray = '0 100';
  if(val)  val.textContent  = '—';
  if(lbl)  lbl.textContent  = '';
  if(brk)  brk.innerHTML    = '';
}
window._clearDashboard = _clearDashboard;

// ── عرض Dashboard للخطة المجانية (بيانات محجوبة) ──────────────────
function _renderDashboardPreview(rep) {
  const score = rep.scoreData.total;
  const scoreCls = score >= 65 ? 'pos' : score >= 40 ? 'warn' : 'neg';

  // ── KPI row: عرض القيم الحقيقية + overlay يبهمها جميعاً ─────────────
  const m = rep.metrics || {};
  const dkRev    = document.getElementById('dk-rev');
  const dkProfit = document.getElementById('dk-profit');
  const dkMargin = document.getElementById('dk-margin');
  const dkHealth = document.getElementById('dk-health');
  if (dkRev)    { dkRev.textContent    = fmt(m.revenue    || 0); dkRev.className    = 'kpi-val neu'; }
  if (dkProfit) { dkProfit.textContent = fmt(m.netProfit  || 0); dkProfit.className = 'kpi-val ' + (m.netProfit >= 0 ? 'pos' : 'neg'); }
  if (dkMargin) { dkMargin.textContent = (m.netMargin || 0).toFixed(1) + '%'; dkMargin.className = 'kpi-val ' + (m.netMargin > 15 ? 'pos' : m.netMargin < 5 ? 'neg' : 'warn'); }
  if (dkHealth) { dkHealth.textContent = score + '/100'; dkHealth.className = 'kpi-val ' + scoreCls; }

  // overlay فوق كل الـ KPIs
  const dashKpis = document.getElementById('dashKpis');
  if (dashKpis) {
    dashKpis.style.cssText += ';position:relative;overflow:hidden;';
    // أزل أي overlay سابق
    dashKpis.querySelector('[data-lock-overlay]')?.remove();
    const kpiOverlay = document.createElement('div');
    kpiOverlay.setAttribute('data-lock-overlay', '1');
    kpiOverlay.style.cssText = 'position:absolute;inset:0;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(13,13,20,0.4);display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;border-radius:inherit;z-index:2;';
    kpiOverlay.innerHTML = `<span style="font-size:20px;">🔒</span><span style="font-size:14px;color:#c9a84c;font-weight:600;">اضغط لرؤية النتائج</span>`;
    kpiOverlay.onclick = () => showUpgradeModal('التقرير الكامل', 'paid');
    dashKpis.appendChild(kpiOverlay);
  }

  // ── حلقة المؤشر: تُرسم حقيقية + overlay يبهمها ─────────────────────
  renderScore('scoreRingFill', 'scoreVal', 'scoreLabel', 'scoreBreakdown', score);

  // overlay فوق كارد الحلقة (يبدأ بعد عنوان الكارد)
  const scoreCardEl = document.getElementById('scoreVal')?.closest('.card');
  if (scoreCardEl) {
    scoreCardEl.style.position = 'relative';
    scoreCardEl.style.overflow = 'hidden';
    scoreCardEl.querySelector('[data-lock-overlay]')?.remove();
    const scoreLock = document.createElement('div');
    scoreLock.setAttribute('data-lock-overlay', '1');
    scoreLock.style.cssText = 'position:absolute;inset:0;top:48px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:rgba(13,13,20,0.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;z-index:2;';
    scoreLock.innerHTML = `
      <span style="font-size:36px;">🔒</span>
      <span style="font-size:15px;color:#c9a84c;font-weight:700;">فتح التحليل الكامل</span>
      <span style="font-size:12px;color:#888;">29 ر.س أو اشتراك شهري</span>`;
    scoreLock.onclick = () => showUpgradeModal('التقرير الكامل', 'paid');
    scoreCardEl.appendChild(scoreLock);
  }

  // ── رسالة ديناميكية: فضول + نقص معلومات ────────────────
  const _msg = (() => {
    if (score >= 65) return {
      icon: '👀',
      title: 'وضعك يبدو جيداً…',
      body: 'لكن هناك فرص تحسين مخفية لم تراها — الأرقام التفصيلية غير ظاهرة',
      ctaMain: 'فتح هذا التقرير — 29 ر.س',
      ctaSub:  'اشترك — 79 ر.س/شهر',
    };
    if (score >= 40) return {
      icon: '⚠️',
      title: 'أداء متوسط — في تفاصيل مخفية',
      body: 'التقرير يكشف أين تتسرب أرباحك بالضبط، ونقطة التعادل، والمصاريف',
      ctaMain: 'فتح هذا التقرير — 29 ر.س',
      ctaSub:  'اشترك — 79 ر.س/شهر',
    };
    return {
      icon: '🚨',
      title: 'مشروعك يخسر بدون ما تدري',
      body: 'المؤشر يشير لمشكلة حقيقية — التقرير الكامل يحدد سببها ويعطيك خطة خروج',
      ctaMain: 'اكشف المشكلة — 29 ر.س',
      ctaSub:  'اشترك — 79 ر.س/شهر',
    };
  })();

  // قالب القفل للأقسام
  const lockedSection = `
    <div style="position:relative;border-radius:14px;overflow:hidden;">
      <div style="filter:blur(3px);pointer-events:none;opacity:0.3;padding:24px;border:1px solid rgba(255,255,255,0.06);border-radius:14px;background:rgba(255,255,255,0.02);">
        <div style="height:12px;background:rgba(255,255,255,0.12);border-radius:6px;margin-bottom:10px;width:55%;"></div>
        <div style="height:9px;background:rgba(255,255,255,0.08);border-radius:6px;margin-bottom:8px;width:75%;"></div>
        <div style="height:9px;background:rgba(255,255,255,0.08);border-radius:6px;width:45%;"></div>
      </div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:20px;">🔒</span>
      </div>
    </div>`;

  const ac = document.getElementById('alertsContainer');
  if (ac) ac.innerHTML = lockedSection;

  const bc = document.getElementById('breakevenContainer');
  if (bc) bc.innerHTML = lockedSection;

  const fc = document.getElementById('forecastContainer');
  if (fc) fc.innerHTML = `
    <div style="text-align:center;padding:28px 20px;border:1px dashed rgba(201,168,76,0.25);border-radius:14px;background:rgba(201,168,76,0.04);">
      <div style="font-size:26px;margin-bottom:10px;">${_msg.icon}</div>
      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:8px;">${_msg.title}</div>
      <p style="font-size:13px;color:#888;margin:0 0 6px;line-height:1.6;">${_msg.body}</p>
      <p style="font-size:11px;color:rgba(201,168,76,0.5);margin:0 0 18px;font-style:italic;">التفاصيل الكاملة غير ظاهرة</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button onclick="showUpgradeModal('التقرير الكامل', 'paid')"
          style="background:linear-gradient(135deg,#e8c76a,#c9a84c);color:#000;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
          ${_msg.ctaMain}
        </button>
        <button onclick="showUpgradeModal('الاشتراك الاحترافي', 'paid')"
          style="background:rgba(201,168,76,0.1);color:#e8c76a;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
          ${_msg.ctaSub}
        </button>
      </div>
    </div>`;
}

function updateDashboard() {
  const rep = STATE.savedReports[0];
  if (!rep) { _clearDashboard(); return; }

  // ── بوابة الخطة المجانية: منع عرض أي رقم مالي حقيقي ──────────────
  if (!planAllows('full_report')) {
    _renderDashboardPreview(rep);
    return;
  }

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
          <button onclick="showUpgradeModal('التوقعات الذكية', 'paid')"
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

    // ── مساعد: هل هذا التقرير مرئي للمستخدم؟ ──────────────────────
    const _isVisibleToUser = (r) => {
      // عمود DB — أولوية
      if (typeof r.is_saved_for_user === 'boolean') return r.is_saved_for_user;
      // fallback: اقرأ من report_json إذا لم يُوجد العمود بعد
      const rj = r.report_json || {};
      if (typeof rj._is_saved_for_user === 'boolean') return rj._is_saved_for_user;
      return true; // التقارير القديمة — تظهر بشكل افتراضي
    };

    // ── مشاريع غير الافتراضي تُحمَّل من localStorage ──────────────
    const projId = window.__CURRENT_PROJECT_ID__ || 'default';
    if (projId !== 'default') {
      const key   = typeof projectReportsKey === 'function' ? projectReportsKey(projId) : `tw_reports_${projId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const all = JSON.parse(saved);
        // فلترة: أظهر فقط التقارير المحفوظة للمستخدم
        STATE.savedReports = all.filter(r => {
          if (typeof r._is_saved_for_user === 'boolean') return r._is_saved_for_user;
          return true;
        });
        if (!STATE.currentReport && STATE.savedReports.length) STATE.currentReport = STATE.savedReports[0];
      }
      if (document.getElementById('savedReportsGrid')) renderSavedReports();
      return;
    }

    const userId = typeof user === 'string' ? user : user.id;
    const { data, error } = await sb
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // نحمّل أكثر لأننا سنفلتر بعضها
    if (error || !data) return;

    // فلترة: استبعد تقارير paid_one_time من القائمة المرئية
    STATE.savedReports = data
      .filter(_isVisibleToUser)
      .slice(0, 20)
      .map(r => {
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

    // حفظ في المفتاح الصحيح (افتراضي = tw_reports، مشروع = tw_reports_[id])
    if (typeof saveProjectReports === 'function') {
      saveProjectReports(STATE.savedReports);
    } else {
      localStorage.setItem('tw_reports', JSON.stringify(STATE.savedReports.slice(0,20)));
    }
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
        <button onclick="showUpgradeModal('حفظ التقارير', 'paid')"
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
  const canSeeNumbers = planAllows('full_report');
  grid.innerHTML = STATE.savedReports.map((r,i)=>{
    const m = r.metrics;
    const revDisplay    = canSeeNumbers ? `${fmt(m.revenue)} ${SAR}`                                                        : '🔒';
    const profitCls     = canSeeNumbers ? (m.netProfit>=0?'pos':'neg')                                                      : '';
    const profitDisplay = canSeeNumbers ? `${m.netProfit>=0?'+':''}${fmt(m.netProfit)} ${SAR}`                              : '🔒';
    return `<div class="card" style="cursor:pointer;transition:all 0.2s;animation:fadeUp 0.4s ease ${i*0.06}s forwards;opacity:0;" onmouseenter="this.style.borderColor='var(--gold-b)'" onmouseleave="this.style.borderColor='var(--border)'" onclick="openSavedReport('${r.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
        <div style="font-size:15px;font-weight:700;color:var(--white);">${r.bizName}</div>
        <div style="font-size:11px;padding:3px 10px;background:var(--gold-d);color:var(--gold);border:1px solid var(--gold-b);border-radius:20px;">${r.bizType||'—'}</div>
      </div>
      <div class="kpi-row kpi-row-2" style="margin-bottom:12px;">
        <div class="kpi card-sm"><div class="kpi-val neu" style="font-size:16px;">${revDisplay}</div><div class="kpi-label">الإيرادات</div></div>
        <div class="kpi card-sm"><div class="kpi-val ${profitCls}" style="font-size:16px;">${profitDisplay}</div><div class="kpi-label">صافي الربح</div></div>
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
