# opencode-codex-orch — O P E N C O D E Plugin

**Generated:** 2026-03-10 | **Branch:** main

## OVERVIEW

GPT-optimized lean fork of oh-my-openagent. OpenCode plugin (npm: `opencode-codex-orch`) with multi-agent orchestration, 13 lifecycle hooks, ~18 tools, skill/command/MCP systems. Sisyphus prompt rewritten based on OpenAI Codex prompt.md.

## STRUCTURE

```
opencode-codex-orch/
├── src/
│   ├── index.ts              # Plugin entry: loadConfig → createManagers → createTools → createHooks → createPluginInterface
│   ├── plugin-config.ts      # JSON multi-level config: user → project → defaults (Zod v4)
│   ├── agents/               # 8 agents (Sisyphus, Oracle, Librarian, Explore, Atlas, Prometheus, Metis, Momus, Multimodal-Looker, Sisyphus-Junior)
│   ├── hooks/                # 13 hooks (error recovery, fallback, injectors, guards, truncator, hashline)
│   ├── tools/                # ~18 tools across 12 directories
│   ├── features/             # 19 feature modules (background-agent, skill-loader, tmux, MCP-OAuth, etc.)
│   ├── shared/               # 95+ utility files in 13 categories
│   ├── config/               # Zod v4 schema system (24 files)
│   ├── cli/                  # CLI: install, run, doctor, mcp-oauth (Commander.js)
│   ├── mcp/                  # 3 built-in remote MCPs (websearch, context7, grep_app)
│   ├── plugin/               # 9 OpenCode hook handlers + hook composition
│   └── plugin-handlers/      # 6-phase config loading pipeline
├── packages/                 # Monorepo: cli-runner, 11 platform binaries
└── .agents/                  # Skills: github-triage, merge-upstream
```

## INITIALIZATION FLOW

```
OpenCodeCodexOrchPlugin(ctx)
├─→ loadPluginConfig()         # JSON parse → project/user merge → Zod validate → migrate
  ├─→ createManagers()           # TmuxSessionManager, BackgroundManager, SkillMcpManager, ConfigHandler
  ├─→ createTools()              # SkillContext + AvailableCategories + ToolRegistry (~18 tools)
  ├─→ createHooks()              # 3-tier: Core + Continuation + Skill = 13 kept hooks + null shims
  └─→ createPluginInterface()    # 9 OpenCode hook handlers → PluginInterface
```

## 8 OPENCODE HOOK HANDLERS

| Handler | Purpose |
|---------|---------|
| `config` | 6-phase: provider → plugin-components → agents → tools → MCPs → commands |
| `tool` | ~18 registered tools |
| `chat.message` | First-message variant, session setup, keyword detection |
| `chat.params` | Anthropic effort level adjustment |
| `chat.headers` | Copilot x-initiator header injection |
| `event` | Session lifecycle (created, deleted, idle, error) |
| `tool.execute.before` | Pre-tool hooks (file guard, label truncator, rules injector) |
| `tool.execute.after` | Post-tool hooks (output truncation, metadata store) |
| `experimental.chat.messages.transform` | Context injection, thinking block validation |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent | `src/agents/` + `src/agents/builtin-agents/` | Follow createXXXAgent factory pattern |
| Add new hook | `src/hooks/{name}/` + register in `src/plugin/hooks/create-*-hooks.ts` | Match event type to tier |
| Add new tool | `src/tools/{name}/` + register in `src/plugin/tool-registry.ts` | Follow createXXXTool factory |
| Add new feature module | `src/features/{name}/` | Standalone module, wire in plugin/ |
| Add new MCP | `src/mcp/` + register in `createBuiltinMcps()` | Remote HTTP only |
| Add new skill | `src/features/builtin-skills/skills/` | Implement BuiltinSkill interface |
| Add new command | `src/features/builtin-commands/` | Template in templates/ |
| Add new CLI command | `src/cli/cli-program.ts` | Commander.js subcommand |
| Add new doctor check | `src/cli/doctor/checks/` | Register in checks/index.ts |
| Modify config schema | `src/config/schema/` + update root schema | Zod v4, add to OpenCodeCodexOrchConfigSchema |
| Add new category | `src/tools/delegate-task/constants.ts` | DEFAULT_CATEGORIES + CATEGORY_MODEL_REQUIREMENTS |

## MULTI-LEVEL CONFIG

```
Project (.opencode/opencode-codex-orch.json)  →  User (~/.config/opencode/opencode-codex-orch.json)  →  Defaults
```

- `agents`, `categories`, `claude_code`: deep merged recursively
- `disabled_*` arrays: Set union (concatenated + deduplicated)
- All other fields: override replaces base value
- Zod `safeParse()` fills defaults for omitted fields
- `migrateConfigFile()` transforms legacy keys automatically

Fields: agents (14 overridable, 21 fields each), categories (4 built-in + custom), disabled_* arrays (agents, hooks, mcps, skills, commands, tools), 19 feature-specific configs.

## THREE-TIER MCP SYSTEM

| Tier | Source | Mechanism |
|------|--------|-----------|
| Built-in | `src/mcp/` | 3 remote HTTP: websearch (Exa/Tavily), context7, grep_app |
| Claude Code | `.mcp.json` | `${VAR}` env expansion via claude-code-mcp-loader |
| Skill-embedded | SKILL.md YAML | Managed by SkillMcpManager (stdio + HTTP) |

## CONVENTIONS

- **Runtime**: Bun only — never use npm/yarn
- **TypeScript**: strict mode, ESNext, bundler moduleResolution, `bun-types` (never `@types/node`)
- **Test pattern**: Bun test (`bun:test`), co-located `*.test.ts`, given/when/then style (nested describe with `#given`/`#when`/`#then` prefixes)
- **CI test split**: mock-heavy tests run in isolation (separate `bun test` processes), rest in batch
- **Factory pattern**: `createXXX()` for all tools, hooks, agents
- **Hook tiers**: 13 kept hooks across Core + Continuation + Skill tiers (33 removed hooks shimmed as null)
- **Agent modes**: `primary` (respects UI model) vs `subagent` (own fallback chain) vs `all`
- **Model resolution**: 4-step: override → category-default → provider-fallback → system-default
- **Config format**: Plugin config uses strict JSON, OpenCode core config still supports JSONC, snake_case keys
- **File naming**: kebab-case for all files/directories
- **Module structure**: index.ts barrel exports, no catch-all files (utils.ts, helpers.ts banned), 200 LOC soft limit
- **Imports**: relative within module, barrel imports across modules (`import { log } from "./shared"`)
- **No path aliases**: no `@/` — relative imports only

## ANTI-PATTERNS

- Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- Never suppress lint/type errors
- Never add emojis to code/comments unless user explicitly asks
- Never commit unless explicitly requested
- Never run `bun publish` directly — use GitHub Actions
- Never modify `package.json` version locally
- Test: given/when/then — never use Arrange-Act-Assert comments
- Comments: avoid AI-generated comment patterns (enforced by comment-checker hook)
- Never create catch-all files (`utils.ts`, `helpers.ts`, `service.ts`)
- Empty catch blocks `catch(e) {}` — always handle errors
- Never use em dashes (—), en dashes (–), or AI filler phrases in generated content
- index.ts is entry point ONLY — never dump business logic there

## COMMANDS

```bash
bun test                    # Bun test suite
bun run build              # Build plugin (ESM + declarations + schema)
bun run build:all          # Build + platform binaries
bun run typecheck           # tsc --noEmit
bunx opencode-codex-orch install # Interactive setup
bunx opencode-codex-orch doctor  # Health diagnostics
bunx opencode-codex-orch run     # Non-interactive session
```

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ci.yml | push/PR to master/dev | Tests (split: mock-heavy isolated + batch), typecheck, build, schema auto-commit |
| publish.yml | manual dispatch | Version bump, npm publish, platform binaries, GitHub release, merge to master |
| publish-platform.yml | called by publish | 12 platform binaries via bun compile (darwin/linux/windows) |
| sisyphus-agent.yml | @mention / dispatch | AI agent handles issues/PRs |
| cla.yml | issue_comment/PR | CLA assistant for contributors |
| lint-workflows.yml | push to .github/ | actionlint + shellcheck on workflow files |

## NOTES

- Logger writes to `/tmp/opencode-codex-orch.log` — check there for debugging
- Background tasks: 5 concurrent per model/provider (configurable)
- Plugin load timeout: 10s for Claude Code plugins
- Model fallback priority: Claude > OpenAI > Gemini > Copilot > OpenCode Zen > Z.ai > Kimi
- Config migration runs automatically on legacy keys (agent names, hook names, model versions)
- Build: bun build (ESM) + tsc --emitDeclarationOnly, externals: @ast-grep/napi
- Test setup: `test-setup.ts` preloaded via bunfig.toml, mock-heavy tests run in isolation in CI
- 98 barrel export files (index.ts) establish module boundaries
- Architecture rules enforced via `.sisyphus/rules/modular-code-enforcement.md`
