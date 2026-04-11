# User Profiles UI Quick Start

**Goal:** Add author attribution and profile pages to your app  
**Prerequisites:** `profiles_attribution_migration.sql` applied  
**Time:** 4-8 hours

---

## 🎯 Quick Wins (Do These First)

### 1. Add Author Chips Everywhere (2 hours)

**Create the component:**

```typescript
// components/common/AuthorChip.tsx
import Link from 'next/link';
import Image from 'next/image';

interface AuthorChipProps {
  userId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  showAvatar?: boolean;
}

export function AuthorChip({ 
  userId, 
  username, 
  displayName, 
  avatarUrl,
  size = 'sm',
  showAvatar = true
}: AuthorChipProps) {
  const href = username ? `/u/${username}` : `/profile/${userId}`;
  const name = displayName || username || 'Anonymous';
  
  return (
    <Link 
      href={href} 
      className="inline-flex items-center gap-2 hover:underline text-gray-700 hover:text-gray-900"
    >
      {showAvatar && avatarUrl && (
        <Image 
          src={avatarUrl} 
          alt={name}
          width={size === 'sm' ? 24 : 32}
          height={size === 'sm' ? 24 : 32}
          className="rounded-full"
        />
      )}
      <span className={size === 'sm' ? 'text-sm' : 'text-base'}>
        {name}
      </span>
    </Link>
  );
}
```

**Use it in ProblemCard:**

```typescript
// components/problems/ProblemCard.tsx
import { AuthorChip } from '@/components/common/AuthorChip';

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{problem.title}</h3>
      <p>{problem.description}</p>
      
      {/* Add this */}
      <div className="mt-2 text-sm text-gray-600">
        by <AuthorChip 
          userId={problem.created_by}
          username={problem.author?.username}
          displayName={problem.author?.display_name}
          avatarUrl={problem.author?.avatar_url}
        />
      </div>
    </div>
  );
}
```

**Use it in PromptCard:**

```typescript
// components/prompts/PromptCard.tsx
export function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{prompt.title}</h3>
      
      {/* Author */}
      <div className="mt-2 text-sm text-gray-600">
        by <AuthorChip 
          userId={prompt.created_by}
          username={prompt.author?.username}
          displayName={prompt.author?.display_name}
          avatarUrl={prompt.author?.avatar_url}
        />
      </div>
      
      {/* Fork attribution */}
      {prompt.parent_prompt_id && (
        <div className="mt-1 text-xs text-gray-500">
          Forked from{' '}
          <Link href={`/prompts/${prompt.parent_slug}`} className="underline">
            {prompt.parent_title}
          </Link>
          {' '}by{' '}
          <AuthorChip 
            userId={prompt.parent_author_id}
            username={prompt.parent_author_username}
            displayName={prompt.parent_author_name}
            showAvatar={false}
          />
        </div>
      )}
    </div>
  );
}
```

---

### 2. Update Your Queries to Include Author Data (30 min)

**In your problem queries:**

```typescript
// lib/actions/problems.actions.ts
const { data: problems } = await supabase
  .from('problems')
  .select(`
    *,
    author:profiles!created_by(
      id,
      username,
      display_name,
      avatar_url
    )
  `)
  .order('created_at', { ascending: false });
```

**In your prompt queries:**

```typescript
// lib/actions/prompts.actions.ts
const { data: prompts } = await supabase
  .from('prompts')
  .select(`
    *,
    author:profiles!created_by(
      id,
      username,
      display_name,
      avatar_url
    ),
    parent:prompts!parent_prompt_id(
      id,
      title,
      slug,
      author:profiles!created_by(
        id,
        username,
        display_name
      )
    )
  `)
  .order('created_at', { ascending: false });
```

---

### 3. Create Profile Page Routes (1 hour)

**Username route:**

```typescript
// app/(app)/u/[username]/page.tsx
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

export default async function ProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const supabase = createServerClient();
  
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { u: params.username })
    .single();
    
  if (!profile) notFound();
  
  return <ProfilePageClient profile={profile} />;
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { u: params.username })
    .single();
    
  if (!profile) return { title: 'User Not Found' };
  
  return {
    title: `${profile.display_name} (@${profile.username}) - Prompto`,
    description: `View ${profile.display_name}'s prompts, forks, and problems on Prompto.`
  };
}
```

**ID fallback route:**

```typescript
// app/(app)/profile/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';

export default async function ProfileByIdPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createServerClient();
  
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (!profile) notFound();
  
  // Redirect to username URL if available
  if (profile.username) {
    redirect(`/u/${profile.username}`);
  }
  
  return <ProfilePageClient profile={profile} />;
}
```

---

### 4. Build Profile Page Component (2-3 hours)

```typescript
// components/profile/ProfilePageClient.tsx
'use client';

import { useState } from 'react';
import { UserPromptsList } from './UserPromptsList';
import { UserForksList } from './UserForksList';
import { UserProblemsList } from './UserProblemsList';

type Tab = 'prompts' | 'forks' | 'problems';

export function ProfilePageClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('prompts');
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <img 
          src={profile.avatar_url || '/default-avatar.png'} 
          alt={profile.display_name}
          className="w-24 h-24 rounded-full border-2 border-gray-200"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          {profile.username && (
            <p className="text-gray-600 text-lg">@{profile.username}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </p>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <StatPill 
              label="Reputation" 
              value={profile.reputation} 
              icon="⭐"
            />
            <StatPill 
              label="Upvotes" 
              value={profile.upvotes_received} 
              icon="👍"
            />
            <StatPill 
              label="Forks" 
              value={profile.forks_received} 
              icon="🔱"
            />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <TabButton 
            active={tab === 'prompts'} 
            onClick={() => setTab('prompts')}
          >
            Prompts
          </TabButton>
          <TabButton 
            active={tab === 'forks'} 
            onClick={() => setTab('forks')}
          >
            Forks
          </TabButton>
          <TabButton 
            active={tab === 'problems'} 
            onClick={() => setTab('problems')}
          >
            Problems
          </TabButton>
        </nav>
      </div>
      
      {/* Content */}
      <div className="min-h-[400px]">
        {tab === 'prompts' && <UserPromptsList userId={profile.id} />}
        {tab === 'forks' && <UserForksList userId={profile.id} />}
        {tab === 'problems' && <UserProblemsList userId={profile.id} />}
      </div>
    </div>
  );
}

function StatPill({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 px-1 border-b-2 font-medium transition-colors
        ${active 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-600 hover:text-gray-900'
        }
      `}
    >
      {children}
    </button>
  );
}
```

---

### 5. Create List Components (1-2 hours)

```typescript
// components/profile/UserPromptsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { PromptCard } from '@/components/prompts/PromptCard';

export function UserPromptsList({ userId }: { userId: string }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  
  useEffect(() => {
    async function loadPrompts() {
      const supabase = createBrowserClient();
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
  
  if (loading) return <div>Loading...</div>;
  
  if (prompts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No prompts yet
      </div>
    );
  }
  
  return (
    <div>
      {/* Sort dropdown */}
      <div className="mb-4">
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="top">Top Rated</option>
          <option value="most_forked">Most Forked</option>
        </select>
      </div>
      
      {/* List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}
```

Similar components for `UserForksList` and `UserProblemsList`.

---

### 6. Add Username Settings (1 hour)

```typescript
// app/(app)/settings/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createBrowserClient();
  
  const checkAvailability = useDebouncedCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }
    
    // Validate format
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setIsAvailable(false);
      return;
    }
    
    setIsChecking(true);
    const { data } = await supabase
      .rpc('is_username_available', { u: value });
    setIsAvailable(data);
    setIsChecking(false);
  }, 500);
  
  const handleSave = async () => {
    if (!isAvailable) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('id', user.id);
      
    if (error) {
      toast.error('Username already taken or invalid');
    } else {
      toast.success('Username saved! Your profile is now at /u/' + username);
    }
    setIsSaving(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Choose Your Username</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase();
                setUsername(value);
                checkAvailability(value);
              }}
              placeholder="username"
              pattern="[a-z0-9_]{3,20}"
              className="w-full pl-8 pr-10 py-2 border rounded-lg"
            />
            {isChecking && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                ⏳
              </span>
            )}
            {!isChecking && isAvailable === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                ✓
              </span>
            )}
            {!isChecking && isAvailable === false && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                ✗
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            3-20 characters • lowercase letters, numbers, and underscores only
          </p>
          
          {isAvailable === true && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Available! Your profile will be at prompto.com/u/{username}
            </p>
          )}
          {isAvailable === false && username.length >= 3 && (
            <p className="text-sm text-red-600 mt-1">
              ✗ Username taken or invalid format
            </p>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={!isAvailable || isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Username'}
        </button>
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Author chips show on all problem cards
- [ ] Author chips show on all prompt cards
- [ ] Fork attribution shows parent author
- [ ] Clicking author chip goes to profile
- [ ] Profile page loads for users with username
- [ ] Profile page loads for users without username (by ID)
- [ ] Profile tabs work (Prompts, Forks, Problems)
- [ ] Username availability check works
- [ ] Username save works
- [ ] Invalid usernames are rejected
- [ ] Profile page respects RLS (only shows visible content)

---

## 🚀 Deploy Order

1. Apply database migration
2. Deploy author chips (non-breaking)
3. Deploy profile pages (new routes)
4. Deploy username settings
5. Test everything
6. Announce feature to users!

---

**Questions?** Check `profiles_implementation_plan.md` for full details.
