import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProblemRow {
    slug: string
    title: string
    summary: string
    domain: string
    difficulty: string
}

interface PromptRow {
    problem_slug: string
    slug: string
    title: string
    system_prompt: string
    is_pinned: string
    parent_prompt_slug: string
    model: string
}

async function seedProblems() {
    console.log('📦 Seeding problems...')

    const problemsPath = path.join(__dirname, '../seed-data/problems.csv')
    const problemsCsv = fs.readFileSync(problemsPath, 'utf-8')
    const problemRows: ProblemRow[] = parse(problemsCsv, {
        columns: true,
        skip_empty_lines: true
    })

    console.log(`Found ${problemRows.length} problems to import`)

    // Get the first workspace to use for seeding
    const { data: workspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, owner_id')
        .limit(1)
        .single()

    if (workspaceError || !workspaces) {
        console.error('Failed to get workspace:', workspaceError)
        process.exit(1)
    }

    const workspaceId = workspaces.id
    const userId = workspaces.owner_id

    console.log(`Using workspace: ${workspaceId}`)

    // Insert problems
    const problemsToInsert = problemRows.map(row => ({
        workspace_id: workspaceId,
        owner_id: userId,
        slug: row.slug,
        title: row.title,
        description: row.summary,
        industry: row.domain,
        created_by: userId,
        visibility: 'public',
        tags: [row.domain, row.difficulty]
    }))

    const { data: insertedProblems, error: problemError } = await supabase
        .from('problems')
        .upsert(problemsToInsert, {
            onConflict: 'workspace_id,slug',
            ignoreDuplicates: false
        })
        .select('id, slug')

    if (problemError) {
        console.error('Error inserting problems:', problemError)
        process.exit(1)
    }

    console.log(`✅ Inserted ${problemRows.length} problems`)
    return { userId, workspaceId, problems: insertedProblems || [] }
}

async function seedPrompts(userId: string, workspaceId: string, problems: any[]) {
    console.log('\n📝 Seeding prompts...')

    const promptsPath = path.join(__dirname, '../seed-data/prompts.csv')
    const promptsCsv = fs.readFileSync(promptsPath, 'utf-8')
    const promptRows: PromptRow[] = parse(promptsCsv, {
        columns: true,
        skip_empty_lines: true
    })

    console.log(`Found ${promptRows.length} prompts to import`)

    // Create a map of problem slugs to IDs
    const problemMap = new Map(problems.map(p => [p.slug, p.id]))

    // First pass: Insert all pinned prompts (no parent)
    const pinnedPrompts = promptRows.filter(row => row.is_pinned === 'true')
    console.log(`\nInserting ${pinnedPrompts.length} pinned prompts...`)

    const pinnedPromptsToInsert = pinnedPrompts.map(row => {
        const problemId = problemMap.get(row.problem_slug)
        if (!problemId) {
            console.warn(`Warning: Problem not found for slug: ${row.problem_slug}`)
            return null
        }

        return {
            workspace_id: workspaceId,
            slug: row.slug,
            title: row.title,
            system_prompt: row.system_prompt,
            problem_id: problemId,
            created_by: userId,
            model: row.model || 'gpt-4',
            visibility: 'public',
            user_prompt_template: 'Provide your input here',
            example_input: { text: 'Example input' },
            example_output: { text: 'Example output' }
        }
    }).filter(Boolean)

    const { data: insertedPinnedPrompts, error: pinnedError } = await supabase
        .from('prompts')
        .upsert(pinnedPromptsToInsert, {
            onConflict: 'workspace_id,slug',
            ignoreDuplicates: false
        })
        .select('id, slug')

    if (pinnedError) {
        console.error('Error inserting pinned prompts:', pinnedError)
        process.exit(1)
    }

    console.log(`✅ Inserted ${pinnedPrompts.length} pinned prompts`)

    // Create a map of prompt slugs to IDs
    const promptMap = new Map(insertedPinnedPrompts?.map(p => [p.slug, p.id]) || [])

    // Second pass: Insert fork prompts (with parent)
    const forkPrompts = promptRows.filter(row => row.is_pinned === 'false' && row.parent_prompt_slug)
    console.log(`\nInserting ${forkPrompts.length} fork prompts...`)

    const forkPromptsToInsert = forkPrompts.map(row => {
        const problemId = problemMap.get(row.problem_slug)
        const parentPromptId = promptMap.get(row.parent_prompt_slug)

        if (!problemId) {
            console.warn(`Warning: Problem not found for slug: ${row.problem_slug}`)
            return null
        }

        if (!parentPromptId) {
            console.warn(`Warning: Parent prompt not found for slug: ${row.parent_prompt_slug}`)
            return null
        }

        return {
            workspace_id: workspaceId,
            slug: row.slug,
            title: row.title,
            system_prompt: row.system_prompt,
            problem_id: problemId,
            parent_prompt_id: parentPromptId,
            created_by: userId,
            model: row.model || 'gpt-4',
            visibility: 'public',
            user_prompt_template: 'Provide your input here',
            example_input: { text: 'Example input' },
            example_output: { text: 'Example output' }
        }
    }).filter(Boolean)

    const { data: insertedForkPrompts, error: forkError } = await supabase
        .from('prompts')
        .upsert(forkPromptsToInsert, {
            onConflict: 'workspace_id,slug',
            ignoreDuplicates: false
        })
        .select('id, slug')

    if (forkError) {
        console.error('Error inserting fork prompts:', forkError)
        process.exit(1)
    }

    console.log(`✅ Inserted ${forkPrompts.length} fork prompts`)

    return {
        totalPrompts: pinnedPrompts.length + forkPrompts.length,
        pinnedCount: pinnedPrompts.length,
        forkCount: forkPrompts.length
    }
}

async function main() {
    console.log('🚀 Starting database seed...\n')

    try {
        const { userId, workspaceId, problems } = await seedProblems()
        const promptStats = await seedPrompts(userId, workspaceId, problems)

        console.log('\n✨ Seed completed successfully!')
        console.log('\n📊 Summary:')
        console.log(`   Problems: ${problems.length}`)
        console.log(`   Prompts: ${promptStats.totalPrompts}`)
        console.log(`   - Pinned: ${promptStats.pinnedCount}`)
        console.log(`   - Forks: ${promptStats.forkCount}`)
    } catch (error) {
        console.error('\n❌ Seed failed:', error)
        process.exit(1)
    }
}

main()
