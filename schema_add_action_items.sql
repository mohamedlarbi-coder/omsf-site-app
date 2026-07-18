-- ============================================================
-- OMSF Site App — Action Items tracker
-- Run this once in Supabase SQL Editor. Safe to run once —
-- does NOT touch existing data or other tables.
--
-- Each corrective/preventative action on a report becomes its own
-- row here (created automatically when the report is saved), so it
-- can be tracked, closed out with proof, and reminded on independent
-- of the underlying report.
-- ============================================================

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  kind text not null,                    -- 'Corrective' | 'Preventative'
  description text not null,
  owner text default '',                 -- who's responsible (person/role)
  subcontractor text default '',         -- which sub this is assigned to, if any
  location text default '',
  due_date date,
  status text not null default 'Open',   -- 'Open' | 'Closed'
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closure_photo_url text,
  closure_notes text default '',
  closed_by uuid references auth.users(id),
  last_reminder_sent_at timestamptz
);

alter table action_items enable row level security;

create policy "Action items are viewable by authenticated users"
  on action_items for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can manage action items"
  on action_items for all
  using (auth.role() = 'authenticated');

create index if not exists action_items_status_idx on action_items(status);
create index if not exists action_items_report_idx on action_items(report_id);
