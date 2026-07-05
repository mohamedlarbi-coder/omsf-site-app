-- ============================================================
-- OMSF Site App — Database Schema
-- Run this once in Supabase SQL Editor (SQL Editor > New query)
-- ============================================================

-- Profiles table: extends Supabase's built-in auth.users with
-- the extra fields the app needs (name, company, position, etc.)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  my_name text not null default '',
  my_company text not null default '',
  my_position text not null default '',
  distribution_list text not null default '',
  created_at timestamptz not null default now()
);

-- Reports table: every Good Spot / Hazard / OFI / Closecall report
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users on delete set null,
  project text not null default 'RSSOM Project',
  report_date date not null default current_date,
  action_report_to text default 'GIP',
  respondent text default '',
  company text default '',
  report_type text not null default 'Hazard',
  location text default '',
  photo_data_url text,
  description text default '',
  safety_concern text default '',
  hazard_classes text[] default '{}',
  hazard_class_other text default '',
  tracking_types text[] default '{}',
  tracking_type_other text default '',
  risk_rating text default '',
  contributing_factors text[] default '{}',
  contributing_factor_other text default '',
  corrective_action text default '',
  corrective_action_owner text default '',
  corrective_close_out_date date,
  preventative_action text default '',
  preventative_action_owner text default '',
  preventative_close_out_date date,
  reviewed_by text default '',
  eco_online_num text default '',
  map_pin jsonb,
  gps jsonb,
  site_map_snapshot text,
  ai_generated boolean default false,
  created_at timestamptz not null default now()
);

-- Site map: one shared image for the whole team
create table if not exists site_map (
  id int primary key default 1,
  image_data_url text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ============================================================
-- Row Level Security: everyone logged in can read all reports
-- (for stats/team log), but can only edit their own profile
-- and their own reports.
-- ============================================================

alter table profiles enable row level security;
alter table reports enable row level security;
alter table site_map enable row level security;

-- Profiles: anyone logged in can view all profiles (needed to show
-- author names in the team log and stats), but only edit their own.
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Reports: anyone logged in can view all reports (shared team log
-- + stats), but only the author can edit/delete their own.
create policy "Reports are viewable by authenticated users"
  on reports for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own reports"
  on reports for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own reports"
  on reports for update
  using (auth.uid() = author_id);

create policy "Users can delete their own reports"
  on reports for delete
  using (auth.uid() = author_id);

-- Site map: anyone logged in can view and update the shared map
create policy "Site map is viewable by authenticated users"
  on site_map for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can update site map"
  on site_map for all
  using (auth.role() = 'authenticated');

-- Seed the single site_map row so updates work with a simple upsert
insert into site_map (id, image_data_url) values (1, null)
  on conflict (id) do nothing;

-- ============================================================
-- Auto-create a profile row whenever someone signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, my_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'my_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
