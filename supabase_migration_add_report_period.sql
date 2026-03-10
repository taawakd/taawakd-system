-- ============================================================
-- Migration: add report_period column to reports table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS report_period TEXT;

-- Optional: backfill report_period from existing report_json for
-- any rows already saved (reportPeriod was stored inside report_json
-- even before the column existed, due to the resilient insert fallback)
UPDATE reports
  SET report_period = report_json->>'reportPeriod'
  WHERE report_period IS NULL
    AND report_json->>'reportPeriod' IS NOT NULL;

-- Verify:
-- SELECT id, biz_name, report_period, report_json->>'reportPeriod' AS rp_in_json
-- FROM reports ORDER BY created_at DESC LIMIT 10;
