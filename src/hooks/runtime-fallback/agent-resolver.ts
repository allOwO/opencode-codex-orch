import { getSessionAgent } from "../../features/claude-code-session-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"

export const AGENT_NAMES = [
  "orchestrator",
  "oracle",
  "librarian",
  "explore",
  "deepsearch",
  "reviewer",
  "executor",
  "build",
  "plan",
]

const LEGACY_RUNTIME_AGENT_ALIASES: Record<string, string> = {
  sisyphus: "orchestrator",
  "sisyphus (ultraworker)": "orchestrator",
  momus: "reviewer",
  "momus (plan critic)": "reviewer",
  "momus (plan reviewer)": "reviewer",
  "sisyphus-junior": "executor",
  "multimodal-looker": "librarian",
}

const RUNTIME_AGENT_PATTERNS = [...AGENT_NAMES, ...Object.keys(LEGACY_RUNTIME_AGENT_ALIASES)]

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
  const legacyAlias = LEGACY_RUNTIME_AGENT_ALIASES[normalized]
  const activeAgent = legacyAlias ?? normalized
  if (AGENT_NAMES.includes(activeAgent)) {
    return activeAgent
  }
  const match = activeAgent.match(agentPattern)
  if (match) {
    return match[1].toLowerCase()
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
