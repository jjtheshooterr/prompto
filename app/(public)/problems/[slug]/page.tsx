import { getPublicProblemBySlug } from '@/lib/actions/problems.actions'
import { listPromptsByProblem } from '@/lib/actions/prompts.actions'
import PromptCard from '@/components/prompts/PromptCard'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: 'newest' | 'top' }>
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { sort } = await searchParams
  
  const problem = await getPublicProblemBySlug(slug)
  
  if (!problem) {
    notFound()
  }

  const prompts = await listPromptsByProblem(problem.id, sort || 'top')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Problem Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              {problem.industry && (
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {problem.industry}
                </span>
              )}
              <span className="text-gray-500">
                {new Date(problem.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {problem.description && (
          <p className="text-gray-700 mb-4">{problem.description}</p>
        )}
        
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prompts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Prompts ({prompts.length})
          </h2>
          
          <div className="flex items-center gap-4">
            <select
              defaultValue={sort || 'top'}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="top">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Compare Selected
            </button>
          </div>
        </div>
        
        {prompts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts yet</h3>
            <p className="text-gray-600 mb-4">Be the first to create a prompt for this problem.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Prompt
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {prompts.map((prompt) => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt}
                showCompareCheckbox={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}