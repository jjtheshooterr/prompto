# Task 4.1 Verification: Update workspace_members RLS Policies

## Task Requirements
- Update RLS policies for the workspace_members table
- Use helper functions like can_manage_workspace() and can_view_workspace()
- Ensure policies enforce that only workspace owners/admins can manage members
- All workspace members can view other members in their workspace
- Enable RLS on the table

## Implementation Summary

### Migration File Created
- **File**: `supabase/migrations/20260312121300_update_workspace_members_rls_policies.sql`
- **Timestamp**: 20260312121300 (follows sequential order after 20260312121200)

### Policies Implemented

#### 1. SELECT Policy: `workspace_members_select_policy`
- **Purpose**: Allow all workspace members to view other members in their workspace
- **Helper Function Used**: `can_view_workspace(workspace_id, auth.uid())`
- **Logic**: Returns true for any workspace member (owner, admin, member, viewer)
- **Matches Design**: ✅ Yes - Design states "All workspace members can view other members in their workspace"

#### 2. INSERT Policy: `workspace_members_insert_policy`
- **Purpose**: Only workspace owners/admins can add members
- **Helper Function Used**: `can_manage_workspace(workspace_id, auth.uid())`
- **Logic**: Returns true only for owner/admin roles
- **Matches Design**: ✅ Yes - Design states "Only workspace owners/admins can manage members"

#### 3. UPDATE Policy: `workspace_members_update_policy`
- **Purpose**: Only workspace owners/admins can update member roles
- **Helper Function Used**: `can_manage_workspace(workspace_id, auth.uid())`
- **Logic**: Returns true only for owner/admin roles (both USING and WITH CHECK)
- **Matches Design**: ✅ Yes - Design states "Only workspace owners/admins can manage members"

#### 4. DELETE Policy: `workspace_members_delete_policy`
- **Purpose**: Only workspace owners/admins can remove members
- **Helper Function Used**: `can_manage_workspace(workspace_id, auth.uid())`
- **Logic**: Returns true only for owner/admin roles
- **Matches Design**: ✅ Yes - Design states "Only workspace owners/admins can manage members"

### RLS Enforcement
- ✅ `ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;`
- ✅ `ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;`

### Policy Naming Convention
- ✅ Clear naming: `workspace_members_select_policy`, `workspace_members_insert_policy`, etc.
- ✅ Matches design document recommendation for clear policy names

### Helper Functions Verified
- ✅ `can_view_workspace()` exists in migration `20260312121100_create_permission_check_functions.sql`
- ✅ `can_manage_workspace()` exists in migration `20260312121100_create_permission_check_functions.sql`

### Old Policies Cleaned Up
The migration drops all existing workspace_members policies to avoid conflicts:
- workspace_members_select_own
- workspace_members_insert_owner
- workspace_members_update_owner
- workspace_members_delete_owner
- workspace_members_select
- workspace_members_select_v2
- workspace_members_insert
- workspace_members_insert_v2
- workspace_members_update
- workspace_members_update_v2
- workspace_members_delete
- workspace_members_delete_v2
- And several other legacy policies

## Design Document Compliance

### From Design.md Section on can_manage_workspace():
> "Checks if a user can manage a workspace (invite members, remove members, rename workspace, etc.). Only owner and admin roles can manage workspaces."

✅ **Compliant**: INSERT, UPDATE, DELETE policies all use `can_manage_workspace()`

### From Design.md Section on can_view_workspace():
> "Checks if a user can view a workspace (any role). Used for workspace UI elements like sidebar, switcher, cards, and selector."

✅ **Compliant**: SELECT policy uses `can_view_workspace()`

### From Design.md Workspace Role Permissions Table:
| Role | View Workspace | Manage Members |
|------|----------------|----------------|
| owner | ✓ | ✓ |
| admin | ✓ | ✓ |
| member | ✓ | ✗ |
| viewer | ✓ | ✗ |

✅ **Compliant**: 
- SELECT policy allows all roles (owner, admin, member, viewer) via `can_view_workspace()`
- INSERT/UPDATE/DELETE policies allow only owner/admin via `can_manage_workspace()`

## Security Considerations

### SECURITY DEFINER Functions
- ✅ Both helper functions use `SECURITY DEFINER` with `SET search_path = public`
- ✅ Prevents search_path attacks

### RLS Enforcement
- ✅ RLS is enabled on the table
- ✅ RLS is forced even for table owners

### Transaction Safety
- ✅ Migration wrapped in BEGIN/COMMIT transaction
- ✅ All policy drops use IF EXISTS to prevent errors

## Verification Checklist

- [x] Migration file created with correct timestamp
- [x] All old policies dropped to avoid conflicts
- [x] SELECT policy uses can_view_workspace()
- [x] INSERT policy uses can_manage_workspace()
- [x] UPDATE policy uses can_manage_workspace() (both USING and WITH CHECK)
- [x] DELETE policy uses can_manage_workspace()
- [x] RLS enabled on workspace_members table
- [x] RLS forced on workspace_members table
- [x] Policy names are clear and descriptive
- [x] Comments added for documentation
- [x] Verification notice included in migration
- [x] Matches design document requirements
- [x] Matches task details requirements

## Conclusion

✅ **Task 4.1 is complete and ready for testing.**

The migration successfully:
1. Updates workspace_members RLS policies to use the new helper functions
2. Enforces that only workspace owners/admins can manage members
3. Allows all workspace members to view other members in their workspace
4. Enables and forces RLS on the table
5. Uses clear, descriptive policy names
6. Follows the design document specifications exactly
