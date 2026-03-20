# opencode-codex-orch

> Multi-agent orchestration plugin for [OpenCode](https://opencode.ai). Multiple models, multiple agents, one coordinated team.

## What it does

opencode-codex-orch turns a single AI agent session into a coordinated development team. Sisyphus orchestrates, specialized agents handle research, planning, code search, and execution in parallel across multiple model providers.

**Key capabilities:**

- **Multi-agent orchestration** with 10 specialized agents (Sisyphus, Atlas, Oracle, Prometheus, Librarian, Explore, Metis, Momus, Multimodal-Looker, Sisyphus-Junior)
- **Multi-model routing** across Claude, GPT, Kimi, Gemini, GLM and more
- **`ultrawork` / `ulw`** prefix for autonomous, execution-biased operation
- **Hash-anchored edits** (`LINE#ID` content hashing) for reliable file modifications
- **Background agents** running 5+ tasks in parallel
- **Built-in MCPs** (web search, Context7, Grep.app)
- **LSP + AST-Grep** for IDE-level precision
- **Skill system** with embedded per-skill MCP servers
- **13 lifecycle hooks** for error recovery, model fallback, context injection, etc.

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

Prompt design referenced [OpenAI Codex CLI](https://github.com/openai/codex) `prompt.md`. Hash-anchored editing inspired by [oh-my-pi](https://github.com/can1357/oh-my-pi).

## License

[SUL-1.0](LICENSE.md)
