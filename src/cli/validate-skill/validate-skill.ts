import { existsSync } from "node:fs"
import { join } from "node:path"

import { validateSkillDirectory } from "../../features/skill-creator"

export interface ValidateSkillOptions {
  json?: boolean
  evalFile?: string
}

function findDefaultEvalFile(skillDir: string): string | undefined {
  const candidates = [
    join(skillDir, "evals", "evals.json"),
    join(skillDir, "evals", "evals.yaml"),
    join(skillDir, "evals", "evals.yml"),
  ]
  return candidates.find((candidate) => existsSync(candidate))
}

export async function validateSkill(skillPath: string, options: ValidateSkillOptions = {}): Promise<number> {
  const evalFile = options.evalFile ?? findDefaultEvalFile(skillPath)
  const report = await validateSkillDirectory(skillPath, evalFile)

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return report.valid ? 0 : 1
  }

  const lines = [
    `Skill: ${report.skillName ?? "(unknown)"}`,
    `Path: ${report.skillFilePath}`,
    `Status: ${report.valid ? "valid" : "invalid"}`,
  ]

  if (report.evalFilePath) {
    lines.push(`Eval Suite: ${report.evalFilePath}`)
  }

  if (report.issues.length === 0) {
    lines.push("No issues found.")
  } else {
    lines.push("Issues:")
    for (const issue of report.issues) {
      const where = issue.path ? ` (${issue.path})` : ""
      lines.push(`- [${issue.severity}] ${issue.code}${where}: ${issue.message}`)
    }
  }

  console.log(lines.join("\n"))
  return report.valid ? 0 : 1
}
