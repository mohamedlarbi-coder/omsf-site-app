-- ============================================================
-- OMSF Site App — Add "site" column to reports
-- Run this once in Supabase SQL Editor. Safe to run once —
-- does NOT touch existing data or other tables.
-- ============================================================

alter table reports add column if not exists site text default '';
