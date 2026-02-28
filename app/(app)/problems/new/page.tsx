import Link from 'next/link'

export default function NewProblemPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Problem</h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            Problem creation form coming soon! This will allow you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Define a clear problem statement</li>
            <li>Set industry and tags</li>
            <li>Choose visibility settings</li>
            <li>Add detailed descriptions</li>
          </ul>

          <Link
            href="/problems"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Existing Problems
          </Link>
        </div>
      </div>
    </div>
  )
}