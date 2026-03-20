import type { AgentPromptMetadata } from "./types"

export interface AvailableAgent {
  name: string
  description: string
  metadata: AgentPromptMetadata
}

export interface AvailableTool {
  name: string
  category: "lsp" | "ast" | "search" | "session" | "command" | "other"
}

export interface AvailableSkill {
  name: string
  description: string
  location: "user" | "project" | "plugin"
}

export interface AvailableCategory {
  name: string
  description: string
  model?: string
}

export function categorizeTools(toolNames: string[]): AvailableTool[] {
  return toolNames.map((name) => {
    let category: AvailableTool["category"] = "other"
    if (name.startsWith("lsp_")) {
      category = "lsp"
    } else if (name.startsWith("ast_grep")) {
      category = "ast"
    } else if (name === "grep" || name === "glob") {
      category = "search"
    } else if (name.startsWith("session_")) {
      category = "session"
    } else if (name === "skill") {
      category = "command"
    }
    return { name, category }
  })
}

function formatToolsForPrompt(tools: AvailableTool[]): string {
  const lspTools = tools.filter((t) => t.category === "lsp")
  const astTools = tools.filter((t) => t.category === "ast")
  const searchTools = tools.filter((t) => t.category === "search")

  const parts: string[] = []

  if (searchTools.length > 0) {
    parts.push(...searchTools.map((t) => `\`${t.name}\``))
  }

  if (lspTools.length > 0) {
    parts.push("`lsp_*`")
  }

  if (astTools.length > 0) {
    parts.push("`ast_grep`")
  }

  return parts.join(", ")
}

function hasAgent(agents: AvailableAgent[], name: string): boolean {
  return agents.some((agent) => agent.name === name)
}

export function buildSearchGuidance(tools: AvailableTool[] = []): string {
  const searchTools = tools
    .filter((tool) => tool.category === "search")
    .map((tool) => `\`${tool.name}\``)
  const hasLspTools = tools.some((tool) => tool.category === "lsp")
  const availableSearch = [...searchTools, ...(hasLspTools ? ["`lsp_*`"] : [])]

  if (availableSearch.length === 0) {
    return "Use repo-native search tools first, then read known files directly"
  }

  return `Use repo-native search first (${availableSearch.join(", ")}), then read known files directly`
}

export function buildDefaultResearchFlow(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return "**Default flow**: explore/librarian (background) + tools → oracle (if required)"
  }

  if (hasExplore) {
    return "**Default flow**: explore (background) + repo-native tools → oracle (if required)"
  }

  if (hasLibrarian) {
    return "**Default flow**: librarian (background) + repo-native tools → oracle (if required)"
  }

  return "**Default flow**: repo-native tools → oracle (if required)"
}

export function buildExplorationParallelGuidance(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return "Parallelize EVERYTHING independent. Fire 2-5 explore/librarian agents (always `run_in_background=true`) for any non-trivial codebase question."
  }

  if (hasExplore) {
    return "Parallelize EVERYTHING independent. Fire 2-5 explore agents (always `run_in_background=true`) for non-trivial repo discovery."
  }

  if (hasLibrarian) {
    return "Parallelize EVERYTHING independent. Use librarian (always `run_in_background=true`) for external docs/code questions, and use repo-native tools for repo discovery."
  }

  return "Parallelize EVERYTHING independent. Use repo-native tools aggressively for discovery when no research agents are available."
}

export function buildResearchDelegationThresholds(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return "- need to discover files, symbols, or patterns first → `explore`\n- unfamiliar or version-sensitive library/API behavior → `librarian`"
  }

  if (hasExplore) {
    return "- need to discover files, symbols, or patterns first → `explore`\n- library/API uncertainty without external research support → use repo-native tools first and avoid guessing"
  }

  if (hasLibrarian) {
    return "- need repo discovery first → use repo-native tools\n- unfamiliar or version-sensitive library/API behavior → `librarian`"
  }

  return "- need to discover files, symbols, or patterns first → use repo-native tools\n- library/API uncertainty without research agents → rely on available repo context and avoid guessing"
}

export function buildResearchAnswerRouting(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return "explore/librarian → synthesize → answer"
  }

  if (hasExplore) {
    return "explore + repo-native tools → synthesize → answer"
  }

  if (hasLibrarian) {
    return "librarian + repo-native tools → synthesize → answer"
  }

  return "repo-native tools → synthesize → answer"
}

export function buildInvestigationRouting(agents: AvailableAgent[]): string {
  return hasAgent(agents, "explore")
    ? "explore → report findings"
    : "repo-native tools → report findings"
}

export function buildResearchToolUsageRules(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return "- Explore/Librarian = background research. ALWAYS `run_in_background=true`, ALWAYS parallel\n- Fire 2-5 explore/librarian agents in parallel for any non-trivial codebase question"
  }

  if (hasExplore) {
    return "- Explore = background repo research. ALWAYS `run_in_background=true`, ALWAYS parallel\n- Fire 2-5 explore agents in parallel for non-trivial repo discovery; use repo-native tools for the rest"
  }

  if (hasLibrarian) {
    return "- Librarian = background external research. ALWAYS `run_in_background=true`; use repo-native tools for repo discovery\n- Fire librarian proactively for library/docs questions, but keep direct repo inspection in tools"
  }

  return "- No research agents available. Use repo-native tools in parallel for discovery and avoid guessing from memory"
}

export function buildBackgroundResearchExamples(agents: AvailableAgent[]): string {
  const hasExplore = hasAgent(agents, "explore")
  const hasLibrarian = hasAgent(agents, "librarian")

  if (hasExplore && hasLibrarian) {
    return `**Research agents = background grep, not consultants.**


~~~typescript
// CORRECT: Always background, always parallel.
task(subagent_type="explore", run_in_background=true, load_skills=[], description="Find auth patterns", prompt="[CONTEXT] Adding JWT auth in src/api/routes/. [GOAL] Match existing middleware and token-flow conventions. [DOWNSTREAM] Use findings to choose middleware structure and validation flow. [REQUEST] Find auth middleware, login/signup handlers, token generation, and credential validation. Focus on src/, skip tests, return file paths with pattern summaries.")
task(subagent_type="librarian", run_in_background=true, load_skills=[], description="Find JWT security guidance", prompt="[CONTEXT] Implementing JWT auth and choosing token storage plus expiration policy. [GOAL] Get current production security guidance. [DOWNSTREAM] Use findings to choose storage, lifetime, and refresh strategy. [REQUEST] Find OWASP guidance, token lifetime recommendations, refresh rotation strategies, and common JWT vulnerabilities. Skip tutorials, return concise production-focused recommendations.")

// WRONG: Never block on explore/librarian.
result = task(..., run_in_background=false)
~~~
`
  }

  if (hasExplore) {
    return `**Explore = background repo grep. Use repo-native tools for anything outside the repo.**


~~~typescript
// CORRECT: Use explore in background for repo discovery.
task(subagent_type="explore", run_in_background=true, load_skills=[], description="Find auth patterns", prompt="[CONTEXT] Adding JWT auth in src/api/routes/. [GOAL] Match existing middleware and token-flow conventions. [DOWNSTREAM] Use findings to choose middleware structure and validation flow. [REQUEST] Find auth middleware, login/signup handlers, token generation, and credential validation. Focus on src/, skip tests, return file paths with pattern summaries.")

// WRONG: Never block on explore.
result = task(..., run_in_background=false)
~~~
`
  }

  if (hasLibrarian) {
    return `**Librarian = background external research. Use repo-native tools for repo discovery.**


~~~typescript
// CORRECT: Use librarian in background for external docs/code guidance.
task(subagent_type="librarian", run_in_background=true, load_skills=[], description="Find JWT security guidance", prompt="[CONTEXT] Implementing JWT auth and choosing token storage plus expiration policy. [GOAL] Get current production security guidance. [DOWNSTREAM] Use findings to choose storage, lifetime, and refresh strategy. [REQUEST] Find OWASP guidance, token lifetime recommendations, refresh rotation strategies, and common JWT vulnerabilities. Skip tutorials, return concise production-focused recommendations.")

// WRONG: Use repo-native tools, not librarian, for files you can inspect directly.
~~~
`
  }

  return "**No research agents are available. Use repo-native tools directly and parallelize reads/searches aggressively.**"
}

export function buildKeyTriggersSection(agents: AvailableAgent[], _skills: AvailableSkill[] = []): string {
  const keyTriggers = agents
    .filter((a) => a.metadata.keyTrigger)
    .map((a) => `- ${a.metadata.keyTrigger}`)

  if (keyTriggers.length === 0) return ""

  return `### Key Triggers (check BEFORE classification):

${keyTriggers.join("\n")}
- **"Look into" + "create PR"** → Not just research. Full implementation cycle expected.`
}

export function buildToolSelectionTable(
  agents: AvailableAgent[],
  tools: AvailableTool[] = [],
  _skills: AvailableSkill[] = []
): string {
  const rows: string[] = [
    "### Tool & Agent Selection:",
    "",
  ]

  if (tools.length > 0) {
    const toolsDisplay = formatToolsForPrompt(tools)
    rows.push(`- ${toolsDisplay} — **FREE** — Not Complex, Scope Clear, No Implicit Assumptions`)
  }

  const costOrder = { FREE: 0, CHEAP: 1, EXPENSIVE: 2 }
  const sortedAgents = [...agents]
    .filter((a) => a.metadata.category !== "utility")
    .sort((a, b) => costOrder[a.metadata.cost] - costOrder[b.metadata.cost])

  for (const agent of sortedAgents) {
    const shortDesc = agent.description.split(".")[0] || agent.description
    rows.push(`- \`${agent.name}\` agent — **${agent.metadata.cost}** — ${shortDesc}`)
  }

  rows.push("")
  rows.push(buildDefaultResearchFlow(agents))

  return rows.join("\n")
}

export function buildExploreSection(agents: AvailableAgent[]): string {
  const exploreAgent = agents.find((a) => a.name === "explore")
  if (!exploreAgent) return ""

  const useWhen = exploreAgent.metadata.useWhen || []
  const avoidWhen = exploreAgent.metadata.avoidWhen || []

  return `### Explore Agent = Contextual Grep

Use it as a **peer tool**, not a fallback. Fire liberally for discovery, not for files you already know.

**Use Direct Tools when:**
${avoidWhen.map((w) => `- ${w}`).join("\n")}

**Use Explore Agent when:**
${useWhen.map((w) => `- ${w}`).join("\n")}`
}

export function buildLibrarianSection(agents: AvailableAgent[]): string {
  const librarianAgent = agents.find((a) => a.name === "librarian")
  if (!librarianAgent) return ""

  const useWhen = librarianAgent.metadata.useWhen || []

  return `### Librarian Agent = Reference Grep

Search **external references** (docs, OSS, web). Fire proactively when unfamiliar libraries are involved.

**Contextual Grep (Internal)** — search OUR codebase, find patterns in THIS repo, project-specific logic.
**Reference Grep (External)** — search EXTERNAL resources, official API docs, library best practices, OSS implementation examples.

**Trigger phrases** (fire librarian immediately):
${useWhen.map((w) => `- "${w}"`).join("\n")}`
}

export function buildDelegationTable(agents: AvailableAgent[]): string {
  const rows: string[] = [
    "### Delegation Table:",
    "",
  ]

  for (const agent of agents) {
    for (const trigger of agent.metadata.triggers) {
      rows.push(`- **${trigger.domain}** → \`${agent.name}\` — ${trigger.trigger}`)
    }
  }

  return rows.join("\n")
}


export function buildCategorySkillsDelegationGuide(categories: AvailableCategory[], skills: AvailableSkill[]): string {
  if (categories.length === 0 && skills.length === 0) return ""

  const categoryRows = categories.map((c) => {
    const desc = c.description || c.name
    return `- \`${c.name}\` — ${desc}`
  })

  const builtinSkills = skills.filter((s) => s.location === "plugin")
  const customSkills = skills.filter((s) => s.location !== "plugin")

  const builtinNames = builtinSkills.map((s) => s.name).join(", ")
  const customNames = customSkills.map((s) => {
    const source = s.location === "project" ? "project" : "user"
    return `${s.name} (${source})`
  }).join(", ")

  let skillsSection: string

  if (customSkills.length > 0 && builtinSkills.length > 0) {
    skillsSection = `#### Available Skills (via \`skill\` tool)

**Built-in**: ${builtinNames}
**⚡ YOUR SKILLS (PRIORITY)**: ${customNames}

> User-installed skills OVERRIDE built-in defaults. ALWAYS prefer YOUR SKILLS when domain matches.
> Full skill descriptions → use the \`skill\` tool to check before EVERY delegation.`
  } else if (customSkills.length > 0) {
    skillsSection = `#### Available Skills (via \`skill\` tool)

**⚡ YOUR SKILLS (PRIORITY)**: ${customNames}

> User-installed skills OVERRIDE built-in defaults. ALWAYS prefer YOUR SKILLS when domain matches.
> Full skill descriptions → use the \`skill\` tool to check before EVERY delegation.`
  } else if (builtinSkills.length > 0) {
    skillsSection = `#### Available Skills (via \`skill\` tool)

**Built-in**: ${builtinNames}

> Full skill descriptions → use the \`skill\` tool to check before EVERY delegation.`
  } else {
    skillsSection = ""
  }

  return `### Category + Skills Delegation

#### Available Categories

${categoryRows.join("\n")}

${skillsSection}

### Selection Protocol (MANDATORY)

1. Match the task domain to the best category.
2. Check the \`skill\` tool and evaluate ALL skills for overlap.
3. INCLUDE every relevant skill in \`load_skills=[...]\`; omit only non-overlapping skills.
${customSkills.length > 0 ? `4. **User-installed skills get PRIORITY.** When in doubt, INCLUDE rather than omit.` : ""}

### Delegation Pattern

\`task(category="[selected-category]", load_skills=["skill-1", "skill-2"], prompt="...")\`

### Category Domain Matching (ZERO TOLERANCE)

**VISUAL WORK = ALWAYS \`visual-engineering\`. NO EXCEPTIONS.**

Any task involving UI, UX, CSS, styling, layout, animation, design, or frontend components MUST go to \`visual-engineering\`. Never delegate visual work to \`quick\` or any other category.

| Task Domain | MUST Use Category |
|---|---|
| UI, styling, animations, layout, design | \`visual-engineering\` |
| Hard logic, architecture decisions, algorithms | \`deep\` |
| Autonomous research + end-to-end implementation | \`deep\` |
| Single-file typo, trivial config change | \`quick\` |

**When in doubt about category, it is almost never \`quick\`. Match the domain.**`
}

export function buildOracleSection(agents: AvailableAgent[]): string {
  const oracleAgent = agents.find((a) => a.name === "oracle")
  if (!oracleAgent) return ""

  const useWhen = oracleAgent.metadata.useWhen || []
  const avoidWhen = oracleAgent.metadata.avoidWhen || []

  return `<Oracle_Usage>
## Oracle — Read-Only High-IQ Consultant

Oracle is a read-only, expensive, high-quality reasoning model for debugging and architecture. Consultation only.

### WHEN to Consult (Oracle FIRST, then implement):

${useWhen.map((w) => `- ${w}`).join("\n")}

### WHEN NOT to Consult:

${avoidWhen.map((w) => `- ${w}`).join("\n")}

### Usage Pattern:
Briefly announce "Consulting Oracle for [reason]" before invocation.

**Exception**: This is the ONLY case where you announce before acting. For all other work, start immediately without status updates.

### Oracle Background Task Policy:

**Collect Oracle results before your final answer. No exceptions.**

- Oracle takes minutes. When done with your own work: **end your response** — wait for the \`<system-reminder>\`.
- Do NOT poll \`background_output\` on a running Oracle. The notification will come.
- Never cancel Oracle.
</Oracle_Usage>`
}

export function buildHardBlocksSection(): string {
  const blocks = [
    "- Type error suppression (`as any`, `@ts-ignore`) — **Never**",
    "- Commit without explicit request — **Never**",
    "- Speculate about unread code — **Never**",
    "- Leave code in broken state after failures — **Never**",
    "- `background_cancel(all=true)` — **Never.** Always cancel individually by taskId.",
    "- Delivering final answer before collecting Oracle result — **Never.**",
  ]

  return `## Hard Blocks (NEVER violate)

${blocks.join("\n")}`
}

export function buildAntiPatternsSection(): string {
  const patterns = [
    "- **Type Safety**: `as any`, `@ts-ignore`, `@ts-expect-error`",
    "- **Error Handling**: Empty catch blocks `catch(e) {}`",
    "- **Testing**: Deleting failing tests to \"pass\"",
    "- **Search**: Firing agents for single-line typos or obvious syntax errors",
    "- **Debugging**: Shotgun debugging, random changes",
    "- **Background Tasks**: Polling `background_output` on running tasks — end response and wait for notification",
    "- **Oracle**: Delivering answer without collecting Oracle results",
  ]

  return `## Anti-Patterns (BLOCKING violations)

${patterns.join("\n")}`
}

export function buildToolCallFormatSection(): string {
  return `## Tool Call Format (CRITICAL)

**ALWAYS use the native tool calling mechanism. NEVER output tool calls as text.**

When you need to call a tool:
1. Use the tool call interface provided by the system
2. Do NOT write tool calls as plain text like \`assistant to=functions.XXX\`
3. Do NOT output JSON directly in your text response
4. The system handles tool call formatting automatically

**CORRECT**: Invoke the tool through the tool call interface
**WRONG**: Writing \`assistant to=functions.todowrite\` or \`json\n{...}\` as text

Your tool calls are processed automatically. Just invoke the tool - do not format the call yourself.`
}

export function buildNonClaudePlannerSection(model: string, agents: AvailableAgent[] = []): string {
  const isNonClaude = !model.toLowerCase().includes('claude')
  if (!isNonClaude || !hasAgent(agents, "plan")) return ""

  return `### Plan Agent Dependency (Non-Claude)

Multi-step task? **ALWAYS consult Plan Agent first.** Do NOT start implementation without a plan.

- Single-file fix or trivial change → proceed directly
- Anything else (2+ steps, unclear scope, architecture) → \`task(subagent_type="plan", ...)\` FIRST
- Use \`session_id\` to resume the same Plan Agent — ask follow-up questions aggressively
- If ANY part of the task is ambiguous, ask Plan Agent before guessing

Plan Agent returns a structured work breakdown with parallel execution opportunities. Follow it.`
}

export function buildParallelDelegationSection(model: string, categories: AvailableCategory[]): string {
  const isNonClaude = !model.toLowerCase().includes('claude')
  const hasDelegationCategory = categories.some(c => c.name === 'deep')

  if (!isNonClaude || !hasDelegationCategory) return ""

  return `### DECOMPOSE AND DELEGATE — YOU ARE NOT AN IMPLEMENTER

**YOUR FAILURE MODE:** doing implementation yourself instead of decomposing and delegating.

For ANY implementation task:
1. **ALWAYS decompose** the work into independent units.
2. **ALWAYS delegate** EACH unit to a \`deep\` agent in parallel (\`run_in_background=true\`).
3. **NEVER work sequentially.** If 4 independent units exist, spawn 4 agents.
4. **NEVER implement directly** when delegation is possible.

Each delegation prompt must include GOAL + success criteria, file paths + constraints, existing patterns to follow, and a clear scope boundary.

**Your value is orchestration, decomposition, and quality control.**`
}

export function buildUltraworkSection(
  agents: AvailableAgent[],
  categories: AvailableCategory[],
  skills: AvailableSkill[]
): string {
  const lines: string[] = []

  if (categories.length > 0) {
    lines.push("**Categories** (for implementation tasks):")
    for (const cat of categories) {
      const shortDesc = cat.description || cat.name
      lines.push(`- \`${cat.name}\`: ${shortDesc}`)
    }
    lines.push("")
  }

  if (skills.length > 0) {
    const builtinSkills = skills.filter((s) => s.location === "plugin")
    const customSkills = skills.filter((s) => s.location !== "plugin")

    if (builtinSkills.length > 0) {
      lines.push("**Built-in Skills** (combine with categories):")
      for (const skill of builtinSkills) {
        const shortDesc = skill.description.split(".")[0] || skill.description
        lines.push(`- \`${skill.name}\`: ${shortDesc}`)
      }
      lines.push("")
    }

    if (customSkills.length > 0) {
      lines.push("**User-Installed Skills** (HIGH PRIORITY - user installed these for their workflow):")
      for (const skill of customSkills) {
        const shortDesc = skill.description.split(".")[0] || skill.description
        lines.push(`- \`${skill.name}\`: ${shortDesc}`)
      }
      lines.push("")
    }
  }

  if (agents.length > 0) {
    const ultraworkAgentPriority = ["explore", "librarian", "plan", "oracle"]
    const sortedAgents = [...agents].sort((a, b) => {
      const aIdx = ultraworkAgentPriority.indexOf(a.name)
      const bIdx = ultraworkAgentPriority.indexOf(b.name)
      if (aIdx === -1 && bIdx === -1) return 0
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })

    lines.push("**Agents** (for specialized consultation/exploration):")
    for (const agent of sortedAgents) {
      const shortDesc = agent.description.length > 120 ? `${agent.description.slice(0, 120)}...` : agent.description
      const suffix = agent.name === "explore" || agent.name === "librarian" ? " (multiple)" : ""
      lines.push(`- \`${agent.name}${suffix}\`: ${shortDesc}`)
    }
  }

  return lines.join("\n")
}
