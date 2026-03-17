// api/menu-ocr.js — قراءة المنيو بالذكاء الاصطناعي وإرجاع قائمة المنتجات
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};

const ALLOWED_ORIGINS = [
  'https://towkd.com',
  'https://www.towkd.com',
  'https://app.towkd.com',
  'https://admin.towkd.com',
];

// ─── Prompt للنموذج ────────────────────────────────────────────────────────
const MENU_SYSTEM_PROMPT = `أنت نظام استخراج بيانات متخصص في قراءة قوائم الأسعار (المنيو).

مهمتك الوحيدة: استخرج اسم المنتج وسعره فقط.

القواعد الصارمة:
1. تجاهل تماماً: السعرات الحرارية، الوصف، المكونات، وأي معلومات إضافية.
2. تجاهل أي رقم مرتبط بكلمات: kcal / cal / سعرة / سعرات / كالوري.
3. السعر عادةً رقم صغير (5 إلى 500 ريال). الأرقام الكبيرة جداً (>1000) غالباً سعرات حرارية — تجاهلها.
4. إذا وُجد أكثر من رقم في السطر، اختر الأقرب لكلمات: ريال / SAR / ر.س.
5. لا تُضف منتجات مكررة.
6. إذا لم يكن للمنتج سعر واضح، تجاهله.

أجب بـ JSON فقط — بدون أي نص إضافي قبله أو بعده:
[
  { "name": "اسم المنتج", "price": 0 }
]`;

// ─── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ─ تحقق من الجلسة ─────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'جلسة منتهية، سجّل دخولك مجدداً' });

  const { fileBase64, mimeType, extractedText } = req.body || {};

  // ─ التحقق من المدخلات ─────────────────────────────────────────────────
  const isImage = mimeType && (mimeType.startsWith('image/jpeg') || mimeType.startsWith('image/png') || mimeType.startsWith('image/jpg'));
  const isPdfText = typeof extractedText === 'string' && extractedText.trim().length > 10;

  if (!isImage && !isPdfText) {
    return res.status(400).json({ error: 'نوع الملف غير مدعوم. يُرجى رفع صورة PNG/JPG أو PDF.' });
  }

  if (isImage && (!fileBase64 || fileBase64.length < 100)) {
    return res.status(400).json({ error: 'الملف فارغ أو غير صالح.' });
  }

  // ─ بناء الرسائل للنموذج (Anthropic Claude) ───────────────────────────
  let messages;

  if (isImage) {
    // رؤية الصورة — صيغة Anthropic للصور
    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,   // e.g. "image/jpeg" or "image/png"
              data: fileBase64,
            },
          },
          {
            type: 'text',
            text: 'اقرأ هذا المنيو واستخرج المنتجات والأسعار فقط بصيغة JSON كما هو مطلوب.',
          },
        ],
      },
    ];
  } else {
    // نص مستخرج من PDF
    messages = [
      {
        role: 'user',
        content: `هذا نص مستخرج من ملف PDF لقائمة طعام (منيو):\n\n${extractedText.substring(0, 8000)}\n\nاستخرج المنتجات والأسعار فقط بصيغة JSON كما هو مطلوب.`,
      },
    ];
  }

  // ─ استدعاء Anthropic Claude ────────────────────────────────────────────
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
        max_tokens: 3000,
        system: MENU_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errData = await claudeRes.json().catch(() => ({}));
      console.error('Anthropic error:', errData);
      return res.status(502).json({ error: 'فشل تحليل الملف بواسطة الذكاء الاصطناعي. حاول مرة أخرى.' });
    }

    const aiData = await claudeRes.json();
    const content = aiData?.content?.[0]?.text || '';

    // ─ استخراج JSON من الرد ──────────────────────────────────────────────
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return res.status(422).json({
        error: 'لم يتم العثور على منتجات في هذا الملف. تأكد أن الصورة تحتوي على قائمة أسعار واضحة.',
        raw: content.substring(0, 500),
      });
    }

    let products;
    try {
      products = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return res.status(422).json({ error: 'تعذّر تحليل بيانات المنتجات. حاول مرة أخرى.' });
    }

    // ─ تنظيف وفلترة النتائج ──────────────────────────────────────────────
    products = products
      .filter(p => p && typeof p.name === 'string' && p.name.trim().length > 0)
      .map(p => ({
        name: String(p.name).trim(),
        price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '0').replace(/[,،]/g, '')) || 0,
      }))
      .filter(p => p.price >= 0);

    // إزالة المكررات
    const seen = new Set();
    products = products.filter(p => {
      const key = p.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (products.length === 0) {
      return res.status(422).json({
        error: 'لم يتم العثور على منتجات بأسعار واضحة في الملف.',
      });
    }

    return res.status(200).json({ products });

  } catch (err) {
    console.error('menu-ocr handler error:', err);
    return res.status(500).json({ error: 'خطأ داخلي — حاول مرة أخرى لاحقاً.' });
  }
}
