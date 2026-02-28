import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const userId = '8ef93276-ac37-4068-b426-d7ebafaddaaa'

function escapeSql(str: string): string {
  if (!str) return 'NULL'
  return "'" + str.replace(/'/g, "''") + "'"
}

// Helper to append to file
function appendToFile(filename: string, content: string) {
  fs.appendFileSync(path.join(__dirname, filename), content)
}

function generateSql() {
  // Clear files
  fs.writeFileSync(path.join(__dirname, 'seed_1_problems.sql'), '-- Seeding Problems\n')
  fs.writeFileSync(path.join(__dirname, 'seed_2_prompts_pinned.sql'), '-- Seeding Prompts (Pinned)\n')
  fs.writeFileSync(path.join(__dirname, 'seed_3_prompts_forks.sql'), '-- Seeding Prompts (Forks)\n')

  console.log('Generating seed_1_problems.sql...')
  const problemsPath = path.join(__dirname, '../seed-data/problems.csv')
  const problemsCsv = fs.readFileSync(problemsPath, 'utf-8')
  const problemRows: any[] = parse(problemsCsv, { columns: true, skip_empty_lines: true })

  for (const row of problemRows) {
    const slug = escapeSql(row.slug)
    const title = escapeSql(row.title)
    const desc = escapeSql(row.summary)
    const industry = escapeSql(row.domain)
    const difficulty = escapeSql(row.difficulty) // assuming difficulty column exists and matches enum/text

    // Using ON CONFLICT logic
    appendToFile('seed_1_problems.sql', `
INSERT INTO problems (slug, title, description, industry, difficulty, created_by, is_public, tags)
VALUES (${slug}, ${title}, ${desc}, ${industry}, ${difficulty}, '${userId}', true, ARRAY[${industry}, ${difficulty}])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;
`)
  }

  console.log('Generating seed_2_prompts_pinned.sql...')
  const promptsPath = path.join(__dirname, '../seed-data/prompts.csv')
  const promptsCsv = fs.readFileSync(promptsPath, 'utf-8')
  const promptRows: any[] = parse(promptsCsv, { columns: true, skip_empty_lines: true })

  // First pass: Pinned prompts
  const pinnedPrompts = promptRows.filter((r: any) => r.is_pinned === 'true')
  for (const row of pinnedPrompts) {
    const slug = escapeSql(row.slug)
    const title = escapeSql(row.title)
    const system_prompt = escapeSql(row.system_prompt)
    const problem_slug = escapeSql(row.problem_slug)
    const model = escapeSql(row.model || 'gpt-4')

    appendToFile('seed_2_prompts_pinned.sql', `
INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, is_public, user_template, example_input, example_output)
VALUES (
  ${slug}, 
  ${title}, 
  ${system_prompt}, 
  (SELECT id FROM problems WHERE slug = ${problem_slug}), 
  '${userId}', 
  ${model}, 
  true, 
  'Provide your input here', 
  'Example input', 
  'Example output'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model;
`)
  }

  console.log('Generating seed_3_prompts_forks.sql...')
  // Second pass: Fork prompts
  const forkPrompts = promptRows.filter((r: any) => r.is_pinned === 'false')
  for (const row of forkPrompts) {
    const slug = escapeSql(row.slug)
    const title = escapeSql(row.title)
    const system_prompt = escapeSql(row.system_prompt)
    const problem_slug = escapeSql(row.problem_slug)
    const parent_prompt_slug = escapeSql(row.parent_prompt_slug)
    const model = escapeSql(row.model || 'gpt-4')

    appendToFile('seed_3_prompts_forks.sql', `
INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, is_public, user_template, example_input, example_output)
VALUES (
  ${slug}, 
  ${title}, 
  ${system_prompt}, 
  (SELECT id FROM problems WHERE slug = ${problem_slug}), 
  (SELECT id FROM prompts WHERE slug = ${parent_prompt_slug}),
  '${userId}', 
  ${model}, 
  true, 
  'Provide your input here', 
  'Example input', 
  'Example output'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = ${parent_prompt_slug});
`)
  }
}

generateSql()
