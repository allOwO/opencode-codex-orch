# src/agents/ — Active Agent Definitions (opencode-codex-orch)

**Generated:** 2026-03-06

## OVERVIEW

Agent factories following `createXXXAgent(model) → AgentConfig` pattern. Each has static `mode` property. Built via `buildAgent()` compositing factory + categories + skills.

## CURRENT USER-FACING SURFACE

- The OpenCode picker is intended to expose only **Orchestrator** and **DeepSearch** as primary selectable agents.
- **DeepSearch** is treated as a primary picker-visible agent and should use `mode: "primary"` so OpenCode surfaces it alongside Orchestrator.
- Other builtin agents such as **Executor**, **Reviewer**, **oracle**, **librarian**, and **explore** remain available for internal orchestration and delegation, but are not meant to appear as top-level picker choices.
- Picker hiding is enforced downstream in `src/plugin-handlers/agent-config-handler.ts`, where non-primary builtin agents are marked `hidden: true` while staying available for runtime permissions and delegation.

## AGENT INVENTORY

| Agent         | Model            | Temp | Mode     | Fallback Chain                     | Purpose                          |
| ------------- | ---------------- | ---- | -------- | ---------------------------------- | -------------------------------- |
| **Orchestrator** | gpt-5.4 xhigh | 0.1  | all      | k2p5 → glm-5                       | Main orchestrator, plans + delegates |
| **DeepSearch** | gpt-5.4 high | 0.2  | primary  | gpt-5.4 → gemini-3.1-pro → claude-opus-4-6 | Deep research orchestrator, picker-visible |
| **Oracle**    | glm-5            | 0.1  | subagent | k2p5                               | Read-only consultation           |
| **Librarian** | k2p5             | 0.1  | subagent | doubao-seed-2.0-code → gemini-3-flash | External docs/code search    |
| **Explore**   | doubao-seed-2.0-code | 0.1 | subagent | doubao-seed-2.0-code → gemini-3-flash | Contextual grep              |
| **Reviewer**  | k2p5             | 0.1  | subagent | glm-5                              | Plan reviewer                    |
| **Executor**  | gpt-5.4 xhigh    | 0.1  | all      | user-configurable                  | Category-spawned executor        |

## TOOL RESTRICTIONS

| Agent      | Denied Tools                                    |
| ---------- | ----------------------------------------------- |
| Oracle     | write, edit, task, call_oco_agent               |
| Librarian  | write, edit, task, call_oco_agent               |
| Explore    | write, edit, task, call_oco_agent               |
| Reviewer   | write, edit, task                               |

## STRUCTURE

```
agents/
├── orchestrator/           # Main orchestrator (GPT-5.4 + Gemini + Codex-style prompt)
│   ├── gpt-5-4.ts
│   ├── gemini.ts
│   └── index.ts
├── oracle.ts               # Read-only consultant
├── librarian.ts            # External search
├── explore.ts              # Codebase grep
├── reviewer.ts             # Plan review
├── executor/               # Category-spawned executor
│   ├── default.ts
│   ├── gpt-5-4.ts
│   ├── gpt-5-3-codex.ts
│   ├── gemini.ts
│   ├── kimi.ts
│   └── agent.ts
├── types.ts                # AgentFactory, AgentMode
├── agent-builder.ts        # buildAgent() composition
├── utils.ts                # Agent utilities
├── builtin-agents.ts       # createBuiltinAgents() registry
└── builtin-agents/         # maybeCreateXXXConfig conditional factories
    ├── orchestrator-agent.ts # Orchestrator config support
    └── general-agents.ts   # collectPendingBuiltinAgents
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
- **all**: Available in both contexts (Executor)
