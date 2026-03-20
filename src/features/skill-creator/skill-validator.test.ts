import { describe, expect, it } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { validateSkillDirectory } from "./skill-validator"

async function createSkillDir(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "skill-validator-test-"))
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, "SKILL.md"), content)
  return dir
}

describe("validateSkillDirectory", () => {
  it("accepts a valid skill", async () => {
    const dir = await createSkillDir(`---\nname: sample-skill\ndescription: Does useful work\n---\nUse Read first.`)

    try {
      const report = await validateSkillDirectory(dir)
      expect(report.valid).toBe(true)
      expect(report.skillName).toBe("sample-skill")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("reports missing frontmatter", async () => {
    const dir = await createSkillDir("No frontmatter here")

    try {
      const report = await validateSkillDirectory(dir)
      expect(report.valid).toBe(false)
      expect(report.issues.some((issue) => issue.code === "missing-frontmatter")).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("reports invalid skill name", async () => {
    const dir = await createSkillDir(`---\nname: Not Valid\ndescription: Does useful work\n---\nUse Read first.`)

    try {
      const report = await validateSkillDirectory(dir)
      expect(report.valid).toBe(false)
      expect(report.issues.some((issue) => issue.path === "name")).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

	it("reports missing eval fixtures", async () => {
		const dir = await createSkillDir(`---\nname: sample-skill\ndescription: Does useful work\n---\nUse Read first.`)
		const evalDir = join(dir, "evals")
		const evalFile = join(evalDir, "evals.json")
		await mkdir(evalDir, { recursive: true })
		await writeFile(evalFile, JSON.stringify({
			skill_name: "sample-skill",
			evals: [{ id: "smoke", prompt: "Inspect fixture", files: ["fixtures/missing.txt"] }],
		}))

		try {
			const report = await validateSkillDirectory(dir, evalFile)
			expect(report.valid).toBe(false)
			expect(report.issues.some((issue) => issue.code === "missing-eval-fixture")).toBe(true)
		} finally {
			await rm(dir, { recursive: true, force: true })
		}
	})
})
