# Task 4.2 Verification: Update problem_members RLS Policies

## Migration File Created
- **File**: `supabase/migrations/20260312121400_update_problem_members_rls_policies.sql`
- **Timestamp**: 20260312121400 (follows 20260312121300)

## Implementation Summary

### RLS Policies Created

1. **problem_members_select_policy**
   - **Purpose**: Allow all problem members to view other members of the problem
   - **Helper Function**: `can_view_problem(problem_id, auth.uid())`
   - **Logic**: If user can view the problem, they can see its members
   - **Applies To**: SELECT operations for authenticated users

2. **problem_members_insert_policy**
   - **Purpose**: Only problem owners/admins can add members
   - **Helper Function**: `can_manage_problem(problem_id, auth.uid())`
   - **Logic**: Only owner/admin roles can add new problem members
   - **Applies To**: INSERT operations for authenticated users

3. **problem_members_update_policy**
   - **Purpose**: Only problem owners/admins can update member roles
   - **Helper Function**: `can_manage_problem(problem_id, auth.uid())`
   - **Logic**: Only owner/admin roles can change member roles
   - **Applies To**: UPDATE operations for authenticated users
   - **Note**: Uses both USING and WITH CHECK clauses

4. **problem_members_delete_policy**
   - **Purpose**: Only problem owners/admins can remove members
   - **Helper Function**: `can_manage_problem(problem_id, auth.uid())`
   - **Logic**: Only owner/admin roles can remove problem members
   - **Applies To**: DELETE operations for authenticated users

### Old Policies Dropped

The migration drops all existing problem_members policies to ensure a clean slate:
- `pm_select`, `pm_insert`, `pm_delete`
- `problem_members_select_policy`, `problem_members_insert_policy`, `problem_members_delete_policy`
- `problem_members_select_members`, `problem_members_insert_owner_admin`, `problem_members_update_owner_admin`, `problem_members_delete_owner_admin`
- `problem_members_select_own`, `problem_members_insert_owner`, `problem_members_update_owner`, `problem_members_delete_owner`
- `problem_members_select_v2`, `problem_members_insert_v2`, `problem_members_update_v2`, `problem_members_delete_v2`
- `problem_members_delete_safe`

### Security Features

1. **RLS Enabled**: `ALTER TABLE public.problem_members ENABLE ROW LEVEL SECURITY;`
2. **RLS Forced**: `ALTER TABLE public.problem_members FORCE ROW LEVEL SECURITY;`
   - Ensures RLS applies even to table owners (superusers)

### Helper Functions Used

1. **can_view_problem(problem_id, user_id)**
   - Returns true if user can view the problem
   - Checks visibility (public/workspace/private)
   - Checks role (explicit problem role or inherited workspace role)
   - Handles is_hidden, is_deleted, is_listed flags

2. **can_manage_problem(problem_id, user_id)**
   - Returns true if user has owner or admin role
   - Uses get_problem_role() which implements role inheritance
   - Explicit problem role takes precedence over workspace role

### Design Alignment

✅ **Follows workspace_members pattern**: Same structure as task 4.1
✅ **Uses SECURITY DEFINER functions**: All helper functions are secure
✅ **Implements role hierarchy**: Owner/admin can manage, all members can view
✅ **Enforces workspace membership**: Trigger validates workspace membership prerequisite
✅ **Clear policy naming**: Descriptive names with _policy suffix
✅ **Comprehensive comments**: Each policy has documentation

### Authorization Rules Enforced

| Action | Required Permission | Helper Function |
|--------|-------------------|-----------------|
| View members | Can view problem | can_view_problem() |
| Add members | Owner/admin role | can_manage_problem() |
| Update roles | Owner/admin role | can_manage_problem() |
| Remove members | Owner/admin role | can_manage_problem() |

### Transaction Safety

- Migration wrapped in BEGIN/COMMIT transaction
- All policy drops use IF EXISTS for idempotency
- Verification notices at end confirm successful execution

## Testing Recommendations

1. **View Access**: Verify problem members can see other members
2. **Management Access**: Verify only owners/admins can add/remove/update members
3. **Workspace Inheritance**: Verify workspace roles work without explicit problem membership
4. **Private Problems**: Verify private problem members are only visible to those with access
5. **Role Precedence**: Verify explicit problem roles override workspace roles

## Next Steps

This completes task 4.2. The next tasks in the spec are:
- Task 4.3: Update problems RLS policies
- Task 4.4: Update prompts RLS policies
- Task 4.5: Enable and force RLS on all tables
