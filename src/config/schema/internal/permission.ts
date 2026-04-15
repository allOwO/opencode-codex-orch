import { z } from "zod"

export const PermissionValueSchema = z.enum(["ask", "allow", "deny"])
export type PermissionValue = z.infer<typeof PermissionValueSchema>

const BashPermissionSchema = z.union([
  PermissionValueSchema,
  z.record(z.string(), PermissionValueSchema),
])

export const AgentPermissionSchema = z.object({
  edit: PermissionValueSchema.optional(),
  bash: BashPermissionSchema.optional(),
  webfetch: PermissionValueSchema.optional(),
  task: PermissionValueSchema.optional(),
  external_directory: PermissionValueSchema.optional(),
}).strict()

export type AgentPermission = z.infer<typeof AgentPermissionSchema>
