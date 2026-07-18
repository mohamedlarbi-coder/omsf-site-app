-- ============================================================
-- OMSF Site App — Add Inspections table
-- Run this once in Supabase SQL Editor. Safe to run once —
-- does NOT touch existing data or other tables.
-- ============================================================

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text default '',
  scheduled_date date,
  status text not null default 'Planned', -- 'Planned' | 'Completed'
  notes text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table inspections enable row level security;

create policy "Inspections are viewable by authenticated users"
  on inspections for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage inspections"
  on inspections for all
  using (auth.role() = 'authenticated');
