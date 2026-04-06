# Agent-Model Matching Guide

> **For agents and users**: Why each agent needs a specific model — and how to customize without breaking things.

## The Core Insight: Models Are Developers

Think of AI models as developers on a team. Each has a different brain, different personality, different strengths. **A model isn't just "smarter" or "dumber." It thinks differently.** Give the same instruction to Claude and GPT, and they'll interpret it in fundamentally different ways.

This isn't a bug. It's the foundation of the entire system.

opencode-codex-orch assigns each agent a model that matches its _working style_ — like building a team where each person is in the role that fits their personality.

### Orchestrator: The Sociable Lead

The orchestrator is the developer who knows everyone, goes everywhere, and gets things done through communication and coordination. Talks to other agents, understands context across the whole codebase, delegates work intelligently, and codes well too. But deep, purely technical problems? It will still lean on specialists.

**This is why the orchestrator uses Claude / Kimi / GLM.** These models excel at:

- Following complex, multi-step orchestration instructions
- Maintaining conversation flow across many tool calls
- Understanding nuanced delegation and orchestration patterns
- Producing well-structured, communicative output

Using the orchestrator with older GPT models would be like taking your best project manager and sticking them in a room alone to debug a race condition. Wrong fit. GPT support exists where useful, but GPT is still not the default recommendation for the orchestrator.

### GPT-heavy execution paths

This fork no longer ships a separate GPT-native deep-worker agent, but it still uses GPT-style reasoning where it fits best: GPT-heavy categories, Executor variants, Oracle, Reviewer, and DeepSearch.

**This is why GPT-5.3 Codex and GPT-5.4 still matter here:**

- Deep, autonomous exploration without hand-holding
- Multi-file reasoning across complex codebases
- Principle-driven execution (give a goal, not a recipe)
- Working independently for extended periods

Using those GPT-heavy execution paths with GLM or Kimi is sometimes acceptable, but you give up the principle-driven style they were tuned for.

### The Takeaway

Every agent's prompt is tuned to match its model's personality. **When you change the model, you change the brain — and the same instructions get understood completely differently.** Model matching isn't about "better" or "worse." It's about fit.

---

## How Claude and GPT Think Differently

This matters for understanding why some agents support both model families while others don't.

**Claude** responds to **mechanics-driven** prompts — detailed checklists, templates, step-by-step procedures. More rules = more compliance. You can write a 1,100-line prompt with nested workflows and Claude will follow every step.

**GPT** (especially 5.2+) responds to **principle-driven** prompts — concise principles, XML structure, explicit decision criteria. More rules = more contradiction surface = more drift. GPT works best when you state the goal and let it figure out the mechanics.

Real example: plan-oriented prompts can often be much shorter on GPT-family models than on Claude-family models while achieving the same outcome.

Agents that support both families auto-detect your model at runtime and switch prompt paths where necessary. You don't have to think about it.

---

## Agent Profiles

### Communicators → Claude / Kimi / GLM

These agents have Claude-optimized prompts — long, detailed, mechanics-driven. They need models that reliably follow complex, multi-layered instructions.

| Agent        | Role              | Fallback Chain                         | Notes                                                                                             |
| ------------ | ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Orchestrator** | Main orchestrator | Claude Opus → K2P5 → Kimi K2.5 → GPT-5.4 → GLM 5 → Big Pickle | Claude-family first. GPT-5.4 has dedicated prompt support. Kimi/GLM as intermediate fallbacks. |

### Review / research agents

These agents lean on GPT-style reasoning for verification and synthesis.

| Agent          | Role              | Fallback Chain                         | Notes                                                                |
| -------------- | ----------------- | -------------------------------------- | -------------------------------------------------------------------- |
| **Reviewer**   | Review / verification  | GPT-5.4 → Claude Opus → Gemini 3.1 Pro | Verifies plans and implementations. |
| **DeepSearch** | Research orchestration | GPT / Gemini / GLM multimodal fallbacks | Synthesizes broad research into reports. |

### GPT-Preferred Specialists

These agents are built for GPT's principle-driven style. Their prompts assume autonomous, goal-oriented execution. Don't override to Claude.

| Agent          | Role                    | Fallback Chain                         | Notes                                            |
| -------------- | ----------------------- | -------------------------------------- | ------------------------------------------------ |
| **Oracle**     | Architecture consultant | GPT-5.4 → Gemini 3.1 Pro → Claude Opus | Read-only high-IQ consultation.                  |
| **Reviewer**   | Ruthless reviewer       | GPT-5.4 → Claude Opus → Gemini 3.1 Pro | Verification and plan review.                    |

### Utility Runners → Speed over Intelligence

These agents do grep, search, and retrieval. They intentionally use the fastest, cheapest models available. **Don't "upgrade" them to Opus** — that's hiring a senior engineer to file paperwork.

| Agent                 | Role               | Fallback Chain                                 | Notes                                                 |
| --------------------- | ------------------ | ---------------------------------------------- | ----------------------------------------------------- |
| **Explore**           | Fast codebase grep | Grok Code Fast → MiniMax → Haiku → GPT-5-Nano  | Speed is everything. Fire 10 in parallel.             |
| **Librarian**         | Docs/code search   | Gemini Flash → MiniMax → Big Pickle            | Doc retrieval doesn't need deep reasoning.            |
| **DeepSearch**        | Research / multimodal synthesis | GPT-5.3 Codex → K2P5 → Gemini Flash → GLM-4.6v | Uses multimodal-capable fallbacks when needed. |

---

## Model Families

### Claude Family

Communicative, instruction-following, structured output. Best for agents that need to follow complex multi-step prompts.

| Model                 | Strengths                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| **Claude Opus 4.6**   | Best overall. Highest compliance with complex prompts. Default for the orchestrator. |
| **Claude Sonnet 4.6** | Faster, cheaper. Good balance for everyday tasks.                            |
| **Claude Haiku 4.5**  | Fast and cheap. Good for quick tasks and utility work.                       |
| **Kimi K2.5**         | Behaves very similarly to Claude. Great all-rounder at lower cost.           |
| **GLM 5**             | Claude-like behavior. Solid for orchestration tasks.                         |

### GPT Family

Principle-driven, explicit reasoning, deep technical capability. Best for agents that work autonomously on complex problems.

| Model             | Strengths                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **GPT-5.3 Codex** | Deep coding powerhouse. Autonomous exploration. Used by GPT-heavy task categories and executors. |
| **GPT-5.4**       | High intelligence, strategic reasoning. Default for Oracle.                                     |
| **GPT-5.4**       | Strong principle-driven reasoning. Default for Reviewer and a key fallback for research/review paths. |
| **GPT-5-Nano**    | Ultra-cheap, fast. Good for simple utility tasks.                                               |

### Other Models

| Model                | Strengths                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Gemini 3.1 Pro**   | Excels at visual/frontend tasks. Different reasoning style. Default for `designer`. |
| **Gemini 3 Flash**   | Fast. Good for doc search and light tasks.                                                                   |
| **Grok Code Fast 1** | Blazing fast code grep. Default for Explore agent.                                                           |
| **MiniMax M2.5**     | Fast and smart. Good for utility tasks and search/retrieval.                                                 |

### About Free-Tier Fallbacks

You may see model names like `kimi-k2.5-free`, `minimax-m2.5-free`, or `big-pickle` (GLM 4.6) in the source code or logs. These are free-tier versions of the same model families, served through the OpenCode Zen provider. They exist as lower-priority entries in fallback chains.

You don't need to configure them. The system includes them so it degrades gracefully when you don't have every paid subscription. If you have the paid version, the paid version is always preferred.

---

## Task Categories

When agents delegate work, they don't pick a model name — they pick a **category**. The category maps to the right model automatically.

| Category             | When Used                  | Fallback Chain                               |
| -------------------- | -------------------------- | -------------------------------------------- |
| `designer`           | Frontend, UI, CSS, design  | Gemini 3.1 Pro → GLM 5 → Claude Opus         |
| `hard`               | Maximum reasoning needed   | GPT-5.4 → Claude Opus → GLM 5 → K2P5         |
| `quick`              | Simple, fast tasks         | Claude Haiku → Gemini Flash → GPT-5-Nano     |

See the [Orchestration System Guide](./orchestration.md) for how agents dispatch tasks to categories.

---

## Customization

### Example Configuration

```json
{
  "$schema": "https://raw.githubusercontent.com/allOwO/opencode-codex-orch/main/assets/opencode-codex-orch.schema.json",
  "agents": {
    "orchestrator": {
      "model": "kimi-for-coding/k2p5"
    },
    "librarian": { "model": "google/gemini-3-flash" },
    "explore": { "model": "github-copilot/grok-code-fast-1" },
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" },
    "reviewer": {
      "prompt_append": "Review for clarity and verification."
    }
  },
  "categories": {
    "quick": { "model": "opencode/gpt-5-nano" },
    "hard": { "model": "openai/gpt-5.4", "variant": "high" },
    "designer": {
      "model": "google/gemini-3.1-pro",
      "variant": "high"
    }
  },
  "background_task": {
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 3,
      "opencode": 10,
      "zai-coding-plan": 10
    },
    "modelConcurrency": {
      "anthropic/claude-opus-4-6": 2,
      "opencode/gpt-5-nano": 20
    }
  }
}
```

Run `opencode models` to see available models, `opencode auth login` to authenticate providers.

### Safe vs Dangerous Overrides

**Safe** — same personality type:

- Orchestrator: Opus → Sonnet, Kimi K2.5, GLM 5 (all communicative models)
- Reviewer: GPT-5.4 → Claude Opus
- DeepSearch: GPT / Gemini / GLM multimodal-capable fallbacks

**Dangerous** — personality mismatch:

- Orchestrator → older GPT models: **Still a bad fit. Claude/Kimi/GLM remain the best default family.**
- GPT-heavy executor paths → Claude: **Possible, but you lose the intended Codex/GPT-style autonomy.**
- Explore → Opus: **Massive cost waste. Explore needs speed, not intelligence.**
- Librarian → Opus: **Same. Doc search doesn't need Opus-level reasoning.**

### How Model Resolution Works

Each agent has a fallback chain. The system tries models in priority order until it finds one available through your connected providers. You don't need to configure providers per model — just authenticate (`opencode auth login`) and the system figures out which models are available and where.

```
Agent Request → User Override (if configured) → Fallback Chain → System Default
```

---

## See Also

- [Installation Guide](./installation.md) — Setup and authentication
- [Orchestration System Guide](./orchestration.md) — How agents dispatch tasks to categories
- [Configuration Reference](../reference/configuration.md) — Full config options
- [`src/shared/model-requirements.ts`](../../src/shared/model-requirements.ts) — Source of truth for fallback chains
