-- ══════════════════════════════════════════════════════════════════
-- supabase_migration_vat.sql
-- إضافة خيار تفعيل ضريبة القيمة المضافة على مستوى المشروع
-- يجب تشغيله مرة واحدة فقط في Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- هل تفعيل ضريبة القيمة المضافة (15%) للمشروع؟
-- false = إيقاف (الافتراضي) — النظام يتجاهل الضريبة بالكامل
-- true  = تفعيل — النظام يحسب vatOutput و vatInput و netVAT بشكل منفصل
ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN NOT NULL DEFAULT false;
