import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "orchestrator",
  "sisyphus",
  "oracle",
  "librarian",
  "explore",
  "deepsearch",
  "reviewer",
  "momus",
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
  "sisyphus",
  "deepsearch",
  "executor",
  "sisyphus-junior",
  "OpenCode-Builder",
  "reviewer",
  "momus",
  "oracle",
  "librarian",
  "explore",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
