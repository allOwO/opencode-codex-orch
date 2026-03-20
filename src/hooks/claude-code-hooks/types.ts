export type ClaudeHookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Notification"
  | "SessionStart"
  | "Stop"

export interface HookDefinition {
  type: string
  command?: string
  [key: string]: unknown
}

export interface HookMatcher {
  matcher: string
  hooks: HookDefinition[]
}

export type ClaudeHooksConfig = Partial<Record<ClaudeHookEvent, HookMatcher[]>>

export interface PluginConfig {
  disabledHooks?: boolean | ClaudeHookEvent[]
}
