import { z } from "zod"

export const BuiltinCommandNameSchema = z.enum([
  "handoff",
  "init-deep",
  "ralph-loop",
  "ulw-loop",
  "cancel-ralph",
  "refactor",
  "skill-creator",
  "start-work",
  "stop-continuation",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
