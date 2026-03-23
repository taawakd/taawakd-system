// api/support.js — ممثل خدمة عملاء توكّد بالذكاء الاصطناعي

const ALLOWED_ORIGINS = [
  'https://towkd.com',
  'https://www.towkd.com',
  'https://app.towkd.com',
  'https://admin.towkd.com',
];

const SYSTEM_PROMPT = `أنت ممثل خدمة عملاء لمنصة "توكّد" (towkd.com)، منصة تحليل مالي ذكية تساعد أصحاب الأعمال الصغيرة على فهم أوضاعهم المالية واتخاذ قرارات أفضل.

**معلومات المنصة:**
- توكّد منصة سعودية متخصصة في التحليل المالي للأعمال الصغيرة
- تدعم: المطاعم، المقاهي، البقالات، الصالونات، والأعمال التجارية المختلفة
- خدمات المنصة: تحليل الإيرادات والمصاريف، درجة الصحة المالية، AI CFO، مقارنة السوق، التدفق النقدي، خطة العمل، التوقعات الذكية، حاسبة تكلفة المنتج، مقارنة الفترات، تحليل التسعير
- الخطط: مجانية (3 تحليلات تجريبية) ومدفوعة (79 ريال/شهر - جميع المميزات غير محدودة)
- طريقة الاستخدام: رفع ملف Excel بالبيانات الشهرية (الإيرادات والمصاريف)، أو رفع منيو المطعم لاستخراج المنتجات تلقائياً
- الدفع: آمن مع ضمان استرداد 7 أيام
- الدعم المباشر: واتساب

**مشاكل شائعة وحلولها:**
- "ما أقدر أرفع الملف": تأكد أن الملف بصيغة Excel (.xlsx) وأن الأعمدة مرتبة صح (الإيرادات، التكاليف، الإيجار... إلخ)
- "التحليل ما يشتغل": تحقق من اتصال الإنترنت وحاول مرة ثانية، إذا استمرت المشكلة تواصل مع الدعم
- "وصلت للحد المجاني": الخطة المجانية تتيح 3 تحليلات تجريبية، للاستمرار يلزم الترقية للخطة المدفوعة
- "ما أقدر أدخل حسابي": استخدم خيار "نسيت كلمة المرور" في صفحة تسجيل الدخول
- "AI CFO لا يرد": تأكد من وجود تحليل محفوظ أولاً، لأن AI CFO يحتاج بيانات لتحليلها
- "كيف أرفع المنيو": اختر "تحليل جديد" ثم استخدم زر مسح المنيو لرفع صورة المنيو
- "كيف أحذف تقرير": ادخل على "التقارير المحفوظة" وانقر على أيقونة الحذف بجانب التقرير

**أسلوبك:**
- ودود ومحترف
- ردود مختصرة وواضحة
- إذا كان بإمكانك حل المشكلة، قدم الحل خطوة بخطوة
- إذا لم تتمكن من حل المشكلة أو كانت تتعلق بحساب المستخدم أو دفع أو مشكلة تقنية متقدمة، اقترح التواصل مع الدعم المباشر عبر واتساب
- تكلم بالعربية دائماً
- لا تُطوّل الردود دون داعٍ`;

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'الرسالة مطلوبة' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'الرسالة طويلة جداً' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'خطأ في الإعدادات، يرجى التواصل مع الدعم' });
  }

  // بناء سجل المحادثة (آخر 6 رسائل فقط للاقتصاد في التوكنز)
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  const messages = [
    ...safeHistory.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).substring(0, 500)
    })),
    { role: 'user', content: message.trim() }
  ];

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      console.error('Anthropic API error:', claudeRes.status);
      return res.status(502).json({ error: 'خطأ مؤقت، حاول مرة أخرى' });
    }

    const data = await claudeRes.json();
    const reply = data?.content?.[0]?.text || 'عذراً، لم أتمكن من الرد. يرجى التواصل مع الدعم مباشرة.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Support chat error:', err);
    return res.status(500).json({ error: 'خطأ مؤقت، حاول مرة أخرى أو تواصل مع الدعم' });
  }
}
