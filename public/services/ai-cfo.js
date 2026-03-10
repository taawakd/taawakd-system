// services/ai-cfo.js — CFO + Action Plan

async function sendCFO(quickMsg) {
  const input = document.getElementById('cfoInput');
  const msg = quickMsg || input.value.trim();
  if (!msg) return;

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

  const ctx = getCFOContext();

  // Update context bar
  if (ctx) {
    document.getElementById('cfoContextBar').style.display = 'flex';
    document.getElementById('cfoContextText').textContent =
      `متصل بـ ${ctx.bizName} — هامش الربح ${ctx.netMargin}% — مؤشر الصحة ${ctx.healthScore}/100`;
  }

  try {
    // ✅ إصلاح 401: تأكد من وجود التوكن قبل الإرسال
    // التوكن محفوظ من onAuthStateChange — نستخدمه مباشرة
    if (!window.__AUTH_TOKEN__) { window.location.href = '/auth.html'; return; }

    const systemPrompt = buildCFOSystemPrompt(ctx);

    // ── debug: confirm previous reports reach the prompt ──
    console.log('[Tawakkad] CFO ctx.cfoContext.previous:', ctx?.cfoContext?.previous);
    console.log('[Tawakkad] CFO system prompt:', systemPrompt);

    // Keep last 10 messages for context
    const messages = CFO_HISTORY.slice(-10);

    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (window.__AUTH_TOKEN__ || '')
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await resp.json();
    const reply = data.content?.map(i => i.text || '').join('') || 'عذراً، حدث خطأ. حاول مجدداً.';

    // Add to history
    CFO_HISTORY.push({ role: 'assistant', content: reply });

    removeTyping(typingId);
    appendCFOMessage('ai', reply);

  } catch(e) {
    removeTyping(typingId);
    appendCFOMessage('ai', '⚠️ تعذّر الاتصال. تأكد من الإنترنت وحاول مجدداً.');
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
    const data = await resp.json();
    let text = data.content?.map(i=>i.text||'').join('') || '';
    text = text.replace(/```json|```/g,'').trim();
    const plan = JSON.parse(text);
    renderActionPlan(plan.weeks);
  } catch(e) {
    renderActionPlan(defaultActionPlan(rep));
  }
}

function defaultActionPlan(rep) {
  const m = rep.metrics;
  return [
    { week:1, focus:'تخفيض التكاليف الفورية', actions:[
      {text:'راجع عقود الموردين وطلب تخفيض 5-10%', impact:'وفر تصل '+fmt(m.cogs*0.07)+' ر', priority:'high'},
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
  let progress = JSON.parse(localStorage.getItem('tw_plan_progress') || '{}');

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
  let progress = JSON.parse(localStorage.getItem('tw_plan_progress') || '{}');
  const key = week+'-'+idx;
  progress[key] = !progress[key];
  localStorage.setItem('tw_plan_progress', JSON.stringify(progress));
  el.classList.toggle('done');
  const check = el.querySelector('.ai-check');
  if(el.classList.contains('done')){check.textContent='✓';} else {check.textContent='';}
}

function exportActionPlanPDF() {
  toast('جاري تصدير الخطة...');
  // Uses same jsPDF logic
  if(!STATE._actionPlanWeeks){toast('لا توجد خطة لتصديرها');return;}
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({unit:'mm',format:'a4'});
  doc.setFillColor(7,8,10); doc.rect(0,0,210,297,'F');
  doc.setFillColor(200,164,90); doc.rect(0,0,210,3,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(200,164,90);
  doc.text('Action Plan — ' + (STATE.currentReport?.bizName||''), 105, 20, {align:'center'});
  let y = 35;
  STATE._actionPlanWeeks.forEach(w => {
    doc.setFontSize(12); doc.setTextColor(200,164,90);
    doc.text('Week '+w.week+': '+w.focus, 20, y); y+=8;
    w.actions.forEach(a => {
      doc.setFontSize(9); doc.setTextColor(160,155,145);
      doc.text('• '+a.text, 25, y); y+=6;
      doc.setFontSize(8); doc.setTextColor(100,95,88);
      doc.text('  → '+a.impact, 28, y); y+=7;
      if(y>270){doc.addPage();doc.setFillColor(7,8,10);doc.rect(0,0,210,297,'F');y=20;}
    });
    y+=5;
  });
  doc.save('tawakkad-action-plan.pdf');
}

// ══════════════════════════════════════════
// CASH FLOW
// ══════════════════════════════════════════

window.sendCFO = sendCFO;
window.generateActionPlan = generateActionPlan;
window.renderActionPlan = renderActionPlan;
window.toggleAction = toggleAction;
window.exportActionPlanPDF = exportActionPlanPDF;
