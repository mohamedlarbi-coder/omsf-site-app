-- ============================================================
-- OMSF Site App — Seed subcontractor contacts (PM + Safety Manager)
-- Run this once in Supabase SQL Editor.
--
-- These are PLACEHOLDER emails. Replace them with the real PM and
-- Safety Manager addresses for each subcontractor once provided —
-- easiest way is via Settings → Subcontractor Contacts in the app
-- itself (edit each entry there), or by re-running similar UPDATE
-- statements here.
--
-- Safe to run once. If a subcontractor with the same name already
-- exists (e.g. you added one manually), this skips it rather than
-- creating a duplicate.
-- ============================================================

insert into subcontractors (name, contact_emails)
select * from (values
  ('GIP',           array['gip.pm@placeholder.com', 'gip.safetymanager@placeholder.com']),
  ('Outspan',       array['outspan.pm@placeholder.com', 'outspan.safetymanager@placeholder.com']),
  ('Structform',    array['structform.pm@placeholder.com', 'structform.safetymanager@placeholder.com']),
  ('Sylvan',        array['sylvan.pm@placeholder.com', 'sylvan.safetymanager@placeholder.com']),
  ('Smith & Long',  array['smithlong.pm@placeholder.com', 'smithlong.safetymanager@placeholder.com'])
) as seed(name, contact_emails)
where not exists (
  select 1 from subcontractors where lower(subcontractors.name) = lower(seed.name)
);
