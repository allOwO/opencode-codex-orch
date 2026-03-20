# opencode-codex-orch

> Lean GPT-optimized fork of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent).  
> Sisyphus prompt rewritten based on [OpenAI Codex CLI](https://github.com/openai/codex) `prompt.md`.

## What changed

```diff
- 38+ hooks   → 11 hooks (error recovery, fallback, injectors, guards)
- 16+ tools   → leaner toolset (restored ast_grep_search; removed call-oco-agent, interactive-bash, look-at, skill-mcp)
- 9 agents    → 8 agents (removed Hephaestus)
- ~2000 line Sisyphus prompt → ~180 line Codex-style prompt
- 388 files changed, 41,610 deletions
```

### Kept

- `ultrawork` / `ulw`
- Delegation 6-section protocol
- Verification loop (lsp_diagnostics + tests + build)
- Explore / Librarian parallel background agents
- Explicit skill loading through `skill(name="...")`
- Hashline edit (LINE#ID content hash)
- LSP tools (rename, diagnostics, goto_definition, find_references)
- Session manager
- Background task (parallel sub-agents)
- Model fallback

## New in this fork

- Built-in `skill-creator` skill for creating and refining `SKILL.md`-based skills
- New CLI helpers for the local skill workflow:
  - `bunx opencode-codex-orch validate-skill <skill-dir>`
  - `bunx opencode-codex-orch eval-skill <skill-dir> --eval-file <path>`
  - `bunx opencode-codex-orch grade-skill-eval <report.json>`
- Official examples and docs under `docs/examples/skill-creator/` and `docs/guide/skill-creator-evals.md`

### Removed

- 33 hooks (todo-continuation-enforcer, think-mode, anthropic-*, session-notification, comment-checker, ralph-loop, etc.)
- 4 tools (call-oco-agent, interactive-bash, look-at, skill-mcp)
- Hephaestus agent
- Gemini / Anthropic prompt patches

## Install

OpenCode only supports plugin entries as npm package names or `file://` paths. It does not natively load GitHub repo specs like `github:user/repo`.

Use this fork by package name once you publish it to npm/GitHub Packages:

```json
{
  "plugin": ["opencode-codex-orch@latest"]
}
```

Bare package name also works and resolves to the same npm `latest` dist-tag.

For local development, keep using a file reference:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-codex-orch/dist/index.js"]
}
```

CLI package name after publish:

```bash
bunx opencode-codex-orch install
```

Config files same as upstream:
- Project: `.opencode/opencode-codex-orch.json`
- User: `~/.config/opencode/opencode-codex-orch.json`

## Usage

```bash
opencode
# then type:
ulw fix the failing tests
```

`ulw` is a lightweight execution-bias prefix for Sisyphus in this fork: when it appears at the start of your message to Sisyphus, it raises model precision and nudges that turn toward more autonomous exploration and delegation.

To load the built-in skill explicitly:

```text
skill(name="skill-creator")
```

## Credits

Fork of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) by [@code-yeongyu](https://github.com/code-yeongyu).  
Prompt design referenced [OpenAI Codex CLI](https://github.com/openai/codex) `prompt.md`.

## License

[SUL-1.0](LICENSE.md)
