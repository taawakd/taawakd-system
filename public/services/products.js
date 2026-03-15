// services/products.js — إدارة جدول المنتجات في Supabase
// المصدر الرئيسي لبيانات المنتجات في جميع أجزاء النظام
// ══════════════════════════════════════════════════════════════

window._PRODUCTS = window._PRODUCTS || []; // الكاش العالمي للمنتجات

// ── CRUD ────────────────────────────────────────────────────────

/** تحميل كل منتجات المستخدم من Supabase وتحديث الكاش */
async function loadProductsFromDB() {
  if (!window.sb) return [];
  try {
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return [];

    const { data, error } = await window.sb
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[products] loadProductsFromDB:', error.message);
      return window._PRODUCTS;
    }

    window._PRODUCTS = data || [];
    // مزامنة مع BP_PRODUCTS للحفاظ على التوافق مع باقي النظام
    _syncToBPProducts();
    return window._PRODUCTS;
  } catch (e) {
    console.warn('[products] loadProductsFromDB exception:', e.message);
    return window._PRODUCTS;
  }
}

/** حفظ مجموعة منتجات جديدة (من المنيو) في Supabase */
async function upsertProductsToDB(products) {
  if (!window.sb || !products?.length) return { data: [], error: null };
  try {
    const { data: { user } } = await window.sb.auth.getUser();
    if (!user) return { data: [], error: { message: 'غير مسجّل الدخول' } };

    const rows = products.map(p => {
      const row = {
        user_id:       user.id,
        name:          String(p.name || '').trim(),
        selling_price: Number(p.selling_price ?? p.price ?? 0),
        cost:          Number(p.cost ?? 0),
        category:      String(p.category || ''),
      };
      // إذا كان المنتج يحمل id موجود مسبقاً نُحدّثه
      if (p.id) row.id = p.id;
      return row;
    }).filter(r => r.name);

    const { data, error } = await window.sb
      .from('products')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.warn('[products] upsertProductsToDB:', error.message);
      return { data: null, error };
    }

    // تحديث الكاش
    await loadProductsFromDB();
    return { data, error: null };
  } catch (e) {
    console.warn('[products] upsertProductsToDB exception:', e.message);
    return { data: null, error: e };
  }
}

/** تحديث حقول منتج واحد في Supabase والكاش */
async function updateProductInDB(id, fields) {
  if (!window.sb || !id) return;
  try {
    const cleanFields = {};
    if (fields.name          !== undefined) cleanFields.name          = String(fields.name).trim();
    if (fields.selling_price !== undefined) cleanFields.selling_price = Number(fields.selling_price);
    if (fields.cost          !== undefined) cleanFields.cost          = Number(fields.cost);
    if (fields.category      !== undefined) cleanFields.category      = String(fields.category);

    const { error } = await window.sb
      .from('products')
      .update(cleanFields)
      .eq('id', id);

    if (error) { console.warn('[products] updateProductInDB:', error.message); return; }

    // تحديث الكاش المحلي
    const idx = window._PRODUCTS.findIndex(p => p.id === id);
    if (idx >= 0) Object.assign(window._PRODUCTS[idx], cleanFields);
    _syncToBPProducts();
  } catch (e) {
    console.warn('[products] updateProductInDB exception:', e.message);
  }
}

/** حذف منتج من Supabase والكاش */
async function deleteProductFromDB(id) {
  if (!window.sb || !id) return;
  try {
    await window.sb.from('products').delete().eq('id', id);
    window._PRODUCTS = window._PRODUCTS.filter(p => p.id !== id);
    _syncToBPProducts();
  } catch (e) {
    console.warn('[products] deleteProductFromDB exception:', e.message);
  }
}

// ── مزامنة مع BP_PRODUCTS ────────────────────────────────────────
/** يحافظ على توافق BP_PRODUCTS مع _PRODUCTS (يستخدمها قسم "المنتجات والخدمات") */
function _syncToBPProducts() {
  window.BP_PRODUCTS = window._PRODUCTS.map(p => ({
    name:  p.name,
    price: p.selling_price,
    cost:  p.cost,
    id:    p.id,
  }));
  if (typeof renderBPProducts === 'function') renderBPProducts();
}

// ── Helpers عامة ──────────────────────────────────────────────────

/** هامش ربح المنتج */
function productMargin(p) {
  const sp = p.selling_price ?? p.price ?? 0;
  if (!sp) return 0;
  return Math.round(((sp - (p.cost ?? 0)) / sp) * 100 * 10) / 10;
}

/** تنسيق المنتجات للـ AI context (يُستخدم في getCFOContext) */
function formatProductsForAI(products) {
  if (!products?.length) return 'لا توجد بيانات منتجات';
  return products.map(p => {
    const mg = productMargin(p);
    const sp = p.selling_price ?? p.price ?? 0;
    return `${p.name} (سعر ${sp} ر.س، هامش ${mg}%${p.cost > 0 ? '، تكلفة '+p.cost+' ر.س' : ''}${p.category ? '، '+p.category : ''})`;
  }).join('، ');
}

// ── تصدير ──────────────────────────────────────────────────────
window.loadProductsFromDB    = loadProductsFromDB;
window.upsertProductsToDB    = upsertProductsToDB;
window.updateProductInDB     = updateProductInDB;
window.deleteProductFromDB   = deleteProductFromDB;
window.productMargin         = productMargin;
window.formatProductsForAI   = formatProductsForAI;
