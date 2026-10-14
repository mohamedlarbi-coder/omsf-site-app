-- MINERVIUM connector (MCP): server-side holding area for report drafts.
-- A draft is only ever turned into a real report by the minervium-mcp function
-- after the signed-in user explicitly confirms. Only the service role can touch this table.
create table if not exists public.mcp_report_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  photo_data_url text,
  hash text not null default '',
  status text not null default 'draft',
  report_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
alter table public.mcp_report_drafts enable row level security;
revoke all on public.mcp_report_drafts from anon, authenticated;
create index if not exists mcp_report_drafts_user_idx on public.mcp_report_drafts (user_id, created_at desc);
