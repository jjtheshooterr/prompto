export interface ProblemInput {
  name: string
  description: string
  required: boolean
}

export interface ProblemConstraint {
  rule: string
  severity?: 'hard' | 'soft'
}

export interface ProblemSuccessCriterion {
  criterion: string
  description?: string
}

export interface ProblemMember {
  id: string
  problem_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
}

export interface Problem {
  id: string
  title: string
  description: string
  goal?: string
  inputs?: ProblemInput[]
  constraints?: ProblemConstraint[]
  success_criteria?: ProblemSuccessCriterion[]
  tags?: string[]
  industry: string
  visibility: 'public' | 'unlisted' | 'private'
  slug: string
  is_listed: boolean
  is_hidden: boolean
  is_deleted?: boolean
  deleted_at?: string
  deleted_by?: string
  created_by: string
  owner_id: string
  workspace_id?: string
  created_at: string
  updated_at: string
}