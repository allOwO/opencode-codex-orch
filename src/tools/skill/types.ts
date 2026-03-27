import type { SkillScope, LoadedSkill } from "../../features/opencode-skill-loader/types"
import type { SkillMcpManager } from "../../features/skill-mcp-manager"
import type { CommandInfo } from "../slashcommand/types"

export interface SkillArgs {
  name: string
  user_message?: string
}

export interface SkillInfo {
  name: string
  description: string
  location?: string
  scope: SkillScope
  license?: string
  compatibility?: string
  metadata?: Record<string, string>
  allowedTools?: string[]
}

export interface SkillLoadOptions {
  /** When true, only load from OpenCode paths (.opencode/skills/, ~/.config/opencode/skills/) */
  opencodeOnly?: boolean
  /** Pre-merged skills to use instead of discovering */
  skills?: LoadedSkill[]
  /** Dynamic skill resolver used when skill availability can change after tool creation */
  getSkills?: () => Promise<LoadedSkill[]>
  /** Pre-discovered commands to use instead of discovering */
  commands?: CommandInfo[]
  /** Dynamic command resolver used when command availability can change after tool creation */
  getCommands?: () => CommandInfo[]
  /** Cache key for invalidating generated descriptions when dynamic sources change */
  getCacheKey?: () => string
  /** MCP manager for querying skill-embedded MCP servers */
  mcpManager?: SkillMcpManager
  /** Session ID getter for MCP client identification */
  getSessionID?: () => string
  disabledSkills?: Set<string>
  /** Include Claude marketplace plugin commands in discovery (default: true) */
  pluginsEnabled?: boolean
  /** Override plugin enablement from Claude settings by plugin key */
  enabledPluginsOverride?: Record<string, boolean>
}
