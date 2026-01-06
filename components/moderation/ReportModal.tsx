'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REPORT_REASONS } from '@/types/reports'

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

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      alert('Please select a reason for reporting')
      return
    }

    setSubmitting(true)
    
    try {
      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        alert('You must be logged in to report content')
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

      alert('Report submitted successfully. Thank you for helping keep our community safe.')
      onClose()
      setReason('')
      setDetails('')
    } catch (error) {
      console.error('Report failed:', error)
      alert(`Failed to submit report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedReason = REPORT_REASONS.find(r => r.value === reason)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Report Content</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Reporting:</div>
          <div className="font-medium">{contentTitle}</div>
          <div className="text-xs text-gray-500 capitalize">{contentType}</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting <span className="text-red-500">*</span>
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
                    <div className="font-medium text-sm">{reportReason.label}</div>
                    <div className="text-xs text-gray-500">{reportReason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedReason && (selectedReason.value === 'other' || selectedReason.value === 'copyright' || selectedReason.value === 'misinformation') && (
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details {selectedReason.value === 'other' ? <span className="text-red-500">*</span> : '(optional)'}
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide more information about this report..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                required={selectedReason.value === 'other'}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
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