# opencode-codex-orch AGENTS Guide

## Purpose

This file is for coding agents working in this repository.
It summarizes how to build, test, edit, and extend the project safely.

## Key Directories

```text
src/
  agents/            Agent factories and prompt builders
  hooks/             Hook implementations and guard logic
  tools/             Tool factories and tool implementations
  features/          Standalone feature modules
  plugin/            Hook composition and plugin wiring
  config/            Zod schema and config loading
  cli/               CLI entrypoints and doctor commands
  mcp/               Built-in MCP integrations
  shared/            Focused cross-cutting helpers
packages/            Platform/binary packages
script/              Build/test helper scripts
```

## External Rule Files

- No `.cursor/rules/` directory found
- No `.cursorrules` file found
- No `.github/copilot-instructions.md` file found

## Build, Typecheck, and Test Commands

Use Bun for everything. Do not use npm or yarn.

```bash
# install deps
bun install

# full test suite via repo script
bun run test

# run a single test file directly
bun test src/hooks/write-existing-file-guard/snapshot-behavior.test.ts

# run one isolated directory or one spec directly
bun test src/plugin-handlers
bun test src/cli/doctor/formatter.test.ts

# typecheck only
bun run typecheck

# build plugin, declarations, CLI, and schema
bun run build

# build everything including platform binaries
bun run build:all

# rebuild from scratch
bun run clean && bun run build

# regenerate schema only
bun run build:schema
```

## Test Runner Notes

- `bun run test` executes `script/test.ts`
- That script runs selected heavy specs in isolated Bun processes first
- Remaining test files are then batched together
- For local work, prefer `bun test path/to/file.test.ts`
- Bun preloads `test-setup.ts` via `bunfig.toml`

## Recommended Verification Flow

After changing code, usually run:

```bash
bun test path/to/changed.test.ts
bun run typecheck
bun run build
```

If you touched broad shared infrastructure, run `bun run test` too.

## Coding Standards

### Runtime and Types

- Bun is the only supported runtime and package manager
- Use `bun-types`, never `@types/node`
- TypeScript is `strict: true`
- Prefer explicit types when they clarify boundaries or return values
- Do not suppress type errors with `as any`, `@ts-ignore`, or `@ts-expect-error`

### Imports

- Use relative imports inside a module area
- Use barrel imports across module boundaries when that pattern already exists
- Do not add path aliases like `@/`
- Keep imports specific and local to the file's responsibility

### File and Module Structure

- Use kebab-case for file and directory names
- Follow `createXXX()` factory naming for tools, hooks, and agents
- Keep `index.ts` as an entrypoint or barrel only
- Avoid catch-all filenames such as `utils.ts`, `helpers.ts`, `service.ts`, or `common.ts`
- Prefer one responsibility per file
- Treat 200 logical lines as the splitting threshold for `.ts` and `.tsx` files unless the extra size is mostly prompt text

### Error Handling

- Never use empty catch blocks
- Handle errors explicitly or rethrow with context
- Prefer deterministic error messages for tool-facing behavior
- Do not hide failures just to make tests pass

### Formatting

- Follow the existing style in nearby files
- Preserve quote style, semicolon usage, and spacing conventions already present in the module
- Favor small focused functions over dense inline logic

## Testing Conventions

- Tests use `bun:test`
- Test files are co-located as `*.test.ts`
- Prefer `describe` and `test` names in given/when/then style
- Add or update the nearest relevant test when changing behavior

## Architecture Rules from `.sisyphus/rules/modular-code-enforcement.md`

- `index.ts` may only re-export, compose, or register modules
- No catch-all utility files
- Split files that mix unrelated responsibilities
- Separate I/O-heavy code from pure logic when practical
- If a touched file is too large or has multiple jobs, refactor first

## Project-Specific Guidance

- Plugin config is strict JSON, while OpenCode core config may still be JSONC
- Config keys in plugin config are snake_case
- Schema changes should be followed by `bun run build:schema`
- Built-in MCPs live in `src/mcp/`
- Hook registration lives under `src/plugin/hooks/`
- Tool registration lives in `src/plugin/tool-registry.ts`
- The logger writes to `/tmp/opencode-codex-orch.log`

## Safe Change Patterns

- Prefer minimal, local edits that match surrounding architecture
- Fix root causes, not superficial symptoms
- Do not modify `package.json` version locally
- Do not run `bun publish`; publishing is handled by GitHub Actions
- Do not commit unless explicitly asked

## Where to Start for Common Tasks

- Add a tool: `src/tools/` plus `src/plugin/tool-registry.ts`
- Add a hook: `src/hooks/` plus `src/plugin/hooks/create-*-hooks.ts`
- Add an agent: `src/agents/` and built-in agent registration
- Add config fields: `src/config/schema/` and root config schema wiring
- Add CLI behavior: `src/cli/`

## Final Checklist for Agents

Before finishing:

1. Read the files you are changing
2. Keep the design modular
3. Run targeted tests
4. Run `bun run typecheck`
5. Run `bun run build` if behavior or public types changed
6. Mention any pre-existing issues separately from your own changes
