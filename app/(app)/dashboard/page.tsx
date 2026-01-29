import ClientDashboard from '@/components/dashboard/ClientDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Prompto',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPage() {
  return <ClientDashboard />
}
