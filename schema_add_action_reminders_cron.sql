-- ============================================================
-- OMSF Site App — Schedule daily action item reminder emails
--
-- Run this AFTER deploying the send-action-reminders Edge Function
-- (see supabase/functions/send-action-reminders/index.ts for setup
-- steps -- you need a Resend API key configured first).
--
-- This requires the pg_cron and pg_net extensions, available on all
-- Supabase projects (Database -> Extensions -> enable both if not
-- already on).
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Runs every day at 08:00 UTC. Adjust the schedule if you want a
-- different time -- cron syntax is "minute hour day month weekday".
select cron.schedule(
  'send-action-reminders-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-action-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Replace YOUR-PROJECT-REF and YOUR-SERVICE-ROLE-KEY above with your
-- actual Supabase project ref (in your project URL) and the service
-- role key (Project Settings -> API -> service_role secret) before
-- running this.

-- To check it's scheduled:      select * from cron.job;
-- To see run history/errors:    select * from cron.job_run_details order by start_time desc limit 20;
-- To remove it later:           select cron.unschedule('send-action-reminders-daily');
