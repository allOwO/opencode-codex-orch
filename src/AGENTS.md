# src/ — Plugin Source

**Generated:** 2026-03-06

## OVERVIEW

Entry point `index.ts` orchestrates 5-step initialization: loadConfig → createManagers → createTools → createHooks → createPluginInterface.

## KEY FILES

| File | Purpose |
|------|---------|
| `index.ts` | Plugin entry, exports `OpenCodeCodexOrchPlugin` |
| `plugin-config.ts` | JSON parse, multi-level merge, Zod v4 validation |
| `create-managers.ts` | TmuxSessionManager, BackgroundManager, SkillMcpManager, ConfigHandler |
| `create-tools.ts` | SkillContext + AvailableCategories + ToolRegistry (~18 tools) |
| `create-hooks.ts` | 3-tier: Core + Continuation + Skill = 13 kept hooks + null shims |
| `plugin-interface.ts` | 8 OpenCode hook handlers: config, tool, chat.message, chat.params, chat.headers, event, tool.execute.before, tool.execute.after |

## CONFIG LOADING

```
loadPluginConfig(directory, ctx)
  1. User: ~/.config/opencode/opencode-codex-orch.json
  2. Project: .opencode/opencode-codex-orch.json
  3. mergeConfigs(user, project) → deepMerge for agents/categories, Set union for disabled_*
  4. Zod safeParse → defaults for omitted fields
  5. migrateConfigFile() → legacy key transformation
```

## HOOK COMPOSITION

```
createHooks()
  ├─→ createCoreHooks()           # Kept: autoUpdateChecker, editErrorRecovery, modelFallback, runtimeFallback, sessionRecovery, directoryAgentsInjector, directoryReadmeInjector, rulesInjector, hashlineReadEnhancer, hashlineEditDiffEnhancer, toolOutputTruncator, writeExistingFileGuard
  ├─→ createContinuationHooks()   # (wired but hooks inside may be null-shimmed)
  ├─→ createSkillHooks()          # (wired but hooks inside may be null-shimmed)
  └─→ removedHooks                # 35 null shims for type compatibility
```
