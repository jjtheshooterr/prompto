'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReportModal from '@/components/moderation/ReportModal'
import { AuthorChip } from '@/components/common/AuthorChip'
import { toast } from 'sonner'
import { promptUrl, toDisplayString } from '@/lib/utils/prompt-url'
import { CompactTokenBadge } from '@/components/prompts/TokenCostBadge'

interface PromptCardProps {
  prompt: any
  onAddToCompare?: (promptId: string) => void
  showProblemTitle?: boolean
}

interface ParentPrompt {
  id: string
  title: string
}

export default function PromptCard({ prompt, onAddToCompare, showProblemTitle = false }: PromptCardProps) {
  const [parentPrompt, setParentPrompt] = useState<ParentPrompt | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isInComparison, setIsInComparison] = useState(false)

  // Check if prompt is in comparison
  useEffect(() => {
    const checkComparison = () => {
      const selected = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
      setIsInComparison(selected.includes(prompt.id))
    }

    checkComparison()

    // Listen for comparison updates
    window.addEventListener('compareUpdated', checkComparison)
    window.addEventListener('storage', checkComparison)

    return () => {
      window.removeEventListener('compareUpdated', checkComparison)
      window.removeEventListener('storage', checkComparison)
    }
  }, [prompt.id])

  const stats = prompt.prompt_stats?.[0] || {
    upvotes: 0,
    downvotes: 0,
    score: 0,
    copy_count: 0,
    view_count: 0,
    fork_count: 0,
    works_count: 0,
    fails_count: 0,
    reviews_count: 0,
    last_reviewed_at: null,
  }

  // Extract fork reason from notes (legacy) - new forks use fix_summary column directly
  const getForkDetails = () => {
    // Prefer dedicated columns (new forks)
    if (prompt.fix_summary && prompt.parent_prompt_id) {
      return { reason: prompt.fix_summary, changes: prompt.improvement_summary || null }
    }
    // Fallback: parse from notes (old forks)
    if (!prompt.parent_prompt_id || !prompt.notes) return { reason: null, changes: null }
    const match = prompt.notes.match(/^Forked from [^.]+\.\s*([^|]+)(?:\s*\|\s*Changes:\s*(.+))?$/)
    if (match) {
      return { reason: match[1]?.trim() || null, changes: match[2]?.trim() || null }
    }
    const oldMatch = prompt.notes.match(/^Forked from [^.]+\.\s*(.+)$/)
    return { reason: oldMatch ? oldMatch[1] : null, changes: null }
  }

  const forkDetails = getForkDetails()

  useEffect(() => {
    const loadParentPrompt = async () => {
      if (!prompt.parent_prompt_id) return

      const supabase = createClient()
      const { data } = await supabase
        .from('prompts')
        .select('id, title')
        .eq('id', prompt.parent_prompt_id)
        .single()

      if (data) {
        setParentPrompt(data)
      }
    }

    loadParentPrompt()
  }, [prompt.parent_prompt_id])

  return (
    <div className={`card p-3 sm:p-5 flex flex-col h-full bg-card text-card-foreground border border-border ${prompt.parent_prompt_id ? 'border-l-4 border-l-orange-500' : ''}`}>
      {/* Main content area - flexible */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3 sm:mb-4">
          <div className="flex-1 w-full sm:w-auto">
            {/* Fork indicator and title */}
            <div className="flex items-center gap-2 mb-2">
              {prompt.parent_prompt_id && (
                <div className="flex items-center gap-1 text-orange-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-xs font-medium bg-orange-500/10 text-orange-500 px-2 py-1 rounded">Fork</span>
                </div>
              )}
            </div>

            <Link
              href={promptUrl(prompt)}
              className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors block"
            >
              {toDisplayString(prompt.title)}
            </Link>

            {/* Best For tags */}
            {prompt.best_for && prompt.best_for.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {prompt.best_for.map((tag: any, index: number) => {
                  const label = toDisplayString(tag)
                  return (
                    <span
                      key={`${label}-${index}`}
                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Improvement Summary */}
            {prompt.improvement_summary && (
              <div className="mt-2 text-xs sm:text-sm text-emerald-600 bg-emerald-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">Improvement:</span>
                  <span>{toDisplayString(prompt.improvement_summary)}</span>
                </div>
              </div>
            )}

            {/* Fork reason and changes summary */}
            {forkDetails.reason && (
              <div className="mt-2 text-xs sm:text-sm text-orange-500 bg-orange-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="font-medium">Forked to:</span>
                  <span>{toDisplayString(forkDetails.reason)}</span>
                </div>
                {forkDetails.changes && (
                  <div className="mt-2 text-xs text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                    <span className="font-medium">Changes:</span> {toDisplayString(forkDetails.changes)}
                  </div>
                )}
                {parentPrompt && (
                  <div className="mt-1 text-xs text-orange-500">
                    from <Link href={promptUrl({ id: parentPrompt.id, slug: '' })} className="underline hover:text-orange-600">{toDisplayString(parentPrompt.title)}</Link>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs sm:text-sm text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
              <span>Model: {prompt.model}</span>
              <span className="text-border">•</span>
              <CompactTokenBadge 
                systemPrompt={prompt.system_prompt} 
                userPromptTemplate={prompt.user_prompt_template} 
                exampleOutput={prompt.example_output} 
                model={prompt.model}
              />
              <span className="text-border">•</span>
              <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
              {showProblemTitle && prompt.problems?.title && (
                <>
                  <span className="text-border">•</span>
                  <Link href={`/problems/${prompt.problems.slug}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                    {toDisplayString(prompt.problems.title)}
                  </Link>
                </>
              )}
            </div>

            {/* Author attribution */}
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              by {prompt.author ? (
                <AuthorChip
                  userId={prompt.created_by}
                  username={prompt.author.username}
                  displayName={prompt.author.display_name}
                  avatarUrl={prompt.author.avatar_url}
                  showAvatar={false}
                />
              ) : (
                <span>Anonymous</span>
              )}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 font-medium w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs border whitespace-nowrap ${stats.works_count > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`} title={`${stats.works_count} people said this worked`}>
                <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">{stats.works_count} Works</span>
                <span className="sm:hidden">{stats.works_count}</span>
              </span>
              <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs border whitespace-nowrap ${stats.fails_count > 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted text-muted-foreground border-border'}`} title={`${stats.fails_count} people said this failed`}>
                <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="hidden sm:inline">{stats.fails_count} Fails</span>
                <span className="sm:hidden">{stats.fails_count}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground pl-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex items-center gap-0.5 text-emerald-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {stats.upvotes}
                </span>
                <span className="flex items-center gap-0.5 text-destructive">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {stats.downvotes}
                </span>
              </div>
              <div>Score: {stats.quality_score || 0}</div>
            </div>
          </div>
        </div>

        <div className="mb-3 sm:mb-4 flex-1">
          <div className="text-xs sm:text-sm text-muted-foreground mb-2">System Prompt:</div>
          <div className="bg-muted/50 border border-border p-2 sm:p-3 rounded text-xs sm:text-sm font-mono line-clamp-3 relative group mb-3 text-foreground">
            {toDisplayString(prompt.system_prompt)}
            <button
              onClick={() => {
                navigator.clipboard.writeText(toDisplayString(prompt.system_prompt))
                toast('System prompt copied')
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-2 py-1 rounded text-xs hover:bg-primary/90"
            >
              Copy
            </button>
          </div>

          {/* Tradeoffs & Usage Context */}
          {(prompt.tradeoffs || prompt.usage_context) && (
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              {prompt.usage_context && (
                <div className="flex-1 bg-accent/50 border border-border rounded p-3 text-xs sm:text-sm">
                  <div className="font-semibold text-foreground mb-1">Usage Context:</div>
                  <div className="text-muted-foreground line-clamp-2">{toDisplayString(prompt.usage_context)}</div>
                </div>
              )}
              {prompt.tradeoffs && (
                <div className="flex-1 bg-primary/5 border border-primary/20 rounded p-3 text-xs sm:text-sm">
                  <div className="font-semibold text-foreground mb-1">Tradeoffs:</div>
                  <div className="text-muted-foreground line-clamp-2">{toDisplayString(prompt.tradeoffs)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer - pinned to bottom */}
      <div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-3 sm:pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <span>{stats.view_count} views</span>
            <span>{stats.copy_count} copies</span>
            {stats.fork_count > 0 && (
              <span className="flex items-center gap-1 text-orange-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                {stats.fork_count} forks
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {onAddToCompare && (
              <button
                className={`text-xs sm:text-sm transition-colors px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-medium ${isInComparison
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                onClick={() => onAddToCompare(prompt.id)}
              >
                {isInComparison ? '✓' : 'Compare'}
              </button>
            )}
            <Link
              href={promptUrl(prompt)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 flex-1 sm:flex-none text-center"
            >
              View Details
            </Link>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Report this prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </button>
          </div>
        </div>{/* end justify-between row */}

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentType="prompt"
          contentId={prompt.id}
          contentTitle={prompt.title}
        />
      </div>
    </div>
  )
}
