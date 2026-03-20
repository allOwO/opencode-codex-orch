import type { BuiltinSkill } from "../types"

export const skillCreatorSkill: BuiltinSkill = {
  name: "skill-creator",
  description:
    "Creates concise SKILL.md-based skills for this plugin, with explicit invocation guidance, local scope placement, and an iteration workflow adapted from Anthropic's skill-authoring style.",
  template: `# Skill Creator

Create small, reusable skills for this plugin's skill system. Keep them focused, explicit, and easy to invoke.

## What This Plugin Does Differently

- Built-in skills here are TypeScript metadata plus a prompt template, not giant always-on instructions.
- They are listed by metadata and loaded on demand through the \`skill\` tool, rather than injected into every chat.
- Explicit invocation matters: use \`skill(name="skill-creator")\` to load this guidance, then call other skills the same way.
- Local skills are usually directory-based and loaded from \`.opencode/skills/\`, \`~/.config/opencode/skills/\`, legacy Claude paths like \`.claude/skills/\` and \`~/.claude/skills/\`, plus the project's \`.agents/skills/\` paths when present.

## When To Use This Skill

Use this when you need to create, refine, or migrate a reusable skill instead of repeating the same instructions in normal chat.

## Workflow

1. Define one narrow job for the skill. Split unrelated responsibilities.
2. Pick a clear name and write a description that explains when to invoke it.
3. Decide whether it should be a local SKILL.md skill or a built-in TypeScript skill.
4. Write the instructions, test them with explicit invocation, then tighten the prompt until it is short and reliable.

## SKILL.md Frontmatter

For local skills, create a directory named after the skill and add \`SKILL.md\` with YAML frontmatter.

\`\`\`markdown
---
name: my-skill
description: One sentence that tells the agent exactly when to call this skill.
tools: [Read, Write]
---

# My Skill

Tell the agent what to do, what to avoid, and how to verify completion.
\`\`\`

Guidelines:

- \`name\`: short, kebab-case, stable, and action-oriented.
- \`description\`: mention the trigger or situation, not just the topic.
- \`tools\`: list only the tools the skill truly needs.
- \`mcp\`: add only when the skill genuinely needs external capabilities.

## Writing Strong Descriptions

Good descriptions help the model choose the skill from the metadata list. Make them:

- Specific about the task or trigger
- Short enough to scan quickly
- Honest about scope and limitations

Prefer: \`Creates and refines SKILL.md-based skills with explicit invocation and testing guidance.\`

Avoid: \`Helpful skill for skills.\`

## Explicit Invocation

- Built-in and local skills are intended to be called explicitly with \`skill(name="...")\`.
- The metadata list in the tool description is the discovery surface; the full prompt loads only when invoked.
- Do not assume automatic context injection for built-in skills in this plugin.

## Choosing A Scope

- \`.opencode/skills/<skill-name>/SKILL.md\`: project-specific OpenCode skill
- \`~/.config/opencode/skills/<skill-name>/SKILL.md\`: reusable OpenCode user skill
- \`.claude/skills/<skill-name>/SKILL.md\` or \`~/.claude/skills/<skill-name>/SKILL.md\`: Claude-compatible local skill locations that this loader can still discover
- \`.agents/skills/<skill-name>/SKILL.md\` or \`~/.agents/skills/<skill-name>/SKILL.md\`: additional compatible local sources
- Built-in TypeScript skill: use when the plugin itself should ship the skill metadata and prompt

Prefer the narrowest scope that matches who should reuse it.

## Built-In Skill Pattern In This Repo

Follow the existing built-in pattern used by files like \`frontend-ui-ux.ts\`:

- export a \`BuiltinSkill\` object
- provide \`name\`, \`description\`, and a concise \`template\`
- keep it prompt-only unless MCP is truly required
- write for explicit invocation, not automatic injection

## Testing And Iteration

1. Create or update the skill.
2. Invoke it explicitly with \`skill(name="your-skill")\`.
3. Give it a realistic task.
4. Check whether the agent used the right tools, followed the scope, and stayed concise.
5. Trim vague wording, remove redundant rules, and retest.
6. Use \`bunx opencode-codex-orch validate-skill <skill-dir>\` for structural checks, \`eval-skill <skill-dir> --eval-file <path>\` to run explicit-invocation evals, and \`grade-skill-eval <report.json>\` to re-grade saved reports.
7. Start from the official examples in \`docs/examples/skill-creator/evals.json\` or \`docs/examples/skill-creator/evals.yaml\` when creating your first eval suite.

## Limitations

- This plugin does not mirror Anthropic's entire upstream skill system or auto-attach a huge authoring prompt to every conversation.
- Built-in skills still need to be registered by the plugin to appear in discovery.
- Local skills must live in supported directories and use valid SKILL.md frontmatter to be discovered.

Aim for compact prompts that teach a repeatable workflow, not massive catch-all instructions.`,
}
