-- 20260110180000_harden_prompt_stats.sql
begin;

-- 0) Pre-Clean: Deduplicate votes to ensure unique constraint can be applied
-- 'id' doesn't exist, use ctid
delete from public.votes a using public.votes b
where a.ctid < b.ctid and a.prompt_id = b.prompt_id and a.user_id = b.user_id;

-- 1) Prevent duplicate votes --------------------------------------------

-- Ensure values are only -1 or +1 (optional but recommended)
-- If you allow 0 for "neutral", expand this check.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_value_check') THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_value_check CHECK (value IN (-1, 1));
  END IF;
END $$;

-- One vote per user per prompt
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_prompt_user_unique') THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_prompt_user_unique UNIQUE (prompt_id, user_id);
  END IF;
END $$;

-- Helpful index for recounts (if not already covered)
create index if not exists votes_prompt_id_idx on public.votes(prompt_id);

-- 2) Ensure prompt_stats has a conflict target ---------------------------

-- If prompt_stats.prompt_id is not unique yet:
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prompt_stats_prompt_id_unique'
  ) then
    alter table public.prompt_stats
      add constraint prompt_stats_prompt_id_unique unique (prompt_id);
  end if;
end $$;

-- 3) Recalculation function ---------------------------------------------

create or replace function public.recalculate_vote_stats(prompt_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_upvotes int;
  v_downvotes int;
  v_score int;
begin
  select
    coalesce(count(*) filter (where value > 0), 0),
    coalesce(count(*) filter (where value < 0), 0),
    coalesce(sum(value), 0)
  into v_upvotes, v_downvotes, v_score
  from public.votes
  where prompt_id = prompt_uuid;

  insert into public.prompt_stats (prompt_id, upvotes, downvotes, score, updated_at)
  values (prompt_uuid, v_upvotes, v_downvotes, v_score, now())
  on conflict (prompt_id) do update
    set upvotes = excluded.upvotes,
        downvotes = excluded.downvotes,
        score = excluded.score,
        updated_at = excluded.updated_at;
end;
$$;

-- 4) Trigger wrapper (handles NEW/OLD properly) -------------------------

create or replace function public.trg_votes_recalculate_prompt_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.recalculate_vote_stats(new.prompt_id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.recalculate_vote_stats(old.prompt_id);
    return old;
  elsif (tg_op = 'UPDATE') then
    -- Recalc old prompt_id if it changed
    if (old.prompt_id is distinct from new.prompt_id) then
      perform public.recalculate_vote_stats(old.prompt_id);
    end if;

    perform public.recalculate_vote_stats(new.prompt_id);
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists on_vote_change on public.votes;

create trigger on_vote_change
after insert or update or delete on public.votes
for each row
execute function public.trg_votes_recalculate_prompt_stats();

-- 5) Optional backfill ---------------------------------------------------

-- Only recalc prompts that have votes (fast)
do $$
declare
  r record;
begin
  for r in (select distinct prompt_id from public.votes) loop
    perform public.recalculate_vote_stats(r.prompt_id);
  end loop;
end $$;

commit;
