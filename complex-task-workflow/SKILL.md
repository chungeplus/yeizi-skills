---
name: "complex-task-workflow"
description: "Use when the user explicitly invokes `/complex-task-workflow` for a complex bug, technical problem, or uncertainty-heavy implementation task with cross-module risk, architectural impact, or unclear repair path."
---

# Complex Task Workflow

This is a command-triggered workflow for complex software tasks. Use it only when the user explicitly invokes `/complex-task-workflow`.

## Trigger Rules

- Trigger only on explicit `/complex-task-workflow` use.
- Standard form: `/complex-task-workflow <task>`
- If the user invokes it for a small, obvious, low-risk change, compress the workflow to the minimum useful path.

## Default Stance

- Be result-oriented. If the user expects a fix, inspect, change, and validate instead of stopping at analysis.
- Keep the heavy workflow mostly internal. Think deeply, but do not dump the full reasoning trace, terminal log, or step-by-step scratch work into the user-facing reply.
- Prefer acting on the most likely correct path over presenting a menu of possibilities.
- If the user already proposed a concrete and viable direction, treat that as the default path and verify it in code before considering alternatives.

## What Counts as a Real Decision

Elevate something into a user-visible decision only if it would materially change one of these:

- the implementation direction
- the success boundary
- the required validation
- the risk profile in a way the user should consciously approve

Do not elevate ordinary implementation details into a decision. Examples:

- package placement
- local version pinning
- small config shape changes
- obvious dependency compatibility repairs
- routine refactors that do not change product behavior

If one option is clearly best after inspection, choose it and move forward.

## User Confirmation Rules

Ask the user only when at least one of these is true:

- multiple options remain genuinely equal after self-review
- the choice affects product behavior, architecture, or maintenance cost in a non-obvious way
- the needed information cannot be inferred safely from the codebase, docs, or the user request
- the proposed change has destructive or hard-to-reverse consequences

When user confirmation is not required:

- do not ask a question just to show thoroughness
- do not output A/B/C options for completeness
- do not ask the user to choose among options you can eliminate yourself

When user confirmation is required:

- ask one narrow question
- include the recommendation
- keep alternatives brief
- ask only after you have already inspected the codebase and ruled out the easy path

## Internal Workflow

### 1. Frame the Task Internally

Privately determine:

- goal
- constraints
- likely success boundary
- minimal validation target

Do not mirror this checklist back to the user unless they asked for a plan.

### 2. Inspect Before Deciding

Collect information in this order:

1. current code, config, tests, and workspace patterns
2. official docs or standards when needed
3. outside references only when they materially affect correctness

Summarize findings for the user. Do not narrate raw command output unless the exact output is the point.

### 3. Converge Internally

Run at least one internal challenge pass:

- what is the simplest viable repair
- what could make it wrong
- what evidence would disprove it

If the user's proposed direction still holds up, proceed with it.

### 4. Implement

Make the smallest coherent change that solves the actual issue.

If new facts discovered during implementation invalidate the chosen path, loop back internally and adjust. Do not restart the whole visible workflow unless the user needs to make a decision.

### 5. Validate

Run the narrowest meaningful validation first, then broaden only if risk justifies it.

Always check:

- the original failure mode
- the expected success path
- obvious regressions near the touched area

## Communication Contract

Default user-facing style:

- short progress updates
- concise summaries of findings
- clear statement of the chosen path
- concrete validation results

Do not:

- paste long execution traces into the response
- echo the full workflow headings such as "Define the Task" or "Identify Key Decisions" unless the user explicitly wants a formal write-up
- present candidate options when no decision is needed from the user
- expose chain-of-thought style internal deliberation

## Output Shape

By default, keep the visible output close to this shape:

1. what was wrong
2. what you changed
3. how you validated it
4. any remaining risk or one blocking question

Only include options, trade-offs, or a decision record when they are genuinely needed for the task.

## Reuse and Recording

Record a reusable decision only when the conclusion is likely to matter again. Keep records concise and avoid creating paperwork for routine fixes.

Use this path when a reusable record is warranted:

- `docs/decision-records/complex-task-workflow.md`

Do not create or update the record for every invocation by default.

## Do

- think broadly, speak concisely
- inspect before proposing
- implement the user's likely intent when it is safe
- ask for confirmation only when the choice is real
- summarize findings instead of replaying the whole investigation

## Don't

- do not force a complex-looking write-up for every complex task
- do not ask the user to choose among options you can rule out yourself
- do not surface internal checklists as user-facing sections by default
- do not turn routine implementation details into decision points
- do not stop at analysis when the user expects a repair

## One-Sentence Rule

When the user explicitly invokes `/complex-task-workflow`, do the necessary deep work internally, then implement and validate the fix while keeping the user-facing communication concise and decision-focused.
