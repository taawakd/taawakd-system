-- ══════════════════════════════════════════════════════════════
-- Migration: Onboarding — إضافة حقول الإعداد الأولي
-- شغّل هذا الملف في Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. إضافة حقل المدينة لجدول business_profile
ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';

-- 2. إضافة حقل التسويق الثابت الشهري لجدول business_profile
ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS fixed_marketing NUMERIC(12,2) DEFAULT 0;

-- 3. إضافة علامة إكمال الإعداد الأولي لجدول profiles
--    (يتحقق منها النظام لتحديد إذا كان المستخدم أكمل الإعداد أم لا)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
