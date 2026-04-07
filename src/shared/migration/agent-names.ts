export const AGENT_NAME_MAP: Record<string, string> = {
  omo: "orchestrator",
  orchestrator: "orchestrator",
  "omo-plan": "prometheus",
  "oco-plan": "prometheus",
  "prometheus (planner)": "prometheus",
  prometheus: "prometheus",
  "atlas (plan executor)": "atlas",
  atlas: "atlas",
  "plan-consultant": "metis",
  "metis (plan consultant)": "metis",
  metis: "metis",
  reviewer: "reviewer",
  executor: "executor",
  build: "build",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  deepsearch: "deepsearch",
}

for (const [key, value] of Object.entries({ ...AGENT_NAME_MAP })) {
  AGENT_NAME_MAP[key.toLowerCase()] = value
}

export const BUILTIN_AGENT_NAMES = new Set([
  "orchestrator",
  "reviewer",
  "oracle",
  "librarian",
  "explore",
  "deepsearch",
  "build",
  "executor",
])

export function migrateAgentNames(
  agents: Record<string, unknown>
): { migrated: Record<string, unknown>; changed: boolean } {
  const migrated: Record<string, unknown> = {}
  let changed = false

  for (const [key, value] of Object.entries(agents)) {
    const newKey = AGENT_NAME_MAP[key.toLowerCase()] ?? AGENT_NAME_MAP[key] ?? key
    if (newKey !== key) {
      changed = true
    }
    migrated[newKey] = value
  }

  return { migrated, changed }
}
