import type { BuiltinSkill } from "../types"

export const gitCommitSkill: BuiltinSkill = {
  name: "git-commit",
  description:
    "MUST USE for committing changes. Atomic commits, dependency ordering, style detection, fixup workflows. STRONGLY RECOMMENDED: Use with task(category='quick', load_skills=['git-commit'], ...) to save context. Triggers: 'commit', 'stage', 'add files', 'commit changes'.",
  template: `# Git Commit Architect

Create atomic, well-ordered commits that match the repo's existing style.

## Step 1: Gather Context (parallel)

Run in parallel:
- \\\`git status\\\`, \\\`git diff --staged --stat\\\`, \\\`git diff --stat\\\`
- \\\`git log -30 --oneline\\\` (for style detection)
- \\\`git branch --show-current\\\`, \\\`git merge-base HEAD main 2>/dev/null || git merge-base HEAD master\\\`
- \\\`git rev-parse --abbrev-ref @{upstream} 2>/dev/null\\\`

## Step 2: Detect Commit Style

From the last 30 commits, detect **language** (majority wins) and **style**:
- SEMANTIC: \\\`feat: ...\\\`, \\\`fix: ...\\\` etc.
- PLAIN: \\\`Add ...\\\`, \\\`Fix ...\\\`
- SHORT: \\\`format\\\`, \\\`lint\\\`

**All new commits MUST match detected style + language. Never default to semantic.**

## Step 3: Plan Atomic Commits

**HARD RULE — multiple commits by default:**
- 3+ files → 2+ commits
- 5+ files → 3+ commits
- 10+ files → 5+ commits on

**Split criteria (each → separate commit):**
- Different directories/modules
- Different concerns (UI / logic / config / test)
- Can be reverted independently

**Always combine:** implementation file + its test file.

**Justify:** For any commit with 3+ files, write one sentence explaining why they must be together. If you can't → split.

**Commit order:** foundations first (types, utils) → business logic → API/config.

## Step 4: Execute

For fixups to existing commits:
\\\`\\\`\\\`bash
git add <files> && git commit --fixup=<hash>
# After all fixups:
MERGE_BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)
GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash $MERGE_BASE
\\\`\\\`\\\`

For new commits:
\\\`\\\`\\\`bash
git add <files> && git commit -m "<message matching detected style>"
\\\`\\\`\\\`

## Step 5: Verify

\\\`\\\`\\\`bash
git status  # must be clean
git log --oneline $(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)..HEAD
\\\`\\\`\\\`

If fixups were used and branch has upstream → \\\`git push --force-with-lease\\\`.

## Safety Rules

- On main/master → new commits only, never rewrite history
- Pushed commits → warn before force push
- Local-only commits → free to fixup/reset/rebase
- Never make 1 giant commit from many files
- Never separate test from implementation`,
}
