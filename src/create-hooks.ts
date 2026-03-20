import type { AvailableSkill } from "./agents/dynamic-agent-prompt-builder"
import type { HookName, OpenCodeCodexOrchConfig } from "./config"
import type { LoadedSkill } from "./features/opencode-skill-loader/types"
import type { BackgroundManager } from "./features/background-agent"
import type { PluginContext } from "./plugin/types"
import type { ModelCacheState } from "./plugin-state"
import type { ChatParamsInput, ChatParamsOutput } from "./plugin/chat-params"

import { createCoreHooks } from "./plugin/hooks/create-core-hooks"
import { createContinuationHooks } from "./plugin/hooks/create-continuation-hooks"
import { createSkillHooks } from "./plugin/hooks/create-skill-hooks"

export type CreatedHooks = ReturnType<typeof createHooks>

type GenericAsyncHookMap = {
  [key: string]: ((...args: unknown[]) => Promise<void>) | undefined
}

type StopContinuationGuardHook = (GenericAsyncHookMap & {
  stop: (sessionID: string) => void
  isStopped: (sessionID: string) => boolean
}) | null

type TodoContinuationEnforcerHook = {
  handler?: (input: unknown) => Promise<void>
  cancelAllCountdowns: () => void
} | null

type RalphLoopHook = {
  event?: (input: unknown) => Promise<void>
  startLoop: (
    sessionID: string,
    prompt: string,
    options: {
      ultrawork?: boolean
      maxIterations?: number
      completionPromise?: string
      strategy?: "reset" | "continue"
    }
  ) => void
  cancelLoop: (sessionID: string) => void
} | null

type SessionNotificationHook = ((input: unknown) => Promise<void>) | null

type CompactionContextInjectorHook = ((sessionID: string) => string) | null

type CompactionTodoPreserverHook = {
  capture: (sessionID: string) => Promise<void>
  event?: (input: unknown) => Promise<void>
} | null

type AtlasHook = (GenericAsyncHookMap & {
  handler?: (input: unknown) => Promise<void>
}) | null

type AnthropicEffortHook = {
  "chat.params"?: (input: ChatParamsInput, output: ChatParamsOutput) => Promise<void>
} | null

type RemovedHookShims = {
  anthropicEffort: AnthropicEffortHook
  stopContinuationGuard: StopContinuationGuardHook
  backgroundNotificationHook: GenericAsyncHookMap | null
  keywordDetector: GenericAsyncHookMap | null
  thinkMode: GenericAsyncHookMap | null
  claudeCodeHooks: GenericAsyncHookMap | null
  autoSlashCommand: GenericAsyncHookMap | null
  noSisyphusGpt: GenericAsyncHookMap | null
  startWork: GenericAsyncHookMap | null
  ralphLoop: RalphLoopHook
  sessionNotification: SessionNotificationHook
  todoContinuationEnforcer: TodoContinuationEnforcerHook
  unstableAgentBabysitter: GenericAsyncHookMap | null
  contextWindowMonitor: GenericAsyncHookMap | null
  anthropicContextWindowLimitRecovery: GenericAsyncHookMap | null
  agentUsageReminder: GenericAsyncHookMap | null
  categorySkillReminder: GenericAsyncHookMap | null
  interactiveBashSession: GenericAsyncHookMap | null
  compactionTodoPreserver: CompactionTodoPreserverHook
  compactionContextInjector: CompactionContextInjectorHook
  preemptiveCompaction: GenericAsyncHookMap | null
  commentChecker: GenericAsyncHookMap | null
  emptyTaskResponseDetector: GenericAsyncHookMap | null
  delegateTaskRetry: GenericAsyncHookMap | null
  atlasHook: AtlasHook
  taskResumeInfo: GenericAsyncHookMap | null
  readImageResizer: GenericAsyncHookMap | null
  jsonErrorRecovery: GenericAsyncHookMap | null
  questionLabelTruncator: GenericAsyncHookMap | null
  nonInteractiveEnv: GenericAsyncHookMap | null
  tasksTodowriteDisabler: GenericAsyncHookMap | null
  prometheusMdOnly: GenericAsyncHookMap | null
  sisyphusJuniorNotepad: GenericAsyncHookMap | null
  thinkingBlockValidator: GenericAsyncHookMap | null
}

const removedHooks: RemovedHookShims = {
  anthropicEffort: null,
  stopContinuationGuard: null,
  backgroundNotificationHook: null,
  keywordDetector: null,
  thinkMode: null,
  claudeCodeHooks: null,
  autoSlashCommand: null,
  noSisyphusGpt: null,
  startWork: null,
  ralphLoop: null,
  sessionNotification: null,
  todoContinuationEnforcer: null,
  unstableAgentBabysitter: null,
  contextWindowMonitor: null,
  anthropicContextWindowLimitRecovery: null,
  agentUsageReminder: null,
  categorySkillReminder: null,
  interactiveBashSession: null,
  compactionTodoPreserver: null,
  compactionContextInjector: null,
  preemptiveCompaction: null,
  commentChecker: null,
  emptyTaskResponseDetector: null,
  delegateTaskRetry: null,
  atlasHook: null,
  taskResumeInfo: null,
  readImageResizer: null,
  jsonErrorRecovery: null,
  questionLabelTruncator: null,
  nonInteractiveEnv: null,
  tasksTodowriteDisabler: null,
  prometheusMdOnly: null,
  sisyphusJuniorNotepad: null,
  thinkingBlockValidator: null,
}

export function createHooks(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  modelCacheState: ModelCacheState
  backgroundManager: BackgroundManager
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
  mergedSkills: LoadedSkill[]
  availableSkills: AvailableSkill[]
}) {
  const {
    ctx,
    pluginConfig,
    modelCacheState,
    backgroundManager,
    isHookEnabled,
    safeHookEnabled,
    mergedSkills,
    availableSkills,
  } = args

  const core = createCoreHooks({
    ctx,
    pluginConfig,
    modelCacheState,
    isHookEnabled,
    safeHookEnabled,
  })

  const continuation = createContinuationHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    backgroundManager,
    sessionRecovery: core.sessionRecovery,
  })

  const skill = createSkillHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    safeHookEnabled,
    mergedSkills,
    availableSkills,
  })

  return {
    ...core,
    ...continuation,
    ...skill,
    ...removedHooks,
  }
}
