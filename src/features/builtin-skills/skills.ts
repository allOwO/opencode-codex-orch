import type { BrowserAutomationProvider } from "../../config/schema"
import type { BuiltinSkill } from "./types"

import {
  agentBrowserSkill,
  devBrowserSkill,
  fastImplementationSkill,
  frontendUiUxSkill,
  gitCommitSkill,
  gitRebaseSkill,
  gitSearchSkill,
  playwrightSkill,
  playwrightCliSkill,
  skillCreatorSkill,
} from "./skills/index"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills } = options

  let browserSkill: BuiltinSkill
  if (browserProvider === "agent-browser") {
    browserSkill = agentBrowserSkill
  } else if (browserProvider === "playwright-cli") {
    browserSkill = playwrightCliSkill
  } else {
    browserSkill = playwrightSkill
  }

  const skills = [
    browserSkill,
    fastImplementationSkill,
    frontendUiUxSkill,
    gitCommitSkill,
    gitRebaseSkill,
    gitSearchSkill,
    devBrowserSkill,
    skillCreatorSkill,
  ]

  if (!disabledSkills) {
    return skills
  }

  return skills.filter((skill) => !disabledSkills.has(skill.name))
}
