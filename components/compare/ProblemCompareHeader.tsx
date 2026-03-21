import Link from 'next/link'

interface Props {
    problem: any;
}

export function ProblemCompareHeader({ problem }: Props) {
    const problemSlug = `${problem.slug}-${problem.short_id}`

    return (
        <div className="bg-background border-b border-border pt-8 pb-6 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Link href={`/problems/${problemSlug}`} className="hover:text-foreground transition-colors">
                        Back to Problem
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Compare Solutions</h1>
                <p className="text-muted-foreground mb-6 max-w-3xl">
                    Comparing prompt strategies for <span className="font-semibold text-foreground">{problem.title}</span> using quality, reliability, token usage, and cost.
                </p>

                {(problem.goal || problem.success_criteria?.length > 0) && (
                    <div className="bg-muted/30 border border-border rounded-xl p-5 mb-4 max-w-4xl">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Problem Context</h2>
                        {problem.goal && <p className="text-sm text-foreground mb-3">{problem.goal}</p>}
                        {problem.success_criteria?.length > 0 && (
                            <ul className="space-y-1">
                                {problem.success_criteria.map((c: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="text-primary mt-0.5 font-bold">•</span>
                                        {c.criterion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
