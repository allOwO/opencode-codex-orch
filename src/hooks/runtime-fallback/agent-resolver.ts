import { getSessionAgent } from "../../features/claude-code-session-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"

export const CANONICAL_AGENT_NAMES = [
  "orchestrator",
  "reviewer",
  "oracle",
  "librarian",
  "explore",
  "deepsearch",
  "executor",
] as const

const RUNTIME_AGENT_PATTERNS = [...CANONICAL_AGENT_NAMES, "build", "plan"]

export const agentPattern = new RegExp(
  `\\b(${RUNTIME_AGENT_PATTERNS
    .sort((a, b) => b.length - a.length)
    .map((a) => a.replace(/-/g, "\\-"))
    .join("|")})\\b`,
  "i",
)

export function detectAgentFromSession(sessionID: string): string | undefined {
  const match = sessionID.match(agentPattern)
  if (match) {
    return normalizeAgentName(match[1])
  }
  return undefined
}

export function normalizeAgentName(agent: string | undefined): string | undefined {
  if (!agent) return undefined
  const normalized = getAgentConfigKey(agent).toLowerCase().trim()
  if (RUNTIME_AGENT_PATTERNS.includes(normalized as (typeof RUNTIME_AGENT_PATTERNS)[number])) {
    return normalized
  }
  return undefined
}

export function resolveAgentForSession(sessionID: string, eventAgent?: string): string | undefined {
  return (
    normalizeAgentName(eventAgent) ??
    normalizeAgentName(getSessionAgent(sessionID)) ??
    detectAgentFromSession(sessionID)
  )
}
