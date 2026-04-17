import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProblemInput, ProblemConstraint, ProblemSuccessCriterion } from '@/types/problems'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers'
import { problemUrl } from '@/lib/utils/prompt-url'
import { sanitizeSlug } from '@/lib/utils/slug'

interface CreateProblemClientProps {
  user: any
}

// Pure CSS hover tooltip — no JS state, valid inside <label> (uses <span> only)
function FieldTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/70 group-hover:text-foreground cursor-default transition-colors shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        <span className="block bg-popover border border-border text-popover-foreground text-xs rounded-lg px-2.5 py-2 shadow-lg leading-relaxed">
          {text}
        </span>
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] block w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45" />
      </span>
    </span>
  )
}

export default function CreateProblemClient({ user }: CreateProblemClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const { user: contextUser } = useAuth()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [inputs, setInputs] = useState<ProblemInput[]>([
    { name: '', description: '', required: true }
  ])
  const [constraints, setConstraints] = useState<ProblemConstraint[]>([
    { rule: '', severity: 'hard' }
  ])
  const [successCriteria, setSuccessCriteria] = useState<ProblemSuccessCriterion[]>([
    { criterion: '' }
  ])

  const addInput = () => {
    setInputs([...inputs, { name: '', description: '', required: true }])
  }

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index))
    }
  }

  const updateInput = (index: number, field: keyof ProblemInput, value: string | boolean) => {
    const updated = [...inputs]
    updated[index] = { ...updated[index], [field]: value }
    setInputs(updated)
  }

  const addConstraint = () => {
    setConstraints([...constraints, { rule: '', severity: 'hard' }])
  }

  const removeConstraint = (index: number) => {
    if (constraints.length > 1) {
      setConstraints(constraints.filter((_, i) => i !== index))
    }
  }

  const updateConstraint = (index: number, field: keyof ProblemConstraint, value: string) => {
    const updated = [...constraints]
    updated[index] = { ...updated[index], [field]: value }
    setConstraints(updated)
  }

  const addSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, { criterion: '' }])
  }

  const removeSuccessCriterion = (index: number) => {
    if (successCriteria.length > 1) {
      setSuccessCriteria(successCriteria.filter((_, i) => i !== index))
    }
  }

  const updateSuccessCriterion = (index: number, field: keyof ProblemSuccessCriterion, value: string) => {
    const updated = [...successCriteria]
    updated[index] = { ...updated[index], [field]: value }
    setSuccessCriteria(updated)
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    try {
      // Create problem directly from client instead of using server action
      const supabase = createClient()

      // Double-check authentication via context
      if (!contextUser) {
        throw new Error('Please log in again')
      }

      // Title is now controlled via state
      const description = formData.get('description') as string
      const goal = formData.get('goal') as string
      const tagsRaw = formData.get('tags') as string || ''
      const tags = tagsRaw
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      const industry = formData.get('industry') as string
      const visibility = formData.get('visibility') as string || 'public'
      const real_world_context = formData.get('real_world_context') as string
      const difficulty = formData.get('difficulty') as string
      const example_input = formData.get('example_input') as string
      const expected_output = formData.get('expected_output') as string

      const known_failure_modes_raw = formData.get('known_failure_modes') as string
      const known_failure_modes = known_failure_modes_raw
        ? known_failure_modes_raw.split(',').map(m => m.trim()).filter(Boolean)
        : []

      // Filter out empty inputs, constraints, and criteria
      const validInputs = inputs.filter(input => input.name.trim() && input.description.trim())
      const validConstraints = constraints.filter(constraint => constraint.rule.trim())
      const validCriteria = successCriteria.filter(criterion => criterion.criterion.trim())

      // Slug is now tracked in state for real-time preview
      // sanitizeSlug guards against reserved route words and collisions
      const finalSlug = slug || sanitizeSlug(title)

      // Get or create user's workspace and ensure membership
      let { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!workspace) {
        // Create workspace if it doesn't exist
        const workspaceSlug = `user-${user.id.replace(/-/g, '')}`

        const { data: newWorkspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: `${user.email}'s Workspace`,
            slug: workspaceSlug,
            owner_id: user.id
          })
          .select('id')
          .single()

        if (workspaceError) {
          throw new Error(`Failed to create workspace: ${workspaceError.message}`)
        }

        // Add user as workspace member
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'owner'
          })

        workspace = newWorkspace
      } else {
        // Ensure user is a member of their workspace
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('user_id', user.id)
          .single()

        if (!membership) {
          // Add user as workspace member if not already
          await supabase
            .from('workspace_members')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              role: 'owner'
            })
        }
      }

      console.log('Creating problem with workspace:', workspace.id)

      const { data: problem, error } = await supabase
        .from('problems')
        .insert({
          title,
          description,
          goal: goal || null,
          inputs: validInputs.length > 0 ? validInputs : null,
          constraints: validConstraints.length > 0 ? validConstraints : null,
          success_criteria: validCriteria.length > 0 ? validCriteria : null,
          // tags handled via RPC below
          industry,
          visibility,
          slug: finalSlug,
          is_listed: true,
          created_by: user.id,
          owner_id: user.id, // Set owner_id for new visibility system
          workspace_id: workspace.id,
          real_world_context: real_world_context || null,
          difficulty: difficulty || null,
          example_input: example_input || null,
          expected_output: expected_output || null,
          known_failure_modes
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create problem: ${error.message}`)
      }

      // Sync tags using the new RPC
      if (tags && tags.length > 0) {
        const { error: tagError } = await supabase.rpc('manage_problem_tags', {
          p_problem_id: problem.id,
          p_tags: tags
        })

        if (tagError) {
          console.error('Failed to save tags:', tagError)
          // Don't block creation, but warn
          toast.error('Problem created but tags failed to save')
        }
      }

      // If creating a private problem, add the owner as a member
      if (visibility === 'private') {
        await supabase
          .from('problem_members')
          .insert({
            problem_id: problem.id,
            user_id: user.id,
            role: 'owner'
          })
      }

      router.push(problemUrl({ id: problem.id, slug: problem.slug }))
    } catch (error) {
      console.error('Failed to create problem:', error)
      toast.error(`Failed to create problem: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSubmitting(false)
    }
  }

  const steps = [
    { id: 'core', label: 'Define', number: '01' },
    { id: 'data', label: 'Data', number: '02' },
    { id: 'eval', label: 'Evaluate', number: '03' },
    { id: 'discovery', label: 'Classify', number: '04' },
  ]

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Wire up Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        const form = document.getElementById('problem-form') as HTMLFormElement
        if (form) form.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-sm font-semibold text-foreground tracking-tight">New Problem</h1>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {steps.map((step, i) => (
              <button
                key={step.id}
                type="button"
                onClick={() => scrollToSection(step.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <span className="font-mono text-[10px] text-muted-foreground">{step.number}</span>
                {step.label}
                {i < steps.length - 1 && <span className="ml-2 text-muted-foreground">›</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById('problem-form') as HTMLFormElement
              if (form) form.requestSubmit()
            }}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-4 py-1.5 rounded-md text-xs font-medium shadow-sm transition-all hover:shadow-md"
          >
            {submitting ? 'Creating...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

      <form id="problem-form" action={handleSubmit}>
        {/* Core Details */}
        <section id="core" className="pb-10 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary text-xs font-mono font-bold">01</span>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Problem Definition</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Problem Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => {
                  const val = e.target.value
                  setTitle(val)
                  setSlug(sanitizeSlug(val))
                }}
                className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-card"
                placeholder="e.g., Generate SQL queries from natural language"
              />
              {title && (
                <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-md">
                  <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">URL Preview</span>
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    prompto.com/p/<span className="text-primary font-bold">{slug}</span>
                  </span>
                  {slug.includes('-') && !title.toLowerCase().includes('-') && (
                    <span className="text-[10px] text-amber-500 font-medium ml-auto" title="Reserved word protected with unique suffix">
                      (Guard active)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-card resize-y"
                placeholder="Describe the problem, constraints, and objective."
              />
            </div>

            <div>
              <label htmlFor="real_world_context" className="flex justify-between items-center text-sm font-medium text-foreground mb-2">
                <span className="flex items-center gap-1">
                  Real World Context
                  <FieldTip text="Helps solvers understand why this problem matters. A real scenario leads to more practical, grounded solutions." />
                </span>
                <span className="text-xs font-normal text-muted-foreground">Optional</span>
              </label>
              <textarea
                id="real_world_context"
                name="real_world_context"
                rows={2}
                className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-muted resize-y"
                placeholder="Why does this matter in production?"
              />
            </div>
          </div>
        </section>

        <div className="my-10 flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Data Targets */}
        <section id="data" className="pb-10 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">02</span>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Data Scaffolding</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="example_input" className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                Example Input
                <FieldTip text="Paste a realistic input a prompt would receive at runtime. Include a tricky edge case if you have one. Solvers test their prompts against this." />
              </label>
              <textarea
                id="example_input"
                name="example_input"
                rows={5}
                className="w-full font-mono text-xs border-border rounded-lg px-4 py-3 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary bg-muted transition-shadow resize-none"
                placeholder="Sample text or JSON block"
              />
            </div>
            <div>
              <label htmlFor="expected_output" className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                Expected Output
                <FieldTip text="Show exactly what a perfect response looks like. The AI scoring engine compares each prompt's output against this when ranking submissions." />
              </label>
              <textarea
                id="expected_output"
                name="expected_output"
                rows={5}
                className="w-full font-mono text-xs border-border rounded-lg px-4 py-3 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary bg-muted transition-shadow resize-none"
                placeholder="The perfect desired output"
              />
            </div>
          </div>

          <div>
            <label htmlFor="goal" className="flex justify-between items-center text-sm font-medium text-foreground mb-2">
              <span className="flex items-center gap-1">
                Primary Goal Requirement
                <FieldTip text="One sentence defining the must-have outcome. e.g. 'Output must be valid JSON' or 'Reply must be under 80 words'. Leave blank if your description already covers it." />
              </span>
              <span className="text-xs font-normal text-muted-foreground">Optional</span>
            </label>
            <input
              type="text"
              id="goal"
              name="goal"
              className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-muted"
              placeholder="e.g., Output must strictly be valid SQL"
            />
          </div>
        </section>

        <div className="my-10 flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Evaluation Engine */}
        <section id="eval" className="pb-10 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">03</span>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Evaluation Engine</h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <label htmlFor="known_failure_modes" className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                Known Failure Modes
                <FieldTip text="Things you already know can go wrong: hallucinations, wrong format, off-topic replies. Enter comma-separated. Solvers use this to build targeted guardrails." />
              </label>
              <input
                type="text"
                id="known_failure_modes"
                name="known_failure_modes"
                className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-muted"
                placeholder="e.g., Hallucinations, bad JSON syntax (comma-separated)"
              />
            </div>

            {/* Inputs Array */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  Dynamic Variables
                  <FieldTip text="Placeholders a prompt receives at runtime. Give each one a short name and describe what it holds. Solvers reference these by name when writing their prompts." />
                </span>
                <button
                  type="button"
                  onClick={addInput}
                  className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary font-medium px-2.5 py-1 rounded-md border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  + Add Variable
                </button>
              </div>
              <div className="space-y-2">
                {inputs.map((input, index) => (
                  <div key={index} className="flex gap-3 items-center bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
                    <input
                      type="text"
                      placeholder="Variable (e.g., user_query)"
                      value={input.name}
                      onChange={(e) => updateInput(index, 'name', e.target.value)}
                      className="w-1/3 font-mono text-xs border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-card"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={input.description}
                      onChange={(e) => updateInput(index, 'description', e.target.value)}
                      className="flex-1 text-sm border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-card"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground shrink-0">
                      <input
                        type="checkbox"
                        checked={input.required}
                        onChange={(e) => updateInput(index, 'required', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      Req
                    </label>
                    {inputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInput(index)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                        title="Remove variable"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Constraints Array */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  System Constraints
                  <FieldTip text="Hard limits must be met or a submission fails scoring. Soft guides are goals solvers should aim for but are not strict requirements." />
                </span>
                <button
                  type="button"
                  onClick={addConstraint}
                  className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary font-medium px-2.5 py-1 rounded-md border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  + Add Constraint
                </button>
              </div>
              <div className="space-y-2">
                {constraints.map((constraint, index) => (
                  <div key={index} className="flex gap-3 items-center bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
                    <input
                      type="text"
                      placeholder="Rule constraint"
                      value={constraint.rule}
                      onChange={(e) => updateConstraint(index, 'rule', e.target.value)}
                      className="flex-1 text-sm border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-card"
                    />
                    <select
                      value={constraint.severity}
                      onChange={(e) => updateConstraint(index, 'severity', e.target.value)}
                      className="text-xs border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-card shrink-0"
                    >
                      <option value="hard">Hard Limit</option>
                      <option value="soft">Soft Guide</option>
                    </select>
                    {constraints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeConstraint(index)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                        title="Remove constraint"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Success Criteria Array */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  Success Criteria
                  <FieldTip text="Define what a winning response looks like in measurable terms. These feed directly into the AI quality scoring rubric used to rank submitted prompts." />
                </span>
                <button
                  type="button"
                  onClick={addSuccessCriterion}
                  className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary font-medium px-2.5 py-1 rounded-md border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  + Add Criterion
                </button>
              </div>
              <div className="space-y-2">
                {successCriteria.map((criterion, index) => (
                  <div key={index} className="flex gap-3 items-center bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
                    <input
                      type="text"
                      placeholder="Criterion definition"
                      value={criterion.criterion}
                      onChange={(e) => updateSuccessCriterion(index, 'criterion', e.target.value)}
                      className="flex-1 text-sm border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-card"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={criterion.description || ''}
                      onChange={(e) => updateSuccessCriterion(index, 'description', e.target.value)}
                      className="w-1/3 text-sm border-border rounded-md px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary bg-muted"
                    />
                    {successCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSuccessCriterion(index)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                        title="Remove criterion"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="my-10 flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-border" />
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Classification */}
        <section id="discovery" className="pb-8 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-mono font-bold">04</span>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Classification &amp; Discovery</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-muted"
                placeholder="sql, database, search (comma-separated)"
                onBlur={(e) => {
                  const cleanTags = e.target.value
                    .split(',')
                    .map(tag => tag.trim().toLowerCase())
                    .filter(Boolean)
                    .filter((tag, index, array) => array.indexOf(tag) === index)
                    .join(', ')
                  e.target.value = cleanTags
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  id="industry"
                  name="industry"
                  required
                  className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground bg-muted focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select category</option>
                  <option value="dev">Development</option>
                  <option value="marketing">Marketing</option>
                  <option value="content">Content</option>
                  <option value="data">Data</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="legal">Legal</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="hr">HR</option>
                  <option value="video">Video</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="difficulty" className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                  Difficulty
                  <FieldTip text="Helps users filter by skill level on the Browse page. Choose based on how much prompt engineering experience is needed to solve this well." />
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground bg-muted focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Set difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label htmlFor="visibility" className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
                  Access Level
                  <FieldTip text="Public problems appear on Browse and in search. Private problems are invite-only and only visible to you and any members you add." />
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  defaultValue="public"
                  className="w-full text-sm border-border rounded-lg px-4 py-2.5 shadow-sm text-foreground bg-muted focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Publish Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">All required fields marked with *</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border px-5 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating...
                  </>
                ) : 'Publish Problem'}
              </button>
            </div>
          </div>
        </div>
      </form>

          {/* Contextual Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-5">

              {/* Prompt Engineering Tips */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 2v4"/><path d="m6.34 7.34 2.83 2.83"/><path d="M2 12h4"/><path d="m6.34 16.66 2.83-2.83"/><path d="M12 18v4"/><path d="m17.66 16.66-2.83-2.83"/><path d="M18 12h4"/><path d="m17.66 7.34-2.83 2.83"/></svg>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Boost Solver Quality</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold mt-px">1</span>
                    <span><strong className="text-foreground">Be specific with constraints.</strong> Vague rules get vague prompts. Say exactly what format, length, or structure you need.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold mt-px">2</span>
                    <span><strong className="text-foreground">Add a real example.</strong> Include a tricky case, not just the easy one. Solvers write better prompts when they see the hard cases early.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold mt-px">3</span>
                    <span><strong className="text-foreground">List what&apos;s gone wrong.</strong> If you already know the failure points (bad formatting, off-topic replies), say so. It saves everyone time.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-400 font-bold mt-px">4</span>
                    <span><strong className="text-foreground">Set clear success criteria.</strong> If solvers know what &ldquo;good&rdquo; looks like, they can actually aim for it.</span>
                  </li>
                </ul>
              </div>

              {/* Quick Reference */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Quick Reference</h3>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="text-muted-foreground">&#x2022;</span> 
                    <span>Use <code className="px-1 py-0.5 bg-muted rounded text-foreground font-mono text-[11px]">JSON</code> or <code className="px-1 py-0.5 bg-muted rounded text-foreground font-mono text-[11px]">plaintext</code> for inputs/outputs</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-muted-foreground">&#x2022;</span> 
                    <span>Separate tags and failure modes with commas</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-muted-foreground">&#x2022;</span>
                    <span>Hard constraints disqualify a submission. Soft ones are just guidance</span>
                  </p>
                </div>
              </div>


            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}