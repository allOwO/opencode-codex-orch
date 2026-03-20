import type { SkillEvalCaseGrade, SkillEvalCaseRun, SkillEvalCheck, SkillEvalGradeReport, SkillEvalRunReport } from "./types"

function includesAll(text: string, values: string[]): string[] {
  const haystack = text.toLowerCase()
  return values.filter((value) => !haystack.includes(value.toLowerCase()))
}

function includesAny(values: string[], expected: string[]): boolean {
  const normalized = new Set(values.map((value) => value.toLowerCase()))
  return expected.some((value) => normalized.has(value.toLowerCase()))
}

function includesEvery(values: string[], expected: string[]): string[] {
  const normalized = new Set(values.map((value) => value.toLowerCase()))
  return expected.filter((value) => !normalized.has(value.toLowerCase()))
}

function includesNone(values: string[], expected: string[]): string[] {
  const normalized = new Set(values.map((value) => value.toLowerCase()))
  return expected.filter((value) => normalized.has(value.toLowerCase()))
}

function pushCheck(checks: SkillEvalCheck[], name: string, passed: boolean, details: string): void {
  checks.push({ name, passed, details })
}

export function gradeEvalCase(run: SkillEvalCaseRun): SkillEvalCaseGrade {
  const checks: SkillEvalCheck[] = []
  const expectations = run.expectations

  pushCheck(checks, "run_success", run.success, run.success ? "Run exited successfully." : `Run failed with exit code ${run.exit_code}.`)

  if (expectations?.skill_invoked !== undefined) {
    const passed = run.skill_invoked === expectations.skill_invoked
    pushCheck(
      checks,
      "skill_invoked",
      passed,
      passed
        ? `Skill invocation matched expected value ${expectations.skill_invoked}.`
        : `Expected skill_invoked=${expectations.skill_invoked}, received ${run.skill_invoked}.`,
    )
  }

  if (expectations?.tools_any?.length) {
    const passed = includesAny(run.tool_names, expectations.tools_any)
    pushCheck(
      checks,
      "tools_any",
      passed,
      passed
        ? `Observed one of: ${expectations.tools_any.join(", ")}.`
        : `None of the expected tools were used: ${expectations.tools_any.join(", ")}.`,
    )
  }

  if (expectations?.tools_all?.length) {
    const missing = includesEvery(run.tool_names, expectations.tools_all)
    pushCheck(
      checks,
      "tools_all",
      missing.length === 0,
      missing.length === 0 ? "All required tools were used." : `Missing required tools: ${missing.join(", ")}.`,
    )
  }

  if (expectations?.tools_none?.length) {
    const forbidden = includesNone(run.tool_names, expectations.tools_none)
    pushCheck(
      checks,
      "tools_none",
      forbidden.length === 0,
      forbidden.length === 0 ? "No forbidden tools were used." : `Forbidden tools were used: ${forbidden.join(", ")}.`,
    )
  }

  if (expectations?.assistant_contains?.length) {
    const missing = includesAll(run.assistant_text, expectations.assistant_contains)
    pushCheck(
      checks,
      "assistant_contains",
      missing.length === 0,
      missing.length === 0 ? "Assistant output contains all required substrings." : `Missing assistant substrings: ${missing.join(", ")}.`,
    )
  }

  if (expectations?.assistant_not_contains?.length) {
    const forbidden = expectations.assistant_not_contains.filter((value) => run.assistant_text.toLowerCase().includes(value.toLowerCase()))
    pushCheck(
      checks,
      "assistant_not_contains",
      forbidden.length === 0,
      forbidden.length === 0 ? "Assistant output avoids forbidden substrings." : `Assistant output contains forbidden substrings: ${forbidden.join(", ")}.`,
    )
  }

  if (expectations?.transcript_contains?.length) {
    const missing = includesAll(run.transcript_text, expectations.transcript_contains)
    pushCheck(
      checks,
      "transcript_contains",
      missing.length === 0,
      missing.length === 0 ? "Transcript contains all required substrings." : `Missing transcript substrings: ${missing.join(", ")}.`,
    )
  }

  if (expectations?.transcript_not_contains?.length) {
    const forbidden = expectations.transcript_not_contains.filter((value) => run.transcript_text.toLowerCase().includes(value.toLowerCase()))
    pushCheck(
      checks,
      "transcript_not_contains",
      forbidden.length === 0,
      forbidden.length === 0 ? "Transcript avoids forbidden substrings." : `Transcript contains forbidden substrings: ${forbidden.join(", ")}.`,
    )
  }

  return {
    case_id: run.case_id,
    passed: checks.every((check) => check.passed),
    checks,
  }
}

export function gradeEvalReport(report: SkillEvalRunReport, sourceReport: string): SkillEvalGradeReport {
  const cases = report.cases.map(gradeEvalCase)
  const passed = cases.filter((item) => item.passed).length

  return {
    graded_at: new Date().toISOString(),
    skill_name: report.skill_name,
    source_report: sourceReport,
    passed,
    failed: cases.length - passed,
    total: cases.length,
    cases,
  }
}
