import { describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { loadSkillEvalSuite } from "./eval-suite-loader"

describe("loadSkillEvalSuite", () => {
  it("loads a valid JSON suite", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skill-eval-suite-test-"))
    const filePath = join(dir, "evals.json")
    await writeFile(filePath, JSON.stringify({
      skill_name: "sample-skill",
      evals: [{ id: "smoke", prompt: "Summarize README" }],
    }))

    try {
      const suite = await loadSkillEvalSuite(filePath)
      expect(suite.skill_name).toBe("sample-skill")
      expect(suite.evals).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
