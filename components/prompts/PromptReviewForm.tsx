'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type ReviewType = 'worked' | 'failed' | 'note'

interface PromptReviewFormProps {
    promptId: string
    onSuccess?: () => void
}

export default function PromptReviewForm({ promptId, onSuccess }: PromptReviewFormProps) {
    const [reviewType, setReviewType] = useState<ReviewType | null>(null)
    const [reason, setReason] = useState('')
    const [isPending, setIsPending] = useState(false) // Changed from useTransition

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reviewType) return

        // Simple validation
        if (reviewType === 'worked' && !reason.trim()) {
            toast.error('Please tell us why/how it worked')
            return
        }
        if (reviewType === 'failed' && !reason.trim()) {
            toast.error('Please tell us why it failed')
            return
        }

        setIsPending(true)

        try {
            // Use client-side Supabase like voting does
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Please log in to submit a review')
                setIsPending(false)
                return
            }

            const payload: any = {
                prompt_id: promptId,
                user_id: user.id,
                review_type: reviewType,
                worked_reason: reviewType === 'worked' ? reason.trim() : null,
                failure_reason: reviewType === 'failed' ? reason.trim() : null,
                comment: reviewType === 'note' ? reason.trim() : null
            }

            const { error } = await supabase
                .from('prompt_reviews')
                .insert(payload)

            if (error) {
                if (error.code === '23505') {
                    toast.error('You have already submitted this type of review for this prompt today.')
                } else {
                    toast.error('Failed to submit review: ' + error.message)
                }
                setIsPending(false)
                return
            }

            toast.success('Review submitted successfully')
            setReviewType(null)
            setReason('')
            setIsPending(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit review')
            setIsPending(false)
        }
    }

    // Login check (optional, but handled by action too)
    // Assuming parent checks login or action throws.

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Did this prompt work for you?</h3>
            </div>

            <div className="p-4">
                {!reviewType ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setReviewType('worked')}
                            className="flex-1 py-3 px-4 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex flex-col items-center gap-1"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">It Worked</span>
                        </button>
                        <button
                            onClick={() => setReviewType('failed')}
                            className="flex-1 py-3 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex flex-col items-center gap-1"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="font-medium">It Failed</span>
                        </button>
                        <button
                            onClick={() => setReviewType('note')}
                            className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors flex flex-col items-center gap-1"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Just a Note</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-medium px-2 py-1 rounded text-sm flex items-center gap-1.5 ${reviewType === 'worked' ? 'bg-green-100 text-green-800' :
                                reviewType === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {reviewType === 'worked' ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        It Worked
                                    </>
                                ) : reviewType === 'failed' ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        It Failed
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Note
                                    </>
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReviewType(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Change
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {reviewType === 'worked' ? 'One sentence: Who/what did it work for?' :
                                    reviewType === 'failed' ? 'One sentence: How did it fail?' :
                                        'Your thoughts'}
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                rows={2}
                                placeholder={
                                    reviewType === 'worked' ? 'e.g. Worked perfectly for Python debugging' :
                                        reviewType === 'failed' ? 'e.g. Hallucinated APIs that do not exist' :
                                            'Share your experience...'
                                }
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setReviewType(null)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isPending ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Shared publicly to help others.
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}
