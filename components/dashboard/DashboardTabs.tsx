'use client'

import { useState } from 'react'
import { LayoutDashboard, BarChart3 } from 'lucide-react'
import ClientDashboard from './ClientDashboard'
import CreatorStudio from './CreatorStudio'

type Tab = 'overview' | 'analytics'

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div>
      <div className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Creator Analytics
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? <ClientDashboard /> : <CreatorStudio />}
    </div>
  )
}
