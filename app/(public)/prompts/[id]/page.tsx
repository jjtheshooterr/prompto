import { getPromptById } from '@/lib/actions/prompts.actions'
import { getUserVote } from '@/lib/actions/votes.actions'
import { trackPromptEvent } from '@/lib/actions/events.actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PromptPage({ params }: PageProps) {
  const { id } = await params
  const prompt = await getPromptById(id)
  
  if (!prompt) {
    notFound()
  }

  // Track page view
  await trackPromptEvent(prompt.id, 'view')

  // Safely get user vote (will return null if not authenticated)
  const userVote = await getUserVote(prompt.id)
  const stats = prompt.prompt_stats?.[0]

  const statusColors = {
    experimental: 'bg-yellow-100 text-yellow-800',
    tested: 'bg-blue-100 text-blue-800',
    production: 'bg-green-100 text-green-800'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/problems" className="text-blue-600 hover:underline">
          Problems
        </Link>
        {prompt.problem && (
          <>
            <span className="mx-2 text-gray-400">/</span>
            <Link 
              href={`/problems/${prompt.problem.slug}`}
              className="text-blue-600 hover:underline"
            >
              {prompt.problem.title}
            </Link>
          </>
        )}
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{prompt.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-3">{prompt.title}</h1>
            
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm rounded-full ${statusColors[prompt.status as keyof typeof statusColors]}`}>
                {prompt.status}
              </span>
              {prompt.model && (
                <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                  {prompt.model}
                </span>
              )}
              <span className="text-gray-500">{new Date(prompt.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* System Prompt */}
          {prompt.system_prompt && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">System Prompt</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{prompt.system_prompt}</pre>
              </div>
            </div>
          )}

          {/* User Prompt Template */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">User Prompt Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{prompt.user_prompt_template}</pre>
            </div>
          </div>

          {/* Example Input/Output */}
          {(prompt.example_input || prompt.example_output) && (
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Example</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {prompt.example_input && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Input</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(prompt.example_input, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {prompt.example_output && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Output</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(prompt.example_output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Known Failures */}
          {prompt.known_failures && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Known Failures</h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-800">{prompt.known_failures}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {prompt.notes && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">{prompt.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            
            {/* Voting */}
            {stats && (
              <div className="flex items-center gap-2 mb-4">
                <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50">
                  <span className="text-green-600">↑</span>
                  <span>{stats.upvotes}</span>
                </button>
                <button className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50">
                  <span className="text-red-600">↓</span>
                  <span>{stats.downvotes}</span>
                </button>
                <span className="ml-2 font-medium">Score: {stats.score}</span>
              </div>
            )}

            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Copy Prompt
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Fork Prompt
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Add to Compare
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-4">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>{stats.view_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Copies:</span>
                  <span>{stats.copy_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forks:</span>
                  <span>{stats.fork_count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2">{new Date(prompt.created_at).toLocaleDateString()}</span>
              </div>
              {prompt.tested_context && (
                <div>
                  <span className="text-gray-600">Tested Context:</span>
                  <span className="ml-2">{prompt.tested_context}</span>
                </div>
              )}
              {prompt.source_url && (
                <div>
                  <span className="text-gray-600">Source:</span>
                  <a href={prompt.source_url} className="ml-2 text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    View Original
                  </a>
                </div>
              )}
              {prompt.license && (
                <div>
                  <span className="text-gray-600">License:</span>
                  <span className="ml-2">{prompt.license}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}