import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreatePromptClient from './CreatePromptClient'

interface CreatePromptPageProps {
  searchParams: Promise<{ problem?: string }>
}

export default async function CreatePromptPage({ searchParams }: CreatePromptPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const problemId = params.problem

  if (!problemId) {
    redirect('/problems')
  }

  return <CreatePromptClient user={user} problemId={problemId} />
}