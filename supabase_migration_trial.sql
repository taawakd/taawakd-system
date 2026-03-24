-- ============================================================
-- Tawakkad — إضافة عمود trial_started_at لجدول profiles
-- شغّل هذا في Supabase → SQL Editor
-- ============================================================

-- إضافة عمود وقت بدء التجربة المجانية
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- ملاحظة: يُترك NULL للمستخدمين الجدد حتى يُشغّلوا أول تحليل،
-- ثم يُعيَّن تلقائياً بواسطة api/analyze.js عند أول استخدام.
-- إذا كانت هناك مستخدمون قدامى تريد منحهم تجربة كاملة من الآن:
-- UPDATE profiles SET trial_started_at = NOW() WHERE trial_started_at IS NULL AND plan = 'free';
