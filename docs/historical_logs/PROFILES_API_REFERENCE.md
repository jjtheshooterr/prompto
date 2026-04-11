# User Profiles API Reference

Quick reference for using the new profiles system in your application.

---

## 🔍 Check Username Availability

```typescript
const { data: isAvailable } = await supabase
  .rpc('is_username_available', { u: 'desired_username' });

if (isAvailable) {
  // Username is available
} else {
  // Username is taken
}
```

**Rules:**
- 3-20 characters
- Lowercase a-z, 0-9, underscore only
- Case-insensitive (testuser = TESTUSER = TestUser)

---

## 👤 Get Profile by Username

```typescript
const { data: profile } = await supabase
  .rpc('get_profile_by_username', { u: 'username' });

// Returns:
// {
//   id: uuid,
//   username: string,
//   display_name: string,
//   avatar_url: string | null,
//   created_at: timestamp,
//   reputation: number,
//   upvotes_received: number,
//   forks_received: number
// }
```

**Case-insensitive**: Works with any case variation of username.

---

## 📝 Get User's Original Prompts

```typescript
const { data: prompts } = await supabase
  .rpc('get_user_prompts', {
    user_id: 'uuid',
    sort_by: 'newest', // or 'top', 'most_forked'
    limit_count: 20,
    offset_count: 0
  });

// Returns array of:
// {
//   id, title, slug, problem_id, problem_title,
//   created_at, updated_at, visibility, status,
//   score, fork_count, works_count, fails_count
// }
```

**Sort Options:**
- `newest` - Most recent first (default)
- `top` - Highest score first
- `most_forked` - Most forked first

**Note:** Only returns original prompts (not forks). Respects RLS visibility.

---

## 🍴 Get User's Forks

```typescript
const { data: forks } = await supabase
  .rpc('get_user_forks', {
    user_id: 'uuid',
    sort_by: 'newest', // or 'top'
    limit_count: 20,
    offset_count: 0
  });

// Returns array of:
// {
//   id, title, slug, problem_id, problem_title,
//   parent_prompt_id, parent_title, parent_author_name,
//   created_at, score, fork_count
// }
```

**Sort Options:**
- `newest` - Most recent first (default)
- `top` - Highest score first

**Note:** Only returns forks (has parent_prompt_id). Includes parent attribution.

---

## 🎯 Get User's Problems

```typescript
const { data: problems } = await supabase
  .rpc('get_user_problems', {
    user_id: 'uuid',
    sort_by: 'newest', // or 'activity'
    limit_count: 20,
    offset_count: 0
  });

// Returns array of:
// {
//   id, title, slug, description,
//   created_at, updated_at, visibility,
//   total_prompts
// }
```

**Sort Options:**
- `newest` - Most recent first (default)
- `activity` - Most recently active first

---

## 🔒 Public Profiles View

For direct queries (not recommended, use functions above):

```typescript
const { data: profiles } = await supabase
  .from('public_profiles')
  .select('*')
  .eq('username', 'testuser');
```

**Available Fields:**
- id, username, display_name, avatar_url
- created_at, reputation
- upvotes_received, forks_received
- onboarding_completed

**Security:** This view is safe for public access. No sensitive data exposed.

---

## ✏️ Update Own Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    username: 'new_username',
    display_name: 'New Display Name',
    avatar_url: 'https://...'
  })
  .eq('id', userId);
```

**RLS Protection:** Users can only update their own profile.

---

## 🎨 UI Examples

### Profile Page Route
```
/u/[username]
```

### Profile Page Component
```typescript
export default async function ProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { u: params.username });

  if (!profile) {
    return <div>User not found</div>;
  }

  const { data: prompts } = await supabase
    .rpc('get_user_prompts', {
      user_id: profile.id,
      sort_by: 'newest',
      limit_count: 20,
      offset_count: 0
    });

  return (
    <div>
      <h1>{profile.display_name}</h1>
      <p>@{profile.username}</p>
      <p>Reputation: {profile.reputation}</p>
      
      <h2>Prompts</h2>
      {prompts?.map(prompt => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
```

### Author Attribution
```typescript
// In your prompt/problem queries, join with public_profiles
const { data: prompts } = await supabase
  .from('prompts')
  .select(`
    *,
    author:public_profiles!created_by(
      username,
      display_name,
      avatar_url
    )
  `)
  .eq('is_deleted', false);

// Then in your component:
<Link href={`/u/${prompt.author.username}`}>
  {prompt.author.display_name}
</Link>
```

### Username Settings Form
```typescript
const [username, setUsername] = useState('');
const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

const checkAvailability = async (value: string) => {
  if (value.length < 3) return;
  
  const { data } = await supabase
    .rpc('is_username_available', { u: value });
  
  setIsAvailable(data);
};

return (
  <div>
    <input
      value={username}
      onChange={(e) => {
        setUsername(e.target.value);
        checkAvailability(e.target.value);
      }}
      pattern="[a-z0-9_]{3,20}"
    />
    {isAvailable === false && (
      <p>Username taken</p>
    )}
    {isAvailable === true && (
      <p>Username available!</p>
    )}
  </div>
);
```

---

## 🚀 Performance Tips

1. **Use the functions** - They're optimized with proper indexes
2. **Pagination** - Always use limit/offset for large result sets
3. **Cache profiles** - Profile data changes infrequently
4. **Batch queries** - Use Supabase's batch query features when possible

---

## 🔐 Security Notes

- ✅ All functions respect RLS policies
- ✅ Public profiles view is safe (no sensitive data)
- ✅ Username availability check is public (needed for signup)
- ✅ Profile updates are restricted to owner only
- ✅ Query functions filter by visibility automatically

---

## 📚 Related Documentation

- **Implementation Plan**: `profiles_implementation_plan.md`
- **UI Quick Start**: `profiles_ui_quickstart.md`
- **Migration Details**: `PROFILES_MIGRATION_APPLIED.md`
- **Feature Summary**: `PROFILES_FEATURE_SUMMARY.md`
