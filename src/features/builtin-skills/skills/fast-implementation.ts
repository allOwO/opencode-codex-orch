import type { BuiltinSkill } from "../types"

export const fastImplementationSkill: BuiltinSkill = {
  name: "fast-implementation",
  description:
    "Use when handling small or medium implementation tasks with a clear approved spec, quickly discoverable file targets, low blast radius, and a need for fast execution.",
  template: `# Fast Implementation

## Overview

Use this skill for low-risk coding work where the requirements are already approved and the safest path is a small, direct change.

This skill optimizes for minimal diffs, requirement traceability, and fast execution. It does **not** override higher-priority safety, delegation, or verification rules.

## Quick Reference

| Situation | Use fast-implementation? | Action |
|-----------|--------------------------|--------|
| Localized bug fix, text tweak, config change, validation fix | Yes | Implement directly with minimal diff |
| Single workflow slice within one module boundary | Usually | Use only if scope and requirements are clear |
| Minor non-visual UI text or wiring change | Sometimes | Allowed only if layout, styling, animation, and UX polish stay unchanged |
| Layout, styling, animation, or UX polish | No | Use designer |
| Architecture, auth, payment, security, migration, unclear scope | No | Escalate to the heavier planning/review flow |

## When to Use

- Localized bug fixes
- Copy, text, or config tweaks
- Validation logic changes
- Adding or wiring a single API field
- One approved feature slice with a clear boundary
- Localized refactors with low, predictable blast radius

## When NOT to Use

- Visual work: layout, styling, animation, interaction polish, or UX refinement
- Architecture changes or new module boundaries
- Cross-module refactors or broad blast radius
- Auth, payment, security, encryption, or PII handling
- Schema changes or data migrations
- Unfamiliar APIs or modules where side effects are hard to predict
- Missing, conflicting, or ambiguous requirements

If any item in this section applies, stop using this skill and escalate.

## Workflow

1. **Requirement Lock** — record source of truth, hard requirements, non-goals, and ambiguities.
2. **Smallest correct change** — touch only needed files, preserve existing patterns, no speculative improvements.
3. **Self-review** — every change must trace to a requirement; if concrete risk appears, escalate.
4. **Verify** — run the nearest relevant tests and any required typecheck, lint, or build steps.
5. **Respond** — always report what changed, files changed, verification, and unresolved issues; add requirement → change mapping for medium tasks or when traceability matters.

## Requirement Lock Template

\`\`\`markdown
## Requirement Lock

**Source of truth:** [issue, spec, approved plan, or user message]

**Hard requirements:**
1. …
2. …

**Non-goals:**
- …

**Open ambiguities:**
- None identified
\`\`\`

## Mini Example

Task: rename one CLI label in an approved spec change.

- Hard requirement: change displayed label from \`Workspace\` to \`Project\`
- Non-goal: do not rename internal symbols
- Correct use of this skill: edit only the display string, run the nearest verification, report the exact file touched

## Common Mistakes

- Treating visual polish as a fast task because the diff looks small
- Continuing despite ambiguous requirements instead of stopping
- Touching extra files "while already here"
- Using this skill to avoid review for security-adjacent or unfamiliar code
- Claiming the task is done without fresh verification output`,
}
