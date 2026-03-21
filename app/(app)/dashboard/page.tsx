import DashboardTabs from '@/components/dashboard/DashboardTabs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Prompto',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPage() {
  return <DashboardTabs />
}
