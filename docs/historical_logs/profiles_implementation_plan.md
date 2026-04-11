# User Profiles & Attribution Implementation Plan

**Feature:** GitHub-style user profiles with author attribution  
**Timeline:** Post-launch (Week 2-3)  
**Complexity:** Medium  
**Impact:** High (community building)

---

## 🎯 Goals

1. **Author Attribution** - Show who created problems/prompts everywhere
2. **Profile Pages** - `/u/:username` with user's content
3. **Username System** - Optional usernames with fallback to ID
4. **Public Visibility** - Safe profile data readable by anyone

---

## 📊 Current State Analysis

### What You Already Have ✅
- `profiles` table with username, display_name, avatar_url
- `problems.created_by` and `prompts.created_by`
- `prompts.parent_prompt_id` for fork attribution
- `prompt_stats` and `problem_stats` for counts
- `profiles.reputation`, `upvotes_received`, `forks_received`

### What Needs Work ⚠️
- Username is nullable (some users have no username)
- No public_profiles view (security concern)
- No indexes for profile queries
- No username availability check
- No username format constraints
- No author chips in UI

---

## 🗄️ Phase 1: Data Model (1-2 hours)

### A. Add Username Constraints

```sql
-- Add format validation (lowercase, 3-20 chars, alphanumeric + underscore)
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_format 
  CHECK (
    username IS NULL 
    OR username ~ '^[a-z0-9_]{3,20}$'
  );

-- Add comment
COMMENT ON COLUMN profiles.username IS 
  'Optional vanity URL handle. Format: 3-20 chars, lowercase a-z 0-9 underscore. Unique.';
```

### B. Create Public Profiles View

```sql
-- Safe public view (no sensitive data)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  created_at,
  reputation,
  upvotes_received,
  forks_received,
  onboarding_completed
FROM public.profiles;

-- Grant public access
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS 
  'Public-safe profile data. Use this for author attribution and profile pages.';
```

### C. Add Performance Indexes

```sql
-- Profile content queries
CREATE INDEX IF NOT EXISTS idx_prompts_created_by_date 
  ON prompts(created_by, created_at DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_prompts_created_by_parent 
  ON prompts(created_by, parent_prompt_id) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_problems_created_by_date 
  ON problems(created_by, created_at DESC) 
  WHERE is_deleted = false;

-- Username lookup (already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON profiles(LOWER(username)) 
  WHERE username IS NOT NULL;
```

### D. Ensure created_by is Always Set

```sql
-- Make created_by NOT NULL on new content (optional, depends on your needs)
-- Only do this if you're sure all content has authors

-- For prompts
-- ALTER TABLE prompts 
--   ALTER COLUMN created_by SET NOT NULL;

-- For problems  
-- ALTER TABLE problems
--   ALTER COLUMN created_by SET NOT NULL;

-- If you have system-generated content, keep nullable and handle in UI
```

---

## 🔒 Phase 2: RLS Policies (30 min)

### A. Public Profile Read Policy

```sql
-- Allow anyone to read public profile data
CREATE POLICY "public_profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- Note: This is safe because we only expose safe columns
-- For extra safety, use the public_profiles view instead
```

### B. Self-Update Policy

```sql
-- Users can update their own profile
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
```

### C. Username Availability Function

```sql
-- Check if username is available
CREATE OR REPLACE FUNCTION public.is_username_available(u text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(u)
  );
$$;

GRANT EXECUTE ON FUNCTION is_username_available TO authenticated, anon;

COMMENT ON FUNCTION is_username_available IS 
  'Check if a username is available. Case-insensitive.';
```

---

## 🔧 Phase 3: Profile Query Functions (1 hour)

### A. Get Profile by Username

```sql
CREATE OR REPLACE FUNCTION public.get_profile_by_username(u text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  reputation int,
  upvotes_received int,
  forks_received int
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    display_name,
    avatar_url,
    created_at,
    reputation,
    upvotes_received,
    forks_received
  FROM public.profiles
  WHERE LOWER(username) = LOWER(u)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_profile_by_username TO anon, authenticated;
```

### B. Get User's Prompts (Originals)

```sql
CREATE OR REPLACE FUNCTION public.get_user_prompts(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  problem_id uuid,
  problem_title text,
  created_at timestamptz,
  updated_at timestamptz,
  visibility visibility,
  status prompt_status,
  score int,
  fork_count int,
  works_count int,
  fails_count int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.problem_id,
    pr.title as problem_title,
    p.created_at,
    p.updated_at,
    p.visibility,
    p.status,
    COALESCE(ps.score, 0) as score,
    COALESCE(ps.fork_count, 0) as fork_count,
    COALESCE(ps.works_count, 0) as works_count,
    COALESCE(ps.fails_count, 0) as fails_count
  FROM prompts p
  JOIN problems pr ON p.problem_id = pr.id
  LEFT JOIN prompt_stats ps ON p.id = ps.prompt_id
  WHERE p.created_by = user_id
    AND p.parent_prompt_id IS NULL  -- Originals only
    AND p.is_deleted = false
    AND pr.is_deleted = false
    -- RLS will enforce visibility
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'top' THEN ps.score::timestamptz
      WHEN sort_by = 'most_forked' THEN ps.fork_count::timestamptz
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_prompts TO anon, authenticated;
```

### C. Get User's Forks

```sql
CREATE OR REPLACE FUNCTION public.get_user_forks(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  problem_id uuid,
  problem_title text,
  parent_prompt_id uuid,
  parent_title text,
  parent_author_name text,
  created_at timestamptz,
  score int,
  fork_count int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.problem_id,
    pr.title as problem_title,
    p.parent_prompt_id,
    parent.title as parent_title,
    parent_profile.display_name as parent_author_name,
    p.created_at,
    COALESCE(ps.score, 0) as score,
    COALESCE(ps.fork_count, 0) as fork_count
  FROM prompts p
  JOIN problems pr ON p.problem_id = pr.id
  LEFT JOIN prompts parent ON p.parent_prompt_id = parent.id
  LEFT JOIN profiles parent_profile ON parent.created_by = parent_profile.id
  LEFT JOIN prompt_stats ps ON p.id = ps.prompt_id
  WHERE p.created_by = user_id
    AND p.parent_prompt_id IS NOT NULL  -- Forks only
    AND p.is_deleted = false
    AND pr.is_deleted = false
    -- RLS will enforce visibility
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'top' THEN ps.score::timestamptz
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_forks TO anon, authenticated;
```

### D. Get User's Problems

```sql
CREATE OR REPLACE FUNCTION public.get_user_problems(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  visibility visibility,
  total_prompts int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.created_at,
    p.updated_at,
    p.visibility,
    COALESCE(ps.total_prompts, 0) as total_prompts
  FROM problems p
  LEFT JOIN problem_stats ps ON p.id = ps.problem_id
  WHERE p.created_by = user_id
    AND p.is_deleted = false
    -- RLS will enforce visibility
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'activity' THEN ps.last_activity_at
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_problems TO anon, authenticated;
```

---

## 🎨 Phase 4: UI Implementation (4-8 hours)

### A. Author Chips Component

```typescript
// components/common/AuthorChip.tsx
interface AuthorChipProps {
  userId: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}

export function AuthorChip({ 
  userId, 
  username, 
  displayName, 
  avatarUrl,
  size = 'sm' 
}: AuthorChipProps) {
  const href = username ? `/u/${username}` : `/profile/${userId}`;
  const name = displayName || username || 'Anonymous';
  
  return (
    <Link href={href} className="flex items-center gap-2 hover:underline">
      {avatarUrl && (
        <img 
          src={avatarUrl} 
          alt={name}
          className={size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
          className="rounded-full"
        />
      )}
      <span className="text-sm text-gray-600">
        by {name}
      </span>
    </Link>
  );
}
```

### B. Add to Problem Cards

```typescript
// In your ProblemCard component
<AuthorChip 
  userId={problem.created_by}
  username={problem.author?.username}
  displayName={problem.author?.display_name}
  avatarUrl={problem.author?.avatar_url}
/>
```

### C. Add to Prompt Cards

```typescript
// In your PromptCard component
<AuthorChip 
  userId={prompt.created_by}
  username={prompt.author?.username}
  displayName={prompt.author?.display_name}
  avatarUrl={prompt.author?.avatar_url}
/>

{/* For forks, show parent attribution */}
{prompt.parent_prompt_id && (
  <div className="text-xs text-gray-500">
    Forked from{' '}
    <Link href={`/prompts/${prompt.parent_slug}`}>
      {prompt.parent_title}
    </Link>
    {' '}by{' '}
    <AuthorChip 
      userId={prompt.parent_author_id}
      username={prompt.parent_author_username}
      displayName={prompt.parent_author_name}
      size="sm"
    />
  </div>
)}
```

### D. Profile Page Route

```typescript
// app/(app)/u/[username]/page.tsx
export default async function ProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { u: params.username })
    .single();
    
  if (!profile) notFound();
  
  return <ProfilePageClient profile={profile} />;
}

// app/(app)/profile/[id]/page.tsx (fallback)
export default async function ProfileByIdPage({ 
  params 
}: { 
  params: { id: string } 
}) {
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

### E. Profile Page Component

```typescript
// components/profile/ProfilePageClient.tsx
'use client';

export function ProfilePageClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<'prompts' | 'forks' | 'problems'>('prompts');
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <img 
          src={profile.avatar_url || '/default-avatar.png'} 
          alt={profile.display_name}
          className="w-24 h-24 rounded-full"
        />
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          {profile.username && (
            <p className="text-gray-600">@{profile.username}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </p>
          
          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <StatPill label="Reputation" value={profile.reputation} />
            <StatPill label="Upvotes" value={profile.upvotes_received} />
            <StatPill label="Forks" value={profile.forks_received} />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b mb-6">
        <button onClick={() => setTab('prompts')}>Prompts</button>
        <button onClick={() => setTab('forks')}>Forks</button>
        <button onClick={() => setTab('problems')}>Problems</button>
      </div>
      
      {/* Content */}
      {tab === 'prompts' && <UserPromptsList userId={profile.id} />}
      {tab === 'forks' && <UserForksList userId={profile.id} />}
      {tab === 'problems' && <UserProblemsList userId={profile.id} />}
    </div>
  );
}
```

---

## ⚙️ Phase 5: Username Settings (2 hours)

### A. Settings Page

```typescript
// app/(app)/settings/profile/page.tsx
'use client';

export default function ProfileSettings() {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const checkAvailability = useDebouncedCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }
    
    setIsChecking(true);
    const { data } = await supabase
      .rpc('is_username_available', { u: value });
    setIsAvailable(data);
    setIsChecking(false);
  }, 500);
  
  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('id', user.id);
      
    if (error) {
      toast.error('Username already taken or invalid');
    } else {
      toast.success('Username saved!');
    }
  };
  
  return (
    <div>
      <h2>Choose Your Username</h2>
      <input
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          checkAvailability(e.target.value);
        }}
        placeholder="username"
        pattern="[a-z0-9_]{3,20}"
      />
      {isChecking && <span>Checking...</span>}
      {isAvailable === true && <span className="text-green-600">✓ Available</span>}
      {isAvailable === false && <span className="text-red-600">✗ Taken</span>}
      
      <p className="text-sm text-gray-600">
        3-20 characters, lowercase letters, numbers, and underscores only
      </p>
      
      <button onClick={handleSave} disabled={!isAvailable}>
        Save Username
      </button>
    </div>
  );
}
```

---

## 🚀 Implementation Order

### Week 2 (Post-Launch)
1. **Day 1-2:** Apply database migrations (Phase 1 & 2)
2. **Day 3-4:** Add author chips everywhere (Phase 4A-C)
3. **Day 5:** Test and verify

### Week 3
1. **Day 1-3:** Build profile page (Phase 4D-E)
2. **Day 4:** Add username settings (Phase 5)
3. **Day 5:** Polish and test

---

## 🎯 Success Criteria

- ✅ Every problem/prompt shows author
- ✅ Forks show parent attribution
- ✅ Profile pages work for users with/without usernames
- ✅ Username claiming is smooth
- ✅ No sensitive data exposed
- ✅ Fast queries (< 100ms)
- ✅ RLS enforces visibility correctly

---

## 📝 Notes

- **Username is optional** - Users can use the platform without claiming a username
- **Fallback to ID** - `/profile/:id` works for users without usernames
- **Case-insensitive** - Usernames are stored lowercase, lookups are case-insensitive
- **One-time claim** - For v1, username can only be set once (prevents impersonation)
- **Safe by default** - public_profiles view only exposes safe data

---

**Ready to implement?** Start with the database migration in Phase 1!
