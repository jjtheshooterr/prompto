-- Add missing constraints and triggers for data integrity

-- 1. Add uniqueness constraint to problem_members (problem_id, user_id)
-- This prevents duplicate memberships
alter table public.problem_members 
add constraint problem_members_problem_id_user_id_key unique (problem_id, user_id);

-- 2. Add uniqueness constraint to prompts.slug within problem scope
-- This ensures slugs are unique within each problem
alter table public.prompts 
add constraint prompts_problem_id_slug_key unique (problem_id, slug);

-- 3. Create function to enforce pinned_prompt_id belongs to the problem
create or replace function public.enforce_pinned_prompt_belongs_to_problem() 
returns trigger 
language plpgsql 
as $$ 
begin   
  if new.pinned_prompt_id is null then     
    return new;   
  end if;    
  
  if not exists (     
    select 1     
    from public.prompts p     
    where p.id = new.pinned_prompt_id       
      and p.problem_id = new.id   
  ) then     
    raise exception 'Pinned prompt % does not belong to problem %', new.pinned_prompt_id, new.id;   
  end if;    
  
  return new; 
end; 
$$;

-- Drop existing trigger if it exists and create new one
drop trigger if exists trg_enforce_pinned_prompt on public.problems;

create trigger trg_enforce_pinned_prompt 
before insert or update of pinned_prompt_id 
on public.problems 
for each row 
execute function public.enforce_pinned_prompt_belongs_to_problem();