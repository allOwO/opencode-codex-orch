---
name: git-commit
description: "MUST USE for committing changes. Atomic commits, dependency ordering, style detection. Triggers: 'commit', 'stage', 'add files'."
---

This skill has been split into three focused skills:
- **git-commit**: Atomic commits, style detection, fixup workflows
- **git-rebase**: Rebase, squash, history cleanup
- **git-search**: Blame, bisect, history search

Each is loaded independently based on the user's request, saving ~80% tokens vs the old monolithic git-master skill.
