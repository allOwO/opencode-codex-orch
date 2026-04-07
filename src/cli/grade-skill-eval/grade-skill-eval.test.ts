import { describe, expect, it, spyOn } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { gradeSkillEval } from "./grade-skill-eval"

describe("gradeSkillEval CLI", () => {
  it("grades a saved report", async () => {
    const dir = await mkdtemp(join(tmpdir(), "grade-skill-eval-cli-test-"))
    const reportPath = join(dir, "report.json")
    await writeFile(reportPath, JSON.stringify({
      generated_at: new Date().toISOString(),
      skill_name: "sample-skill",
      skill_path: "/tmp/sample-skill",
      eval_file_path: "/tmp/evals.json",
      agent: "Orchestrator",
      cases: [{
        case_id: "smoke",
        prompt: "Summarize README",
        files: [],
        expectations: { assistant_contains: ["summary"] },
        session_id: "ses_123",
        exit_code: 0,
        success: true,
        duration_ms: 1,
        message_count: 2,
        summary: "done",
        assistant_text: "summary ready",
        transcript_text: "summary ready",
        tool_names: [],
        skill_invoked: false,
      }],
    }))
    const logSpy = spyOn(console, "log").mockImplementation(() => undefined)

    try {
      const exitCode = await gradeSkillEval(reportPath)
      expect(exitCode).toBe(0)
    } finally {
      logSpy.mockRestore()
      await rm(dir, { recursive: true, force: true })
    }
  })
})
