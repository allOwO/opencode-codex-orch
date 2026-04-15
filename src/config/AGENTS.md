# src/config/ — Zod v4 Schema System

**Generated:** 2026-03-06

## OVERVIEW

24 schema files composing `OpenCodeCodexOrchConfigSchema`. Zod v4 validation with `safeParse()`. All fields optional — omitted fields use plugin defaults.

## SCHEMA TREE

```
config/schema/
├── opencode-codex-orch-config.ts    # ROOT: OpenCodeCodexOrchConfigSchema (composes all below)
├── agent-names.ts              # BuiltinAgentNameSchema (11), OverridableAgentNameSchema (14)
├── agent-overrides.ts          # AgentOverrideConfigSchema (21 fields per agent)
├── categories.ts               # 8 built-in + custom categories
├── hooks.ts                    # HookNameSchema (46 hooks)
├── skills.ts                   # SkillsConfigSchema (sources, paths, recursive)
├── commands.ts                 # BuiltinCommandNameSchema
├── experimental.ts             # Feature flags (plugin_load_timeout_ms min 1000)
├── orchestrator.ts             # OrchestratorConfigSchema (task system)
├── orchestrator-agent.ts       # OrchestratorAgentConfigSchema
├── tmux.ts                     # TmuxConfigSchema + TmuxLayoutSchema
├── websearch.ts                # provider: "exa" | "tavily"
├── claude-code.ts              # CC compatibility settings
├── comment-checker.ts          # AI comment detection config
├── notification.ts             # OS notification settings
├── browser-automation.ts       # provider: playwright | agent-browser | playwright-cli
├── background-task.ts          # Concurrency limits per model/provider
├── fallback-models.ts          # FallbackModelsConfigSchema
├── runtime-fallback.ts         # RuntimeFallbackConfigSchema
├── babysitting.ts              # Unstable agent monitoring
├── dynamic-context-pruning.ts  # Context pruning settings
├── start-work.ts              # StartWorkConfigSchema (auto_commit)
└── internal/permission.ts      # AgentPermissionSchema

```

## ROOT SCHEMA FIELDS (27)

`$schema`, `new_task_system_enabled`, `default_run_agent`, `disabled_mcps`, `disabled_agents`, `disabled_skills`, `disabled_hooks`, `disabled_commands`, `disabled_tools`, `hashline_edit`, `agents`, `categories`, `claude_code`, `orchestrator_agent`, `comment_checker`, `experimental`, `auto_update`, `skills`, `ralph_loop`, `background_task`, `notification`, `babysitting`, `browser_automation_engine`, `websearch`, `tmux`, `orchestrator`, `start_work`, `_migrations`

## AGENT OVERRIDE FIELDS (19)

`model`, `variant`, `category`, `skills`, `temperature`, `top_p`, `prompt`, `prompt_append`, `tools`, `disable`, `description`, `mode`, `color`, `permission`, `maxTokens`, `thinking`, `reasoningEffort`, `textVerbosity`, `providerOptions`

## HOW TO ADD CONFIG

1. Create `src/config/schema/{name}.ts` with Zod schema
2. Add field to `opencode-codex-orch-config.ts` root schema
3. Reference via `z.infer<typeof YourSchema>` for TypeScript types
4. Access in handlers via `pluginConfig.{name}`
