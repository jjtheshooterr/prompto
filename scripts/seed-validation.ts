import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { allValidationProblems } from './seed-validation-problems'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generate a URL-safe slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100) // Limit length
}

/**
 * Map industry names to valid schema values
 */
function mapIndustry(industry: string): string {
  const industryMap: Record<string, string> = {
    'Financial': 'finance',
    'Support': 'support',
    'API/Dev': 'dev',
    'Content': 'content',
    'Development': 'dev'
  }
  return industryMap[industry] || 'dev'
}

async function seedValidationProblems() {
  console.log('🚀 Starting validation problems seed...\n')
  console.log(`📦 Found ${allValidationProblems.length} problems to seed\n`)

  try {
    // Get the first workspace to use for seeding
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .limit(1)
      .single()

    if (workspaceError || !workspace) {
      console.error('❌ Failed to get workspace:', workspaceError)
      console.error('   Make sure you have at least one workspace in the database')
      process.exit(1)
    }

    const workspaceId = workspace.id
    const userId = workspace.owner_id

    console.log(`✓ Using workspace: ${workspaceId}`)
    console.log(`✓ Using user: ${userId}\n`)

    console.log('📝 Inserting problems into database...')

    // Insert problems one at a time without tags field
    let successCount = 0
    const insertedProblems: any[] = []

    for (const problem of allValidationProblems) {
      const slug = generateSlug(problem.title)
      const industry = mapIndustry(problem.industry)

      const problemData = {
        workspace_id: workspaceId,
        owner_id: userId,
        slug,
        title: problem.title,
        description: problem.description,
        industry,
        created_by: userId,
        visibility: 'public',
        is_listed: true
      }

      const { data, error } = await supabase
        .from('problems')
        .insert(problemData)
        .select('id, slug, title')

      if (error) {
        console.log(`⚠️  Insert failed for "${problem.title.substring(0, 50)}...": ${error.message}`)
        // If insert fails (likely duplicate), try update
        const { data: updateData, error: updateError } = await supabase
          .from('problems')
          .update({
            title: problem.title,
            description: problem.description,
            industry,
            updated_at: new Date().toISOString()
          })
          .eq('workspace_id', workspaceId)
          .eq('slug', slug)
          .select('id, slug, title')

        if (updateError) {
          console.error(`❌ Update also failed: ${updateError.message}`)
          continue
        }

        if (updateData && updateData.length > 0) {
          insertedProblems.push(updateData[0])
          successCount++
          console.log(`✓ Updated: ${problem.title.substring(0, 50)}...`)
        }
      } else if (data && data.length > 0) {
        insertedProblems.push(data[0])
        successCount++
        console.log(`✓ Inserted: ${problem.title.substring(0, 50)}...`)
      } else {
        console.log(`⚠️  No data returned for "${problem.title.substring(0, 50)}..."`)
      }
    }

    console.log(`\n✅ Inserted/updated ${successCount} problems\n`)

    // Now insert example prompts for each problem
    console.log('📝 Inserting example prompts...')

    let totalPrompts = 0
    const problemMap = new Map(insertedProblems.map(p => [p.slug, p.id]))

    for (const problem of allValidationProblems) {
      const problemSlug = generateSlug(problem.title)
      const problemId = problemMap.get(problemSlug)

      if (!problemId) {
        console.warn(`⚠️  Warning: Problem not found for slug: ${problemSlug}`)
        continue
      }

      // Insert example prompts for this problem
      const promptsToInsert = problem.example_prompts.map((examplePrompt, index) => ({
        workspace_id: workspaceId,
        slug: `${problemSlug}-example-${index + 1}`,
        title: examplePrompt.title,
        system_prompt: examplePrompt.system_prompt || '',
        user_prompt_template: examplePrompt.user_prompt_template,
        problem_id: problemId,
        created_by: userId,
        model: 'gpt-4',
        visibility: 'public',
        example_input: { text: 'Example input' },
        example_output: { text: 'Example output' },
        notes: examplePrompt.notes || ''
      }))

      const { data: insertedPrompts, error: promptError } = await supabase
        .from('prompts')
        .insert(promptsToInsert)
        .select('id')

      if (promptError) {
        console.error(`❌ Error inserting prompts for problem "${problem.title}":`, promptError)
        continue
      }

      totalPrompts += insertedPrompts?.length || 0
    }

    console.log(`✅ Inserted ${totalPrompts} example prompts\n`)

    // Summary
    console.log('✨ Seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   Problems: ${successCount}`)
    console.log(`   Example Prompts: ${totalPrompts}`)
    console.log(`\n🎯 Next step: Visit /problems to verify all problems appear`)

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

seedValidationProblems()
