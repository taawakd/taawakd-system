// services/support-chat.js — مساعد دعم توكّد بالإجابات الجاهزة (بدون AI)

(function () {
  var SC_OPEN    = false;
  var SC_TYPING  = false;
  var SC_GREETED = false;

  // ══════════════════════════════════════════════════════════════════════
  // قائمة الأسئلة الشائعة — كل سؤال يحتوي على:
  //   q : كلمات مفتاحية (أي منها يكفي للمطابقة)
  //   a : الرد الجاهز
  // ══════════════════════════════════════════════════════════════════════
  var FAQ = [
    {
      q: ['كيف أبدأ', 'ابدأ تحليل', 'أول تحليل', 'ابدا', 'البداية', 'كيف ابدا'],
      a: 'لبدء أول تحليل:\n1) اضغط "تحليل جديد"\n2) أدخل بيانات مشروعك\n3) أضف المنتجات أو الخدمات\n4) اضغط "تحليل"\nوسيتم إنشاء التقرير فورًا.'
    },
    {
      q: ['النتائج مقفلة', 'ليش مقفل', 'ما تظهر النتائج', 'مقفل', 'قفل', 'اقفال', 'مقفوله'],
      a: 'النتائج مقفلة لأن فترة التجربة انتهت.\nيمكنك الاشتراك لفتح جميع الميزات.'
    },
    {
      q: ['كيف اشترك', 'تفعيل الاشتراك', 'ادفع', 'الاشتراك', 'اشتراك', 'اشترك', 'دفع'],
      a: 'لتفعيل الاشتراك:\n1) اضغط على "اشترك الآن"\n2) اختر الباقة الشهرية\n3) أكمل الدفع\nوسيتم تفعيل الحساب مباشرة.'
    },
    {
      q: ['مدة التجربة', 'كم التجربة', '7 أيام', '14 يوم', 'التجربة المجانية', 'المجانيه', 'كم يوم'],
      a: 'فترة التجربة المجانية هي 14 يومًا من أول تسجيل، وتشمل جميع الميزات كاملة.'
    },
    {
      q: ['كم تحليل', 'عدد التحاليل', 'حد التحليل', 'تحاليل', 'كم مره', 'كم مرة'],
      a: 'في الاشتراك الشهري يمكنك إجراء 8 تحاليل شهريًا.'
    },
    {
      q: ['ai cfo', 'الذكاء ما يشتغل', 'cfo ما يشتغل', 'المستشار', 'cfo', 'الذكاء الاصطناعي'],
      a: 'ميزة AI CFO تعمل فقط أثناء التجربة أو مع الاشتراك المدفوع.'
    },
    {
      q: ['بدون اشتراك', 'مجاني', 'هل مجاني', 'مجانا', 'مجانًا', 'بلاش'],
      a: 'يمكنك استخدام النظام مجانًا لمدة 14 يومًا، بعدها يتطلب الاشتراك للاستمرار.'
    },
    {
      q: ['اضيف منتجات', 'كيف اضيف خدمات', 'اضافة منتج', 'اضافة خدمة', 'اضيف', 'إضافة'],
      a: 'لإضافة المنتجات:\n1) ادخل صفحة التحليل\n2) أضف المنتج أو الخدمة\n3) احفظ البيانات\nوسيتم استخدامها في التحليل.'
    },
    {
      q: ['نتائج غريبة', 'تحليل غلط', 'نتائج خاطئة', 'غلط', 'خطأ في التحليل', 'بيانات خاطئة'],
      a: 'تأكد من:\n- صحة الأسعار\n- دقة التكاليف\n- إدخال جميع البيانات\nلأن التحليل يعتمد عليها بالكامل.'
    },
    {
      q: ['هل البيانات محفوظة', 'بياناتي تضيع', 'حفظ البيانات', 'بياناتي', 'ضاعت', 'تضيع'],
      a: 'جميع بياناتك وتحليلاتك محفوظة في النظام ويمكنك الرجوع لها في أي وقت.'
    },
    {
      q: ['نسيت كلمة المرور', 'كلمة السر', 'تسجيل دخول', 'ما اقدر ادخل', 'نسيت'],
      a: 'لاستعادة كلمة المرور:\n1) اضغط "نسيت كلمة المرور" في صفحة تسجيل الدخول\n2) أدخل بريدك الإلكتروني\n3) تحقق من بريدك لرابط التغيير.'
    },
    {
      q: ['سعر الاشتراك', 'كم الاشتراك', 'كم السعر', 'السعر', 'التكلفة', 'رسوم'],
      a: 'سعر الاشتراك الشهري هو 79 ريال سعودي فقط، ويشمل جميع الميزات بدون قيود.'
    },
    {
      q: ['الغاء الاشتراك', 'إلغاء', 'وقف الاشتراك', 'الغاء'],
      a: 'لإلغاء الاشتراك تواصل مع الدعم عبر واتساب وسنساعدك فورًا.'
    },
    {
      q: ['تقرير', 'حفظ التقرير', 'تحميل التقرير', 'pdf', 'تصدير'],
      a: 'يمكنك حفظ وتصدير تقاريرك بصيغة PDF من صفحة النتائج، وتتوفر هذه الميزة للمشتركين وأثناء التجربة المجانية.'
    },
    {
      q: ['مقارنة', 'مقارنة التقارير', 'قارن'],
      a: 'ميزة مقارنة التقارير تتيح لك مقارنة أداء مشروعك بين فترتين مختلفتين، وتتوفر للمشتركين وأثناء التجربة.'
    },
    {
      q: ['شكراً', 'شكرا', 'ممتاز', 'عال', 'تمام', 'وايد زين', 'حلو'],
      a: 'شكراً لك! 😊 يسعدنا دائمًا مساعدتك. هل هناك شيء آخر تحتاجه؟'
    },
    {
      q: ['مرحبا', 'اهلا', 'السلام', 'هلا', 'هاي', 'hi', 'hello'],
      a: 'أهلاً وسهلاً! 👋 كيف أقدر أساعدك اليوم؟'
    }
  ];

  // ══════════════════════════════════════════════════════════════════════
  // _scMatchFAQ(msg) — البحث في قائمة الأسئلة الشائعة
  // يعيد نص الإجابة أو null إذا لم تُوجد مطابقة
  // ══════════════════════════════════════════════════════════════════════
  function _scMatchFAQ(msg) {
    var normalized = msg.toLowerCase().trim();
    console.log('[Tawakkad][SupportChat] سؤال المستخدم:', normalized);

    for (var i = 0; i < FAQ.length; i++) {
      var entry = FAQ[i];
      for (var j = 0; j < entry.q.length; j++) {
        var keyword = entry.q[j].toLowerCase();
        if (normalized.includes(keyword)) {
          console.log('[Tawakkad][SupportChat] مطابقة وجدت — السؤال:', entry.q[j], '| الإجابة:', entry.a.substring(0, 60) + '...');
          return entry.a;
        }
      }
    }

    console.log('[Tawakkad][SupportChat] لم تُوجد مطابقة للسؤال:', normalized);
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════
  // فتح/إغلاق نافذة الشات
  // ══════════════════════════════════════════════════════════════════════
  window.toggleSupportChat = function () {
    SC_OPEN = !SC_OPEN;
    var widget = document.getElementById('supportChatWidget');
    if (!widget) return;
    if (SC_OPEN) {
      widget.classList.add('open');
      if (!SC_GREETED) {
        SC_GREETED = true;
        _scAppendMsg('bot', 'مرحباً! 👋 أنا مساعد توكّد.\nاسألني عن أي شيء وسأجيبك فورًا.');
      }
      setTimeout(function () {
        var inp = document.getElementById('supportChatInput');
        if (inp) inp.focus();
      }, 80);
    } else {
      widget.classList.remove('open');
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // إرسال رسالة — يبحث في FAQ محلياً بدون AI أو API
  // ══════════════════════════════════════════════════════════════════════
  window.supportChatSend = function () {
    var input = document.getElementById('supportChatInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg || SC_TYPING) return;
    input.value = '';
    input.style.height = '38px';

    _scAppendMsg('user', msg);
    _scSetTyping(true);

    // تأخير بسيط لطبيعية التجربة (لا يوجد AI فعلي)
    setTimeout(function () {
      _scSetTyping(false);
      var answer = _scMatchFAQ(msg);

      if (answer) {
        _scAppendMsg('bot', answer);
      } else {
        _scAppendMsg('bot', 'لم أستطع فهم سؤالك. 🙏\nتواصل مع الدعم عبر واتساب وسنساعدك مباشرة.');
        _scAppendWhatsApp();
      }
    }, 600);
  };

  // ══════════════════════════════════════════════════════════════════════
  // إضافة رسالة — تدعم الأسطر الجديدة (\n) وتعرضها كـ <br>
  // ══════════════════════════════════════════════════════════════════════
  function _scAppendMsg(role, text) {
    var msgs = document.getElementById('supportChatMessages');
    if (!msgs) return;
    var div = document.createElement('div');
    div.className = 'sc-msg ' + role;

    // تحويل \n إلى <br> بشكل آمن (بدون innerHTML مباشرة)
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) div.appendChild(document.createElement('br'));
      div.appendChild(document.createTextNode(lines[i]));
    }

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ══════════════════════════════════════════════════════════════════════
  // زر واتساب — يظهر مرة واحدة فقط
  // ══════════════════════════════════════════════════════════════════════
  function _scAppendWhatsApp() {
    var msgs = document.getElementById('supportChatMessages');
    if (!msgs) return;
    if (msgs.querySelector('.sc-whatsapp-btn')) return; // لا تضيفه مرتين
    var a = document.createElement('a');
    a.href = 'https://wa.me/966500000000?text=' + encodeURIComponent('مرحباً، أحتاج مساعدة في منصة توكّد');
    a.target  = '_blank';
    a.rel     = 'noopener noreferrer';
    a.className = 'sc-whatsapp-btn';
    a.innerHTML = '💬 واتساب';
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ══════════════════════════════════════════════════════════════════════
  // مؤشر "يكتب..."
  // ══════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════
  // أحداث لوحة المفاتيح والنص
  // ══════════════════════════════════════════════════════════════════════
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
