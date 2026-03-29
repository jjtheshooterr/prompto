'use client'

import { useState } from 'react'
import { toggleEmergencyLockdown } from '@/lib/actions/admin.actions'
import { toast } from 'sonner'
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react'

export function EmergencyControls({ initialIsLockdown }: { initialIsLockdown: boolean }) {
  const [isLockdown, setIsLockdown] = useState(initialIsLockdown)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleToggle = async (newState: boolean) => {
    setLoading(true)
    try {
      await toggleEmergencyLockdown(newState)
      setIsLockdown(newState)
      setShowConfirm(false)
      
      if (newState) {
        toast.error('EMERGENCY LOCKDOWN ENGAGED', { 
          description: 'All AI Evaluation endpoints have been severed.' 
        })
      } else {
        toast.success('Lockdown Disengaged', { 
          description: 'AI Evaluation Services restored successfully.' 
        })
      }
    } catch (err: any) {
      toast.error('Action Failed', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`rounded-xl border-2 p-6 transition-colors ${
        isLockdown 
          ? 'border-red-500/50 bg-red-500/5' 
          : 'border-border bg-card'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg flex-shrink-0 ${
            isLockdown 
              ? 'bg-red-500/20 text-red-500' 
              : 'bg-green-500/20 text-green-500'
          }`}>
            {isLockdown ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLockdown ? 'text-red-500' : 'text-foreground'}`}>
              System Status: {isLockdown ? 'EMERGENCY LOCKDOWN' : 'OPERATIONAL'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Controls the core AI evaluation circuit breaker.
            </p>
          </div>
        </div>

        <div>
          {isLockdown ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 text-sm text-red-500/90 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>The AI architecture is severed from outbound networks.</strong><br/>
                  Users cannot evaluate prompts, preventing rate limit spikes and protecting the API budget from malicious extraction.
                </p>
              </div>
              
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg border-2 border-red-500/50 text-red-500 font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                DISENGAGE LOCKDOWN & RESTORE SERVICES
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest rounded-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                ENGAGE PANIC BUTTON
              </button>
              <p className="text-xs text-muted-foreground text-center px-2">
                Instantly severs all AI evaluation endpoints to stop API abuse, Denial of Wallet attacks, or hallucination loops.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Custom Modal ───────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-xl border p-6 shadow-xl ${
            isLockdown ? 'bg-card border-border' : 'bg-background border-red-500/50'
          }`}>
            <h2 className={`text-xl font-bold flex items-center gap-2 mb-3 ${!isLockdown && 'text-red-500'}`}>
              {!isLockdown && <AlertTriangle className="w-6 h-6" />}
              {isLockdown ? 'Restore Platform Operations?' : 'CONFIRM EMERGENCY LOCKDOWN'}
            </h2>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {isLockdown ? (
                "This will reconnect the server to the Deepseek APIs and resume real-time community AI scoring. Have the threat actors been mitigated?"
              ) : (
                <>
                  This action will instantly trip the circuit breakers on the massive AI evaluation engine. Any user actively attempting to score a Prompt will receive a 503 error.
                  <br /><br />
                  Only engage this if you suspect an orchestrated Denial of Wallet attack or a systemic hallucination loop in the models.
                </>
              )}
            </p>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-lg border border-border bg-transparent text-foreground font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleToggle(!isLockdown)}
                disabled={loading}
                className={`px-5 py-2.5 rounded-lg font-bold text-white transition-all disabled:opacity-50 ${
                  isLockdown 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700 ring-2 ring-red-500/20 ring-offset-2 ring-offset-background'
                }`}
              >
                {loading ? 'Processing...' : (isLockdown ? 'Yes, Restore Systems' : 'ENGAGE LOCKDOWN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
