'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { toDisplayString } from '@/lib/utils/prompt-url';

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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg font-medium text-foreground">No problems yet</p>
        <p className="text-sm mt-1">This user hasn&apos;t created any problems</p>
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
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
        >
          <option value="newest">Newest First</option>
          <option value="activity">Most Active</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {problems.map((problem) => (
          <div key={problem.id} className="border border-border rounded-lg p-5 bg-card hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Link
                  href={`/problems/${problem.slug}`}
                  className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {toDisplayString(problem.title)}
                </Link>
                <p className="text-muted-foreground mt-2 line-clamp-2">{toDisplayString(problem.description)}</p>
                <div className="text-sm text-muted-foreground mt-2">
                  Created {new Date(problem.created_at).toLocaleDateString()}
                  {problem.updated_at !== problem.created_at && (
                    <> • Updated {new Date(problem.updated_at).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${problem.visibility === 'public'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                    : problem.visibility === 'workspace'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                  {problem.visibility}
                </span>
                <span className="text-sm text-muted-foreground">
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
