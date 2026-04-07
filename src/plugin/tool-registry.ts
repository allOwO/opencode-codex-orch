import type { ToolDefinition } from "@opencode-ai/plugin"

import type {
  AvailableCategory,
} from "../agents/dynamic-agent-prompt-builder"
import type { OpenCodeCodexOrchConfig } from "../config"
import type { PluginContext, ToolsRecord } from "./types"

import {
  builtinTools,
  createBackgroundTools,
  createSkillTool,
  createAstGrepTools,
  createGrepTools,
  createGlobTools,
  createSessionManagerTools,
  createDelegateTask,
  discoverCommandsSync,
  createTaskCreateTool,
  createTaskGetTool,
  createTaskList,
  createTaskUpdateTool,
  createHashlineEditTool,
} from "../tools"
import { getMainSessionID } from "../features/claude-code-session-state"
import { filterDisabledTools } from "../shared/disabled-tools"
import { log } from "../shared"
import type { RuntimeConfigState } from "../plugin-state"
import { createSkillContext } from "./skill-context"

import type { Managers } from "../create-managers"
import type { SkillContext } from "./skill-context"

export type ToolRegistryResult = {
  filteredTools: ToolsRecord
  taskSystemEnabled: boolean
}

export function createToolRegistry(args: {
  ctx: PluginContext
  pluginConfig: OpenCodeCodexOrchConfig
  managers: Pick<Managers, "backgroundManager" | "tmuxSessionManager" | "skillMcpManager">
  skillContext: SkillContext
  availableCategories: AvailableCategory[]
  runtimeConfigState?: RuntimeConfigState
}): ToolRegistryResult {
  const runtimeConfigState = args.runtimeConfigState ?? { config: undefined, version: 0 }
  const { ctx, pluginConfig, managers, skillContext, availableCategories } = args

  const backgroundTools = createBackgroundTools(managers.backgroundManager, ctx.client)

  const delegateTask = createDelegateTask({
    manager: managers.backgroundManager,
    client: ctx.client,
    directory: ctx.directory,
    userCategories: pluginConfig.categories,
    agentOverrides: pluginConfig.agents,
    executorModel: pluginConfig.agents?.executor?.model,
    browserProvider: skillContext.browserProvider,
    disabledSkills: skillContext.disabledSkills,
    availableCategories,
    availableSkills: skillContext.availableSkills,
    syncPollTimeoutMs: pluginConfig.background_task?.syncPollTimeoutMs,
    onSyncSessionCreated: async (event) => {
      log("[index] onSyncSessionCreated callback", {
        sessionID: event.sessionID,
        parentID: event.parentID,
        title: event.title,
      })
      await managers.tmuxSessionManager.onSessionCreated({
        type: "session.created",
        properties: {
          info: {
            id: event.sessionID,
            parentID: event.parentID,
            title: event.title,
          },
        },
      })
    },
  })

  const getSessionIDForMcp = (): string => getMainSessionID() || ""

  const commands = discoverCommandsSync(ctx.directory, {
    pluginsEnabled: pluginConfig.claude_code?.plugins ?? true,
    enabledPluginsOverride: pluginConfig.claude_code?.plugins_override,
  })

  const getCurrentSkillContext = async (): Promise<SkillContext> => {
    if (!runtimeConfigState.config) return skillContext

    return await createSkillContext({
      directory: ctx.directory,
      pluginConfig,
      runtimeConfig: runtimeConfigState.config,
    })
  }

  const skillTool = createSkillTool({
    commands,
    getSkills: async () => (await getCurrentSkillContext()).mergedSkills,
    getCacheKey: () => `${runtimeConfigState.version}`,
    mcpManager: managers.skillMcpManager,
    getSessionID: getSessionIDForMcp,
  })

  const taskSystemEnabled = pluginConfig.experimental?.task_system ?? false
  const taskToolsRecord: Record<string, ToolDefinition> = taskSystemEnabled
    ? {
      task_create: createTaskCreateTool(pluginConfig, ctx),
      task_get: createTaskGetTool(pluginConfig),
      task_list: createTaskList(pluginConfig),
      task_update: createTaskUpdateTool(pluginConfig, ctx),
    }
    : {}

  const hashlineEnabled = pluginConfig.hashline_edit ?? false
  const hashlineToolsRecord: Record<string, ToolDefinition> = hashlineEnabled
    ? { edit: createHashlineEditTool() }
    : {}

  const allTools: Record<string, ToolDefinition> = {
    ...builtinTools,
    ...createAstGrepTools(ctx),
    ...createGrepTools(ctx),
    ...createGlobTools(ctx),
    ...createSessionManagerTools(ctx),
    ...backgroundTools,
    task: delegateTask,
    skill: skillTool,
    ...taskToolsRecord,
    ...hashlineToolsRecord,
  }

  const filteredTools = filterDisabledTools(allTools, pluginConfig.disabled_tools)

  return {
    filteredTools,
    taskSystemEnabled,
  }
}
