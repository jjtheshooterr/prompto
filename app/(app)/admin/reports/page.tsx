'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/types/reports'
import Link from 'next/link'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Check if user is admin
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setLoading(false)
        return
      }

      // Get user profile to check admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (profile?.role !== 'admin') {
        setLoading(false)
        return
      }

      setUser(currentUser)

      // Load reports
      await loadReports()
      setLoading(false)
    }

    loadData()
  }, [filter])

  const loadReports = async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(username),
        reviewer:profiles!reviewed_by(username)
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setReports(data || [])
  }

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'resolve', shouldDelete = false) => {
    const supabase = createClient()
    
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: action === 'dismiss' ? 'dismissed' : 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (reportError) throw reportError

      // If resolving and should delete content
      if (action === 'resolve' && shouldDelete) {
        const report = reports.find(r => r.id === reportId)
        if (report) {
          const table = report.content_type === 'prompt' ? 'prompts' : 'problems'
          await supabase
            .from(table)
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
              deleted_by: user.id
            })
            .eq('id', report.content_id)
        }
      }

      // Reload reports
      await loadReports()
    } catch (error) {
      console.error('Failed to update report:', error)
      alert('Failed to update report')
    }
  }

  const getContentLink = (report: Report) => {
    if (report.content_type === 'prompt') {
      return `/prompts/${report.content_id}`
    } else if (report.content_type === 'problem') {
      return `/problems/${report.content_id}` // This would need the slug, but we'll use ID for now
    }
    return '#'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in as an admin to access this page.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Content Reports</h1>
        <p className="text-gray-600">
          Review and moderate reported content from the community.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { key: 'pending', label: 'Pending', count: reports.filter(r => r.status === 'pending').length },
            { key: 'all', label: 'All Reports', count: reports.length },
            { key: 'reviewed', label: 'Reviewed', count: reports.filter(r => r.status !== 'pending').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reports found.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded capitalize">
                      {report.content_type}
                    </span>
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      {report.reason}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Reported by {(report as any).reporter?.username || 'Unknown'} on{' '}
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <Link
                  href={getContentLink(report)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  target="_blank"
                >
                  View Content
                </Link>
              </div>

              {report.details && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-1">Details:</div>
                  <div className="text-sm text-gray-600">{report.details}</div>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'resolve', false)}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Resolve (Keep Content)
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
                        handleReportAction(report.id, 'resolve', true)
                      }
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete Content
                  </button>
                </div>
              )}

              {report.status !== 'pending' && report.reviewed_by && (
                <div className="text-sm text-gray-500">
                  Reviewed by {(report as any).reviewer?.username || 'Unknown'} on{' '}
                  {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : 'Unknown date'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}