'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function UserForksList({ userId }: { userId: string }) {
  const [forks, setForks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  
  useEffect(() => {
    async function loadForks() {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_user_forks', {
          user_id: userId,
          sort_by: sort,
          limit_count: 20,
          offset_count: 0
        });
      setForks(data || []);
      setLoading(false);
    }
    loadForks();
  }, [userId, sort]);
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (forks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <p className="text-lg font-medium">No forks yet</p>
        <p className="text-sm mt-1">This user hasn't forked any prompts</p>
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
          <option value="top">Top Rated</option>
        </select>
      </div>
      
      {/* List */}
      <div className="space-y-4">
        {forks.map((fork) => (
          <div key={fork.id} className="border border-orange-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2 py-1 rounded">Fork</span>
                </div>
                <Link 
                  href={`/prompts/${fork.id}`}
                  className="text-xl font-semibold hover:text-blue-600 transition-colors"
                >
                  {fork.title}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(fork.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-600">Score: {fork.score}</span>
                {fork.fork_count > 0 && (
                  <span className="text-orange-600">{fork.fork_count} forks</span>
                )}
              </div>
            </div>
            
            {/* Parent attribution */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
              Forked from{' '}
              <Link 
                href={`/prompts/${fork.parent_prompt_id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {fork.parent_title}
              </Link>
              {fork.parent_author_name && (
                <>
                  {' '}by <span className="font-medium">{fork.parent_author_name}</span>
                </>
              )}
            </div>
            
            {/* Problem link */}
            <div className="mt-2 text-sm text-gray-500">
              Problem:{' '}
              <Link 
                href={`/problems/${fork.problem_id}`}
                className="hover:text-gray-700"
              >
                {fork.problem_title}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
