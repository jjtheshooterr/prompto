'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function UserProblemsList({ userId }: { userId: string }) {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  
  useEffect(() => {
    async function loadProblems() {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_user_problems', {
          user_id: userId,
          sort_by: sort,
          limit_count: 20,
          offset_count: 0
        });
      setProblems(data || []);
      setLoading(false);
    }
    loadProblems();
  }, [userId, sort]);
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (problems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg font-medium">No problems yet</p>
        <p className="text-sm mt-1">This user hasn't created any problems</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Sort dropdown */}
      <div className="mb-4 flex justify-end">
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="activity">Most Active</option>
        </select>
      </div>
      
      {/* List */}
      <div className="space-y-4">
        {problems.map((problem) => (
          <div key={problem.id} className="border rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Link 
                  href={`/problems/${problem.slug}`}
                  className="text-xl font-semibold hover:text-blue-600 transition-colors"
                >
                  {problem.title}
                </Link>
                <p className="text-gray-600 mt-2 line-clamp-2">{problem.description}</p>
                <div className="text-sm text-gray-500 mt-2">
                  Created {new Date(problem.created_at).toLocaleDateString()}
                  {problem.updated_at !== problem.created_at && (
                    <> • Updated {new Date(problem.updated_at).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  problem.visibility === 'public' 
                    ? 'bg-green-100 text-green-700' 
                    : problem.visibility === 'workspace'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {problem.visibility}
                </span>
                <span className="text-sm text-gray-600">
                  {problem.total_prompts} {problem.total_prompts === 1 ? 'prompt' : 'prompts'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
