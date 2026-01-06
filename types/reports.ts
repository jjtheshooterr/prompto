export interface Report {
  id: string
  content_type: 'prompt' | 'problem' | 'comment'
  content_id: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reporter_id: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface ReportReason {
  value: string
  label: string
  description: string
}

export const REPORT_REASONS: ReportReason[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Repetitive, unwanted, or promotional content'
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive, harmful, or inappropriate material'
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material'
  },
  {
    value: 'misinformation',
    label: 'Misinformation',
    description: 'False or misleading information'
  },
  {
    value: 'low_quality',
    label: 'Low Quality',
    description: 'Poor quality, broken, or non-functional content'
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
    description: 'Duplicate or near-duplicate content'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please provide details)'
  }
]