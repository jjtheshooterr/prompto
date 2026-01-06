'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CreateProblemClient from './CreateProblemClient'

export default function CreateProblemPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('Create problem - Auth check:', { user: user?.email || 'No user' })
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Redirecting to login...</div>
      </div>
    )
  }

  return <CreateProblemClient user={user} />
}