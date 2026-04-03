# opencode-codex-orch

> Multi-agent orchestration plugin for [OpenCode](https://opencode.ai). Multiple models, multiple agents, one coordinated team.

## Origin

This project is derived from [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) (omo) and its slim variant oh-my-opencode-slim (omo-slim). It has been **purpose-built for OpenAI Codex**: all Anthropic/Claude-specific logic, prompts, and model routing have been stripped out, leaving a lean, GPT/Codex-focused orchestration core.

On top of the slim foundation, this fork adds several practical skills and fork-specific workflows (see [Built-in skills](#built-in-skills) and [Fork-specific skills](#fork-specific-skills) below).

## What it does

opencode-codex-orch turns a single AI agent session into a coordinated development team. Sisyphus orchestrates, specialized agents handle research, planning, code search, and execution in parallel across multiple model providers.

**Key capabilities:**

- **Multi-agent orchestration** with 10 specialized agents (Sisyphus, Atlas, Oracle, Prometheus, Librarian, Explore, Metis, Momus, Multimodal-Looker, Sisyphus-Junior)
- **Multi-model routing** across GPT, Kimi, Gemini, GLM and more — **no Claude/Anthropic dependencies**
- **`ultrawork` / `ulw`** prefix for autonomous, execution-biased operation
- **Built-in slash commands** like `/autopilot`, `/refactor`, and `/handoff`
- **Hash-anchored edits** (`LINE#ID` content hashing) for reliable file modifications
- **Background agents** running 5+ tasks in parallel
- **Built-in MCPs** (web search, Context7, Grep.app)
- **LSP + AST-Grep** for IDE-level precision
- **Skill system** with embedded per-skill MCP servers
- **13 lifecycle hooks** for error recovery, model fallback, context injection, etc.

### Built-in skills

The plugin ships with these built-in skills:

- **playwright** / **agent-browser** — browser automation, page inspection, screenshots, and web testing (provider-dependent)
- **dev-browser** — persistent browser workflows for navigation, extraction, and app testing
- **frontend-ui-ux** — broad UI/UX design skill for visually strong frontend work, including restrained, brand-forward landing pages and consumer UI *(GPT-optimized prompt)*
- **fast-implementation** — spec-disciplined workflow for low-risk small and medium implementation tasks with minimal diffs, requirement locks, and explicit escalation boundaries
- **git-commit / git-rebase / git-search** — git workflow skills covering atomic commits, history rewriting, and code archaeology *(GPT-optimized; split from the old monolithic git-master to save ~85% tokens per invocation)*
- **skill-creator** — create and refine reusable `SKILL.md`-based skills for this plugin

### Fork-specific skills

These skills were added specifically for this fork:

- **github-triage** — unified GitHub issue & PR triage with background-task parallelism, fork-aware review lens
- **merge-upstream** — guided upstream merge workflow that preserves fork identity, slim architecture, and Codex-first design decisions

## Install

Add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-codex-orch@latest"]
}
```

For local development:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-codex-orch/dist/index.js"]
}
```

Interactive setup:

```bash
bunx opencode-codex-orch install
```

### Config files

- Project: `.opencode/opencode-codex-orch.json`
- User: `~/.config/opencode/opencode-codex-orch.json`

## Usage

```bash
opencode
# then type:
ulw fix the failing tests
```

`ulw` triggers autonomous execution mode. The agent explores, plans, implements, and verifies on its own.

## Documentation

- [Overview](docs/guide/overview.md)
- [Installation Guide](docs/guide/installation.md)
- [Orchestration Guide](docs/guide/orchestration.md)
- [Agent-Model Matching](docs/guide/agent-model-matching.md)
- [Configuration Reference](docs/reference/configuration.md)
- [Features Reference](docs/reference/features.md)

## Credits

Derived from [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) (omo) and oh-my-opencode-slim (omo-slim). Prompt design referenced [OpenAI Codex CLI](https://github.com/openai/codex) `prompt.md`. Hash-anchored editing inspired by [oh-my-pi](https://github.com/can1357/oh-my-pi).

## License

[SUL-1.0](LICENSE.md)
