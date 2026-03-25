-- ══════════════════════════════════════════════════════════════════
-- supabase_migration_trial_daily.sql
-- إضافة عدّاد التحليلات اليومي لمستخدمي فترة التجربة
-- شغّل مرة واحدة فقط في Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- قواعد فترة التجربة (7 أيام):
--   • تحليل واحد يومي كحد أقصى  ← trial_daily_used / trial_daily_reset_at
--   • 3 رسائل AI CFO يومياً      ← cfo_daily_used / cfo_daily_reset_at (موجود مسبقاً)
--   • بعد انتهاء 7 أيام: كل شيء مقفل
--     → الدفع 29 ريال لتحليل واحد (غير مشترك)
--     → أو الاشتراك بـ 79 ريال / شهر

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_daily_used      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_daily_reset_at  TIMESTAMPTZ DEFAULT NULL;

-- ملاحظة: يُعيَّن trial_daily_reset_at عند أول تحليل في اليوم،
--         ويُعاد تصفير العداد إذا مضى أكثر من 24 ساعة.
