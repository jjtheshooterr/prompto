# Task 4.4 Verification: Update Prompts RLS Policies

## Migration File
- **File**: `supabase/migrations/20260312121600_update_prompts_rls_policies.sql`
- **Status**: ✅ Created

## Implementation Summary

### RLS Policies Created

#### 1. SELECT Policy (`prompts_select_policy`)
- **Purpose**: Control who can view prompts
- **Logic**: 
  - Prompts inherit visibility from parent problem
  - Uses `can_view_problem(problem_id, auth.uid())`
  - Filters out deleted prompts (`NOT is_deleted`)
- **Access**: `authenticated, anon` (anonymous users can view public prompts)

#### 2. INSERT Policy (`prompts_insert_policy`)
- **Purpose**: Control who can submit prompts
- **Logic**:
  - Uses `can_submit_prompt(problem_id, auth.uid())`
  - Returns true for owner/admin/member roles
  - Returns false for viewer role (read-only)
  - Enforces `created_by = auth.uid()`
- **Access**: `authenticated` only

#### 3. UPDATE Policy (`prompts_update_policy`)
- **Purpose**: Control who can edit prompts
- **Logic**:
  - Uses `can_edit_prompt(id, auth.uid())`
  - Owner/admin can edit any prompt
  - Member can edit only their own prompts (via `created_by`)
  - Viewer cannot edit any prompts
  - Filters out deleted prompts (`NOT is_deleted`)
- **Access**: `authenticated` only

#### 4. DELETE Policy (`prompts_delete_policy`)
- **Purpose**: Control who can delete prompts
- **Logic**:
  - Uses `can_manage_prompt(id, auth.uid())`
  - Only owner/admin can delete prompts
  - Members cannot delete prompts (even their own)
- **Access**: `authenticated` only

## Key Design Principles Implemented

### 1. Visibility Inheritance
✅ Prompts fully inherit visibility from their parent problem
✅ No separate visibility column on prompts table
✅ Uses `can_view_problem()` for SELECT policy

### 2. Role-Based Permissions
✅ Owner/admin can edit any prompt
✅ Member can edit only their own prompts (via `created_by`)
✅ Viewer cannot edit any prompts
✅ Only owner/admin can delete prompts

### 3. Helper Function Usage
✅ `can_view_problem()` - SELECT policy
✅ `can_submit_prompt()` - INSERT policy
✅ `can_edit_prompt()` - UPDATE policy
✅ `can_manage_prompt()` - DELETE policy

### 4. Security Best Practices
✅ All helper functions use SECURITY DEFINER
✅ RLS enabled on prompts table
✅ RLS forced even for table owners
✅ Clear policy naming convention
✅ Comprehensive comments on policies

## Dropped Old Policies

The migration drops all existing prompts policies to ensure a clean slate:
- `Anyone can view public and unlisted prompts`
- `Workspace members can create prompts`
- `Workspace members can update their prompts`
- `Workspace members can delete their prompts`
- `prompts_select_policy`
- `prompts_insert_policy`
- `prompts_update_policy`
- `prompts_delete_policy`
- `prompts_select`
- `prompts_insert`
- `prompts_update`
- `prompts_delete`
- `prompts_public_select_policy`
- `prompts_update_owner`
- `prompts_delete_owner`
- `prompts_update_delete`
- `prompts_select_public_or_members`
- `prompts_insert_authenticated`
- `prompts_update_owner_admin`
- `prompts_delete_owner_admin`

## Authorization Flow

### Viewing a Prompt
1. User requests to view prompt
2. RLS checks `prompts_select_policy`
3. Policy checks `NOT is_deleted`
4. Policy calls `can_view_problem(problem_id, auth.uid())`
5. `can_view_problem()` checks problem visibility and user role
6. Access granted if user can view parent problem

### Submitting a Prompt
1. User attempts to create prompt
2. RLS checks `prompts_insert_policy`
3. Policy calls `can_submit_prompt(problem_id, auth.uid())`
4. `can_submit_prompt()` gets effective role via `get_problem_role()`
5. Returns true if role is owner/admin/member
6. Access granted if role check passes and `created_by = auth.uid()`

### Editing a Prompt
1. User attempts to update prompt
2. RLS checks `prompts_update_policy`
3. Policy calls `can_edit_prompt(id, auth.uid())`
4. `can_edit_prompt()` gets effective role and checks `created_by`
5. Returns true if:
   - Role is owner/admin (can edit any prompt), OR
   - Role is member AND `created_by = user_id` (can edit own prompt)
6. Access granted if check passes and `NOT is_deleted`

### Deleting a Prompt
1. User attempts to delete prompt
2. RLS checks `prompts_delete_policy`
3. Policy calls `can_manage_prompt(id, auth.uid())`
4. `can_manage_prompt()` gets effective role
5. Returns true if role is owner/admin
6. Access granted if role check passes

## Verification Checklist

- [x] Migration file created with correct naming convention
- [x] All old policies dropped to avoid conflicts
- [x] SELECT policy uses `can_view_problem()`
- [x] INSERT policy uses `can_submit_prompt()`
- [x] UPDATE policy uses `can_edit_prompt()`
- [x] DELETE policy uses `can_manage_prompt()`
- [x] Policies enforce `created_by = auth.uid()` for INSERT
- [x] Policies check `NOT is_deleted` where appropriate
- [x] RLS enabled and forced on prompts table
- [x] Policy comments added for documentation
- [x] Anonymous users can view public prompts (SELECT policy)
- [x] Only authenticated users can INSERT/UPDATE/DELETE

## Design Document Alignment

### From Design.md Section on can_edit_prompt():

> **Preconditions**:
> - p_prompt_id references a valid prompt
> - p_user_id is provided
> 
> **Postconditions**:
> - Returns true if user is owner/admin OR is member and created the prompt
> - Returns false otherwise
> - created_by is attribution + ownership check for limited edit rights
> - Members can edit only their own prompts (checked via created_by)
> - Admins/owners can edit any prompt
> - This is NOT full authorization, but IS used for member-level edit checks
> - No side effects

✅ **Implemented correctly** - UPDATE policy uses `can_edit_prompt()` which implements this exact logic

### From Design.md Section on Prompt Visibility:

> **Visibility Inheritance**:
> - Prompts fully inherit visibility from their parent problem
> - No separate visibility column on prompts table
> - Simplifies authorization logic and reduces complexity

✅ **Implemented correctly** - SELECT policy uses `can_view_problem(problem_id, auth.uid())`

### From Design.md Section on Authorization Rule:

> **Authorization Rule**:
> - Prompt permissions = Problem permissions (inherited through problem_id)
> - created_by is attribution + ownership check for limited edit rights
> - Members can edit only their own prompts (checked via created_by)
> - Admins/owners can edit any prompt
> - This is NOT full authorization, but IS used for member-level edit checks
> - Effective role comes from problem's effective role

✅ **Implemented correctly** - All policies delegate to helper functions that use `get_problem_role()`

## Next Steps

1. ✅ Migration file created
2. ⏭️ Run migration on database (task 4.5)
3. ⏭️ Test RLS policies with different roles
4. ⏭️ Verify prompt permissions match problem permissions
5. ⏭️ Test member can edit only their own prompts
6. ⏭️ Test admin/owner can edit any prompt

## Notes

- The migration follows the same pattern as `20260312121500_update_problems_rls_policies.sql`
- All helper functions are already created in `20260312121100_create_permission_check_functions.sql`
- The migration is idempotent (can be run multiple times safely)
- Policy names follow the convention: `{table}_{operation}_policy`
