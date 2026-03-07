import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { promptUrl, problemUrl } from '@/lib/utils/prompt-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://promptvexity.vercel.app'
  const supabase = await createClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/problems`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/prompts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Get public problems
  const { data: problems } = await supabase
    .from('problems')
    .select('id, slug, updated_at')
    .eq('visibility', 'public')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(1000)

  const problemPages: MetadataRoute.Sitemap = (problems || []).map((problem) => ({
    url: `${baseUrl}${problemUrl({ id: problem.id, slug: problem.slug || '' })}`,
    lastModified: new Date(problem.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Get public prompts
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, slug, updated_at, problems!inner(visibility)')
    .eq('is_listed', true)
    .eq('is_deleted', false)
    .eq('problems.visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const promptPages: MetadataRoute.Sitemap = (prompts || []).map((prompt) => ({
    url: `${baseUrl}${promptUrl({ id: prompt.id, slug: (prompt as any).slug || '' })}`,
    lastModified: new Date(prompt.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Get public profiles with usernames
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at')
    .not('username', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500)

  const profilePages: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${baseUrl}/u/${profile.username}`,
    lastModified: new Date(profile.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...problemPages, ...promptPages, ...profilePages]
}
