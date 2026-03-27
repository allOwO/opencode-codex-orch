import { homedir } from "node:os"
import { join } from "node:path"
import { getClaudeConfigDir } from "../../shared/claude-config-dir"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"
import type { CommandDefinition } from "../claude-code-command-loader/types"
import { readRuntimeConfigSkillPaths, resolveRuntimeSkillPathCandidates } from "./runtime-config-skill-paths"
import type { LoadedSkill } from "./types"
import { skillsToCommandDefinitionRecord } from "./skill-definition-record"
import { deduplicateSkillsByName } from "./skill-deduplication"
import { loadSkillsFromDir } from "./skill-directory-loader"

export async function loadUserSkills(): Promise<Record<string, CommandDefinition>> {
  const userSkillsDir = join(getClaudeConfigDir(), "skills")
  const skills = await loadSkillsFromDir({ skillsDir: userSkillsDir, scope: "user" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadProjectSkills(directory?: string): Promise<Record<string, CommandDefinition>> {
  const projectSkillsDir = join(directory ?? process.cwd(), ".claude", "skills")
  const skills = await loadSkillsFromDir({ skillsDir: projectSkillsDir, scope: "project" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadOpencodeGlobalSkills(): Promise<Record<string, CommandDefinition>> {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const opencodeSkillsDir = join(configDir, "skills")
  const skills = await loadSkillsFromDir({ skillsDir: opencodeSkillsDir, scope: "opencode" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadOpencodeProjectSkills(directory?: string): Promise<Record<string, CommandDefinition>> {
  const opencodeProjectDir = join(directory ?? process.cwd(), ".opencode", "skills")
  const skills = await loadSkillsFromDir({ skillsDir: opencodeProjectDir, scope: "opencode-project" })
  return skillsToCommandDefinitionRecord(skills)
}

export interface DiscoverSkillsOptions {
  includeClaudeCodePaths?: boolean
  directory?: string
}

export async function discoverRuntimeConfiguredSkills(options: {
  directory?: string
  runtimeConfig?: unknown
  runtimeConfigContent?: string
} = {}): Promise<LoadedSkill[]> {
  const baseDirectory = options.directory ?? process.cwd()
  const runtimeConfigContent = options.runtimeConfigContent ?? process.env.OPENCODE_CONFIG_CONTENT
  const configuredPaths = readRuntimeConfigSkillPaths({
    runtimeConfig: options.runtimeConfig,
    runtimeConfigContent,
  })

  if (configuredPaths.length === 0) {
    return []
  }

  const candidatePaths = configuredPaths.flatMap((path) => resolveRuntimeSkillPathCandidates(path, baseDirectory))
  const loadedByPath = await Promise.all(
    candidatePaths.map((skillsDir) => loadSkillsFromDir({ skillsDir, scope: "opencode" }))
  )

  return deduplicateSkillsByName(loadedByPath.flat())
}

export async function discoverAllSkills(directory?: string): Promise<LoadedSkill[]> {
  const [opencodeProjectSkills, opencodeGlobalSkills, runtimeConfiguredSkills, projectSkills, userSkills, agentsProjectSkills, agentsGlobalSkills] =
    await Promise.all([
      discoverOpencodeProjectSkills(directory),
      discoverOpencodeGlobalSkills(),
      discoverRuntimeConfiguredSkills({ directory }),
      discoverProjectClaudeSkills(directory),
      discoverUserClaudeSkills(),
      discoverProjectAgentsSkills(directory),
      discoverGlobalAgentsSkills(),
    ])

  // Priority: opencode-project > opencode > project (.claude + .agents) > user (.claude + .agents)
  return deduplicateSkillsByName([
    ...opencodeProjectSkills,
    ...opencodeGlobalSkills,
    ...runtimeConfiguredSkills,
    ...projectSkills,
    ...agentsProjectSkills,
    ...userSkills,
    ...agentsGlobalSkills,
  ])
}

export async function discoverSkills(options: DiscoverSkillsOptions = {}): Promise<LoadedSkill[]> {
  const { includeClaudeCodePaths = true, directory } = options

  const [opencodeProjectSkills, opencodeGlobalSkills, runtimeConfiguredSkills] = await Promise.all([
    discoverOpencodeProjectSkills(directory),
    discoverOpencodeGlobalSkills(),
    discoverRuntimeConfiguredSkills({ directory }),
  ])

  if (!includeClaudeCodePaths) {
    // Priority: opencode-project > opencode
    return deduplicateSkillsByName([...opencodeProjectSkills, ...opencodeGlobalSkills, ...runtimeConfiguredSkills])
  }

  const [projectSkills, userSkills, agentsProjectSkills, agentsGlobalSkills] = await Promise.all([
    discoverProjectClaudeSkills(directory),
    discoverUserClaudeSkills(),
    discoverProjectAgentsSkills(directory),
    discoverGlobalAgentsSkills(),
  ])

  // Priority: opencode-project > opencode > project (.claude + .agents) > user (.claude + .agents)
  return deduplicateSkillsByName([
    ...opencodeProjectSkills,
    ...opencodeGlobalSkills,
    ...runtimeConfiguredSkills,
    ...projectSkills,
    ...agentsProjectSkills,
    ...userSkills,
    ...agentsGlobalSkills,
  ])
}

export async function getSkillByName(name: string, options: DiscoverSkillsOptions = {}): Promise<LoadedSkill | undefined> {
  const skills = await discoverSkills(options)
  return skills.find(s => s.name === name)
}

export async function discoverUserClaudeSkills(): Promise<LoadedSkill[]> {
  const userSkillsDir = join(getClaudeConfigDir(), "skills")
  return loadSkillsFromDir({ skillsDir: userSkillsDir, scope: "user" })
}

export async function discoverProjectClaudeSkills(directory?: string): Promise<LoadedSkill[]> {
  const projectSkillsDir = join(directory ?? process.cwd(), ".claude", "skills")
  return loadSkillsFromDir({ skillsDir: projectSkillsDir, scope: "project" })
}

export async function discoverOpencodeGlobalSkills(): Promise<LoadedSkill[]> {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const opencodeSkillsDir = join(configDir, "skills")
  return loadSkillsFromDir({ skillsDir: opencodeSkillsDir, scope: "opencode" })
}

export async function discoverOpencodeProjectSkills(directory?: string): Promise<LoadedSkill[]> {
  const opencodeProjectDir = join(directory ?? process.cwd(), ".opencode", "skills")
  return loadSkillsFromDir({ skillsDir: opencodeProjectDir, scope: "opencode-project" })
}

export async function discoverProjectAgentsSkills(directory?: string): Promise<LoadedSkill[]> {
  const agentsProjectDir = join(directory ?? process.cwd(), ".agents", "skills")
  return loadSkillsFromDir({ skillsDir: agentsProjectDir, scope: "project" })
}

export async function discoverGlobalAgentsSkills(): Promise<LoadedSkill[]> {
  const agentsGlobalDir = join(homedir(), ".agents", "skills")
  return loadSkillsFromDir({ skillsDir: agentsGlobalDir, scope: "user" })
}
