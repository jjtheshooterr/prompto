'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REPORT_REASONS } from '@/types/reports'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'prompt' | 'problem'
  contentId: string
  contentTitle: string
}

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle
}: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast('Please select a reason for reporting')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Check authentication
      if (!user) {
        toast('Please log in to report content')
        return
      }

      // Submit report
      const { error } = await supabase
        .from('reports')
        .insert({
          content_type: contentType,
          content_id: contentId,
          reason,
          details: details.trim() || null,
          reporter_id: user.id
        })

      if (error) {
        throw new Error(`Failed to submit report: ${error.message}`)
      }

      // Note: Report count will be calculated dynamically from reports table

      toast('Report submitted successfully')
      onClose()
      setReason('')
      setDetails('')
    } catch (error) {
      console.error('Report failed:', error)
      toast.error('Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReason = REPORT_REASONS.find(r => r.value === reason)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Report Content</h2>

        <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg">
          <div className="text-sm text-muted-foreground">Reporting:</div>
          <div className="font-medium text-foreground">{contentTitle}</div>
          <div className="text-xs text-muted-foreground capitalize">{contentType}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for reporting <span className="text-destructive">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reportReason) => (
                <label key={reportReason.value} className="flex items-start">
                  <input
                    type="radio"
                    name="reason"
                    value={reportReason.value}
                    checked={reason === reportReason.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-sm text-foreground">{reportReason.label}</div>
                    <div className="text-xs text-muted-foreground">{reportReason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedReason && (selectedReason.value === 'other' || selectedReason.value === 'copyright' || selectedReason.value === 'misinformation') && (
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-foreground mb-1">
                Additional Details {selectedReason.value === 'other' ? <span className="text-destructive">*</span> : '(optional)'}
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide more information about this report..."
                className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                required={selectedReason.value === 'other'}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
              disabled={submitting || !reason || (selectedReason?.value === 'other' && !details.trim())}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}