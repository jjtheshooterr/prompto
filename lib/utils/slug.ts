/**
 * Reserved route segments that must not be used as bare slugs.
 * These map to actual Next.js routes or common URL conventions.
 */
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'new', 'create', 'edit', 'delete', 'update', 'remove',
  'dashboard', 'workspace', 'settings', 'account', 'profile', 'preferences',
  'signin', 'signup', 'login', 'logout', 'register', 'auth', 'oauth',
  'problems', 'prompts', 'compare', 'leaderboard', 'guide', 'search',
  'sitemap', 'robots', 'feed', 'rss', 'health', 'status',
  'null', 'undefined', 'true', 'false', 'nan', 'none',
])

/**
 * Converts an arbitrary title string into a URL-safe slug.
 *
 * Rules:
 * 1. Lowercase, strip non-alphanumeric chars (keep hyphens), collapse spaces
 * 2. Trim leading/trailing hyphens
 * 3. If the result exactly matches a reserved word, append `-[suffix]`
 *    where suffix is the provided shortSuffix (e.g. a short UUID fragment)
 *    or a random 6-char base36 string as fallback.
 * 4. Falls back to 'item' if the title is empty after sanitisation.
 *
 * @param title  - raw user-supplied title
 * @param maxLen - maximum slug length before the suffix is appended (default 60)
 * @param shortSuffix - optional deterministic suffix (e.g. first 8 chars of the row's UUID)
 */
export function sanitizeSlug(
  title: string,
  options?: {
    maxLen?: number;
    shortSuffix?: string;
    forceRandom?: boolean;
  }
): string {
  const { maxLen = 60, shortSuffix, forceRandom = false } = options || {}
  
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, maxLen)

  const slug = base || 'item'

  if (RESERVED_SLUGS.has(slug) || forceRandom) {
    const suffix = shortSuffix ?? Math.random().toString(36).substring(2, 8)
    return `${slug}-${suffix}`
  }

  return slug
}
