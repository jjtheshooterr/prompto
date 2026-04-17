import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAiGenerationEnabled } from '@/lib/actions/admin.actions'
import CreatePromptClient from './CreatePromptClient'

interface PageProps {
  searchParams: Promise<{ problem?: string }>
}

export default async function CreatePromptPage({ searchParams }: PageProps) {
  const { problem: problemId } = await searchParams

  // If no problem ID provided, redirect immediately server-side (no flash)
  if (!problemId) {
    redirect('/problems')
  }

  // Auth check server-side
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/create/prompt?problem=${problemId}`)
  }

  // Read the ai_generation_enabled flag once, server-side, before rendering
  const aiGenerationEnabled = await getAiGenerationEnabled()

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <CreatePromptClient
        user={user}
        problemId={problemId}
        aiGenerationEnabled={aiGenerationEnabled}
      />
    </Suspense>
  )
}