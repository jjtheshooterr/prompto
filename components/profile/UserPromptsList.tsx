'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PromptCard from '@/components/prompts/PromptCard';

export function UserPromptsList({ userId }: { userId: string }) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    async function loadPrompts() {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_user_prompts', {
          user_id: userId,
          sort_by: sort,
          limit_count: 20,
          offset_count: 0
        });
      setPrompts(data || []);
      setLoading(false);
    }
    loadPrompts();
  }, [userId, sort]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No prompts yet</p>
        <p className="text-sm mt-1">This user hasn&apos;t created any original prompts</p>
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
          <option value="most_forked">Most Forked</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={{
              ...prompt,
              problems: { title: prompt.problem_title, slug: prompt.problem_id },
              prompt_stats: [{
                score: prompt.score,
                fork_count: prompt.fork_count,
                works_count: prompt.works_count,
                fails_count: prompt.fails_count,
                upvotes: 0,
                downvotes: 0,
                copy_count: 0,
                view_count: 0
              }]
            }}
            showProblemTitle={true}
          />
        ))}
      </div>
    </div>
  );
}
