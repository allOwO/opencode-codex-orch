import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "sisyphus",
  "prometheus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
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
  "sisyphus",
  "sisyphus-junior",
  "OpenCode-Builder",
  "prometheus",
  "metis",
  "momus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "atlas",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
