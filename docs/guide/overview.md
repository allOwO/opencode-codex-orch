# What Is opencode-codex-orch?

opencode-codex-orch is a multi-model agent orchestration harness for OpenCode. It transforms a single AI agent into a coordinated development team that actually ships code.

Not locked to Claude. Not locked to OpenAI. Not locked to anyone.

Just better results, cheaper models, real orchestration.

---

## Quick Start

### Installation

Paste this into your LLM agent session:

```
Install and configure opencode-codex-orch by following the instructions here:
https://raw.githubusercontent.com/allOwO/opencode-codex-orch/main/docs/guide/installation.md
```

Or read the full [Installation Guide](./installation.md) for manual setup, provider authentication, and troubleshooting.

### Your First Task

Once installed, just type your request:

```
fix the failing tests
```

That's it. The orchestrator figures everything out — explores your codebase, researches patterns, implements the feature, verifies with diagnostics, and keeps working until done.

Want more control? Use the planning workflow documented in the [Orchestration Guide](./orchestration.md), then run `/start-work` for structured execution.

---

## The Philosophy: Breaking Free

We used to call this "Claude Code on steroids." That was wrong.

This isn't about making Claude Code better. It's about breaking free from the idea that one model, one provider, one way of working is enough. Anthropic wants you locked in. OpenAI wants you locked in. Everyone wants you locked in.

opencode-codex-orch doesn't play that game. It orchestrates across models, picking the right brain for the right job. Claude for orchestration. GPT for deep reasoning. Gemini for frontend. Haiku for quick tasks. All working together, automatically.

---

## How It Works: Agent Orchestration

Instead of one agent doing everything, opencode-codex-orch uses **specialized agents that delegate to each other** based on task type.

**The Architecture:**

```
User Request
    ↓
[Intent Gate] — Classifies what you actually want
    ↓
[Orchestrator] — Main agent, plans and delegates
    ↓
    ├─→ [Reviewer] — Plan / implementation review
    ├─→ [Oracle] — Architecture consultation
    ├─→ [Librarian] — Documentation/code search
    ├─→ [Explore] — Fast codebase grep
    ├─→ [DeepSearch] — Deep research orchestration
    └─→ [Category-based agents] — Specialized by task type
```

When the orchestrator delegates to a subagent, it doesn't pick a model name. It picks a **category** — `designer`, `hard`, or `quick`. The category automatically maps to the right model. You touch nothing.

For a deep dive into how agents collaborate, see the [Orchestration System Guide](./orchestration.md).

---

## Meet the Agents

### Orchestrator: The Discipline Agent

Named after the Greek myth. He rolls the boulder every day. Never stops. Never gives up.

The orchestrator is your main agent. It plans, delegates to specialists, and drives tasks to completion with aggressive parallel execution. It doesn't stop halfway. It doesn't get distracted. It finishes.

**Recommended models:**

- **Claude Opus 4.6** — Best overall experience. The orchestrator was built with Claude-optimized prompts.
- **Claude Sonnet 4.6** — Good balance of capability and cost.
- **Kimi K2.5** — Great Claude-like alternative. Many users run this combo exclusively.
- **GLM 5** — Solid option, especially via Z.ai.

The orchestrator still works best on Claude-family models, Kimi, and GLM. GPT-5.4 now has a dedicated prompt path for the places that benefit from GPT reasoning, but this fork no longer routes through a separate deep-worker persona.

### GPT-heavy execution without a separate agent

When you need deeper GPT-style reasoning, the fork now leans on GPT-specialized categories, Executor variants, Oracle, and Reviewer instead of a dedicated deep-worker persona.

In practice that means you can stay on the orchestrator and let the delegation system pick GPT-backed specialists only when the task actually benefits from them.

**Why this beats vanilla Codex CLI:**

- **Multi-model orchestration.** Pure Codex is single-model. opencode-codex-orch routes different tasks to different models automatically. GPT for deep reasoning. Gemini for frontend. Haiku for speed. The right brain for the right job.
- **Background agents.** Fire 5+ agents in parallel. Something Codex simply cannot do. While one agent writes code, another researches patterns, another checks documentation. Like a real dev team.
- **Category system.** Tasks are routed by intent, not model name. `designer` gets Gemini. `hard` gets GPT-heavy reasoning. `quick` gets Haiku. No manual juggling.
- **Accumulated wisdom.** Subagents learn from previous results. Conventions discovered in task 1 are passed to task 5. Mistakes made early aren't repeated. The system gets smarter as it works.

### Reviewer: The Critic

Reviewer validates plans and implementations against clarity, verifiability, and completeness. Use it when you want a strong second opinion before execution or merge.

### Oracle: The Consultant

Read-only high-IQ consultant for architecture decisions and complex debugging. Consult Oracle when facing unfamiliar patterns, security concerns, or multi-system tradeoffs.

### Supporting Cast

- **DeepSearch** — Research orchestrator for comparative analysis and structured reports.
- **Explore** — Fast codebase grep. Uses speed-focused models for pattern discovery.
- **Librarian** — Documentation and OSS code search. Stays current on library APIs and best practices.

---

## Working Modes

### Direct Orchestration

Just ask for the work directly. The orchestrator can explore the codebase, research patterns, implement the change, verify it, and keep going until the job is done.

### Planned Execution

For larger tasks, write or review a plan first, then run `/start-work`. Progress tracks via `.opencode` state and `docs/superpowers/plans`.

---

## Agent Model Matching

Different agents work best with different models. opencode-codex-orch automatically assigns optimal models, but you can customize everything.

### Default Configuration

Models are auto-configured at install time. The interactive installer asks which providers you have, then generates optimal model assignments for each agent and category.

At runtime, fallback chains ensure work continues even if your preferred provider is down. Each agent has a provider priority chain. The system tries providers in order until it finds an available model.

### Custom Model Configuration

You can override specific agents or categories in your config:

```json
{
  "$schema": "https://raw.githubusercontent.com/allOwO/opencode-codex-orch/main/assets/opencode-codex-orch.schema.json",
  "agents": {
    "orchestrator": {
      "model": "kimi-for-coding/k2p5"
    },
    "librarian": { "model": "google/gemini-3-flash" },
    "explore": { "model": "github-copilot/grok-code-fast-1" },
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" }
  },
  "categories": {
    "designer": {
      "model": "google/gemini-3.1-pro",
      "variant": "high"
    },
    "hard": { "model": "openai/gpt-5.4", "variant": "high" },
    "quick": { "model": "anthropic/claude-haiku-4-5" },
    "designer": { "model": "google/gemini-3.1-pro", "variant": "high" }
  }
}
```

### Model Families

**Claude-like models** (instruction-following, structured output):

- Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5
- Kimi K2.5 — behaves very similarly to Claude
- GLM 5 — Claude-like behavior, good for broad tasks

**GPT models** (explicit reasoning, principle-driven):

- GPT-5.3-codex — deep coding powerhouse, used by GPT-heavy categories and executors
- GPT-5.4 — high intelligence, default for Oracle
- GPT-5-Nano — ultra-cheap, fast utility tasks

**Different-behavior models**:

- Gemini 3 Pro — excels at visual/frontend tasks
- MiniMax M2.5 — fast and smart for utility tasks
- Grok Code Fast 1 — optimized for code grep/search

See the [Agent-Model Matching Guide](./agent-model-matching.md) for complete details on which models work best for each agent, safe vs dangerous overrides, and provider priority chains.

---

## Why It's Better Than Pure Claude Code

Claude Code is good. But it's a single agent running a single model doing everything alone.

opencode-codex-orch turns that into a coordinated team:

**Parallel execution.** Claude Code processes one thing at a time. opencode-codex-orch fires background agents in parallel — research, implementation, and verification happening simultaneously. Like having 5 engineers instead of 1.

**Hash-anchored edits.** Claude Code's edit tool fails when the model can't reproduce lines exactly. opencode-codex-orch's `LINE#ID` content hashing validates every edit before applying. Grok Code Fast 1 went from 6.7% to 68.3% success rate just from this change.

**Intent Gate.** Claude Code takes your prompt and runs. opencode-codex-orch classifies your true intent first — research, implementation, investigation, fix — then routes accordingly. Fewer misinterpretations, better results.

**LSP + AST tools.** Workspace-level rename, go-to-definition, find-references, pre-build diagnostics, AST-aware code rewrites. IDE precision that vanilla Claude Code doesn't have.

**Skills with embedded MCPs.** Each skill brings its own MCP servers, scoped to the task. Context window stays clean instead of bloating with every tool.

**Discipline enforcement.** Todo enforcer yanks idle agents back to work. Comment checker strips AI slop. The system doesn't let the agent slack off.

**The fundamental advantage.** Models have different temperaments. Claude thinks deeply. GPT reasons architecturally. Gemini visualizes. Haiku moves fast. Single-model tools force you to pick one personality for all tasks. opencode-codex-orch leverages them all, routing by task type. This isn't a temporary hack — it's the only architecture that makes sense as models specialize further. The gap between multi-model orchestration and single-model limitation widens every month. We're betting on that future.

---

## The Intent Gate

Before acting on any request, the orchestrator classifies your true intent.

Are you asking for research? Implementation? Investigation? A fix? The Intent Gate figures out what you actually want, not just the literal words you typed. This means the agent understands context, nuance, and the real goal behind your request.

Claude Code doesn't have this. It takes your prompt and runs. opencode-codex-orch thinks first, then acts.

---

## What's Next

- **[Installation Guide](./installation.md)** — Complete setup instructions, provider authentication, and troubleshooting
- **[Orchestration Guide](./orchestration.md)** — Deep dive into agent collaboration, canonical planning, and execution flow
- **[Agent-Model Matching Guide](./agent-model-matching.md)** — Which models work best for each agent and how to customize
- **[Configuration Reference](../reference/configuration.md)** — Full config options with examples
- **[Features Reference](../reference/features.md)** — Complete feature documentation
- **[Manifesto](../manifesto.md)** — Philosophy behind the project

---

**Ready to start?** Ask for the work directly and see what a coordinated AI team can do.
