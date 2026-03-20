import { readFile } from "node:fs/promises"
import yaml from "js-yaml"

import type { SkillEvalSuite } from "./types"
import { SkillEvalSuiteSchema } from "./schema"

export async function loadSkillEvalSuite(evalFilePath: string): Promise<SkillEvalSuite> {
  const content = await readFile(evalFilePath, "utf-8")
  const parsed = evalFilePath.endsWith(".json")
    ? JSON.parse(content)
    : yaml.load(content, { schema: yaml.JSON_SCHEMA })

  return SkillEvalSuiteSchema.parse(parsed)
}
