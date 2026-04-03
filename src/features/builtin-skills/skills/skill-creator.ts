import type { BuiltinSkill } from "../types"

export const skillCreatorSkill: BuiltinSkill = {
  name: "skill-creator",
  description:
    "Use when creating, refining, or migrating a reusable skill for OpenCode, especially when deciding between a local SKILL.md skill and a built-in TypeScript skill.",
  template: `# Skill Creator

Create or refine reusable skills for this plugin. This skill covers OpenCode-specific scope, packaging, discovery, and validation. For general skill-writing doctrine, use writing-skills.

## Workflow

1. Define one narrow job for the skill.
2. Choose the narrowest scope that matches who should reuse it.
3. Write minimal metadata and focused instructions.
4. Test with explicit invocation on a realistic task.
5. Trim until the skill is concise, discoverable, and reliable.

## Scope

- .agents/skills/<name>/SKILL.md — repo-local generic skill
- .opencode/skills/<name>/SKILL.md — repo-local OpenCode-specific skill
- ~/.agents/skills/<name>/SKILL.md — user-level generic skill
- ~/.config/opencode/skills/<name>/SKILL.md — user-level OpenCode-specific skill
- built-in TypeScript skill — when the plugin itself should ship the skill

Prefer the narrowest scope that matches intended reuse.

## Local Skill Format




---
name: my-skill
description: Use when [specific trigger or situation].
tools: [Read, Write]
---

# My Skill

Tell the agent what to do, what to avoid, and how to verify completion.




Guidelines:
- \`name\`: short, stable, kebab-case
- \`description\`: describe when to invoke, not the workflow
- \`tools\`: include only what is truly needed
- \`mcp\`: add only when external capability is required

## Built-In Skill Pattern

For built-in skills in this repo:
- export a \`BuiltinSkill\`
- provide \`name\`, \`description\`, and a concise \`template\`
- write for explicit invocation
- register it so it appears in discovery

## Validation

- invoke explicitly with \`skill(name="your-skill")\`
- test it on a realistic task
- run \`bunx opencode-codex-orch validate-skill <skill-dir>\`
- use \`eval-skill <skill-dir> --eval-file <path>\` for evals
- use \`grade-skill-eval <report.json>\` to re-grade saved evals

## Do Not

- duplicate general authoring doctrine from writing-skills
- create broad catch-all skills
- assume skills are auto-injected
- include unnecessary tools or MCP requirements`,
}
