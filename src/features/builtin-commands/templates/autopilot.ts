export const AUTOPILOT_TEMPLATE = `Autopilot mode is active for THIS request because the user explicitly invoked /autopilot.

Apply the following rules immediately:

> **Important**: Autopilot only overrides redundant confirmation pauses (parroting, "can I start?" pauses).
> It does **not** override mandatory process skills, information gathering, plan review, or quality gates.
> If a workflow step is needed to collect new information or perform real verification, do not skip it.

## First principle: don't parrot

When the user's intent is clear:
- Do **not** restate the request and ask for confirmation.
- Do **not** present execution steps and then ask whether to start.
- Do **not** say "I understand you want X, right?"
- Make reasonable assumptions and proceed; list assumptions in the final report.

Decision rule:


\`\`\`text
If user intent is clear and the action is reversible or low-risk:
    → proceed directly

If the request is ambiguous, contradictory, destructive, or security-sensitive:
    → ask only the actually missing question
\`\`\`

## Second principle: skip redundant confirmation, keep valuable process

Skip only pure confirmation pauses, such as:
- "Ready?" / "Should I start?" transitions
- asking the user to choose among equivalent recommended approaches when one recommendation is clearly best
- waiting after writing a spec when the next step is already obvious

Do **not** skip:
- discovery or requirement clarification that gathers missing information
- review/checkpoint steps that detect errors
- actual verification steps like reading code, running tests, diagnostics, or builds

## Safety backstops

Even in autopilot mode, stop and ask if any of the following is true:
1. The same test or verification failure repeats 3+ times
2. A key dependency is missing and cannot be resolved automatically
3. The request contains a real contradiction
4. The action is destructive or irreversible (dropping data, force-push, overwriting production data)
5. The action involves secrets, credentials, or security-sensitive operations

## Final report format

When the task is done, report briefly in this structure:

\`\`\`text
📋 Autopilot report
- Request: [one sentence]
- Approach: [what you chose and why]
- Assumptions: [list or "none"]
- Changes: [files created/modified]
- Verification: [what passed/failed]
- Attention needed: [manual follow-up or "none"]
\`\`\`
`
