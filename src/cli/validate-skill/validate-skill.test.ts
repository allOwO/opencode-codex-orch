import { describe, expect, it, spyOn } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { validateSkill } from "./validate-skill"

describe("validateSkill CLI", () => {
  it("returns zero for a valid skill", async () => {
    const dir = await mkdtemp(join(tmpdir(), "validate-skill-cli-test-"))
    await writeFile(join(dir, "SKILL.md"), `---\nname: sample-skill\ndescription: Useful description\n---\nUse Read first.`)
    const logSpy = spyOn(console, "log").mockImplementation(() => undefined)

    try {
      const exitCode = await validateSkill(dir)
      expect(exitCode).toBe(0)
    } finally {
      logSpy.mockRestore()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
