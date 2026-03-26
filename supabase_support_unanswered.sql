-- ══════════════════════════════════════════════════════════════════
-- supabase_support_unanswered.sql
-- جدول تتبع أسئلة دعم العملاء (مطابقة وغير مطابقة)
-- شغّله مرة واحدة في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS support_unanswered (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  message         TEXT        NOT NULL,
  matched         BOOLEAN     NOT NULL DEFAULT FALSE,
  matched_question TEXT        DEFAULT NULL,   -- الكلمة المفتاحية التي تطابقت (إن وجدت)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهرس لتسريع الاستعلامات الأكثر شيوعاً
CREATE INDEX IF NOT EXISTS idx_support_unanswered_matched
  ON support_unanswered (matched, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_unanswered_user
  ON support_unanswered (user_id, created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE support_unanswered ENABLE ROW LEVEL SECURITY;

-- المستخدم يستطيع كتابة سجلاته فقط (INSERT بدون قراءة)
CREATE POLICY "users can insert own support messages"
  ON support_unanswered FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- القراءة للأدمن فقط (يتم التحكم فيها عبر service_role في الـ backend)
-- لا نضيف SELECT policy للمستخدمين العاديين

-- ══════════════════════════════════════════════════════════════════
-- للتحقق بعد التشغيل:
--   SELECT * FROM support_unanswered ORDER BY created_at DESC LIMIT 20;
--   SELECT matched, COUNT(*) FROM support_unanswered GROUP BY matched;
-- ══════════════════════════════════════════════════════════════════
