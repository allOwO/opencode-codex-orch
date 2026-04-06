import { z } from "zod"

export const BuiltinCommandNameSchema = z.enum([
  "handoff",
  "init-deep",
  "refactor",
  "skill-creator",
  "stop-continuation",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
