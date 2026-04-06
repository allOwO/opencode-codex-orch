import type { CommandDefinition } from "../claude-code-command-loader"

export type BuiltinCommandName = "autopilot" | "init-deep" | "refactor" | "skill-creator" | "stop-continuation" | "handoff"

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[]
}

export type BuiltinCommands = Record<string, CommandDefinition>
