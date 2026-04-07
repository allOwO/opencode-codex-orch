import { writeFile } from "node:fs/promises"

import { gradeEvalReport, loadSkillEvalSuite, resolveSkillFilePath, runSkillEvalSuite, validateSkillDirectory } from "../../features/skill-creator"

export interface EvalSkillOptions {
  agent?: string
  evalFile: string
  json?: boolean
  output?: string
  keepWorkspace?: boolean
  timeoutMs?: number
}

export async function evalSkill(skillPath: string, options: EvalSkillOptions): Promise<number> {
  const validation = await validateSkillDirectory(skillPath, options.evalFile)
  if (!validation.valid || !validation.skillName) {
    if (options.json) {
      console.log(JSON.stringify(validation, null, 2))
    } else {
      console.log(`Skill validation failed for ${validation.skillFilePath}.`)
    }
    return 1
  }

  const suite = await loadSkillEvalSuite(options.evalFile)
  const { skillDir } = await resolveSkillFilePath(skillPath)
  const report = await runSkillEvalSuite({
    skillDir,
    skillName: validation.skillName,
    evalFilePath: options.evalFile,
    suite,
    agent: options.agent ?? "orchestrator",
    keepWorkspace: options.keepWorkspace,
    timeoutMs: options.timeoutMs,
  })
  const graded = gradeEvalReport(report, options.output ?? "(stdout)")

  if (options.output) {
    await writeFile(options.output, JSON.stringify(report, null, 2))
  }

  if (options.json) {
    console.log(JSON.stringify({ report, graded }, null, 2))
  } else {
    const lines = [
      `Skill: ${report.skill_name}`,
      `Cases: ${report.cases.length}`,
      `Passed: ${graded.passed}`,
      `Failed: ${graded.failed}`,
    ]
    if (options.output) {
      lines.push(`Report: ${options.output}`)
    }
    if (options.timeoutMs) {
      lines.push(`Per-case timeout: ${options.timeoutMs}ms`)
    }
    console.log(lines.join("\n"))
  }

  return graded.failed === 0 ? 0 : 1
}
