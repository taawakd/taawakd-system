-- ══════════════════════════════════════════════════════════════════
-- Migration: إضافة أعمدة paid_one_time و is_saved_for_user
-- الغرض: التمييز بين تقارير الدفع المرة الواحدة (analytics only)
--         والتقارير المحفوظة الفعلية للمستخدم
-- التاريخ: 2026-03
-- ══════════════════════════════════════════════════════════════════

-- أسعار الدفع المنفرد (مصدر الحقيقة: api/analyze.js و plan-config.js):
--   مشترك (plan = paid/pro/enterprise): 19 ريال
--   غير مشترك (plan = free / تجربة منتهية): 29 ريال

-- paid_one_time: صح إذا دفع المستخدم لتقرير واحد (19 أو 29 ريال حسب الخطة)
-- is_saved_for_user: صح إذا يجب أن يظهر التقرير في "التقارير المحفوظة"

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS paid_one_time     BOOLEAN        NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_saved_for_user BOOLEAN        NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS one_time_price    NUMERIC(10,2)  DEFAULT NULL;
-- one_time_price: القيمة المدفوعة (19 للمشترك، 29 لغير المشترك) — NULL إذا لم يكن دفعاً منفرداً

-- التقارير القديمة قبل هذه الميزة: كلها مرئية للمستخدم (القيمة الافتراضية صحيحة)
-- لا نحتاج UPDATE على البيانات القديمة

-- Index لتسريع استعلام "التقارير المحفوظة" (يستبعد paid_one_time)
CREATE INDEX IF NOT EXISTS idx_reports_is_saved_for_user
  ON reports (user_id, is_saved_for_user, created_at DESC);

-- للتحقق:
-- SELECT id, biz_name, paid_one_time, is_saved_for_user, created_at
-- FROM reports
-- WHERE user_id = '<user_id>'
-- ORDER BY created_at DESC;
