import type { BuiltinSkill } from "../types"

export const skillCreatorSkill: BuiltinSkill = {
  name: "skill-creator",
  description:
    "Use when creating, refining, or migrating a reusable skill for OpenCode, especially when deciding between a local SKILL.md skill and a built-in TypeScript skill.",
  template: `# Skill Creator

Create or refine reusable skills for this plugin. This skill is the single entry point for both skill-writing doctrine and OpenCode-specific scope, packaging, discovery, and validation.

## Iron Law

NO SKILL WITHOUT A FAILING TEST FIRST

Write the pressure scenario first. Watch the agent fail without the skill. Then write the minimum skill content that fixes the observed failure. If you wrote the skill before the test, delete it and start over.

## Description Rule

Description = When to Use, NOT What the Skill Does.

- Start with \`Use when...\`
- Describe triggers, symptoms, and situations
- Do not summarize the workflow in the description
- Include concrete keywords future agents would search for

## Workflow

1. Run a failing baseline scenario without the skill and capture the failure pattern.
2. Define one narrow job for the skill.
3. Choose the narrowest scope that matches who should reuse it.
4. Write minimal metadata and focused instructions that address the observed failure.
5. Re-run with explicit invocation and trim until the skill is concise, discoverable, and reliable.

## Searchability

- Use a short kebab-case name
- Put likely trigger words in the description and body
- Prefer one excellent example over many weak ones
- Keep the skill focused; broad catch-all skills are hard to discover and hard to trust

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
- watch the baseline fail before you write or edit the skill
- test it on a realistic task
- run \`bunx opencode-codex-orch validate-skill <skill-dir>\`
- use \`eval-skill <skill-dir> --eval-file <path>\` for evals
- use \`grade-skill-eval <report.json>\` to re-grade saved evals

## Red Flags - STOP and Start Over

- you wrote or edited the skill before running the baseline
- the description explains the workflow instead of the trigger
- the skill grew into a catch-all reference dump
- you are keeping text that does not address a tested failure or a concrete OpenCode integration need

## Do Not

- create broad catch-all skills
- assume skills are auto-injected
- include unnecessary tools or MCP requirements`,
}
