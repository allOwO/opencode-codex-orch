import { describe, expect, it } from "bun:test"

import { gradeEvalReport } from "./eval-grader"
import type { SkillEvalRunReport } from "./types"

describe("gradeEvalReport", () => {
  it("passes when all expectations match", () => {
    const report: SkillEvalRunReport = {
      generated_at: new Date().toISOString(),
      skill_name: "sample-skill",
      skill_path: "/tmp/sample-skill",
      eval_file_path: "/tmp/evals.json",
      agent: "Orchestrator",
      cases: [{
        case_id: "smoke",
        prompt: "Summarize README",
        files: [],
        expectations: {
          skill_invoked: true,
          tools_all: ["Read"],
          assistant_contains: ["summary"],
        },
        session_id: "ses_123",
        exit_code: 0,
        success: true,
        duration_ms: 1,
        message_count: 2,
        summary: "done",
        assistant_text: "Here is a summary of the README.",
        transcript_text: "skill Read Here is a summary of the README.",
        tool_names: ["skill", "Read"],
        skill_invoked: true,
      }],
    }

    const graded = gradeEvalReport(report, "/tmp/report.json")
    expect(graded.passed).toBe(1)
    expect(graded.failed).toBe(0)
    expect(graded.cases[0].passed).toBe(true)
  })

  it("fails when forbidden tools are used", () => {
    const report: SkillEvalRunReport = {
      generated_at: new Date().toISOString(),
      skill_name: "sample-skill",
      skill_path: "/tmp/sample-skill",
      eval_file_path: "/tmp/evals.json",
      agent: "Orchestrator",
      cases: [{
        case_id: "smoke",
        prompt: "Summarize README",
        files: [],
        expectations: { tools_none: ["Write"] },
        session_id: "ses_123",
        exit_code: 0,
        success: true,
        duration_ms: 1,
        message_count: 2,
        summary: "done",
        assistant_text: "Done",
        transcript_text: "Write Done",
        tool_names: ["Write"],
        skill_invoked: false,
      }],
    }

    const graded = gradeEvalReport(report, "/tmp/report.json")
    expect(graded.failed).toBe(1)
    expect(graded.cases[0].passed).toBe(false)
  })
})
