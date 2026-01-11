-- 20260110190000_get_ranked_prompts.sql

create or replace function get_ranked_prompts(
  sort_by text default 'newest',
  filter_type text default 'all',
  limit_count int default 20
)
returns setof prompts
language plpgsql
as $$
begin
  return query
  select p.*
  from prompts p
  join prompt_stats s on p.id = s.prompt_id
  where p.is_listed = true
    and p.is_hidden = false
    and p.visibility = 'public'
    and p.is_deleted = false
    and (
      case 
        when filter_type = 'originals' then p.parent_prompt_id is null
        when filter_type = 'forks' then p.parent_prompt_id is not null
        else true
      end
    )
  order by
    case when sort_by = 'top' then s.score end desc,
    case when sort_by = 'most_forked' then s.fork_count end desc,
    case when sort_by = 'newest' then p.created_at end desc,
    p.created_at desc
  limit limit_count;
end;
$$;
