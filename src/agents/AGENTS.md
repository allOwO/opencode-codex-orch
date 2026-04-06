# src/agents/ — Active Agent Definitions (opencode-codex-orch)

**Generated:** 2026-03-06

## OVERVIEW

Agent factories following `createXXXAgent(model) → AgentConfig` pattern. Each has static `mode` property. Built via `buildAgent()` compositing factory + categories + skills.

## AGENT INVENTORY

| Agent | Model | Temp | Mode | Fallback Chain | Purpose |
|-------|-------|------|------|----------------|---------|
| **Sisyphus** | gpt-5.4 xhigh | 0.1 | all | k2p5 → glm-5 | Main orchestrator, plans + delegates |
| **Oracle** | glm-5 | 0.1 | subagent | k2p5 | Read-only consultation |
| **Librarian** |  k2p5 | 0.1 | subagent | doubao-seed-2.0-code → gemini-3-flash | External docs/code search |
| **Explore** | doubao-seed-2.0-code | 0.1 | subagent | doubao-seed-2.0-code → gemini-3-flash | Contextual grep |
| **Momus** | k2p5 | 0.1 | subagent | glm-5 | Plan reviewer |
| **Sisyphus-Junior** | gpt-5.4 xhigh |  0.1 | all | user-configurable | Category-spawned executor |

## TOOL RESTRICTIONS

| Agent | Denied Tools |
|-------|-------------|
| Oracle | write, edit, task, call_oco_agent |
| Librarian | write, edit, task, call_oco_agent |
| Explore | write, edit, task, call_oco_agent |
| Momus | write, edit, task |

## STRUCTURE

```
agents/
├── sisyphus.ts            # Main orchestrator (GPT-5.4 + Gemini + Codex-style prompt)
├── oracle.ts              # Read-only consultant
├── librarian.ts           # External search
├── explore.ts             # Codebase grep
├── momus.ts               # Plan review
├── types.ts               # AgentFactory, AgentMode
├── agent-builder.ts       # buildAgent() composition
├── utils.ts               # Agent utilities
├── builtin-agents.ts      # createBuiltinAgents() registry
└── builtin-agents/        # maybeCreateXXXConfig conditional factories
    ├── sisyphus-agent.ts
    ├── general-agents.ts  # collectPendingBuiltinAgents
    └── available-skills.ts
```

## FACTORY PATTERN

```typescript
const createXXXAgent: AgentFactory = (model: string) => ({
  instructions: "...",
  model,
  temperature: 0.1,
  // ...config
})
createXXXAgent.mode = "subagent" // or "primary" or "all"
```

Model resolution: 4-step: override → category-default → provider-fallback → system-default. Defined in `shared/model-requirements.ts`.

## MODES

- **primary**: Respects UI-selected model, uses fallback chain
- **subagent**: Uses own fallback chain, ignores UI selection
- **all**: Available in both contexts (Sisyphus-Junior)
