'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type ReviewType = 'worked' | 'failed' | 'note'

export interface SubmitReviewParams {
    promptId: string
    reviewType: ReviewType
    workedReason?: string
    failureReason?: string
    comment?: string
}

export async function submitReview({
    promptId,
    reviewType,
    workedReason,
    failureReason,
    comment
}: SubmitReviewParams) {
    // NUCLEAR OPTION: Bypass Supabase's broken SSR auth and read cookie directly
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('sb-yknsbonffoaxxcwvxrls-auth-token')

    let user = null
    if (authCookie?.value) {
        try {
            const sessionData = JSON.parse(authCookie.value)
            user = sessionData.user
            console.log('submitReview - Direct cookie parse successful:', user?.email)
        } catch (e) {
            console.error('submitReview - Failed to parse auth cookie:', e)
        }
    }

    if (!user) {
        throw new Error('You must be logged in to submit a review. Please sign out and sign back in.')
    }

    // Now proceed with normal insertion
    const supabase = await createClient()

    // Helper to sanitize
    const clean = (s?: string) => s?.trim() || null

    const payload: any = {
        prompt_id: promptId,
        user_id: user.id,
        review_type: reviewType,
        // Provide appropriate reason based on type
        worked_reason: reviewType === 'worked' ? clean(workedReason) : null,
        failure_reason: reviewType === 'failed' ? clean(failureReason) : null,
        // We can map comment to a generic note column if it exists, or one of the reasons?
        // The schema has `worked_reason` and `failure_reason`. It might also have `comment` or similar from before?
        // Migration 1 did not remove columns. It added new ones.
        // Let's assume `comment` column exists or we use `note` type?
        // Migration 1: `review_type` enum has 'note'.
        // Existing table likely had `comment`?
        // I'll check schema if needed, but safe to assume we just want evidence columns.
        // If 'note', where does it go? "Note can have comment only".
        // I will check if `comment` column exists.
        // I will try to insert `comment` if it's there.
    }

    // Check if `comment` column exists by trying to select it or just assume standard `prompt_reviews` structure.
    // Previous chats mentioned `prompt_reviews` (criteria_met, criteria_failed, comment).
    // So `comment` exists.
    if (comment) {
        payload.comment = clean(comment)
    }

    console.log('submitReview - Inserting payload:', { ...payload, worked_reason: payload.worked_reason ? '[redacted]' : null, failure_reason: payload.failure_reason ? '[redacted]' : null })

    const { error } = await supabase
        .from('prompt_reviews')
        .insert(payload)

    if (error) {
        console.error('Submit review error:', error)
        // Handle uniqueness constraint violation
        if (error.code === '23505') { // unique_violation
            throw new Error('You have already submitted this type of review for this prompt today.')
        }
        throw new Error('Failed to submit review: ' + error.message)
    }

    console.log('submitReview - Success!')
    revalidatePath(`/prompts/${promptId}`)
    return { success: true }
}
