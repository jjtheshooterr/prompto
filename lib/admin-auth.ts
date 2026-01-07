'use client'

export function checkAdminAuth(): boolean {
  if (typeof window === 'undefined') return false
  
  const adminSession = localStorage.getItem('admin_session')
  const sessionTime = localStorage.getItem('admin_session_time')
  
  if (!adminSession || !sessionTime) return false
  
  // Session expires after 24 hours
  const sessionAge = Date.now() - parseInt(sessionTime)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  if (sessionAge > maxAge) {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_time')
    return false
  }
  
  return adminSession === 'true'
}

export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('admin_session')
  localStorage.removeItem('admin_session_time')
}