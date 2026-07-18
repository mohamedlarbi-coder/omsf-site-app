-- ============================================================
-- OMSF Site App — Add project/site assignment fields to profiles
-- Run this once in Supabase SQL Editor. Safe to run once —
-- does NOT touch existing data or other tables.
-- ============================================================

alter table profiles add column if not exists assigned_project text default '';
alter table profiles add column if not exists assigned_site text default '';
alter table profiles add column if not exists assigned_building text default '';
