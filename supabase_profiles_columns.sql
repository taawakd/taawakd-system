-- ============================================================
-- Tawakkad — إضافة أعمدة الملف الشخصي للمستخدم
-- شغّل هذا في Supabase → SQL Editor
-- ============================================================

-- إضافة الأعمدة الناقصة لجدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city            TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commercial_reg  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_number      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- تفعيل صلاحية التعديل لصاحب الحساب (Row Level Security)
-- إذا لم تكن هناك policy للتعديل، أضفها:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'users can update own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'users can insert own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id)';
  END IF;
END$$;
