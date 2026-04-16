'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleShadowban, updateTrustScore, banUser, unbanUser } from '@/lib/actions/admin.actions'
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

export default function UsersTable({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleShadowban = async (e: React.FormEvent<HTMLFormElement>, userId: string, currentStatus: boolean) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const reason = formData.get('shadowban_reason') as string

    setLoading(userId)
    // Optimistic UI update
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, is_shadowbanned: !currentStatus, shadowban_reason: !currentStatus ? reason : null } : u
    ))

    try {
      await toggleShadowban(userId, !currentStatus, reason || undefined)
      toast.success(currentStatus ? 'User un-shadowbanned' : 'User shadowbanned')
      router.refresh() // Keep server sync
    } catch (e: any) {
      // Revert Optimistic UI
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_shadowbanned: currentStatus } : u
      ))
      toast.error(e.message)
    } finally {
      setLoading(null)
    }
  }

  const handleTrustScore = async (e: React.FormEvent<HTMLFormElement>, userId: string) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const score = Number(formData.get('score'))
    
    if (isNaN(score)) return

    setLoading(userId)
    
    // Optimistic UI update
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, system_trust_score: score } : u
    ))

    try {
      await updateTrustScore(userId, score)
      toast.success('Trust score updated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      router.refresh() // Re-fetch to revert the UI cleanly if it fails
    } finally {
      setLoading(null)
    }
  }

  const handleBan = async (e: React.FormEvent<HTMLFormElement>, userId: string, isBanned: boolean) => {
    e.preventDefault()
    setLoading(userId)

    try {
      if (isBanned) {
        
        // Optimistic UI unban
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_banned: false } : u
        ))

        await unbanUser(userId)
        toast.success('User unbanned')
      } else {
        const formData = new FormData(e.currentTarget)
        const reason = formData.get('reason') as string
        if (!reason) throw new Error('Reason is required to ban')

        // Optimistic UI ban
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_banned: true } : u
        ))

        await banUser(userId, reason)
        toast.success('User banned and session revoked')
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
      router.refresh() // Re-fetch to revert UI if DB fails
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
            <th className="p-3 border-b border-border">Trust Score</th>
            <th className="p-3 border-b border-border">Shadowban</th>
            <th className="p-3 border-b border-border">Hard Ban</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="p-3">
                <Link href={`/u/${user.username}`} target="_blank" className="font-medium text-foreground hover:text-primary hover:underline transition-colors">
                  {user.username}
                </Link>
                <div className="text-xs text-muted-foreground">{user.id}</div>
                <div className="text-xs text-muted-foreground mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                  {user.role}
                </span>
                {user.is_banned && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 font-bold">
                    BANNED
                  </span>
                )}
              </td>
              <td className="p-3">
                <form onSubmit={(e) => handleTrustScore(e, user.id)} className="flex items-center gap-2">
                  <input 
                    type="number" 
                    name="score" 
                    defaultValue={user.system_trust_score}
                    className="w-20 px-2 py-1 bg-background border border-border rounded text-sm"
                  />
                  <button 
                    disabled={loading === user.id}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50"
                  >
                    Set
                  </button>
                </form>
              </td>
              <td className="p-3">
                {user.is_banned ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-muted text-muted-foreground italic" title="Shadowban is managed automatically by the ban system. Unban the user to restore their previous state.">
                    🔒 Tied to ban
                  </span>
                ) : user.is_shadowbanned ? (
                  <form onSubmit={(e) => handleShadowban(e, user.id, true)} className="flex flex-col gap-1.5">
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
                  <form onSubmit={(e) => handleShadowban(e, user.id, false)} className="flex flex-col gap-1.5">
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
                {user.is_banned ? (
                   <form onSubmit={(e) => handleBan(e, user.id, true)}>
                      <button 
                        disabled={loading === user.id}
                        className="px-3 py-1 text-xs bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 disabled:opacity-50 font-bold"
                      >
                        Unban User
                      </button>
                   </form>
                ) : (
                  <form onSubmit={(e) => handleBan(e, user.id, false)} className="flex items-center gap-2">
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
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
