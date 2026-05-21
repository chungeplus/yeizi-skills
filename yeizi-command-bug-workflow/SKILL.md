---
name: "yeizi-command-bug-workflow"
description: "Use when the user explicitly invokes `/yeizi-command-bug-workflow` for a complex bug, technical problem, debugging task, or uncertainty-heavy repair with cross-module risk, architectural impact, or an unclear fix path."
---

# Yeizi Command Bug Workflow

This is a command-triggered workflow for complex bug diagnosis and repair. Use it only when the user explicitly invokes `/yeizi-command-bug-workflow`.

## Trigger Rules

- Trigger only on explicit `/yeizi-command-bug-workflow` use.
- Standard form: `/yeizi-command-bug-workflow <task>`
- Use it for debugging, root-cause analysis, uncertain fixes, regressions, and cross-module repair work.
- If the user invokes it for a small, obvious, low-risk bug or repair, compress only the visible ceremony and non-essential steps. Do not skip evidence gathering, challenge passes, or meaningful validation when they materially improve correctness.

## Primary Fit

- complex bugs with unclear root cause
- regressions where the failing change is not immediately obvious
- technical problems with multiple plausible explanations
- repairs that may affect nearby behavior or multiple modules
- situations where correctness matters more than speed

## Not The Primary Fit

- requirement discovery or product scoping
- feature ideation or trade-off exploration before implementation starts
- user-flow clarification that depends on repeated product decisions from the user
- open-ended planning where the core task is to decide what to build rather than why it is broken

## Default Stance

- Be result-oriented. If the user expects a fix, diagnose, change, and validate instead of stopping at analysis.
- Keep the heavy workflow mostly internal. Think deeply, but do not dump the full reasoning trace, terminal log, or step-by-step scratch work into the user-facing reply.
- Prioritize correctness over speed, token thrift, or minimal effort. It is acceptable to spend more time and tokens if that materially increases confidence.
- Prefer the best-evidenced path over the fastest path. Do not treat a plausible explanation as sufficient just because it looks likely.
- If the user already proposed a concrete and viable fix direction, treat that as a candidate path and verify it in code before committing to it over alternatives.

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

### 1. Parse the Reported Bug

Privately determine:

- observed failure or reported symptom
- expected behavior or repair goal
- affected surface area that is known so far
- constraints
- likely success boundary
- what is clear already vs what is still underspecified in the report

Do not jump to root cause here. This step is for establishing a useful initial search boundary, not for confirming why the bug exists.

Do not mirror this checklist back to the user unless they asked for a plan.

### 2. Sense the Relevant Environment

Collect information in this order:

1. current code, config, tests, and workspace patterns
2. official docs or standards when needed
3. outside references only when they materially affect correctness

Sense the environment narrowly and deliberately. Start from the modules, files, flows, logs, state transitions, or recent changes most likely connected to the reported bug instead of broadly scanning the whole project.

For each decision-relevant conclusion, identify whether it comes from source code, config, tests, runtime output, docs, or a still-unverified inference.

Do not treat "looks plausible" as enough evidence for a root cause. If evidence is weak, keep the conclusion provisional and continue inspecting.

If the initial search boundary appears wrong or too narrow, expand it deliberately and update the working understanding of the bug rather than staying anchored to the first interpretation.

Summarize findings for the user. Do not narrate raw command output unless the exact output is the point.

### 3. Refine the Problem Definition and Form Working Hypotheses

After environment sensing, update the internal understanding of the bug:

- what the failure now appears to be
- what expected behavior should be restored
- which parts are confirmed facts
- which parts remain unknown
- what the current leading explanation is
- what at least one competing explanation is

Do not keep the original user report frozen if the environment shows a more precise problem definition.

### 4. Converge on the Repair

Run at least one internal challenge pass:

- what is the simplest viable repair if the leading explanation is correct
- what could make the leading explanation wrong
- what evidence would disprove it
- what evidence, if found, would strengthen the competing explanation

Do not treat "not yet disproved" as equivalent to "confirmed." If the competing explanation still fits the observed facts, continue gathering evidence or state the remaining uncertainty explicitly.

If the user's proposed direction still holds up after challenge and evidence review, proceed with it.

### 5. Implement

Make the smallest coherent repair that solves the actual issue.

Do not mix confirmed fixes with speculative cleanup in the same repair path. Avoid bundling "while here" changes that are not needed to resolve the diagnosed issue.

If new facts discovered during implementation invalidate the chosen path, loop back internally and adjust. Do not restart the whole visible workflow unless the user needs to make a decision.

### 6. Validate

Run the validation that most directly proves or disproves the diagnosis and fix first, then broaden validation until confidence is proportional to the risk.

Always check:

- the original failure mode
- the expected success path
- obvious regressions near the touched area

State clearly which parts were:

- confirmed by static inspection
- confirmed by execution or test results
- not verified and therefore still carry uncertainty

If the available environment or evidence is insufficient for a high-confidence conclusion, say so explicitly instead of implying the fix is fully validated.

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

- `docs/decision-records/yeizi-command-bug-workflow.md`

Do not create or update the record for every invocation by default.

## Do

- think broadly, speak concisely
- inspect before proposing
- anchor key conclusions to evidence whenever possible
- challenge the leading explanation before committing to it
- implement the most defensible repair when it is safe
- ask for confirmation only when the choice is real
- summarize findings instead of replaying the whole investigation

## Don't

- do not force a complex-looking write-up for every complex task
- do not trade away correctness for speed when the task is uncertain or high-risk
- do not ask the user to choose among options you can rule out yourself
- do not surface internal checklists as user-facing sections by default
- do not turn routine implementation details into decision points
- do not present unverified inferences as confirmed facts
- do not describe static review as runtime validation
- do not turn this workflow into a requirement-definition or product-scoping process
- do not stop at analysis when the user expects a repair

## One-Sentence Rule

When the user explicitly invokes `/yeizi-command-bug-workflow`, do the necessary deep work internally, favor evidence and challenge over speed, then diagnose, repair, and validate the fix while keeping the user-facing communication concise and decision-focused.
