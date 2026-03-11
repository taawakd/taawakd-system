-- ============================================================
-- Tawakkad Admin Logs Migration
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,        -- 'api_call' | 'ai_usage' | 'error' | 'payment'
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT,
  details    JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_logs_type_idx ON admin_logs(type);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON admin_logs(created_at DESC);

-- RLS: الأدمن فقط يقرأ
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_logs_admin_only" ON admin_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
