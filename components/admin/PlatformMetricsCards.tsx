'use client'

import { Activity, Users, LayoutTemplate, Cpu, Database, TrendingUp } from 'lucide-react'

interface DailyMetrics {
  metric_date: string
  daily_active_users: number
  new_signups: number
  prompts_created: number
  ai_evaluations_today: number
}

interface TotalMetrics {
  total_users: number
  total_prompts: number
  total_problems: number
  total_ai_evaluations: number
}

interface PlatformMetricsProps {
  daily: DailyMetrics
  total: TotalMetrics
}

export function PlatformMetricsCards({ daily, total }: PlatformMetricsProps) {
  return (
    <div className="space-y-8">
      
      {/* ── Daily Pulse ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          24h Pulse
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Daily Active Users</h3>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">{daily.daily_active_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Interacting on platform today</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">New Signups</h3>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">+{daily.new_signups.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered today</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Prompts Created</h3>
              <LayoutTemplate className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">+{daily.prompts_created.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">New submissions today</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">AI Evaluations</h3>
              <Cpu className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500">{daily.ai_evaluations_today.toLocaleString()}</div>
              <p className="text-xs text-orange-500/80 mt-1">API calls triggered today</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── All Time Infrastructure ────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          Aggregate Volume
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total User Base</h3>
            <div className="text-2xl font-bold">{total.total_users.toLocaleString()}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Prompts Hosted</h3>
            <div className="text-2xl font-bold">{total.total_prompts.toLocaleString()}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Problems</h3>
            <div className="text-2xl font-bold">{total.total_problems.toLocaleString()}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total LLM Inference Calls</h3>
            <div className="text-2xl font-bold">{total.total_ai_evaluations.toLocaleString()}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
