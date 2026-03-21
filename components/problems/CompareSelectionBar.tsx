'use client'

import { useRouter } from 'next/navigation'

interface Props {
    selectedPrompts: string[];
    problemSlug: string;
    onClear: () => void;
}

export function CompareSelectionBar({ selectedPrompts, problemSlug, onClear }: Props) {
    const router = useRouter()

    if (selectedPrompts.length === 0) return null

    const handleCompare = () => {
        if (selectedPrompts.length < 2) return;
        router.push(`/problems/${problemSlug}/compare?prompts=${selectedPrompts.join(',')}`)
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-md border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-none rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="flex items-center gap-3 border-r border-border pr-5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">
                    {selectedPrompts.length}
                </span>
                <span className="text-sm font-semibold text-foreground">Prompts selected</span>
            </div>

            <button
                onClick={onClear}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2"
            >
                Clear
            </button>

            <button
                onClick={handleCompare}
                disabled={selectedPrompts.length < 2}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedPrompts.length >= 2
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
            >
                Compare Solutions
            </button>
        </div>
    )
}
