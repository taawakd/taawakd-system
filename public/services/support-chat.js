// services/support-chat.js — ممثل خدمة عملاء توكّد

(function () {
  var SC_HISTORY = [];
  var SC_OPEN = false;
  var SC_TYPING = false;
  var SC_GREETED = false;

  // ── فتح/إغلاق نافذة الشات ──
  window.toggleSupportChat = function () {
    SC_OPEN = !SC_OPEN;
    var widget = document.getElementById('supportChatWidget');
    if (!widget) return;
    if (SC_OPEN) {
      widget.classList.add('open');
      if (!SC_GREETED) {
        SC_GREETED = true;
        _scAppendMsg('bot', 'مرحباً! 👋 أنا مساعد توكّد. كيف أقدر أساعدك اليوم؟');
      }
      setTimeout(function () {
        var inp = document.getElementById('supportChatInput');
        if (inp) inp.focus();
      }, 80);
    } else {
      widget.classList.remove('open');
    }
  };

  // ── إرسال رسالة ──
  window.supportChatSend = function () {
    var input = document.getElementById('supportChatInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg || SC_TYPING) return;
    input.value = '';
    input.style.height = '38px';
    _scAppendMsg('user', msg);
    var historySnapshot = SC_HISTORY.slice();
    SC_HISTORY.push({ role: 'user', content: msg });
    _scSetTyping(true);

    fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: historySnapshot })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _scSetTyping(false);
        var reply = data.reply || data.error || 'عذراً، حدث خطأ. حاول مرة أخرى.';
        _scAppendMsg('bot', reply);
        SC_HISTORY.push({ role: 'assistant', content: reply });
        if (reply.includes('واتساب') || reply.includes('الدعم') || reply.includes('تواصل')) {
          _scAppendWhatsApp();
        }
      })
      .catch(function () {
        _scSetTyping(false);
        _scAppendMsg('bot', 'تعذّر الاتصال. تحقق من الإنترنت أو تواصل معنا مباشرة.');
        _scAppendWhatsApp();
      });
  };

  // ── إضافة رسالة في الشات ──
  function _scAppendMsg(role, text) {
    var msgs = document.getElementById('supportChatMessages');
    if (!msgs) return;
    var div = document.createElement('div');
    div.className = 'sc-msg ' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── زر واتساب ──
  function _scAppendWhatsApp() {
    var msgs = document.getElementById('supportChatMessages');
    if (!msgs) return;
    // لا تضيفه مرتين
    if (msgs.querySelector('.sc-whatsapp-btn')) return;
    var a = document.createElement('a');
    a.href = 'https://wa.me/966500000000?text=' + encodeURIComponent('مرحباً، أحتاج مساعدة في منصة توكّد');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'sc-whatsapp-btn';
    a.innerHTML = '💬 تواصل عبر واتساب';
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── مؤشر الكتابة ──
  function _scSetTyping(on) {
    SC_TYPING = on;
    var btn = document.getElementById('supportChatSend');
    if (btn) btn.disabled = on;
    var existing = document.querySelector('.sc-msg.typing');
    if (on && !existing) {
      var msgs = document.getElementById('supportChatMessages');
      if (!msgs) return;
      var div = document.createElement('div');
      div.className = 'sc-msg typing';
      div.textContent = 'يكتب...';
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    } else if (!on && existing) {
      existing.remove();
    }
  }

  // ── استماع للأحداث (تفويض على document لأن العناصر تُحقن لاحقاً) ──
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.id === 'supportChatInput') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.supportChatSend();
      }
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'supportChatInput') {
      e.target.style.height = '38px';
      e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
    }
  });
})();
