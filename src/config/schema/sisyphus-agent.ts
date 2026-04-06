import { z } from "zod"

export const SisyphusAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
})

export const OrchestratorAgentConfigSchema = SisyphusAgentConfigSchema

export type SisyphusAgentConfig = z.infer<typeof SisyphusAgentConfigSchema>
export type OrchestratorAgentConfig = z.infer<typeof OrchestratorAgentConfigSchema>
