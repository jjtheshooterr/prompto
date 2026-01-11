-- 20260110173000_refactor_tags_and_status.sql

begin;

-- 1) TAG NORMALIZATION ------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_unique unique (name),
  constraint tags_slug_unique unique (slug)
);

create table if not exists public.problem_tags (
  problem_id uuid not null references public.problems(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (problem_id, tag_id)
);

create table if not exists public.prompt_tags (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

-- helpful indexes
create index if not exists problem_tags_problem_id_idx on public.problem_tags(problem_id);
create index if not exists problem_tags_tag_id_idx on public.problem_tags(tag_id);
create index if not exists prompt_tags_prompt_id_idx on public.prompt_tags(prompt_id);
create index if not exists prompt_tags_tag_id_idx on public.prompt_tags(tag_id);

-- NOTE: slugify helper (simple + cheap). If you already have one, use it instead.
-- This creates slugs like "Video Editing" -> "video-editing"
create or replace function public.slugify_tag(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(input)), '[^a-z0-9]+', '-', 'g')
$$;

-- MIGRATE: distinct tags from problems.tags array into tags + problem_tags
-- (assumes problems.tags is text[] or _text)
with raw as (
  select
    p.id as problem_id,
    trim(t) as tag_name
  from public.problems p
  cross join lateral unnest(coalesce(p.tags, array[]::text[])) as t
),
clean as (
  select distinct
    problem_id,
    tag_name,
    public.slugify_tag(tag_name) as tag_slug
  from raw
  where tag_name is not null and tag_name <> ''
),
ins_tags as (
  insert into public.tags (name, slug)
  select distinct tag_name, tag_slug
  from clean
  on conflict (slug) do update set name = excluded.name
  returning id, slug
)
insert into public.problem_tags (problem_id, tag_id)
select
  c.problem_id,
  t.id
from clean c
join public.tags t on t.slug = c.tag_slug
on conflict do nothing;

-- 2) STATUS ENUM ------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'prompt_status') then
    create type public.prompt_status as enum ('draft', 'published', 'archived', 'flagged');
  end if;
end $$;

-- Drop existing check constraint if it exists to allow new enum values
alter table public.prompts drop constraint if exists prompts_status_check;

-- Map existing statuses to the new enum set BEFORE casting.
-- Adjust mappings if your data has other values.
update public.prompts
set status =
  case lower(status)
    when 'draft' then 'draft'
    when 'published' then 'published'
    when 'public' then 'published'
    when 'live' then 'published'
    when 'active' then 'published'
    when 'archived' then 'archived'
    when 'flagged' then 'flagged'
    when 'reported' then 'flagged'
    when 'experimental' then 'draft'
    when 'tested' then 'published'
    when 'production' then 'published'
    else 'draft'
  end
where status is not null;

-- Drop default value to allow type change
alter table public.prompts alter column status drop default;

-- Now cast the column
alter table public.prompts
  alter column status type public.prompt_status
  using status::public.prompt_status;

-- Set new default
alter table public.prompts alter column status set default 'draft'::public.prompt_status;

-- 3) DATA INTEGRITY / SEMANTICS --------------------------------------------

comment on column public.prompts.is_deleted is
'Hard removal flag. If true: exclude from all user-facing queries. Row kept for audit. Use deleted_at/deleted_by when possible.';

comment on column public.prompts.is_hidden is
'Visibility flag. If true: not shown in listings/search, but may be accessible by direct link depending on visibility rules.';

comment on column public.prompts.is_listed is
'Listing eligibility flag. If false: do not show on browse pages/SEO pages even if not hidden.';

-- Unique slug on workspaces
alter table public.workspaces
  add constraint workspaces_slug_unique unique (slug);

-- (Strongly recommended) per-workspace problem slugs unique (routing)
-- If you already have this constraint, skip it.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'problems_workspace_slug_unique'
  ) then
    alter table public.problems
      add constraint problems_workspace_slug_unique unique (workspace_id, slug);
  end if;
end $$;

commit;
