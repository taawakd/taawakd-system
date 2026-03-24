// services/ai-cfo.js — CFO + Action Plan

async function sendCFO(quickMsg) {
  console.log("AI CFO VERSION TEST");
  const input = document.getElementById('cfoInput');
  const msg = quickMsg || input.value.trim();
  if (!msg) return;

  // ── فحص الصلاحية: canAccessFeature() هو المرجع الوحيد ────────────────────
  // المنطق: مشترك → مسموح | تجربة نشطة → مسموح | منتهية → محجوب
  const _cfoUser   = window.getAccessUser();
  const _cfoAccess = window.canAccessFeature(_cfoUser, 'cfo_full');

  console.log('[Tawakkad][CFO] plan=%s | trialActive=%s | access=%s',
    _cfoUser.plan, _cfoUser.isTrialActive, _cfoAccess);

  if (!_cfoAccess) {
    input.value = '';
    appendCFOMessage('ai',
      '🔒 **انتهت فترة التجربة المجانية.**\n\n' +
      'اشترك في الخطة المدفوعة للوصول إلى AI CFO وجميع الميزات.');
    if (typeof showUpgradeModal === 'function') showUpgradeModal('AI CFO', 'paid');
    return;
  }

  input.value = '';
  input.style.height = 'auto';

  // Hide suggestions after first message
  document.getElementById('cfoSuggestions').style.display = 'none';

  // Add user message
  appendCFOMessage('user', msg);

  // Add to history
  CFO_HISTORY.push({ role: 'user', content: msg });

  // Show typing
  const typingId = appendCFOTyping();

  document.getElementById('cfoSendBtn').disabled = true;

  // ── تأكد من تحميل بيانات حاسبة التكاليف (PC_STATE) قبل بناء الـ prompt ──
  // pcLoadFromDB تُشغَّل عند فتح الصفحة لكن إذا كانت لم تنته بعد، ننتظرها هنا
  if (typeof pcLoadFromDB === 'function' && (!window.PC_STATE?.products?.length)) {
    try { await pcLoadFromDB(); } catch(e) { /* استمر حتى لو فشل التحميل */ }
  }

  // ═══════════════════════════════════════════════════
  // 🔍 DIAGNOSTIC LOG #1 — حالة PC_STATE قبل بناء الـ prompt
  // ═══════════════════════════════════════════════════
  console.log('%c[CFO DIAG #1] window.PC_STATE', 'color:#f90;font-weight:bold', window.PC_STATE);
  console.log('%c[CFO DIAG #1] window.PC_STATE?.products', 'color:#f90;font-weight:bold', window.PC_STATE?.products);
  console.log('%c[CFO DIAG #1] عدد المنتجات في PC_STATE:', 'color:#f90;font-weight:bold', window.PC_STATE?.products?.length ?? 'غير موجود');
  console.log('%c[CFO DIAG #1] __CURRENT_PROJECT_ID__:', 'color:#f90;font-weight:bold', window.__CURRENT_PROJECT_ID__);
  const _diagKey = typeof projectProductCostsKey === 'function'
    ? projectProductCostsKey(window.__CURRENT_PROJECT_ID__ || 'default')
    : 'tw_product_costs';
  console.log('%c[CFO DIAG #1] مفتاح localStorage المستخدم:', 'color:#f90;font-weight:bold', _diagKey);
  console.log('%c[CFO DIAG #1] محتوى localStorage بهذا المفتاح:', 'color:#f90;font-weight:bold',
    JSON.parse(localStorage.getItem(_diagKey) || '[]'));
  // ═══════════════════════════════════════════════════

  const ctx = getCFOContext();

  // Update context bar
  if (ctx) {
    document.getElementById('cfoContextBar').style.display = 'flex';
    document.getElementById('cfoContextText').textContent =
      `متصل بـ ${ctx.bizName} — هامش الربح ${ctx.netMargin}% — مؤشر الصحة ${ctx.healthScore}/100`;
  }

  // ── التحقق من التوكن قبل البدء — خارج try لتجنب التنقل داخل طلب نشط ──
  if (!window.__AUTH_TOKEN__) {
    removeTyping(typingId);
    appendCFOMessage('ai', '⚠️ انتهت جلستك — يرجى تسجيل الدخول مجدداً.');
    document.getElementById('cfoSendBtn').disabled = false;
    input.focus();
    return;
  }

  try {
    let systemPrompt = buildCFOSystemPrompt(ctx);

    // ── مطابقة اسم المنتج في رسالة المستخدم ──────────────────────────────
    // نبحث عن أي منتج من PC_STATE يظهر اسمه (أو جزء منه) داخل سؤال المستخدم
    // وإذا وجدنا تطابقاً نُضيف سطراً صريحاً في أعلى الـ system prompt
    const _pcProdsForMatch = (window.PC_STATE?.products || []).filter(p => p && p.name);
    if (_pcProdsForMatch.length > 0) {
      const _msgLower = msg.trim().toLowerCase();
      // نرتب المنتجات من الأطول اسماً للأقصر حتى نطابق الأكثر تحديداً أولاً
      const _sorted = [..._pcProdsForMatch].sort((a, b) => b.name.length - a.name.length);
      const _matched = _sorted.find(p => {
        const nameLower = p.name.trim().toLowerCase();
        if (_msgLower.includes(nameLower)) return true;
        // مطابقة جزئية: إذا كان الاسم مكوناً من كلمتين أو أكثر، نطابق أي كلمة رئيسية (أكثر من 3 أحرف)
        const words = nameLower.split(/\s+/).filter(w => w.length > 3);
        return words.length > 0 && words.every(w => _msgLower.includes(w));
      });
      if (_matched) {
        systemPrompt = `[تنبيه للنموذج: المنتج المقصود في سؤال المستخدم هو "${_matched.name}" — استخدم بياناته من قسم "بيانات المنتجات الحالية" مباشرة للإجابة.]\n\n` + systemPrompt;
        console.log('[CFO] منتج مطابق اكتُشف:', _matched.name);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // ═══════════════════════════════════════════════════
    // 🔍 DIAGNOSTIC LOG #3 — الـ system prompt النهائي قبل الإرسال
    // ═══════════════════════════════════════════════════
    console.log('%c[CFO DIAG #3] CFO SYSTEM PROMPT (كامل):', 'color:#0cf;font-weight:bold', systemPrompt);
    const hasProdsSection = systemPrompt.includes('بيانات المنتجات');
    console.log('%c[CFO DIAG #3] هل يحتوي الـ prompt على قسم المنتجات؟', 'color:#0cf;font-weight:bold', hasProdsSection);
    // ═══════════════════════════════════════════════════

    // System prompt as messages[0] so it is guaranteed to be the first
    // entry in the array sent to OpenAI — no reliance on server-side
    // body.system branching. _type:'cfo' lets the API apply CFO-specific
    // settings (higher max_tokens, no cache).
    const payload = {
      _type: 'cfo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...CFO_HISTORY.slice(-10)
      ]
    };

    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (window.__AUTH_TOKEN__ || '')
      },
      body: JSON.stringify(payload)
    });

    // ── التحقق من حالة الاستجابة قبل قراءة JSON ──
    if (!resp.ok) {
      let serverMsg = '';
      try {
        const errJson = await resp.json();
        serverMsg = errJson.error || JSON.stringify(errJson);
      } catch {
        serverMsg = await resp.text().catch(() => '');
      }
      throw new Error(`[${resp.status}] ${serverMsg.slice(0, 200)}`);
    }

    // ── التحقق من Content-Type قبل تحليل JSON ──
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await resp.text().catch(() => '');
      throw new Error(`Unexpected response type (${contentType}): ${raw.slice(0, 120)}`);
    }

    const data = await resp.json();

    // ── فحص حد يومي (3 رسائل/يوم للمشتركين) أو انتهاء التجربة ──
    if (data.limit_reached || data.trial_expired) {
      removeTyping(typingId);
      const _limitMsg = data.trial_expired
        ? '🔒 **انتهت فترة التجربة المجانية.**\n\nاشترك في الخطة المدفوعة للمتابعة.'
        : `🔒 **وصلت لحد ${window.PLAN_CONFIG?.PAID_CFO_PER_DAY ?? 3} رسائل AI CFO اليوم.**\n\nيتجدد الغد.`;
      appendCFOMessage('ai', _limitMsg);
      if (data.trial_expired && typeof showUpgradeModal === 'function') showUpgradeModal('AI CFO', 'paid');
      return;
    }

    const reply = data.content?.map(i => i.text || '').join('').trim()
      || 'عذراً، لم يصل رد من المستشار. حاول مرة أخرى.';

    // Add to history
    CFO_HISTORY.push({ role: 'assistant', content: reply });

    removeTyping(typingId);
    appendCFOMessage('ai', reply);

  } catch(e) {
    console.error('AI CFO error:', e);
    removeTyping(typingId);
    const errDetail = e.message ? `\n\`${e.message}\`` : '';
    appendCFOMessage('ai', `⚠️ تعذّر الاتصال بالمستشار المالي — تأكد من الإنترنت وحاول مرة أخرى.${errDetail}`);
  } finally {
    document.getElementById('cfoSendBtn').disabled = false;
    input.focus();
  }
}

function appendCFOMessage(role, text) {
  const msgs = document.getElementById('cfoMessages');
  const div = document.createElement('div');
  div.className = `cfo-msg ${role}`;

  // Format text: bold **text**, newlines
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
    .replace(/^[-•]\s*/gm, '• ');

  div.innerHTML = `
    <div class="cfo-avatar ${role}">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="cfo-bubble ${role}">${formatted}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function appendCFOTyping() {
  const msgs = document.getElementById('cfoMessages');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'cfo-msg';
  div.id = id;
  div.innerHTML = `
    <div class="cfo-avatar ai">🤖</div>
    <div class="cfo-bubble ai">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}


// ══════════════════════════════════════════
// ACTION PLAN
// ══════════════════════════════════════════
async function generateActionPlan() {
  const rep = STATE.currentReport;
  if (!rep) { toast('أجرِ تحليلاً أولاً'); showPage('analysis'); return; }

  const c = document.getElementById('actionPlanContent');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray);">⏳ جاري توليد الخطة...</div>';

  const m = rep.metrics;
  const prompt = `أنت مستشار مالي. بناءً على بيانات "${rep.bizName}":
- الإيرادات: ${m.revenue?.toLocaleString()} ﷼ | صافي الربح: ${m.netProfit?.toLocaleString()} ﷼ | هامش: ${m.netMargin}%
- تكاليف البضاعة: ${m.cogsPct}% | الإيجار: ${m.rentPct}% | الرواتب: ${m.salPct}%
- مؤشر الصحة: ${rep.scoreData?.total}/100
- التنبيهات: ${rep.alerts?.map(a=>a.msg).join(' | ') || 'لا يوجد'}

أعطني خطة عمل 4 أسابيع بالتنسيق التالي بالضبط (JSON فقط بدون أي نص آخر):
{
  "weeks": [
    {
      "week": 1,
      "focus": "عنوان التركيز",
      "actions": [
        {"text": "الإجراء", "impact": "التأثير المتوقع مثل يوفر 2000 ﷼ شهرياً", "priority": "high|med|low"}
      ]
    }
  ]
}`;

  try {
    if (!window.__AUTH_TOKEN__) throw new Error('no auth token');

    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (window.__AUTH_TOKEN__ || '')
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) throw new Error(`Action plan API error: ${resp.status}`);

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('non-JSON response');

    const data = await resp.json();
    let text = data.content?.map(i=>i.text||'').join('') || '';
    text = text.replace(/```json|```/g,'').trim();

    // JSON.parse منفصل في try/catch خاص لتفادي انهيار الصفحة
    let plan;
    try {
      plan = JSON.parse(text);
    } catch(jsonErr) {
      console.error('Action plan JSON parse error:', jsonErr, '\nRaw text:', text);
      renderActionPlan(defaultActionPlan(rep));
      return;
    }

    if (!plan?.weeks?.length) throw new Error('empty or invalid plan structure');
    renderActionPlan(plan.weeks);

  } catch(e) {
    console.error('generateActionPlan error:', e);
    renderActionPlan(defaultActionPlan(rep));
  }
}

function defaultActionPlan(rep) {
  const m = rep.metrics;
  return [
    { week:1, focus:'تخفيض التكاليف الفورية', actions:[
      {text:'راجع عقود الموردين وطلب تخفيض 5-10%', impact:'وفر تصل '+fmt(m.cogs*0.07)+' ﷼', priority:'high'},
      {text:'حدّد المصاريف غير الضرورية وأوقفها فوراً', impact:'تخفيض مباشر للتكاليف', priority:'high'},
      {text:'راجع ساعات العمل وتوزيع الموظفين', impact:'تحسين الكفاءة التشغيلية', priority:'med'},
    ]},
    { week:2, focus:'تحسين الإيرادات', actions:[
      {text:'رفع أسعار المنتجات ذات الهامش المنخفض 5-8%', impact:'زيادة الهامش '+m.netMargin+'%→'+(parseFloat(m.netMargin)+3)+'%', priority:'high'},
      {text:'فعّل حملة تسويقية للمنتج الأكثر ربحاً', impact:'زيادة المبيعات 10-15%', priority:'high'},
      {text:'اطلق عروض الولاء للعملاء الحاليين', impact:'تحسين الاحتفاظ بالعملاء', priority:'med'},
    ]},
    { week:3, focus:'تحسين العمليات', actions:[
      {text:'راجع جدول الطلبات والمخزون لتقليل الهدر', impact:'تخفيض COGS 3-5%', priority:'med'},
      {text:'أتمت العمليات المتكررة قدر الإمكان', impact:'توفير وقت وتكاليف', priority:'low'},
      {text:'حلّل ساعات الذروة وضع طاقم كافٍ', impact:'تحسين خدمة العملاء والمبيعات', priority:'med'},
    ]},
    { week:4, focus:'قياس النتائج والتخطيط', actions:[
      {text:'قارن أرقام هذا الشهر بالشهر الماضي', impact:'قياس أثر التحسينات', priority:'high'},
      {text:'حدّد 3 أهداف للشهر القادم بأرقام واضحة', impact:'توجيه استراتيجي واضح', priority:'high'},
      {text:'اعمل تحليل جديد على توكّد لقياس التحسن', impact:'متابعة دقيقة للأداء', priority:'med'},
    ]},
  ];
}

function renderActionPlan(weeks) {
  const c = document.getElementById('actionPlanContent');
  const _ppKey = typeof projectPlanProgressKey === 'function'
    ? projectPlanProgressKey(window.__CURRENT_PROJECT_ID__ || 'default')
    : 'tw_plan_progress';
  let progress = JSON.parse(localStorage.getItem(_ppKey) || '{}');

  c.innerHTML = weeks.map(w => `
    <div class="week-card">
      <div class="week-header">
        <div class="week-num">أ${w.week}</div>
        <div><div class="week-title">الأسبوع ${w.week}</div><div class="week-focus">${w.focus}</div></div>
        <div style="margin-right:auto;font-size:12px;color:var(--gray);">
          ${w.actions.filter((_,i)=>progress[w.week+'-'+i]).length}/${w.actions.length} مكتمل
        </div>
      </div>
      ${w.actions.map((a,i) => {
        const key = w.week+'-'+i;
        const done = !!progress[key];
        const priLabel = a.priority==='high'?'عالي':a.priority==='med'?'متوسط':'منخفض';
        const priClass = a.priority==='high'?'pri-high':a.priority==='med'?'pri-med':'pri-low';
        return `<div class="action-item ${done?'done':''}" onclick="toggleAction(${w.week},${i},this)">
          <div class="ai-check">${done?'✓':''}</div>
          <div style="flex:1;">
            <div class="ai-text">${a.text}</div>
            <div class="ai-impact">📈 ${a.impact}</div>
          </div>
          <div class="ai-priority ${priClass}">${priLabel}</div>
        </div>`;
      }).join('')}
    </div>`).join('');

  STATE._actionPlanWeeks = weeks;
}

function toggleAction(week, idx, el) {
  const _ppKey = typeof projectPlanProgressKey === 'function'
    ? projectPlanProgressKey(window.__CURRENT_PROJECT_ID__ || 'default')
    : 'tw_plan_progress';
  let progress = JSON.parse(localStorage.getItem(_ppKey) || '{}');
  const key = week+'-'+idx;
  progress[key] = !progress[key];
  localStorage.setItem(_ppKey, JSON.stringify(progress));
  el.classList.toggle('done');
  const check = el.querySelector('.ai-check');
  if(el.classList.contains('done')){check.textContent='✓';} else {check.textContent='';}
}

// ══════════════════════════════════════════
// CASH FLOW
// ══════════════════════════════════════════

window.sendCFO = sendCFO;
window.generateActionPlan = generateActionPlan;
window.renderActionPlan = renderActionPlan;
window.toggleAction = toggleAction;
