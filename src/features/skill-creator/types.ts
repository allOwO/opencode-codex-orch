export interface SkillEvalExpectations {
  skill_invoked?: boolean
  tools_any?: string[]
  tools_all?: string[]
  tools_none?: string[]
  assistant_contains?: string[]
  assistant_not_contains?: string[]
  transcript_contains?: string[]
  transcript_not_contains?: string[]
}

export interface SkillEvalCase {
  id: string
  prompt: string
  files?: string[]
  expectations?: SkillEvalExpectations
}

export interface SkillEvalSuite {
  skill_name?: string
  evals: SkillEvalCase[]
}

export interface SkillValidationIssue {
  code: string
  message: string
  path?: string
  severity: "error" | "warning"
}

export interface SkillValidationReport {
  valid: boolean
  skillDir: string
  skillFilePath: string
  skillName?: string
  evalFilePath?: string
  issues: SkillValidationIssue[]
}

export interface SkillEvalCaseRun {
  case_id: string
  prompt: string
  files: string[]
  expectations?: SkillEvalExpectations
  session_id: string
  exit_code: number
  success: boolean
  duration_ms: number
  message_count: number
  summary: string
  assistant_text: string
  transcript_text: string
  tool_names: string[]
  skill_invoked: boolean
  workspace_dir?: string
}

export interface SkillEvalRunReport {
  generated_at: string
  skill_name: string
  skill_path: string
  eval_file_path: string
  agent: string
  timeout_ms?: number
  cases: SkillEvalCaseRun[]
}

export interface SkillEvalCheck {
  name: string
  passed: boolean
  details: string
}

export interface SkillEvalCaseGrade {
  case_id: string
  passed: boolean
  checks: SkillEvalCheck[]
}

export interface SkillEvalGradeReport {
  graded_at: string
  skill_name: string
  source_report: string
  passed: number
  failed: number
  total: number
  cases: SkillEvalCaseGrade[]
}
