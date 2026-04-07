import { z } from "zod"

export const OrchestratorTasksConfigSchema = z.object({
  /** Absolute or relative storage path override. When set, bypasses global config dir. */
  storage_path: z.string().optional(),
  /** Force task list ID (alternative to env ULTRAWORK_TASK_LIST_ID) */
  task_list_id: z.string().optional(),
  /** Enable Claude Code path compatibility mode */
  claude_code_compat: z.boolean().default(false),
})

export const OrchestratorConfigSchema = z.object({
  tasks: OrchestratorTasksConfigSchema.optional(),
})

export type OrchestratorTasksConfig = z.infer<typeof OrchestratorTasksConfigSchema>
export type OrchestratorConfig = z.infer<typeof OrchestratorConfigSchema>
