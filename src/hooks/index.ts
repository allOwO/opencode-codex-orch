// Kept hooks — error recovery, fallback, injectors, guards, truncator, hashline
export { createAutoUpdateCheckerHook } from "./auto-update-checker";
export { createEditErrorRecoveryHook } from "./edit-error-recovery";
export { createModelFallbackHook, setPendingModelFallback, clearPendingModelFallback, type ModelFallbackState } from "./model-fallback/hook";
export { createRuntimeFallbackHook, type RuntimeFallbackHook, type RuntimeFallbackOptions } from "./runtime-fallback";
export { createSessionRecoveryHook, type SessionRecoveryHook, type SessionRecoveryOptions } from "./session-recovery";
export { createDirectoryAgentsInjectorHook } from "./directory-agents-injector";
export { createDirectoryReadmeInjectorHook } from "./directory-readme-injector";
export { createRulesInjectorHook } from "./rules-injector";
export { createHashlineReadEnhancerHook } from "./hashline-read-enhancer";
export { createHashlineEditDiffEnhancerHook } from "./hashline-edit-diff-enhancer";
export { createToolOutputTruncatorHook } from "./tool-output-truncator";
export { createWriteExistingFileGuardHook } from "./write-existing-file-guard";
