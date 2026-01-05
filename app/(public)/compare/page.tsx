import { getPromptsByIds } from '@/lib/actions/prompts.actions'

interface SearchParams {
  ids?: string
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const ids = params.ids?.split(',').filter(Boolean) || []
  const prompts = ids.length > 0 ? await getPromptsByIds(ids) : []

  if (ids.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Compare Prompts</h1>
          <p className="text-gray-600 mb-4">
            Select prompts from problem pages to compare them side by side.
          </p>
          <a 
            href="/problems" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Problems
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Compare Prompts</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-medium">Field</th>
              {prompts.map((prompt) => (
                <th key={prompt.id} className="border border-gray-300 p-3 text-left font-medium min-w-64">
                  {prompt.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">Model</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  {prompt.model || 'Not specified'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">Status</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    prompt.status === 'production' ? 'bg-green-100 text-green-800' :
                    prompt.status === 'tested' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {prompt.status}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">Score</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  {prompt.prompt_stats?.[0]?.score || 0}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">System Prompt</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  <div className="max-h-32 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {prompt.system_prompt || 'None'}
                    </pre>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">User Template</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  <div className="max-h-32 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {prompt.user_prompt_template}
                    </pre>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-medium bg-gray-50">Example Output</td>
              {prompts.map((prompt) => (
                <td key={prompt.id} className="border border-gray-300 p-3">
                  <div className="max-h-32 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {prompt.example_output ? JSON.stringify(prompt.example_output, null, 2) : 'None'}
                    </pre>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}