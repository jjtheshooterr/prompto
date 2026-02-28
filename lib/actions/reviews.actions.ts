'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Input Validation Schema ──────────────────────────────────────────────────

const SubmitReviewSchema = z.discriminatedUnion('reviewType', [
    z.object({
        promptId: z.string().uuid('Invalid prompt ID'),
        reviewType: z.literal('worked'),
        workedReason: z.string().min(1, 'Please explain why this prompt worked').max(1000),
        failureReason: z.string().optional(),
        comment: z.string().max(2000).optional(),
    }),
    z.object({
        promptId: z.string().uuid('Invalid prompt ID'),
        reviewType: z.literal('failed'),
        failureReason: z.string().min(1, 'Please explain why this prompt failed').max(1000),
        workedReason: z.string().optional(),
        comment: z.string().max(2000).optional(),
    }),
    z.object({
        promptId: z.string().uuid('Invalid prompt ID'),
        reviewType: z.literal('note'),
        comment: z.string().min(1, 'Please provide a note').max(2000),
        workedReason: z.string().optional(),
        failureReason: z.string().optional(),
    }),
])

export type ReviewType = 'worked' | 'failed' | 'note'

export interface SubmitReviewParams {
    promptId: string
    reviewType: ReviewType
    workedReason?: string
    failureReason?: string
    comment?: string
}

// ─── Server Action ─────────────────────────────────────────────────────────────

export async function submitReview(params: SubmitReviewParams) {
    // 1. Validate inputs before hitting the database
    const parsed = SubmitReviewSchema.safeParse(params)
    if (!parsed.success) {
        const firstError = parsed.error.errors[0]
        throw new Error(firstError?.message ?? 'Invalid review data')
    }

    const { promptId, reviewType, workedReason, failureReason, comment } = parsed.data

    const supabase = await createClient()

    // 2. Verify the user's session server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('You must be logged in to submit a review.')
    }

    // 3. Verify the prompt exists and is publicly visible — prevents spoofed
    //    reviews on deleted, hidden, or non-existent prompts
    const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', promptId)
        .eq('is_deleted', false)
        .eq('is_hidden', false)
        .single()

    if (promptError || !prompt) {
        throw new Error('Prompt not found or is no longer available.')
    }

    // 4. Insert the review
    const clean = (s?: string) => s?.trim() || null

    const { error } = await supabase
        .from('prompt_reviews')
        .insert({
            prompt_id: promptId,
            user_id: user.id,
            review_type: reviewType,
            worked_reason: reviewType === 'worked' ? clean(workedReason) : null,
            failure_reason: reviewType === 'failed' ? clean(failureReason) : null,
            comment: clean(comment),
        })

    if (error) {
        if (error.code === '23505') {
            throw new Error('You have already submitted this type of review for this prompt today.')
        }
        throw new Error('Failed to submit review: ' + error.message)
    }

    revalidatePath(`/prompts/${promptId}`)
    return { success: true }
}
