'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { promptUrl } from '@/lib/utils/prompt-url';

const ITEMS_PER_PAGE = 8;

export function UserForksList({ userId }: { userId: string }) {
  const [forks, setForks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('newest');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    async function loadInitialForks() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_user_forks', {
          user_id: userId,
          sort_by: sort,
          limit_count: ITEMS_PER_PAGE + 1,
          offset_count: 0
        });

      const results = data || [];
      if (results.length > ITEMS_PER_PAGE) {
        setForks(results.slice(0, ITEMS_PER_PAGE));
        setHasMore(true);
      } else {
        setForks(results);
        setHasMore(false);
      }

      setOffset(ITEMS_PER_PAGE);
      setLoading(false);
    }
    loadInitialForks();
  }, [userId, sort]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const supabase = createClient();
    const { data } = await supabase
      .rpc('get_user_forks', {
        user_id: userId,
        sort_by: sort,
        limit_count: ITEMS_PER_PAGE + 1,
        offset_count: offset
      });

    const results = data || [];
    if (results.length > ITEMS_PER_PAGE) {
      setForks(prev => [...prev, ...results.slice(0, ITEMS_PER_PAGE)]);
      setHasMore(true);
    } else {
      setForks(prev => [...prev, ...results]);
      setHasMore(false);
    }

    setOffset(prev => prev + ITEMS_PER_PAGE);
    setLoadingMore(false);
  }

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
        <p className="text-sm mt-1">This user hasn&apos;t forked any prompts</p>
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
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        >
          <option value="newest">Newest First</option>
          <option value="top">Top Rated</option>
        </select>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forks.map((fork) => (
          <div key={fork.id} className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">Fork</span>
                </div>
                <Link
                  href={promptUrl({ id: fork.id, slug: fork.slug || '' })}
                  className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors block truncate"
                >
                  {fork.title}
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(fork.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{fork.score}</span>
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Parent attribution */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Forked from</span>
                <Link
                  href={promptUrl({ id: fork.parent_prompt_id, slug: fork.parent_slug || '' })}
                  className="text-blue-600 hover:underline font-bold"
                >
                  {fork.parent_title}
                </Link>
                {fork.parent_author_name && (
                  <span className="flex items-center gap-1">
                    by <span className="font-bold text-slate-700">{fork.parent_author_name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <Link
                  href={`/problems/${fork.problem_id}`}
                  className="hover:text-slate-600 truncate"
                >
                  Problem: {fork.problem_title}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-sm"
          >
            {loadingMore ? 'Loading...' : 'Load More Forks'}
          </button>
        </div>
      )}
    </div>
  );
}
