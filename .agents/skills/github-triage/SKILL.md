---
name: github-triage
description: "Unified GitHub triage for this fork. 1 item = 1 background task. Issues: answer questions from the codebase, analyze bugs, or assess feature requests. PRs: review bugfixes and report safe merge candidates. Use background tasks in parallel. Triggers: 'triage', 'triage issues', 'triage PRs', 'github triage'."
---

# GitHub Triage

## Background

This repository is `opencode-codex-orch`, a lean GPT-oriented fork of `code-yeongyu/oh-my-openagent`.

Current project facts that matter during triage:

- npm/plugin package: `opencode-codex-orch`
- preferred plugin entry: `opencode-codex-orch@latest`
- project config file: `.opencode/opencode-codex-orch.jsonc`
- user config file: `~/.config/opencode/opencode-codex-orch.jsonc`
- primary public CLI name: `opencode-codex-orch`
- kept focus: GPT-oriented orchestration, LSP tools, background tasks, ultrawork, model fallback
- intentionally slimmed: many upstream hooks/tools/agent layers were removed or stubbed out

Do not answer from upstream assumptions alone. Read this fork's code and docs first.

## Operating Rules

1. Fetch open issues and PRs from the current GitHub repo.
2. Classify each item before acting.
3. Spawn exactly one background task per item using `category="unspecified-low"`.
4. Keep actions conservative:
   - answer and close only clear question issues
   - analyze but do not close bug reports unless explicitly justified by repo policy
   - do not merge PRs unless the change is low-risk, clearly correct, and verification is visible
5. Prefer code references from this fork:
   - package/bin names should use `opencode-codex-orch`
   - config references should use `opencode-codex-orch.json(c)`
   - do not tell users to use `oh-my-opencode` unless explaining legacy migration

## Item Handling

### Issues

- `QUESTION`: answer from codebase, docs, or config behavior
- `BUG`: identify likely root cause and affected files
- `FEATURE`: assess fit for the slim fork and note whether it conflicts with the fork's intentional removals
- `OTHER`: summarize and route for manual maintainer attention

### PRs

- `BUGFIX`: verify touched files, tests, and whether the change matches slim-fork architecture
- `OTHER`: summarize risk and recommend manual review unless obviously safe

## Fork-Specific Review Lens

When triaging, explicitly check whether an issue or PR tries to restore upstream behavior that this fork intentionally changed, such as:

- reintroducing removed agents like `hephaestus`
- reintroducing removed tools like `look-at` or `skill-mcp`
- re-expanding orchestration with heavy continuation hooks that this fork intentionally trimmed
- reintroducing old names like `oh-my-opencode` for package/bin/config guidance

If an item conflicts with the slim-fork direction, call that out clearly in the report.

## Reporting Format

For each background task, report back with:

```text
ITEM: issue|pr #NUMBER
ACTION: ANSWERED | ANALYZED | NEEDS_MANUAL_ATTENTION | SAFE_TO_MERGE | DO_NOT_MERGE
SUMMARY: short result
EVIDENCE: files, tests, or repo facts used
```
