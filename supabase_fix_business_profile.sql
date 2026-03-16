-- ══════════════════════════════════════════════════════
-- إصلاح شامل لجدول business_profile
-- أضف هذه الأعمدة الناقصة في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════

-- عمود المدينة (أُضيف في الـ onboarding)
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';

-- عمود التسويق الثابت (أُضيف في الـ onboarding)
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS fixed_marketing NUMERIC(12,2) DEFAULT 0;

-- عمود الاشتراكات والتراخيص ← السبب الرئيسي لفشل الحفظ
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS fixed_subscriptions NUMERIC(12,2) DEFAULT 0;

-- أعمدة النسب المتغيرة (إن لم تكن موجودة)
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS var_cogs_pct       NUMERIC(5,2) DEFAULT 0;
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS var_delivery_pct   NUMERIC(5,2) DEFAULT 0;
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS var_marketing_pct  NUMERIC(5,2) DEFAULT 0;
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS var_other_pct      NUMERIC(5,2) DEFAULT 0;

-- عمود بيانات حاسبة التكاليف
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS product_costs JSONB DEFAULT '[]';

-- علامة إتمام الـ onboarding في جدول profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- تحقق من النتيجة
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'business_profile'
ORDER BY ordinal_position;
