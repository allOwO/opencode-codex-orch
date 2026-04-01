import type { CommandDefinition } from "../claude-code-command-loader"

export type BuiltinCommandName = "autopilot" | "init-deep" | "ralph-loop" | "cancel-ralph" | "ulw-loop" | "refactor" | "skill-creator" | "start-work" | "stop-continuation" | "handoff"

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[]
}

export type BuiltinCommands = Record<string, CommandDefinition>
