-- ============================================================
-- OMSF Site App — Add Subcontractors / Contacts table
-- Run this in Supabase SQL Editor. Safe to run once on top of
-- the existing schema — it does NOT touch reports/profiles/site_map.
-- ============================================================

create table if not exists subcontractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_emails text[] default '{}',
  created_at timestamptz not null default now()
);

alter table subcontractors enable row level security;

create policy "Subcontractors are viewable by authenticated users"
  on subcontractors for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage subcontractors"
  on subcontractors for all
  using (auth.role() = 'authenticated');
