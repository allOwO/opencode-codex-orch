export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  orchestrator: "Orchestrator",
  reviewer: "Reviewer",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  deepsearch: "DeepSearch",
  executor: "Executor",
  build: "build",
}

export function getAgentDisplayName(configKey: string): string {
  const exactMatch = AGENT_DISPLAY_NAMES[configKey]
  if (exactMatch !== undefined) return exactMatch

  const lowerKey = configKey.toLowerCase()
  for (const [key, value] of Object.entries(AGENT_DISPLAY_NAMES)) {
    if (key.toLowerCase() === lowerKey) return value
  }

  return configKey
}

export function getAgentConfigKey(agentName: string): string {
  const lower = agentName.toLowerCase()
  const reverse = Object.entries(AGENT_DISPLAY_NAMES).find(([, value]) => value.toLowerCase() === lower)
  return reverse?.[0] ?? lower
}
