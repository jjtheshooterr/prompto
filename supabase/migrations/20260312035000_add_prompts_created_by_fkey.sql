-- Add missing foreign key constraint for prompts.created_by to profiles.id
ALTER TABLE public.prompts
ADD CONSTRAINT prompts_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
