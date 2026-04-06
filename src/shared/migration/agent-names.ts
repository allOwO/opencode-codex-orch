export const AGENT_NAME_MAP: Record<string, string> = {
  // Sisyphus variants → orchestrator
  omo: "orchestrator",
  sisyphus: "orchestrator",
  orchestrator: "orchestrator",

  // Planner / reviewer variants
  "omo-plan": "prometheus",
  "oco-plan": "prometheus",
  "planner-sisyphus": "prometheus",
  "prometheus (planner)": "prometheus",
  prometheus: "prometheus",

  // Removed executor variants
  "orchestrator-sisyphus": "atlas",
  "atlas (plan executor)": "atlas",
  atlas: "atlas",

  // Removed consultant variants
  "plan-consultant": "metis",
  "metis (plan consultant)": "metis",
  metis: "metis",

  // Momus variants → reviewer
  "momus (plan reviewer)": "reviewer",
  "momus (plan critic)": "reviewer",
  momus: "reviewer",
  reviewer: "reviewer",

  // Executor variants
  "sisyphus-junior": "executor",
  executor: "executor",

  // Other kept agents
  build: "build",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  deepsearch: "deepsearch",
  "multimodal-looker": "librarian",
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
