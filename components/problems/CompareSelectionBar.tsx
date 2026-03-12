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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="flex items-center gap-3 border-r border-slate-200 pr-5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shadow-sm">
                    {selectedPrompts.length}
                </span>
                <span className="text-sm font-semibold text-slate-700">Prompts selected</span>
            </div>

            <button
                onClick={onClear}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2"
            >
                Clear
            </button>

            <button
                onClick={handleCompare}
                disabled={selectedPrompts.length < 2}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedPrompts.length >= 2
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
            >
                Compare Solutions
            </button>
        </div>
    )
}
