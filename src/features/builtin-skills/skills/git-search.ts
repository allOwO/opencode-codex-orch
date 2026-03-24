import type { BuiltinSkill } from "../types"

export const gitSearchSkill: BuiltinSkill = {
  name: "git-search",
  description:
    "MUST USE for git history search, blame, bisect, and code archaeology. Triggers: 'git blame', 'bisect', 'who wrote', 'when was X added', 'find the commit that', 'git log -S', 'history of file'.",
  template: `# Git History Search

Find when/where/who introduced specific changes using the right git search tool.

## Tool Selection

| Goal | Command |
|------|---------|
| When was string added/removed | \\\`git log -S "string" --oneline\\\` |
| What commits touched a pattern | \\\`git log -G "regex" --oneline\\\` |
| Who wrote specific lines | \\\`git blame -L start,end file\\\` (\\\`-C\\\` for moved code, \\\`-w\\\` ignore whitespace) |
| Find bug-introducing commit | \\\`git bisect start && git bisect bad && git bisect good <ref>\\\` |
| File history (including renames) | \\\`git log --follow --oneline -- path\\\` |
| Find deleted file/code | \\\`git log -S "string" --all --oneline\\\` |

**Key: \\\`-S\\\` finds commits where the count of a string changed (add/remove). \\\`-G\\\` finds commits where the diff matches a pattern. Use \\\`-S\\\` for "when was X added", \\\`-G\\\` for "what touched lines containing X".**

## Workflow

1. Parse user request → pick the right tool from the table above
2. Scope the search: specific file (\\\`-- path\\\`), date range (\\\`--since\\\`), all branches (\\\`--all\\\`)
3. Run the command, present results with commit hash, date, author, message
4. Offer actionable follow-ups: \\\`git show <hash>\\\`, \\\`git revert <hash>\\\`, \\\`git cherry-pick <hash>\\\`

## Automated Bisect

When a test can detect the bug:
\\\`\\\`\\\`bash
git bisect start && git bisect bad HEAD && git bisect good <known-good>
git bisect run <test-command>
git bisect reset
\\\`\\\`\\\``,
}
