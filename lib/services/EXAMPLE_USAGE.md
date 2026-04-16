# WorkspaceMembershipManager Usage Examples

## Example 1: Add Member to Workspace (API Route)

```typescript
// app/api/workspaces/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceMembershipService } from '@/lib/services'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await request.json()
    const workspaceId = params.id

    // Check if current user can manage workspace
    const service = new WorkspaceMembershipService(supabase)
    const currentUserRole = await service.getRole(workspaceId, user.id)
    
    if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add the new member
    await service.addMember(workspaceId, userId, role)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding workspace member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add member' },
      { status: 500 }
    )
  }
}
```

## Example 2: Remove Member from Workspace

```typescript
// app/api/workspaces/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceMembershipService } from '@/lib/services'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = params.id
    const targetUserId = params.userId

    // Check if current user can manage workspace
    const service = new WorkspaceMembershipService(supabase)
    const currentUserRole = await service.getRole(workspaceId, user.id)
    
    if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove the member (cascades to problem memberships)
    await service.removeMember(workspaceId, targetUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    )
  }
}
```

## Example 3: Update Member Role

```typescript
// app/api/workspaces/[id]/members/[userId]/role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceMembershipService, type WorkspaceRole } from '@/lib/services'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json() as { role: WorkspaceRole }
    const workspaceId = params.id
    const targetUserId = params.userId

    // Check if current user can manage workspace
    const service = new WorkspaceMembershipService(supabase)
    const currentUserRole = await service.getRole(workspaceId, user.id)
    
    if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only owners can promote to owner
    if (role === 'owner' && currentUserRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can promote other owners' },
        { status: 403 }
      )
    }

    // Update the role
    await service.updateRole(workspaceId, targetUserId, role)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating workspace member role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update role' },
      { status: 500 }
    )
  }
}
```

## Example 4: Server Action

```typescript
// lib/actions/workspace.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { WorkspaceMembershipService } from '@/lib/services'
import { revalidatePath } from 'next/cache'

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' | 'viewer'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const service = new WorkspaceMembershipService(supabase)
  
  // Check permissions
  const currentUserRole = await service.getRole(workspaceId, user.id)
  if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
    throw new Error('Forbidden: You do not have permission to add members')
  }

  // Add member
  await service.addMember(workspaceId, userId, role)

  // Revalidate workspace page
  revalidatePath(`/workspace/${workspaceId}`)
  
  return { success: true }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const service = new WorkspaceMembershipService(supabase)
  
  // Check permissions
  const currentUserRole = await service.getRole(workspaceId, user.id)
  if (!currentUserRole || !['owner', 'admin'].includes(currentUserRole)) {
    throw new Error('Forbidden: You do not have permission to remove members')
  }

  // Remove member
  await service.removeMember(workspaceId, userId)

  // Revalidate workspace page
  revalidatePath(`/workspace/${workspaceId}`)
  
  return { success: true }
}
```

## Example 5: React Component

```typescript
// components/workspace/MemberList.tsx
'use client'

import { useState } from 'react'
import { addWorkspaceMember, removeWorkspaceMember } from '@/lib/actions/workspace.actions'

interface Member {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

export function MemberList({ 
  workspaceId, 
  members,
  currentUserRole 
}: { 
  workspaceId: string
  members: Member[]
  currentUserRole: string
}) {
  const [loading, setLoading] = useState(false)

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    setLoading(true)
    try {
      await removeWorkspaceMember(workspaceId, userId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole)

  return (
    <div>
      <h2>Workspace Members</h2>
      <ul>
        {members.map(member => (
          <li key={member.id}>
            {member.name} - {member.role}
            {canManageMembers && member.role !== 'owner' && (
              <button 
                onClick={() => handleRemoveMember(member.id)}
                disabled={loading}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```
