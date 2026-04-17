-- Fix: is_moderator() did not include the 'owner' role, which was added later
-- as a super-admin role above 'admin'. This caused owners to be denied SELECT
-- on the reports table (and any other table gated by is_moderator()).
--
-- NOTE: The admin reports page was also switched to use the service role client
-- (createAdminClient) which bypasses RLS entirely for verified admin/owner users,
-- so this migration is belt-and-suspenders but good hygiene for other RLS policies
-- that rely on is_moderator().

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'moderator', 'owner')
  );
$$;
