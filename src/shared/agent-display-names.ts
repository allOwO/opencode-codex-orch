export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  orchestrator: "Orchestrator",
  reviewer: "Reviewer",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  deepsearch: "DeepSearch",
  prometheus: "Prometheus (Plan Builder)",
  atlas: "Atlas (Plan Executor)",
  metis: "Metis (Plan Consultant)",
  "multimodal-looker": "multimodal-looker",
  executor: "Executor",
  build: "build",
}

const LEGACY_AGENT_DISPLAY_NAMES: Record<string, string> = {
  sisyphus: "Orchestrator",
  momus: "Reviewer",
  "sisyphus-junior": "Executor",
}

/**
 * Get display name for an agent config key.
 * Uses case-insensitive lookup for backward compatibility.
 * Returns original key if not found.
 */
export function getAgentDisplayName(configKey: string): string {
  // Try exact match first
  const exactMatch = AGENT_DISPLAY_NAMES[configKey]
  if (exactMatch !== undefined) return exactMatch

  const legacyExactMatch = LEGACY_AGENT_DISPLAY_NAMES[configKey]
  if (legacyExactMatch !== undefined) return legacyExactMatch

  // Fall back to case-insensitive search
  const lowerKey = configKey.toLowerCase()
  for (const [k, v] of Object.entries(AGENT_DISPLAY_NAMES)) {
    if (k.toLowerCase() === lowerKey) return v
  }
  for (const [k, v] of Object.entries(LEGACY_AGENT_DISPLAY_NAMES)) {
    if (k.toLowerCase() === lowerKey) return v
  }

  // Unknown agent: return original key
  return configKey
}

const REVERSE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_DISPLAY_NAMES).map(([key, displayName]) => [displayName.toLowerCase(), key]),
)

const LEGACY_NAME_ALIASES: Record<string, string> = {
  sisyphus: "orchestrator",
  "sisyphus (ultraworker)": "orchestrator",
  momus: "reviewer",
  "momus (plan critic)": "reviewer",
  "momus (plan reviewer)": "reviewer",
  "sisyphus-junior": "executor",
}

/**
 * Resolve an agent name (display name or config key) to its lowercase config key.
 * "Atlas (Plan Executor)" → "atlas", "atlas" → "atlas", "unknown" → "unknown"
 */
export function getAgentConfigKey(agentName: string): string {
  const lower = agentName.toLowerCase()
  const legacyAlias = LEGACY_NAME_ALIASES[lower]
  if (legacyAlias !== undefined) return legacyAlias
  const reversed = REVERSE_DISPLAY_NAMES[lower]
  if (reversed !== undefined) return reversed
  if (AGENT_DISPLAY_NAMES[lower] !== undefined) return lower
  return lower
}
