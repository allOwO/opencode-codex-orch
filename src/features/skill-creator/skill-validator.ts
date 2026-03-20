import { access, readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { z } from "zod"

import { parseFrontmatter } from "../../shared/frontmatter"
import { SkillFrontmatterSchema } from "./schema"
import { loadSkillEvalSuite } from "./eval-suite-loader"
import type { SkillValidationIssue, SkillValidationReport } from "./types"

const ALLOWED_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "model",
  "argument-hint",
  "agent",
  "subtask",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
  "mcp",
])

function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function resolveSkillFilePath(skillPath: string): Promise<{ skillDir: string; skillFilePath: string }> {
  const directSkillFile = skillPath.endsWith("SKILL.md") ? skillPath : join(skillPath, "SKILL.md")
  const exists = await pathExists(directSkillFile)
  if (!exists) {
    throw new Error(`SKILL.md not found at ${directSkillFile}`)
  }

  return {
    skillDir: dirname(directSkillFile),
    skillFilePath: directSkillFile,
  }
}

export async function validateSkillDirectory(skillPath: string, evalFilePath?: string): Promise<SkillValidationReport> {
  const { skillDir, skillFilePath } = await resolveSkillFilePath(skillPath)
  const issues: SkillValidationIssue[] = []
  const content = await readFile(skillFilePath, "utf-8")
  const frontmatter = parseFrontmatter<Record<string, unknown>>(content)

  if (!frontmatter.hadFrontmatter) {
    issues.push({
      code: "missing-frontmatter",
      message: "SKILL.md must begin with YAML frontmatter.",
      path: skillFilePath,
      severity: "error",
    })
  }

  if (frontmatter.parseError) {
    issues.push({
      code: "invalid-frontmatter",
      message: "YAML frontmatter could not be parsed.",
      path: skillFilePath,
      severity: "error",
    })
  }

  let skillName: string | undefined

  if (frontmatter.hadFrontmatter && !frontmatter.parseError) {
    const unknownKeys = Object.keys(frontmatter.data).filter((key) => !ALLOWED_FRONTMATTER_KEYS.has(key))
    for (const key of unknownKeys) {
      issues.push({
        code: "unknown-frontmatter-key",
        message: `Unknown frontmatter key: ${key}`,
        path: key,
        severity: "warning",
      })
    }

    const result = SkillFrontmatterSchema.safeParse(frontmatter.data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({
          code: "invalid-frontmatter-field",
          message: issue.message,
          path: issue.path.join("."),
          severity: "error",
        })
      }
    } else {
      skillName = result.data.name
    }
  }

  if (frontmatter.body.trim().length === 0) {
    issues.push({
      code: "empty-body",
      message: "SKILL.md body must contain instructions after the frontmatter.",
      path: skillFilePath,
      severity: "error",
    })
  }

  if (evalFilePath) {
    try {
      const suite = await loadSkillEvalSuite(evalFilePath)
      const evalBaseDir = dirname(evalFilePath)
      if (skillName && suite.skill_name && suite.skill_name !== skillName) {
        issues.push({
          code: "skill-name-mismatch",
          message: `Eval suite references '${suite.skill_name}' but SKILL.md uses '${skillName}'.`,
          path: evalFilePath,
          severity: "error",
        })
      }

      for (const evalCase of suite.evals) {
        for (const file of evalCase.files ?? []) {
          const fixturePath = resolve(evalBaseDir, file)
          const exists = await pathExists(fixturePath)
          if (!exists) {
            issues.push({
              code: "missing-eval-fixture",
              message: `Eval case '${evalCase.id}' references missing fixture '${file}'.`,
              path: fixturePath,
              severity: "error",
            })
          }
        }
      }
    } catch (error) {
      if (isZodError(error)) {
        for (const issue of error.issues) {
          issues.push({
            code: "invalid-eval-suite",
            message: issue.message,
            path: `evals.${issue.path.join(".")}`,
            severity: "error",
          })
        }
      } else {
        issues.push({
          code: "invalid-eval-suite",
          message: error instanceof Error ? error.message : String(error),
          path: evalFilePath,
          severity: "error",
        })
      }
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    skillDir,
    skillFilePath,
    skillName,
    evalFilePath,
    issues,
  }
}
