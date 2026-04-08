import { z } from "zod"

export const LspServerConfigSchema = z.object({
  /** Whether this LSP server is disabled */
  disabled: z.boolean().optional(),
  /** Command to launch the LSP server */
  command: z.array(z.string()).optional(),
  /** File extensions this server handles */
  extensions: z.array(z.string()).optional(),
  /** Priority for server selection (higher wins) */
  priority: z.number().optional(),
  /** Environment variables for the server process */
  env: z.record(z.string(), z.string()).optional(),
  /** Initialization options passed to the server */
  initialization: z.record(z.string(), z.unknown()).optional(),
})

export const LspConfigSchema = z.record(z.string(), LspServerConfigSchema)

export type LspServerConfig = z.infer<typeof LspServerConfigSchema>
export type LspConfig = z.infer<typeof LspConfigSchema>
