# src/hooks/ — 13 Kept Lifecycle Hooks (opencode-codex-orch)

**Generated:** 2026-03-10

## OVERVIEW

13 hooks kept from the original 46. Removed hooks are null-shimmed in `create-hooks.ts` for type compatibility. All hooks follow `createXXXHook(deps) → HookFunction` factory pattern.

## KEPT HOOKS

Exported from `src/hooks/index.ts`:

| Hook | Purpose |
|------|---------|
| autoUpdateChecker | Check npm for plugin updates on session creation |
| editErrorRecovery | Retry failed file edits |
| modelFallback | Provider-level model fallback on errors |
| runtimeFallback | Auto-switch models on API provider errors |
| sessionRecovery | Auto-recover from session crashes |
| directoryAgentsInjector | Auto-inject AGENTS.md into context |
| directoryReadmeInjector | Auto-inject README.md into context |
| rulesInjector | Conditional rules injection (AGENTS.md, config, skill rules) |
| hashlineReadEnhancer | Enhance Read output with LINE#ID hashes |
| hashlineEditDiffEnhancer | Enhanced diff output for hashline edits |
| toolOutputTruncator | Truncate oversized tool output |
| writeExistingFileGuard | Require Read before Write on existing files |

## STRUCTURE

```
hooks/
├── auto-update-checker/        # Plugin update check
├── directory-agents-injector/  # Auto-injects AGENTS.md
├── directory-readme-injector/  # Auto-injects README.md
├── edit-error-recovery/        # Recovers from edit failures
├── hashline-edit-diff-enhancer/ # Enhanced diff output
├── hashline-read-enhancer/     # Adds LINE#ID hashes
├── model-fallback/             # Provider-level model fallback
├── rules-injector/             # Conditional rules
├── runtime-fallback/           # Auto-switch models on errors
├── session-recovery/           # Auto-recovers from crashes
├── shared/                     # Shared hook utilities
├── tool-output-truncator.ts    # Truncate tool output
├── write-existing-file-guard/  # Require Read before Write
└── index.ts                    # Hook exports
```

## REMOVED HOOKS (null-shimmed in create-hooks.ts)

34 hooks removed and set to `null` for type compatibility:
anthropicEffort, stopContinuationGuard, backgroundNotificationHook, keywordDetector, thinkMode, claudeCodeHooks, autoSlashCommand, noSisyphusGpt, startWork, ralphLoop, sessionNotification, todoContinuationEnforcer, unstableAgentBabysitter, contextWindowMonitor, anthropicContextWindowLimitRecovery, agentUsageReminder, categorySkillReminder, interactiveBashSession, compactionTodoPreserver, compactionContextInjector, preemptiveCompaction, commentChecker, emptyTaskResponseDetector, delegateTaskRetry, atlasHook, taskResumeInfo, readImageResizer, jsonErrorRecovery, questionLabelTruncator, nonInteractiveEnv, tasksTodowriteDisabler, prometheusMdOnly, sisyphusJuniorNotepad, thinkingBlockValidator

## HOW TO ADD A HOOK

1. Create `src/hooks/{name}/index.ts` with `createXXXHook(deps)` factory
2. Register in appropriate tier file (`src/plugin/hooks/create-{tier}-hooks.ts`)
3. Add hook name to `src/config/schema/hooks.ts` HookNameSchema
4. Export from `src/hooks/index.ts`
