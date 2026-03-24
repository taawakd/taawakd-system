// ════════════════════════════════════════════════════════════════
// category-products.js — خرائط المنتجات / الخدمات المقترحة حسب فئة النشاط
//
// المصدر الوحيد للحقيقة: business_profile.biz_type
// window._businessProfile.category = window._businessProfile.biz_type (مرادف مُصدَّر)
// ════════════════════════════════════════════════════════════════

/**
 * CATEGORY_PRODUCTS
 * ─────────────────
 * لكل فئة نشاط (biz_type slug) قائمة من المنتجات / الخدمات المقترحة.
 * الحقل type يتوافق مع PC_BENCHMARKS في product-cost.js:
 *   'طعام' | 'مشروب' | 'خدمة' | 'منتج بيع بالتجزئة'
 */
window.CATEGORY_PRODUCTS = {

  // ── مطاعم ومقاهي ─────────────────────────────────────────
  restaurant: [
    { name: 'وجبة رئيسية',    type: 'طعام',  salePrice: 35 },
    { name: 'وجبة سريعة',     type: 'طعام',  salePrice: 22 },
    { name: 'مشروب غازي',     type: 'مشروب', salePrice: 8  },
    { name: 'حلوى / تحلية',   type: 'طعام',  salePrice: 15 },
    { name: 'وجبة عائلية',    type: 'طعام',  salePrice: 85 },
  ],

  cafe: [
    { name: 'قهوة عربية',        type: 'مشروب', salePrice: 15 },
    { name: 'كابتشينو / لاتيه',  type: 'مشروب', salePrice: 20 },
    { name: 'عصير طازج',         type: 'مشروب', salePrice: 18 },
    { name: 'كيك / معجنات',      type: 'طعام',  salePrice: 20 },
    { name: 'ساندويتش',           type: 'طعام',  salePrice: 22 },
  ],

  cloud_kitchen: [
    { name: 'وجبة رئيسية',   type: 'طعام', salePrice: 32 },
    { name: 'بروتين مشوي',   type: 'طعام', salePrice: 48 },
    { name: 'وجبة صحية',     type: 'طعام', salePrice: 42 },
    { name: 'ساندويتش',       type: 'طعام', salePrice: 22 },
    { name: 'رجيم دايت',     type: 'طعام', salePrice: 55 },
  ],

  drive_thru: [
    { name: 'مشروب ساخن',    type: 'مشروب', salePrice: 15 },
    { name: 'مشروب بارد',    type: 'مشروب', salePrice: 18 },
    { name: 'وجبة سريعة',   type: 'طعام',  salePrice: 25 },
    { name: 'سناك / حلوى',  type: 'طعام',  salePrice: 12 },
  ],

  bakery: [
    { name: 'خبز',            type: 'طعام', salePrice: 5   },
    { name: 'كرواسون',        type: 'طعام', salePrice: 12  },
    { name: 'كيكة',           type: 'طعام', salePrice: 35  },
    { name: 'معجنات متنوعة',  type: 'طعام', salePrice: 8   },
    { name: 'تورتة خاصة',    type: 'طعام', salePrice: 120 },
  ],

  // ── تجارة ────────────────────────────────────────────────
  retail: [
    { name: 'منتج رئيسي',    type: 'منتج بيع بالتجزئة', salePrice: 50  },
    { name: 'منتج إضافي',    type: 'منتج بيع بالتجزئة', salePrice: 30  },
    { name: 'باقة تجميعية',  type: 'منتج بيع بالتجزئة', salePrice: 100 },
    { name: 'منتج موسمي',    type: 'منتج بيع بالتجزئة', salePrice: 60  },
  ],

  ecom: [
    { name: 'منتج أساسي',    type: 'منتج بيع بالتجزئة', salePrice: 60  },
    { name: 'منتج مميز',     type: 'منتج بيع بالتجزئة', salePrice: 120 },
    { name: 'باقة تجميعية',  type: 'منتج بيع بالتجزئة', salePrice: 200 },
    { name: 'منتج إضافي',    type: 'منتج بيع بالتجزئة', salePrice: 35  },
  ],

  dates: [
    { name: 'تمر عجوة',   type: 'منتج بيع بالتجزئة', salePrice: 50  },
    { name: 'تمر صفاوي',  type: 'منتج بيع بالتجزئة', salePrice: 40  },
    { name: 'هدية تمور',  type: 'منتج بيع بالتجزئة', salePrice: 120 },
    { name: 'تمر خلاص',   type: 'منتج بيع بالتجزئة', salePrice: 60  },
    { name: 'تمر سكري',   type: 'منتج بيع بالتجزئة', salePrice: 45  },
  ],

  perfumes: [
    { name: 'عطر رجالي',  type: 'منتج بيع بالتجزئة', salePrice: 150 },
    { name: 'عطر نسائي',  type: 'منتج بيع بالتجزئة', salePrice: 180 },
    { name: 'بخور',        type: 'منتج بيع بالتجزئة', salePrice: 80  },
    { name: 'دهن عود',    type: 'منتج بيع بالتجزئة', salePrice: 200 },
    { name: 'عطر عود',    type: 'منتج بيع بالتجزئة', salePrice: 250 },
  ],

  // ── خدمات صحية وتجميل ────────────────────────────────────
  clinic: [
    { name: 'استشارة طبية',  type: 'خدمة', salePrice: 150 },
    { name: 'كشف طبي',       type: 'خدمة', salePrice: 100 },
    { name: 'تحليل مختبري',  type: 'خدمة', salePrice: 80  },
    { name: 'إجراء طبي',     type: 'خدمة', salePrice: 300 },
    { name: 'متابعة دورية',  type: 'خدمة', salePrice: 80  },
  ],

  pharmacy: [
    { name: 'دواء شائع',         type: 'منتج بيع بالتجزئة', salePrice: 25 },
    { name: 'مكمل غذائي',        type: 'منتج بيع بالتجزئة', salePrice: 80 },
    { name: 'منتج عناية شخصية',  type: 'منتج بيع بالتجزئة', salePrice: 40 },
    { name: 'مستلزمات طبية',     type: 'منتج بيع بالتجزئة', salePrice: 55 },
  ],

  barber: [
    { name: 'قص شعر',      type: 'خدمة', salePrice: 40  },
    { name: 'حلاقة لحية',  type: 'خدمة', salePrice: 25  },
    { name: 'تشذيب لحية',  type: 'خدمة', salePrice: 20  },
    { name: 'قص + لحية',   type: 'خدمة', salePrice: 60  },
    { name: 'باقة العريس', type: 'خدمة', salePrice: 150 },
  ],

  beauty: [
    { name: 'مكياج',       type: 'خدمة', salePrice: 100 },
    { name: 'صبغة شعر',    type: 'خدمة', salePrice: 200 },
    { name: 'مانيكير',     type: 'خدمة', salePrice: 60  },
    { name: 'باديكير',     type: 'خدمة', salePrice: 70  },
    { name: 'علاج بشرة',   type: 'خدمة', salePrice: 150 },
  ],

  // ── خدمات تشغيلية ────────────────────────────────────────
  laundry: [
    { name: 'غسيل (كيلو)',       type: 'خدمة', salePrice: 8  },
    { name: 'كوي',                type: 'خدمة', salePrice: 5  },
    { name: 'غسيل + كوي (كيلو)', type: 'خدمة', salePrice: 12 },
    { name: 'تنظيف جاف',          type: 'خدمة', salePrice: 25 },
    { name: 'غسيل بطانية',        type: 'خدمة', salePrice: 30 },
  ],

  carwash: [
    { name: 'غسيل خارجي',         type: 'خدمة', salePrice: 30  },
    { name: 'غسيل داخلي + خارجي', type: 'خدمة', salePrice: 60  },
    { name: 'تلميع',               type: 'خدمة', salePrice: 150 },
    { name: 'غسيل سريع',          type: 'خدمة', salePrice: 20  },
    { name: 'حماية طلاء',          type: 'خدمة', salePrice: 250 },
  ],

  logistics: [
    { name: 'توصيل محلي',         type: 'خدمة', salePrice: 20  },
    { name: 'توصيل بين مدن',      type: 'خدمة', salePrice: 60  },
    { name: 'باقة لوجستية شهرية', type: 'خدمة', salePrice: 500 },
    { name: 'معالجة شحنة',        type: 'خدمة', salePrice: 35  },
  ],

  // ── ضيافة ───────────────────────────────────────────────
  hotel: [
    { name: 'غرفة مفردة',  type: 'خدمة', salePrice: 300 },
    { name: 'غرفة مزدوجة', type: 'خدمة', salePrice: 450 },
    { name: 'جناح',         type: 'خدمة', salePrice: 800 },
    { name: 'إفطار',        type: 'طعام', salePrice: 50  },
    { name: 'خدمة الغرف',  type: 'خدمة', salePrice: 60  },
  ],

  // ── خدمات أعمال ─────────────────────────────────────────
  services: [
    { name: 'خدمة أساسية',  type: 'خدمة', salePrice: 100 },
    { name: 'خدمة متقدمة',  type: 'خدمة', salePrice: 200 },
    { name: 'باقة اشتراك',  type: 'خدمة', salePrice: 300 },
    { name: 'خدمة إضافية',  type: 'خدمة', salePrice: 80  },
  ],

  services_co: [
    { name: 'استشارة',      type: 'خدمة', salePrice: 300  },
    { name: 'خدمة شهرية',  type: 'خدمة', salePrice: 1500 },
    { name: 'تنفيذ مشروع', type: 'خدمة', salePrice: 5000 },
    { name: 'ورشة عمل',    type: 'خدمة', salePrice: 500  },
  ],

  tech: [
    { name: 'اشتراك شهري',  type: 'خدمة', salePrice: 200  },
    { name: 'اشتراك سنوي',  type: 'خدمة', salePrice: 1800 },
    { name: 'مشروع تقني',   type: 'خدمة', salePrice: 5000 },
    { name: 'دعم فني شهري', type: 'خدمة', salePrice: 400  },
    { name: 'تدريب',         type: 'خدمة', salePrice: 300  },
  ],

  // ── أخرى ────────────────────────────────────────────────
  other: [
    { name: 'منتج / خدمة 1', type: 'خدمة', salePrice: 100 },
    { name: 'منتج / خدمة 2', type: 'خدمة', salePrice: 150 },
    { name: 'منتج / خدمة 3', type: 'خدمة', salePrice: 200 },
  ],
};

// ── نوع المنتج الافتراضي (pc-type) لكل فئة ─────────────────────
// يُستبدل || 'طعام' الثابت القديم في product-cost.js
var _CATEGORY_DEFAULT_TYPE = {
  restaurant:    'طعام',
  cafe:          'مشروب',
  cloud_kitchen: 'طعام',
  drive_thru:    'مشروب',
  bakery:        'طعام',
  retail:        'منتج بيع بالتجزئة',
  ecom:          'منتج بيع بالتجزئة',
  clinic:        'خدمة',
  hotel:         'خدمة',
  pharmacy:      'منتج بيع بالتجزئة',
  services:      'خدمة',
  logistics:     'خدمة',
  barber:        'خدمة',
  beauty:        'خدمة',
  laundry:       'خدمة',
  carwash:       'خدمة',
  services_co:   'خدمة',
  tech:          'خدمة',
  dates:         'منتج بيع بالتجزئة',
  perfumes:      'منتج بيع بالتجزئة',
  other:         'خدمة',
};

/**
 * getCategoryDefaultType(bizType)
 * ──────────────────────────────────
 * يُعيد نوع المنتج الافتراضي لفئة نشاط معينة.
 * بديل صريح لـ || 'طعام' — يمنع تسرّب فئة المطعم إلى أنشطة أخرى.
 * @param {string} bizType  مثال: 'barber' | 'restaurant' | 'cafe'
 * @returns {'طعام'|'مشروب'|'خدمة'|'منتج بيع بالتجزئة'}
 */
window.getCategoryDefaultType = function(bizType) {
  const type = _CATEGORY_DEFAULT_TYPE[bizType] || 'خدمة';
  console.log('[Tawakkad][categoryDefault] bizType=%s → defaultType=%s', bizType, type);
  return type;
};

/**
 * getCategorySuggestedProducts(bizType)
 * ──────────────────────────────────────
 * يُعيد مصفوفة المنتجات / الخدمات المقترحة للفئة.
 * لا يُعيد بيانات فئة أخرى — يرجع إلى 'other' فقط كاحتياطي.
 * @param {string} bizType
 * @returns {Array<{name:string, type:string, salePrice:number}>}
 */
window.getCategorySuggestedProducts = function(bizType) {
  const products = window.CATEGORY_PRODUCTS[bizType];
  if (!products || !products.length) {
    console.warn('[Tawakkad][categorySuggest] No mapping for bizType=%s — using "other"', bizType);
    return window.CATEGORY_PRODUCTS['other'] || [];
  }
  console.log('[Tawakkad][categorySuggest] bizType=%s → %d products found', bizType, products.length);
  return products;
};

/**
 * pcSuggestFromCategory(bizType, options)
 * ─────────────────────────────────────────
 * يُنشئ قائمة منتجات / خدمات مقترحة في PC_STATE بناءً على فئة النشاط.
 *
 * سلوك:
 * - إذا كانت PC_STATE.products ممتلئة بمدخلات يدوية → لا يُبدّل (إلا إذا force=true)
 * - إذا كانت كل المنتجات ذات علامة _isSuggested أو القائمة فارغة → يُجدّد الاقتراحات
 *
 * @param {string}  bizType           — مثال: 'barber' | 'restaurant'
 * @param {object}  [options]
 * @param {boolean} [options.force]   — true: استبدل حتى لو غير فارغة
 */
window.pcSuggestFromCategory = function(bizType, options) {
  const force = options?.force === true;

  if (!bizType) {
    console.warn('[Tawakkad][pcSuggest] No bizType provided — skipping');
    return;
  }

  const current = window.PC_STATE?.products || [];
  const hasManual = current.some(p => !p._isSuggested);

  if (!force && hasManual) {
    console.log('[Tawakkad][pcSuggest] Skipping — %d manually-entered product(s) exist', current.filter(p => !p._isSuggested).length);
    return;
  }

  console.log('[Tawakkad][pcSuggest] category=%s | generating suggestions (force=%s)', bizType, force);

  const suggested = window.getCategorySuggestedProducts(bizType);
  if (!suggested.length) return;

  const now = Date.now();
  window.PC_STATE.products = suggested.map((p, i) => ({
    id:            String(now + i),
    name:          p.name,
    type:          p.type,
    salePrice:     p.salePrice,
    trueCost:      0,
    suggestedPrice: 0,
    monthlySales:  0,
    ingredients:   [],
    opCosts:       {},
    _isSuggested:  true,   // علامة: مُقترَح تلقائياً — لم يُدخله المستخدم يدوياً
  }));

  // حفظ في localStorage
  if (typeof _pcStorageKey === 'function') {
    try {
      localStorage.setItem(_pcStorageKey(), JSON.stringify(window.PC_STATE.products));
    } catch(_) {}
  }

  console.log('[Tawakkad][pcSuggest] ✅ generated %d suggestions for category=%s',
    window.PC_STATE.products.length, bizType);

  // تحديث جدول العرض إذا كانت الدالة متاحة
  if (typeof renderProductComparison === 'function') renderProductComparison();
};

// ── مراقبة تغيير الفئة في أي حقل select ─────────────────────────
// bp-type (ملف المشروع) | ob-type (الإعداد الأولي)
document.addEventListener('change', function(e) {
  const id = e.target?.id;
  if (id !== 'bp-type' && id !== 'ob-type') return;

  const newType = e.target.value;
  if (!newType) return;

  console.log('[Tawakkad][category] %s changed → category=%s', id, newType);

  // تحديث الكاش العالمي فوراً
  if (window._businessProfile) {
    window._businessProfile.biz_type = newType;
    window._businessProfile.category = newType;   // مرادف
    console.log('[Tawakkad][category] _businessProfile.biz_type updated to=%s', newType);
  }

  // دائماً أعِد تحميل القائمة الثابتة عند اختيار نوع النشاط
  if (typeof window.pcSuggestFromCategory === 'function') {
    console.log('[Tawakkad][category] force-loading static products for category=%s', newType);
    window.pcSuggestFromCategory(newType, { force: true });
  }
});
