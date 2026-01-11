begin;

-- Helpers -------------------------------------------------------------

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
  )
$$;

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws_id
      and w.owner_id = auth.uid()
  )
$$;

-- Optional: role-based check (only if you want to restrict edits)
-- Assumes workspace_members.role contains 'owner'/'admin'/'editor' etc.
create or replace function public.can_edit_workspace(ws_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and coalesce(wm.role, '') in ('owner','admin','editor')
  )
  or public.is_workspace_owner(ws_id)
$$;


-- TAGS ----------------------------------------------------------------
-- Tags are global/shared. We typically allow public read, controlled write.

alter table public.tags enable row level security;

-- Anyone can read tags (needed for SEO/filter UIs)
drop policy if exists "tags_select_all" on public.tags;
create policy "tags_select_all"
on public.tags
for select
to public
using (true);

-- Only authenticated users can create tags
-- (If you want stricter control, change to: to authenticated + require membership via RPC)
drop policy if exists "tags_insert_auth" on public.tags;
create policy "tags_insert_auth"
on public.tags
for insert
to authenticated
with check (true);

-- Only service role should update/delete tags (recommended)
-- If you want admins to edit tag names/slugs, we can extend later.
drop policy if exists "tags_update_none" on public.tags;
create policy "tags_update_none"
on public.tags
for update
to authenticated
using (false);

drop policy if exists "tags_delete_none" on public.tags;
create policy "tags_delete_none"
on public.tags
for delete
to authenticated
using (false);


-- PROBLEM_TAGS --------------------------------------------------------

alter table public.problem_tags enable row level security;

-- Public can read problem tags only if the underlying problem is public+listed and not deleted/hidden
drop policy if exists "problem_tags_select_public_or_member" on public.problem_tags;
create policy "problem_tags_select_public_or_member"
on public.problem_tags
for select
to public
using (
  exists (
    select 1
    from public.problems p
    where p.id = problem_tags.problem_id
      and p.is_deleted = false
      and p.is_hidden = false
      and p.is_listed = true
      and (
        p.visibility = 'public'
        or public.is_workspace_member(p.workspace_id)
      )
  )
);

-- Workspace editors/members can add tags to problems they can edit
-- If you want ANY member to tag, replace can_edit_workspace(...) with is_workspace_member(...)
drop policy if exists "problem_tags_insert_workspace_editors" on public.problem_tags;
create policy "problem_tags_insert_workspace_editors"
on public.problem_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.problems p
    where p.id = problem_tags.problem_id
      and p.is_deleted = false
      and public.can_edit_workspace(p.workspace_id)
  )
);

-- Workspace editors/members can remove tags
drop policy if exists "problem_tags_delete_workspace_editors" on public.problem_tags;
create policy "problem_tags_delete_workspace_editors"
on public.problem_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.problems p
    where p.id = problem_tags.problem_id
      and p.is_deleted = false
      and public.can_edit_workspace(p.workspace_id)
  )
);

-- Updates aren’t needed (it’s a join table) – block update
drop policy if exists "problem_tags_update_none" on public.problem_tags;
create policy "problem_tags_update_none"
on public.problem_tags
for update
to authenticated
using (false);


-- PROMPT_TAGS ---------------------------------------------------------

alter table public.prompt_tags enable row level security;

-- Public can read prompt tags only if underlying prompt is public+listed and not deleted/hidden
drop policy if exists "prompt_tags_select_public_or_member" on public.prompt_tags;
create policy "prompt_tags_select_public_or_member"
on public.prompt_tags
for select
to public
using (
  exists (
    select 1
    from public.prompts pr
    where pr.id = prompt_tags.prompt_id
      and pr.is_deleted = false
      and pr.is_hidden = false
      and pr.is_listed = true
      and (
        pr.visibility = 'public'
        or public.is_workspace_member(pr.workspace_id)
      )
  )
);

-- Workspace editors/members can add tags to prompts they can edit
drop policy if exists "prompt_tags_insert_workspace_editors" on public.prompt_tags;
create policy "prompt_tags_insert_workspace_editors"
on public.prompt_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.prompts pr
    where pr.id = prompt_tags.prompt_id
      and pr.is_deleted = false
      and public.can_edit_workspace(pr.workspace_id)
  )
);

-- Workspace editors/members can remove tags
drop policy if exists "prompt_tags_delete_workspace_editors" on public.prompt_tags;
create policy "prompt_tags_delete_workspace_editors"
on public.prompt_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.prompts pr
    where pr.id = prompt_tags.prompt_id
      and pr.is_deleted = false
      and public.can_edit_workspace(pr.workspace_id)
  )
);

-- Block updates (join table)
drop policy if exists "prompt_tags_update_none" on public.prompt_tags;
create policy "prompt_tags_update_none"
on public.prompt_tags
for update
to authenticated
using (false);

commit;
