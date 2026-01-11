-- 20260110184500_prompt_stats_rls.sql
begin;

-- Verify RLS is enabled (it is, but good practice)
alter table public.prompt_stats enable row level security;

-- Add policy for public read access
-- We want everyone to see stats (upvotes, views, etc.)
drop policy if exists "prompt_stats_select_all" on public.prompt_stats;
create policy "prompt_stats_select_all"
on public.prompt_stats
for select
to public
using (true);

-- No user should insert/update/delete stats directly (handled by triggers)
-- But if we wanted to be explicit:
-- create policy "prompt_stats_write_none" ... using (false);
-- (Default is deny so we are good)

commit;
