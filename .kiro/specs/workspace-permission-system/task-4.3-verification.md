# Task 4.3 Verification: Update problems RLS policies

## Migration File
`supabase/migrations/20260312121500_update_problems_rls_policies.sql`

## Implementation Summary

### RLS Policies Created

#### 1. SELECT Policy: `problems_select_policy`
- **Function Used**: `can_view_problem(id, auth.uid())`
- **Applies To**: `authenticated` and `anon` users
- **Visibility Rules**:
  - **Public problems**: Visible to anyone if `is_listed=true` AND `is_hidden=false`
  - **Workspace problems**: Visible to workspace members
  - **Private problems**: Visible to explicit problem members OR workspace admins/owners
  - **Hidden problems**: Only visible to workspace admin/owner OR problem admin/owner
  - **Deleted problems**: Never visible (filtered by helper function)

#### 2. INSERT Policy: `problems_insert_policy`
- **Function Used**: `get_workspace_role(workspace_id, auth.uid())`
- **Applies To**: `authenticated` users only
- **Permission Rules**:
  - User must be workspace member with `owner`, `admin`, or `member` role
  - **Viewer role CANNOT create problems** (read-only)
  - `created_by` must be set to current user (`auth.uid()`)

#### 3. UPDATE Policy: `problems_update_policy`
- **Function Used**: `can_edit_problem(id, auth.uid())`
- **Applies To**: `authenticated` users only
- **Permission Rules**:
  - Only `owner` and `admin` roles can edit problem metadata
  - **Members CANNOT edit problem definitions** (can only submit prompts)
  - Applied to both `USING` and `WITH CHECK` clauses

#### 4. DELETE Policy: `problems_delete_policy`
- **Function Used**: `can_manage_problem(id, auth.uid())`
- **Applies To**: `authenticated` users only
- **Permission Rules**:
  - Only `owner` and `admin` roles can delete problems
  - Management operation restricted to admin-level roles

### Security Features

1. **RLS Enabled**: `ALTER TABLE problems ENABLE ROW LEVEL SECURITY;`
2. **Force RLS**: `ALTER TABLE problems FORCE ROW LEVEL SECURITY;`
   - Ensures RLS applies even to table owners (security best practice)

### Helper Functions Used

All helper functions are SECURITY DEFINER with `SET search_path = public`:

1. **can_view_problem(p_problem_id UUID, p_user_id UUID)**: 
   - Handles all visibility logic (public/workspace/private)
   - Checks listing, hidden, and deleted flags
   - Verifies role-based access for private/hidden problems

2. **can_edit_problem(p_problem_id UUID, p_user_id UUID)**:
   - Returns true only for owner/admin roles
   - Uses `get_problem_role()` internally (explicit problem role ?? workspace role)

3. **can_manage_problem(p_problem_id UUID, p_user_id UUID)**:
   - Returns true only for owner/admin roles
   - Used for management operations (delete, change visibility, manage members)

4. **get_workspace_role(p_workspace_id UUID, p_user_id UUID)**:
   - Returns workspace role or NULL
   - Used in INSERT policy to check role before allowing problem creation

### Policy Naming Convention

All policies follow the naming pattern: `problems_{operation}_policy`
- `problems_select_policy`
- `problems_insert_policy`
- `problems_update_policy`
- `problems_delete_policy`

### Cleanup

The migration drops all old/conflicting policies before creating new ones:
- Old named policies from previous migrations
- Policies with different naming conventions
- Ensures clean slate for new policy implementation

## Verification Checklist

- [x] SELECT policy uses `can_view_problem()` helper function
- [x] INSERT policy checks workspace role (owner/admin/member only, excludes viewer)
- [x] UPDATE policy uses `can_edit_problem()` helper function
- [x] DELETE policy uses `can_manage_problem()` helper function
- [x] RLS is enabled on problems table
- [x] RLS is forced (applies to table owners)
- [x] Policies are named clearly (problems_select_policy, etc.)
- [x] All old policies are dropped before creating new ones
- [x] Comments added to document each policy's purpose
- [x] Public problems visible to anonymous users (anon role in SELECT policy)
- [x] Workspace problems visible only to workspace members
- [x] Private problems visible to explicit members OR workspace admins/owners
- [x] Hidden problems only visible to admins/owners (not members)
- [x] Members CANNOT edit problem metadata (only owner/admin)
- [x] Viewer role CANNOT create problems (read-only)

## Design Document Compliance

### Visibility Rules (from design.md)
✅ **Public problems**: Visible to anyone if `is_listed=true` AND `is_hidden=false`
✅ **Workspace problems**: Visible to workspace members
✅ **Private problems**: Visible to explicit problem members OR workspace admins/owners
✅ **Hidden problems**: Only visible to workspace admin/owner OR problem admin/owner

### Role-Based Permissions (from design.md)
✅ **Owner/Admin**: Can view, edit, manage, delete problems
✅ **Member**: Can view and create problems, CANNOT edit problem metadata
✅ **Viewer**: Can view problems, CANNOT create or edit

### Security Best Practices (from design.md)
✅ All helper functions use SECURITY DEFINER with SET search_path
✅ RLS policies enforce same logic at database level
✅ FORCE ROW LEVEL SECURITY enabled
✅ Policies named clearly for maintainability

## Task Requirements Met

From task details:
- [x] Update RLS policies for the problems table
- [x] Use helper functions like `can_view_problem()`, `can_edit_problem()`, `can_manage_problem()`
- [x] Ensure policies enforce visibility rules (public, workspace, private)
- [x] Ensure policies enforce role-based permissions (owner/admin can edit, member can view)
- [x] Enable RLS on the table
- [x] Policies are named clearly (e.g., problems_select_policy, problems_insert_policy)

## Notes

1. The INSERT policy uses `get_workspace_role()` directly instead of a helper function because:
   - We need to check the specific workspace role (owner/admin/member)
   - Viewer role must be explicitly excluded
   - This is a workspace-level permission check, not a problem-level check

2. The SELECT policy applies to both `authenticated` and `anon` users:
   - Anonymous users can view public listed problems
   - Authenticated users can view problems based on their role and visibility

3. All policies use the helper functions as SECURITY DEFINER functions:
   - This ensures consistent authorization logic
   - Prevents SQL injection attacks
   - Maintains security boundaries

4. The migration is idempotent:
   - Uses `DROP POLICY IF EXISTS` before creating new policies
   - Can be safely re-run without errors
