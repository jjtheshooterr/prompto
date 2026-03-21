'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SelectedPrompt {
    id: string
    title: string
    problemId: string
    problemSlug: string
    problemTitle: string
    problemShortId: string
}

export function CompareCart() {
    const router = useRouter()
    const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadSelectedPrompts = async () => {
            const ids = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
            
            if (ids.length === 0) {
                setLoading(false)
                return
            }

            try {
                const response = await fetch('/api/prompts/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids })
                })
                
                if (response.ok) {
                    const prompts = await response.json()
                    setSelectedPrompts(prompts)
                    
                    // Clean up localStorage - remove IDs that don't exist in DB
                    const validIds = prompts.map((p: SelectedPrompt) => p.id)
                    if (validIds.length !== ids.length) {
                        localStorage.setItem('comparePrompts', JSON.stringify(validIds))
                        window.dispatchEvent(new CustomEvent('compareUpdated'))
                    }
                }
            } catch (error) {
                console.error('Failed to load selected prompts:', error)
            } finally {
                setLoading(false)
            }
        }

        loadSelectedPrompts()

        const handleUpdate = () => loadSelectedPrompts()
        window.addEventListener('compareUpdated', handleUpdate)
        return () => window.removeEventListener('compareUpdated', handleUpdate)
    }, [])

    const handleClear = () => {
        localStorage.removeItem('comparePrompts')
        setSelectedPrompts([])
        window.dispatchEvent(new CustomEvent('compareUpdated'))
    }

    const handleRemove = (id: string) => {
        const ids = JSON.parse(localStorage.getItem('comparePrompts') || '[]')
        const updated = ids.filter((promptId: string) => promptId !== id)
        localStorage.setItem('comparePrompts', JSON.stringify(updated))
        setSelectedPrompts(prev => prev.filter(p => p.id !== id))
        window.dispatchEvent(new CustomEvent('compareUpdated'))
    }

    const handleCompare = () => {
        if (selectedPrompts.length < 2) return

        const problemIds = [...new Set(selectedPrompts.map(p => p.problemId))]
        
        if (problemIds.length === 1) {
            const problemSlug = selectedPrompts[0].problemSlug
            const problemShortId = selectedPrompts[0].problemShortId
            const promptIds = selectedPrompts.map(p => p.id).join(',')
            const url = `/problems/${problemSlug}-${problemShortId}/compare?prompts=${promptIds}`
            router.push(url)
        } else {
            alert('All selected prompts must be from the same problem to compare them.')
        }
    }

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-muted/50 rounded"></div>
                        <div className="h-16 bg-muted/50 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedPrompts.length === 0) {
        return null
    }

    const problemIds = [...new Set(selectedPrompts.map(p => p.problemId))]
    const isMultiProblem = problemIds.length > 1

    return (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6 mb-12">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">Your Comparison Cart</h2>
                    <p className="text-sm text-muted-foreground">
                        {selectedPrompts.length} prompt{selectedPrompts.length !== 1 ? 's' : ''} selected
                        {isMultiProblem && <span className="text-orange-500 font-semibold ml-2">⚠️ From different problems</span>}
                    </p>
                </div>
                <button
                    onClick={handleClear}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-background/50"
                >
                    Clear All
                </button>
            </div>

            <div className="space-y-2 mb-4">
                {selectedPrompts.map((prompt) => (
                    <div
                        key={prompt.id}
                        className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
                    >
                        <div className="flex-grow min-w-0">
                            <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                                {prompt.title}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                                Problem: {prompt.problemTitle}
                            </p>
                        </div>
                        <button
                            onClick={() => handleRemove(prompt.id)}
                            className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Remove"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {isMultiProblem ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-destructive text-sm mb-1">Cannot Compare</h4>
                            <p className="text-xs text-destructive/80">
                                You can only compare prompts from the same problem. Please remove prompts until all selections are from one problem.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleCompare}
                    disabled={selectedPrompts.length < 2}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                        selectedPrompts.length >= 2
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                >
                    {selectedPrompts.length < 2 
                        ? 'Select at least 2 prompts to compare'
                        : `Compare ${selectedPrompts.length} Prompts`
                    }
                </button>
            )}
        </div>
    )
}
