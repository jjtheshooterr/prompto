# Services

This directory contains service layer implementations for the workspace permission system.

## WorkspaceMembershipManager

The `WorkspaceMembershipManager` service manages workspace-level roles and membership.

### Usage

```typescript
import { createClient } from '@/lib/supabase/server'
import { WorkspaceMembershipService } from '@/lib/services'

// Create service instance
const supabase = await createClient()
const workspaceService = new WorkspaceMembershipService(supabase)

// Add a member
await workspaceService.addMember(workspaceId, userId, 'member')

// Get a member's role
const role = await workspaceService.getRole(workspaceId, userId)

// Check if user is a member
const isMember = await workspaceService.isMember(workspaceId, userId)

// Update a member's role
await workspaceService.updateRole(workspaceId, userId, 'admin')

// Remove a member (cascades to problem memberships)
await workspaceService.removeMember(workspaceId, userId)
```

### Roles

- `owner`: Full control, can delete workspace, manage all members
- `admin`: Can manage members (except owners), manage all problems
- `member`: Can create problems, view workspace problems
- `viewer`: Read-only access to workspace problems

### Constraints

- At least one owner must exist per workspace
- Removing a workspace member cascades to remove all problem memberships in that workspace
- Only owners can promote other owners (admins cannot create owners)

### Error Handling

The service throws descriptive errors for:
- Invalid roles
- Duplicate memberships
- Attempting to remove the last owner
- Database errors

All errors include the original error message for debugging.
