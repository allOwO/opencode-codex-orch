import { readFile, writeFile } from "node:fs/promises"

import { gradeEvalReport } from "../../features/skill-creator"
import type { SkillEvalRunReport } from "../../features/skill-creator"

export interface GradeSkillEvalOptions {
  json?: boolean
  output?: string
}

export async function gradeSkillEval(reportPath: string, options: GradeSkillEvalOptions = {}): Promise<number> {
  const content = await readFile(reportPath, "utf-8")
  const report = JSON.parse(content) as SkillEvalRunReport
  const graded = gradeEvalReport(report, reportPath)

  if (options.output) {
    await writeFile(options.output, JSON.stringify(graded, null, 2))
  }

  if (options.json) {
    console.log(JSON.stringify(graded, null, 2))
  } else {
    const lines = [
      `Skill: ${graded.skill_name}`,
      `Passed: ${graded.passed}`,
      `Failed: ${graded.failed}`,
      `Total: ${graded.total}`,
    ]
    if (options.output) {
      lines.push(`Grade Report: ${options.output}`)
    }
    console.log(lines.join("\n"))
  }

  return graded.failed === 0 ? 0 : 1
}
