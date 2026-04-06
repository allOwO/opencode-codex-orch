# Manifesto

The principles and philosophy behind opencode-codex-orch.

---

## Human Intervention is a Failure Signal

**HUMAN IN THE LOOP = BOTTLENECK**

Think about autonomous driving. When a human has to take over the wheel, that's not a feature. It's a failure of the system. The car couldn't handle the situation on its own.

**Why is coding any different?**

When you find yourself:
- Fixing the AI's half-finished code
- Manually correcting obvious mistakes
- Guiding the agent step-by-step through a task
- Repeatedly clarifying the same requirements

That's not "human-AI collaboration." That's the AI failing to do its job.

**opencode-codex-orch is built on this premise**: Human intervention during agentic work is fundamentally a wrong signal. If the system is designed correctly, the agent should complete the work without requiring you to babysit it.

---

## Indistinguishable Code

**Goal: Code written by the agent should be indistinguishable from code written by a senior engineer.**

Not "AI-generated code that needs cleanup." Not "a good starting point." The actual, final, production-ready code.

This means:
- Following existing codebase patterns exactly
- Proper error handling without being asked
- Tests that actually test the right things
- No AI slop (over-engineering, unnecessary abstractions, scope creep)
- Comments only when they add value

If you can tell whether a commit was made by a human or an agent, the agent has failed.

---

## Token Cost vs Productivity

**Higher token usage is acceptable if it significantly increases productivity.**

Using more tokens to:
- Have multiple specialized agents research in parallel
- Get the job done completely without human intervention
- Verify work thoroughly before completion
- Accumulate knowledge across tasks

That's a worthwhile investment when it means 10x, 20x, or 100x productivity gains.

**However:**

Unnecessary token waste is not pursued. The system optimizes for:
- Using cheaper models (Haiku, Flash) for simple tasks
- Avoiding redundant exploration
- Caching learnings across sessions
- Stopping research when sufficient context is gathered

Token efficiency matters. But not at the cost of work quality or human cognitive load.

---

## Minimize Human Cognitive Load

**The human should only need to say what they want. Everything else is the agent's job.**

In practice, that means the user can describe intent at whatever level they prefer:

- "I want to add authentication."
- "Fix the failing tests."
- "Refactor this module without changing behavior."

From there, the orchestration system should:

- Research the codebase to understand existing patterns
- Ask clarifying questions only when they are truly necessary
- Surface edge cases before they become bugs
- Turn intent into an executable plan when planning is needed
- Implement, verify, and keep going until the work is actually complete

**You provide intent. The agent provides structure and execution.**

---

## Predictable, Continuous, Delegatable

**The ideal agent should work like a compiler**: markdown document goes in, working code comes out.

### Predictable

Given the same inputs:
- Same codebase patterns
- Same requirements
- Same constraints

The output should be consistent. Not random, not surprising, not "creative" in ways you didn't ask for.

### Continuous

Work should survive interruptions:
- Session crashes? Resume with `/start-work`
- Need to step away? Progress is tracked
- Multi-day project? Context is preserved

The agent maintains state. You don't have to.

### Delegatable

Just like you can assign a task to a capable team member and trust them to handle it, you should be able to delegate to the agent.

This means:
- Clear acceptance criteria, verified independently
- Self-correcting behavior when something goes wrong
- Escalation (to Oracle, to user) only when truly needed
- Complete work, not "mostly done"

---

## The Core Loop

```
Human Intent → Agent Execution → Verified Result
       ↑                              ↓
       └──────── Minimum ─────────────┘
          (intervention only on true failure)
```

Everything in opencode-codex-orch is designed to make this loop work:

| Feature | Purpose |
|---------|---------|
| Orchestrator | Coordinate work without human micromanagement |
| Reviewer | Verify plans and implementation quality before completion |
| Oracle | Provide high-quality read-only consultation for hard decisions |
| Todo Continuation | Force completion, prevent "I'm done" lies |
| Category System | Route to optimal model without human decision |
| Background Agents | Parallel research without blocking user |
| Wisdom Accumulation | Learn from work, don't repeat mistakes |

---

## What This Means in Practice

**You should be able to:**

1. Describe what you want (high-level or detailed, your choice)
2. Let the agent clarify or plan only when needed
3. Confirm the plan when the workflow requires approval
4. Walk away
5. Come back to completed, verified, production-ready work

**If you can't do this, something in the system needs to improve.**

---

## The Future We're Building

A world where:
- Human developers focus on **what** to build, not **how** to get AI to build it
- Code quality is independent of who (or what) wrote it
- Complex projects are as easy as simple ones (just take longer)
- "Prompt engineering" becomes as obsolete as "compiler debugging"

**The agent should be invisible.** Not in the sense that it's hidden, but in the sense that it just works. Like electricity, like running water, like the internet.

You flip the switch. The light turns on. You don't think about the power grid.

That's the goal.

---

## Further Reading

- [Overview](./guide/overview.md)
- [Orchestration Guide](./guide/orchestration.md)
