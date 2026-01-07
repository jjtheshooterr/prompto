'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import CreatePromptClient from './CreatePromptClient'

function CreatePromptContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const problemId = searchParams.get('problem')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('Create prompt - Auth check:', { user: user?.email || 'No user' })
      
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

  if (!problemId) {
    router.push('/problems')
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Redirecting to login...</div>
      </div>
    )
  }

  return <CreatePromptClient user={user} problemId={problemId} />
}

export default function CreatePromptPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <CreatePromptContent />
    </Suspense>
  )
}