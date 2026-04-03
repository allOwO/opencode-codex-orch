export const SKILL_CREATOR_TEMPLATE = `# Skill Creator Command

Load the built-in skill-creator skill for OpenCode-specific scope, packaging, discovery, and validation.

## How To Use This Command

1. Call the skill tool with the built-in skill name:

\`skill(name="skill-creator")\`

2. After the skill loads, use its guidance to:
   - choose between a local \`SKILL.md\` skill and a built-in TypeScript skill
   - pick the narrowest reuse scope
   - write minimal metadata and focused instructions
   - validate the skill with explicit invocation

## Scope

The loaded skill covers OpenCode-specific scope, packaging, discovery, and validation. Do not duplicate general authoring doctrine from writing-skills.

## User Context

Treat any command arguments as the user's goal or context for the skill work.

## Action

Call \`skill(name="skill-creator")\` now, then continue using the loaded guidance and the user's request.`
