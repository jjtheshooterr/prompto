-- Add missing owner memberships for private problems
INSERT INTO problem_members (problem_id, user_id, role)
SELECT p.id, p.owner_id, 'owner'
FROM problems p
WHERE p.visibility = 'private'
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM problem_members pm 
    WHERE pm.problem_id = p.id AND pm.user_id = p.owner_id
  );;
