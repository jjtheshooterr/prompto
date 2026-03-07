/**
 * Builds the canonical public URL path for a prompt.
 * Format: /prompts/[slug]-[shortId]
 * Example: /prompts/security-review-question-generator-21218e6e
 */
export function promptUrl(prompt: { slug: string; id: string }): string {
    const shortId = prompt.id.slice(0, 8)
    return `/prompts/${prompt.slug}-${shortId}`
}

/**
 * Builds the canonical public URL path for a problem.
 * Format: /problems/[slug]-[shortId]
 */
export function problemUrl(problem: { slug: string; id: string }): string {
    const shortId = problem.id.slice(0, 8)
    return `/problems/${problem.slug}-${shortId}`
}


/**
 * Extracts the stored DB slug from a URL slug param.
 * The URL param is "[dbSlug]-[shortId]" (e.g. "my-title-abc123-3ff2faf2").
 * We strip the last 9 chars ("-XXXXXXXX") to recover the DB slug and shortId.
 * Also handles full UUIDs (legacy links) by returning null so the caller
 * can fall back to an eq('id', ...) query.
 */
export function extractDbSlug(slugParam: string): { dbSlug: string; shortId: string | null; isFullUuid: boolean } {
    // Detect full UUID (36 chars: 8-4-4-4-12)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugParam)) {
        return { dbSlug: '', shortId: null, isFullUuid: true }
    }
    // The last segment is the 8-char shortId appended by promptUrl.
    // Strip it: "my-title-abc123-3ff2faf2" → "my-title-abc123"
    const parts = slugParam.split('-')
    const last = parts[parts.length - 1]
    if (parts.length >= 2 && /^[0-9a-f]{8}$/i.test(last)) {
        return { dbSlug: parts.slice(0, -1).join('-'), shortId: last, isFullUuid: false }
    }
    // Fallback: use the whole param as the slug
    return { dbSlug: slugParam, shortId: null, isFullUuid: false }
}

/** @deprecated use extractDbSlug instead */
export function extractShortId(slugParam: string): string | null {
    const parts = slugParam.split('-')
    const last = parts[parts.length - 1]
    if (/^[0-9a-f]{8}$/i.test(last)) return last
    return null
}
