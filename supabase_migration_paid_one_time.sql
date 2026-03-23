-- ══════════════════════════════════════════════════════════════════
-- Migration: إضافة أعمدة paid_one_time و is_saved_for_user
-- الغرض: التمييز بين تقارير الدفع المرة الواحدة (analytics only)
--         والتقارير المحفوظة الفعلية للمستخدم
-- التاريخ: 2026-03
-- ══════════════════════════════════════════════════════════════════

-- paid_one_time: صح إذا دفع المستخدم 29 ريال لتقرير واحد
-- is_saved_for_user: صح إذا يجب أن يظهر التقرير في "التقارير المحفوظة"

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS paid_one_time     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_saved_for_user BOOLEAN NOT NULL DEFAULT TRUE;

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
