---
name: merge-upstream
description: Guides agents on how to merge updates from the upstream oh-my-openagent repository into this GPT-slim fork without undoing fork-specific decisions.
---

# Merge Upstream

## Background

This repository is not a lightly branded mirror. It is an opinionated fork with its own package, CLI, config naming, and project boundaries.

Current fork identity:

- package: `opencode-codex-orch`
- CLI: `opencode-codex-orch`
- platform packages: `opencode-codex-orch-*`
- project config: `.opencode/opencode-codex-orch.jsonc`
- user config: `~/.config/opencode/opencode-codex-orch.jsonc`
- upstream source of truth for comparison: `code-yeongyu/oh-my-openagent`

This fork keeps the GPT/Codex-oriented workflow and aggressively avoids reintroducing heavy or redundant upstream behavior unless it clearly improves the slim fork.

## Merge Contract

Never treat upstream as automatically correct for this fork. Merge by intent, not by diff size.

### Always preserve fork identity

Reject upstream changes that would revert any of the following back to upstream naming or behavior:

- package/bin names back to `oh-my-opencode`
- config basename back to `oh-my-opencode.json(c)`
- plugin install guidance back to `oh-my-opencode`
- platform package names back to `oh-my-opencode-*`

### Preserve the slim architecture

This fork intentionally stays small. Do not blindly restore deleted or hollowed-out systems.

Areas that need special scrutiny during merges:

- large continuation or babysitting hook systems
- Anthropic-specific prompt patches and reasoning-control layers
- extra agent layers that duplicate Sisyphus-led workflows
- heavy tools or monitoring behavior that increase token use or tool noise

### Current kept hook surface

The kept hook exports currently include only the slim set in `src/hooks/index.ts`, including:

- `auto-update-checker`
- error recovery and fallback hooks
- directory injectors
- hashline enhancers
- output truncation and write guards

If upstream modifies other hook families, assume they are out of scope unless you verify they were intentionally reintroduced in this fork.

### Current kept tool surface

The public tool layer is intentionally focused. Verify against `src/tools/index.ts` and the current tool registry before accepting upstream tool additions.

## Merge Strategy

1. Compare upstream change intent with current fork intent.
2. Accept current fork naming and structure by default in conflict-heavy files.
3. Cherry-pick only the upstream logic that still makes sense for this fork.
4. Re-run verification after every substantial merge step.

## Files That Often Need Fork-First Conflict Resolution

- `package.json`
- `bin/`
- `packages/*/package.json`
- `src/cli/`
- `src/plugin-config.ts`
- `src/shared/opencode-config-dir.ts`
- `src/hooks/index.ts`
- `src/tools/index.ts`
- publish workflows and publish scripts

## Verification Checklist

After merging upstream changes:

1. Run `bun run typecheck`
2. Run `bun run build`
3. Run targeted tests for touched areas
4. If platform packaging changed, run `bun run build:binaries`
5. Confirm naming is still fork-specific:
   - package/bin names use `opencode-codex-orch`
   - config basename uses `opencode-codex-orch.json(c)`
   - docs do not regress to upstream install instructions

## Decision Rule

If a change is useful but conflicts with the slim design, port the minimum viable logic instead of restoring the full upstream subsystem.
