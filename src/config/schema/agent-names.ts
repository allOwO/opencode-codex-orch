import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "orchestrator",
  "oracle",
  "librarian",
  "explore",
  "deepsearch",
  "quicktask",
  "reviewer",
  "executor",
])

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "frontend-ui-ux",
  "git-commit",
  "git-rebase",
  "git-search",
  "skill-creator",
])

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "orchestrator",
  "deepsearch",
  "quicktask",
  "executor",
  "OpenCode-Builder",
  "reviewer",
  "oracle",
  "librarian",
  "explore",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
