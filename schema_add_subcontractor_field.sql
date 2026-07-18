-- ============================================================
-- OMSF Site App — Add subcontractor field to reports
-- Run this once in Supabase SQL Editor. Safe to run once —
-- does NOT touch existing data or other tables.
-- ============================================================

alter table reports add column if not exists subcontractor text default '';
alter table reports add column if not exists subcontractor_other text default '';
