import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateProblemClient from './CreateProblemClient'

export default async function CreateProblemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <CreateProblemClient user={user} />
}