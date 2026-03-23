-- ══════════════════════════════════════════════════════════════════
-- supabase_migration_cfo_daily.sql
-- إضافة أعمدة تتبع رسائل AI CFO اليومية للمشتركين
-- يجب تشغيله مرة واحدة فقط في Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- عداد رسائل AI CFO لليوم الحالي (يُعاد ضبطه يومياً)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cfo_daily_used      INTEGER      NOT NULL DEFAULT 0;

-- تاريخ آخر إعادة ضبط لعداد CFO اليومي
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cfo_daily_reset_at  TIMESTAMPTZ  DEFAULT NULL;

-- ملاحظة: العمود القديم cfo_questions_used يُبقى كما هو لأغراض التوافق
-- المنطق الجديد يستخدم cfo_daily_used + cfo_daily_reset_at فقط
