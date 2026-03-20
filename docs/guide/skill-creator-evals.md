# Skill Creator Eval Guide

Use the `skill-creator` workflow to validate a `SKILL.md`, run explicit-invocation eval cases, and re-grade saved reports without rerunning the suite.

---

## Quick Start

Validate a skill first:

```bash
bunx opencode-codex-orch validate-skill .opencode/skills/my-skill
```

Run an eval suite:

```bash
bunx opencode-codex-orch eval-skill .opencode/skills/my-skill --eval-file ./docs/examples/skill-creator/evals.yaml --timeout 90
```

Re-grade a saved report:

```bash
bunx opencode-codex-orch grade-skill-eval ./skill-eval-report.json
```

---

## Eval Suite Formats

Supported formats:

- JSON
- YAML

Official examples:

- `docs/examples/skill-creator/evals.json`
- `docs/examples/skill-creator/evals.yaml`

Each suite contains:

- `skill_name`: expected skill name
- `evals`: one or more eval cases

---

## Eval Case Fields

Each eval case can include:

- `id`: stable unique identifier
- `prompt`: the task given to the agent
- `files`: fixture files copied into a temporary workspace before the case runs
- `expectations`: deterministic checks applied to the result

The CLI-level `--timeout <seconds>` applies a per-case timeout for the suite run.

---

## How Execution Works

- A temporary workspace is created for each eval case
- The target skill is copied into `.opencode/skills/<skill-name>/`
- Fixture files are copied relative to the eval suite location
- The runner explicitly tells the agent to call `skill(name="<skill-name>")`
- The session transcript is collected and graded after each case

This means the workflow measures explicit skill loading, not automatic skill triggering.

---

## Expectations

Supported expectation keys:

- `skill_invoked`
- `tools_any`
- `tools_all`
- `tools_none`
- `assistant_contains`
- `assistant_not_contains`
- `transcript_contains`
- `transcript_not_contains`

These checks are deterministic string and tool-usage checks, so they are best used for stable acceptance criteria rather than nuanced quality judgments.

---

## Fixtures

Fixture paths are resolved relative to the eval suite file.

Example:

```yaml
skill_name: my-skill
evals:
  - id: smoke
    prompt: Review the sample input
    files:
      - fixtures/input.txt
```

If a referenced fixture does not exist, `validate-skill` and `eval-skill` fail before execution.

---

## Best Practices

- Keep each eval case narrow and easy to diagnose
- Prefer read-only fixture scenarios before write-heavy workflows
- Assert on concrete substrings and tool usage, not vague quality claims
- Use `--keep-workspace` when debugging a failed case
- Start from the official examples and trim them to your real use case

---

## Command Roles

- `validate-skill`: frontmatter, body, suite, and fixture validation
- `eval-skill`: run the suite and emit a raw report
- `grade-skill-eval`: re-grade an existing raw report
