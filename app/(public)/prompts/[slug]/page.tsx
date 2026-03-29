import { createClient } from '@/lib/supabase/server'
import { extractDbSlug, promptUrl, problemUrl } from '@/lib/utils/prompt-url'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'
import PromptDetailClient from './PromptDetailClient'

export const revalidate = 300

const BASE_URL = 'https://promptvexity.com'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPromptForSeo(slugParam: string) {
  const supabase = await createClient()
  const { dbSlug, shortId, isFullUuid } = extractDbSlug(slugParam)

  let promptData: any = null

  if (isFullUuid) {
    const { data } = await supabase
      .from('prompts')
      .select('id, title, slug, system_prompt, model, created_at, updated_at, created_by, problem_id, parent_prompt_id, is_featured, author:profiles!prompts_created_by_profile_fkey(id, username, display_name)')
      .eq('id', slugParam)
      .single()
    promptData = data
  } else {
    const { data } = await supabase
      .from('prompts')
      .select('id, title, slug, system_prompt, model, created_at, updated_at, created_by, problem_id, parent_prompt_id, is_featured, author:profiles!prompts_created_by_profile_fkey(id, username, display_name)')
      .eq('slug', dbSlug)
    if (data && data.length > 0) {
      promptData = shortId
        ? data.find((p: any) => p.id.startsWith(shortId)) || data[0]
        : data[0]
    }
  }

  if (!promptData) return null

  // Fetch stats
  const { data: stats } = await supabase
    .from('prompt_stats')
    .select('upvotes, downvotes, copy_count, view_count, fork_count, quality_score')
    .eq('prompt_id', promptData.id)
    .single()

  // Fetch problem info
  let problem: any = null
  if (promptData.problem_id) {
    const { data: prob } = await supabase
      .from('problems')
      .select('id, title, slug')
      .eq('id', promptData.problem_id)
      .single()
    problem = prob
  }

  // Fetch parent prompt info (for forks)
  let parentPrompt: any = null
  if (promptData.parent_prompt_id) {
    const { data: parent } = await supabase
      .from('prompts')
      .select('id, title, slug')
      .eq('id', promptData.parent_prompt_id)
      .single()
    parentPrompt = parent
  }

  return { ...promptData, stats: stats || {}, problem, parentPrompt }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugParam } = await params
  const prompt = await getPromptForSeo(slugParam)

  if (!prompt) {
    return { title: 'Prompt Not Found - Promptvexity' }
  }

  const canonicalPath = promptUrl(prompt)
  const authorName = prompt.author?.display_name || prompt.author?.username || 'Anonymous'
  const upvotes = prompt.stats?.upvotes || 0

  const title = `${prompt.title} - ${prompt.problem?.title || 'AI Prompt'} | Promptvexity`
  const description = prompt.system_prompt
    ? `${prompt.system_prompt.slice(0, 140).trim()}... By ${authorName}. ${upvotes} upvotes on Promptvexity.`
    : `AI prompt by ${authorName} for ${prompt.problem?.title || 'prompt engineering'}. ${upvotes} upvotes on Promptvexity.`

  const ogImageUrl = `${BASE_URL}/api/og/prompt?title=${encodeURIComponent(prompt.title)}&author=${encodeURIComponent(authorName)}&score=${encodeURIComponent(prompt.stats?.quality_score || 0)}`

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      type: 'article',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: prompt.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { slug: slugParam } = await params
  const prompt = await getPromptForSeo(slugParam)

  if (!prompt) {
    return <PromptDetailClient />
  }

  const canonicalUrl = `${BASE_URL}${promptUrl(prompt)}`
  const stats = prompt.stats || {}

  const upvotes = stats.upvotes || 0
  const downvotes = stats.downvotes || 0
  const totalVotes = upvotes + downvotes
  const ratingValue = totalVotes > 0 ? Math.round(((upvotes / totalVotes) * 4 + 1) * 10) / 10 : null

  const creativeWorkData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    description: (prompt.system_prompt || '').slice(0, 300),
    url: canonicalUrl,
    dateCreated: prompt.created_at,
    dateModified: prompt.updated_at || prompt.created_at,
    ...(prompt.author ? {
      author: {
        '@type': 'Person',
        name: prompt.author.display_name || prompt.author.username,
        url: `${BASE_URL}/u/${prompt.author.username}`,
      },
    } : {}),
    ...(prompt.problem ? {
      isPartOf: {
        '@type': 'CreativeWork',
        name: prompt.problem.title,
        url: `${BASE_URL}${problemUrl(prompt.problem)}`,
      },
    } : {}),
    ...(prompt.parentPrompt ? {
      isBasedOn: {
        '@type': 'CreativeWork',
        name: prompt.parentPrompt.title,
        url: `${BASE_URL}${promptUrl(prompt.parentPrompt)}`,
      },
    } : {}),
    ...(ratingValue && totalVotes >= 2 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        bestRating: 5,
        worstRating: 1,
        ratingCount: totalVotes,
      },
    } : {}),
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: upvotes },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: stats.copy_count || 0 },
    ],
  }

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Problems', item: `${BASE_URL}/problems` },
  ]

  if (prompt.problem) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: prompt.problem.title,
      item: `${BASE_URL}${problemUrl(prompt.problem)}`,
    })
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: prompt.title,
      item: canonicalUrl,
    })
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: prompt.title,
      item: canonicalUrl,
    })
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return (
    <>
      <JsonLd data={[creativeWorkData, breadcrumbData]} />
      <PromptDetailClient />
    </>
  )
}
