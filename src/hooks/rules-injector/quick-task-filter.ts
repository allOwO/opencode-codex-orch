import { getSessionAgent } from "../../features/claude-code-session-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"

function isQuickTaskSession(sessionID: string): boolean {
  const sessionAgent = getSessionAgent(sessionID)
  return getAgentConfigKey(sessionAgent ?? "").toLowerCase() === "quicktask"
}

export function shouldSkipRuleForQuickTask(input: {
  sessionID: string
  rulePath: string
}): boolean {
  if (!isQuickTaskSession(input.sessionID)) return false

  const normalizedPath = input.rulePath.replaceAll("\\", "/").toLowerCase()
  return normalizedPath.includes("/superpowers/") || normalizedPath.includes("everyoneclaudecode")
}
