-- ============================================================
-- Tawakkad Admin Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. إضافة أعمدة الإدارة إلى profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended  BOOLEAN DEFAULT FALSE;

-- 2. إنشاء جدول الخطط
CREATE TABLE IF NOT EXISTS plans (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  name_ar          TEXT NOT NULL,
  analyses_limit   INTEGER NOT NULL DEFAULT 10,
  price_monthly    NUMERIC(10,2) DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إدراج الخطط الافتراضية
INSERT INTO plans (id, name, name_ar, analyses_limit, price_monthly, is_active, created_at) VALUES
  ('free',       'Free',       'مجاني',    10,   0,   true, NOW()),
  ('pro',        'Pro',        'احترافي',  100,  49,  true, NOW()),
  ('enterprise', 'Enterprise', 'مؤسسي',    -1,   299, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. لتعيين نفسك كأدمن — استبدل YOUR_USER_ID بـ UUID حسابك من Supabase
-- UPDATE profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
