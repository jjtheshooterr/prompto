-- Phase 1: Identity Security & Trust (User-Level Moderation)

-- 1. Add shadowbanning and trust scores to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS system_trust_score INTEGER NOT NULL DEFAULT 100;

-- 2. Create user_bans table for hard bans
CREATE TABLE IF NOT EXISTS public.user_bans (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    banned_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_shadowbanned ON public.profiles(is_shadowbanned);

-- Enable RLS on user_bans
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Admins can view all bans
CREATE POLICY "Admins can view all bans" 
ON public.user_bans FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Users can view their own ban
CREATE POLICY "Users can view their own ban" 
ON public.user_bans FOR SELECT 
USING (user_id = auth.uid());

-- Admins can insert/update bans
CREATE POLICY "Admins can manage bans" 
ON public.user_bans FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 3. Update prompts RLS to hide shadowbanned content from public
-- First, drop the existing policy
DROP POLICY IF EXISTS "prompts_select_comprehensive" ON prompts;

-- Recreate policy with shadowban check
CREATE POLICY "prompts_select_comprehensive" ON prompts FOR SELECT USING (
    is_deleted = false 
    AND is_hidden = false 
    AND (
        -- The creator can always see their own prompt, even if they are shadowbanned
        created_by = auth.uid()
        OR 
        -- Others can only see it if the creator is NOT shadowbanned
        (
            NOT EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = prompts.created_by AND is_shadowbanned = true
            )
            AND
            (
                (visibility = 'public' AND is_listed = true) 
                OR visibility = 'unlisted'
                OR (
                    visibility = 'private' 
                    AND can_edit_problem(problem_id, auth.uid())
                )
            )
        )
    )
    AND EXISTS (
        SELECT 1 FROM problems
        WHERE problems.id = prompts.problem_id 
        AND problems.is_deleted = false 
        AND (
            problems.visibility = 'public' 
            OR problems.visibility = 'unlisted' 
            OR (
                problems.visibility = 'private' 
                AND can_edit_problem(problems.id, auth.uid())
            )
        )
    )
);
