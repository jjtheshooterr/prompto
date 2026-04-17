'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  toggleShadowban, 
  updateTrustScore, 
  banUser, 
  unbanUser, 
  promoteToAdmin, 
  revokeAdmin, 
  promoteToOwner, 
  revokeOwner 
} from '@/lib/actions/admin.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type AdminUser = {
  id: string
  username: string
  display_name: string
  role: string
  is_shadowbanned: boolean
  shadowban_reason: string | null
  system_trust_score: number
  created_at: string
  is_banned: boolean
}

export default function UsersTable({ 
  users: initialUsers, 
  currentUserId,
  currentUserRole = 'user'
}: { 
  users: AdminUser[], 
  currentUserId?: string,
  currentUserRole?: string
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  // Hierarchy Logic:
  // - Owners can moderate anyone except themselves.
  // - Admins can ONLY moderate regular Users and Moderators.
  // - Admins CANNOT moderate other Admins or Owners.
  const canModerate = (targetId: string, targetRole: string) => {
    if (currentUserId === targetId) return false // Self-moderation is Always blocked
    if (currentUserRole === 'owner') return true // Owners are gods
    
    // Admins are restricted hierarchy-wise
    if (currentUserRole === 'admin') {
      const highTier = ['admin', 'owner']
      return !highTier.includes(targetRole)
    }

    return false
  }

  const handleShadowban = async (e: React.FormEvent<HTMLFormElement>, userId: string, targetRole: string, currentStatus: boolean) => {
    e.preventDefault()
    if (!canModerate(userId, targetRole)) {
      toast.error('Permission Denied: Hierarchical protection is active')
      return
    }

    const formData = new FormData(e.currentTarget)
    const reason = formData.get('shadowban_reason') as string

    setLoading(userId)
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, is_shadowbanned: !currentStatus, shadowban_reason: !currentStatus ? reason : null } : u
    ))

    try {
      await toggleShadowban(userId, !currentStatus, reason || undefined)
      toast.success(currentStatus ? 'User un-shadowbanned' : 'User shadowbanned')
      router.refresh()
    } catch (e: any) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_shadowbanned: currentStatus } : u
      ))
      toast.error(e.message)
    } finally {
      setLoading(null)
    }
  }

  const handleTrustScore = async (e: React.FormEvent<HTMLFormElement>, userId: string, targetRole: string) => {
    e.preventDefault()
    if (!canModerate(userId, targetRole)) {
      toast.error('Permission Denied: Cannot modify trust scores for high-tier accounts')
      return
    }

    const formData = new FormData(e.currentTarget)
    const score = Number(formData.get('score'))
    if (isNaN(score)) return

    setLoading(userId)
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, system_trust_score: score } : u
    ))

    try {
      await updateTrustScore(userId, score)
      toast.success('Trust score updated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      router.refresh() 
    } finally {
      setLoading(null)
    }
  }

  const handleBan = async (e: React.FormEvent<HTMLFormElement>, userId: string, targetRole: string, isBanned: boolean) => {
    e.preventDefault()
    if (!canModerate(userId, targetRole)) {
      toast.error('Permission Denied: High-tier accounts are immune to standard bans')
      return
    }

    setLoading(userId)
    try {
      if (isBanned) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_banned: false } : u
        ))
        await unbanUser(userId)
        toast.success('User unbanned')
      } else {
        const formData = new FormData(e.currentTarget)
        const reason = formData.get('reason') as string
        if (!reason) throw new Error('Reason is required to ban')

        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_banned: true } : u
        ))
        await banUser(userId, reason)
        toast.success('User banned and session revoked')
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const handleAdminRole = async (userId: string, currentRole: string) => {
    if (!canModerate(userId, currentRole)) {
      toast.error('Permission Denied: Hierarchical protection is active')
      return
    }

    if (currentUserRole !== 'owner') {
      toast.error('Permission Denied: Only Owners can manage global roles')
      return
    }

    setLoading(userId)
    try {
      if (currentRole === 'admin') {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'user' } : u))
        await revokeAdmin(userId)
        toast.success('Admin role revoked')
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u))
        await promoteToAdmin(userId)
        toast.success('User promoted to admin')
      }
      router.refresh()
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: currentRole } : u))
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleOwnerRole = async (userId: string, currentRole: string) => {
    if (!canModerate(userId, currentRole)) {
      toast.error('Permission Denied: Hierarchical protection is active')
      return
    }

    if (currentUserRole !== 'owner') {
      toast.error('Permission Denied: Only Owners can manage Owner status')
      return
    }

    setLoading(userId)
    try {
      if (currentRole === 'owner') {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u))
        await revokeOwner(userId)
        toast.success('Owner status revoked (Downgraded to Admin)')
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'owner' } : u))
        await promoteToOwner(userId)
        toast.success('User promoted to OWNER')
      }
      router.refresh()
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: currentRole } : u))
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="p-3 border-b border-border">User</th>
            <th className="p-3 border-b border-border">Role / Status</th>
            <th className="p-3 border-b border-border text-center">Hierarchy Management</th>
            <th className="p-3 border-b border-border">Trust Score</th>
            <th className="p-3 border-b border-border">Shadowban</th>
            <th className="p-3 border-b border-border">Hard Ban</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isProtected = !canModerate(user.id, user.role)

            return (
              <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-3">
                  <Link href={`/u/${user.username}`} target="_blank" className="font-medium text-foreground hover:text-primary hover:underline transition-colors">
                    {user.username}
                  </Link>
                  <div className="text-xs text-muted-foreground">{user.id}</div>
                  <div className="text-xs text-muted-foreground mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    user.role === 'owner' 
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : user.role === 'admin' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-foreground'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                  {user.is_banned && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 font-bold">
                      BANNED
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col gap-2 items-center">
                    {currentUserId === user.id ? (
                      <span className="text-xs text-muted-foreground italic">You</span>
                    ) : (currentUserRole === 'admin') ? (
                       <span className="text-xs text-muted-foreground italic opacity-70">Requires Owner Tier</span>
                    ) : currentUserRole === 'owner' ? (
                      <>
                        {/* Admin Management */}
                        <button
                          disabled={loading === user.id}
                          onClick={() => handleAdminRole(user.id, user.role)}
                          className={`w-32 px-3 py-1 text-xs rounded transition-colors font-medium border ${
                            user.role === 'admin' 
                              ? 'border-destructive/30 text-destructive hover:bg-destructive/10' 
                              : 'border-primary/30 text-primary hover:bg-primary/10'
                          }`}
                        >
                          {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        
                        {/* Owner Management */}
                        <button
                          disabled={loading === user.id}
                          onClick={() => handleOwnerRole(user.id, user.role)}
                          className={`w-32 px-3 py-1 text-xs rounded transition-colors font-bold border-2 ${
                            user.role === 'owner'
                              ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                              : 'border-amber-500/30 text-amber-500/70 hover:bg-amber-500/10'
                          }`}
                        >
                          {user.role === 'owner' ? 'Revoke Owner' : 'Make Owner'}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic opacity-50 select-none">Access Restricted</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <form onSubmit={(e) => handleTrustScore(e, user.id, user.role)} className="flex items-center gap-2">
                    <input 
                      type="number" 
                      name="score" 
                      defaultValue={user.system_trust_score}
                      disabled={isProtected}
                      className="w-20 px-2 py-1 bg-background border border-border rounded text-sm disabled:opacity-30"
                    />
                    {!isProtected && (
                      <button 
                        disabled={loading === user.id}
                        className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50"
                      >
                        Set
                      </button>
                    )}
                  </form>
                </td>
                <td className="p-3">
                  {isProtected ? (
                     <span className="text-xs text-muted-foreground italic opacity-50 select-none">Tier Immune</span>
                  ) : user.is_banned ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-muted text-muted-foreground italic" title="Shadowban is managed automatically by the ban system. Unban the user to restore their previous state.">
                      🔒 Tied to ban
                    </span>
                  ) : user.is_shadowbanned ? (
                    <form onSubmit={(e) => handleShadowban(e, user.id, user.role, true)} className="flex flex-col gap-1.5">
                      <button
                        disabled={loading === user.id}
                        className="px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 font-bold whitespace-nowrap"
                      >
                        Shadowbanned (Undo)
                      </button>
                      {user.shadowban_reason && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={user.shadowban_reason}>
                          {user.shadowban_reason}
                        </span>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={(e) => handleShadowban(e, user.id, user.role, false)} className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        name="shadowban_reason"
                        placeholder="Reason (optional)"
                        className="w-32 px-2 py-1 bg-background border border-border rounded text-xs"
                      />
                      <button
                        disabled={loading === user.id}
                        className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-yellow-500/20 hover:text-yellow-500 transition-colors disabled:opacity-50 font-medium"
                      >
                        Shadowban
                      </button>
                    </form>
                  )}
                </td>
                <td className="p-3">
                  {isProtected ? (
                     <span className="text-xs text-muted-foreground italic opacity-50 select-none">Tier Immune</span>
                  ) : user.is_banned ? (
                     <form onSubmit={(e) => handleBan(e, user.id, user.role, true)}>
                        <button 
                          disabled={loading === user.id}
                          className="px-3 py-1 text-xs bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 disabled:opacity-50 font-bold"
                        >
                          Unban User
                        </button>
                     </form>
                  ) : (
                    <form onSubmit={(e) => handleBan(e, user.id, user.role, false)} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        name="reason" 
                        placeholder="Reason for ban..."
                        className="w-32 px-2 py-1 bg-background border border-border rounded text-xs"
                        required
                      />
                      <button 
                        disabled={loading === user.id}
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 disabled:opacity-50 font-bold"
                      >
                        Ban
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            )
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
