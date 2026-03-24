import type { BuiltinSkill } from "../types"

export const gitRebaseSkill: BuiltinSkill = {
  name: "git-rebase",
  description:
    "MUST USE for rebase, squash, history cleanup, and branch updates. Triggers: 'rebase', 'squash', 'cleanup history', 'rebase onto', 'autosquash', 'reorder commits'.",
  template: `# Git Rebase Surgeon

Rewrite history safely: squash, reorder, rebase onto, and resolve conflicts.

## Step 1: Assess Safety

Run: \\\`git branch --show-current\\\`, \\\`git log --oneline -20\\\`, \\\`git status --porcelain\\\`, \\\`git stash list\\\`

| Condition | Action |
|-----------|--------|
| On main/master | **ABORT** — never rebase main |
| Dirty working dir | \\\`git stash push -m "pre-rebase"\\\` first |
| Pushed commits | Warn: will need \\\`--force-with-lease\\\` |
| Local-only | Proceed freely |

## Step 2: Execute

**Squash all into one:**
\\\`\\\`\\\`bash
MERGE_BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)
git reset --soft $MERGE_BASE && git commit -m "<summary>"
\\\`\\\`\\\`

**Autosquash fixup commits:**
\\\`\\\`\\\`bash
GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash $MERGE_BASE
\\\`\\\`\\\`

**Rebase onto updated main:**
\\\`\\\`\\\`bash
git fetch origin && git rebase origin/main
\\\`\\\`\\\`

**Conflicts:** resolve → \\\`git add <file>\\\` → \\\`git rebase --continue\\\`. If stuck → \\\`git rebase --abort\\\`.

## Step 3: Verify & Push

\\\`\\\`\\\`bash
git status && git log --oneline $MERGE_BASE..HEAD
\\\`\\\`\\\`

- First push: \\\`git push -u origin <branch>\\\`
- After rewrite: \\\`git push --force-with-lease\\\` (never \\\`--force\\\`)
- Recovery: \\\`git reflog\\\` → \\\`git reset --hard <hash>\\\``,
}
