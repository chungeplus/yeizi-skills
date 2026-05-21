---
name: "yeizi-command-bug-workflow"
description: "Use when the user explicitly invokes `/yeizi-command-bug-workflow` for a complex bug, regression, or technical repair where the failure is real, but the root cause or safest fix path is still unclear."
---

# Yeizi Command Bug Workflow

This is a command-triggered repair workflow for complex software bugs. Use it only when the user explicitly invokes `/yeizi-command-bug-workflow`.

## Trigger Rules

- Trigger only on explicit `/yeizi-command-bug-workflow` use.
- Standard form: `/yeizi-command-bug-workflow <task>`.
- If the command body is brief but the current thread already makes the bug target obvious, continue from context.
- Ask only if the actual target bug is still unclear after inspecting the current context.

## Primary Fit

- complex bugs with unclear root cause
- regressions where the breaking change is not immediately obvious
- technical failures with multiple plausible explanations
- repairs that may touch multiple modules, state transitions, or call chains
- situations where correctness matters more than speed

## Not The Primary Fit

- requirement discussion
- product scoping
- feature ideation before implementation starts
- open-ended planning where the core task is deciding what to build rather than why something is broken

## Core Stance

- This is a repair workflow, not a requirement-discussion workflow.
- If the user expects a fix, keep going through diagnosis, implementation, and validation instead of stopping at analysis.
- Prioritize correctness over speed, token thrift, or minimal effort.
- Do not treat "looks plausible" as good enough.
- Do not ask the user to choose among repair options you can eliminate yourself.
- Keep the heavy thinking internal. The visible output should stay concise and decision-focused.

## Internal Workflow

### 1. Take the Bug Report

Start from the user-reported failure, not from your own guess.

At this step, receive and hold onto:

- the reported failure or symptom
- the user's current description of what is wrong

Do not judge root cause here.

Do not enter repair here.

### 2. Light-Parse the Bug and Repair Target

Based only on the current bug report, privately determine:

- the expected behavior
- the repair goal
- the currently known affected surface area
- the constraints already visible in the request
- the most useful place to start looking next

Do not fully define the bug here.

The point of this step is only to choose where to start looking, not to fully define the problem yet.

### 3. Sense the Relevant Environment

Collect information in this order:

1. current code, config, tests, logs, and workspace patterns
2. official docs or standards when needed
3. outside references only when they materially affect correctness

Start narrowly and deliberately. Prefer the modules, files, flows, logs, state transitions, recent changes, and tests most likely connected to the reported failure.

For every decision-relevant conclusion, track whether it comes from:

- source code
- config
- tests
- runtime output
- docs
- or an inference that is still not verified

If the initial search boundary looks wrong or too narrow, expand it on purpose instead of staying anchored to the first guess.

Summarize findings for the user. Do not dump raw command output unless the exact output is the point.

Do not leave this step until the following are clear enough:

- you can point to one or more likely failure regions instead of only broad module names
- you can separate current facts from current guesses
- you can describe roughly which behavior should be restored

It is also better if you can say what the next best place to inspect would be if you had to keep digging.

If the first three are not clear enough, keep sensing. Do not enter full problem definition yet.

### 4. Fully Define the Problem and Repair Target

After looking at the environment, privately update the bug definition:

- what the actual failure now appears to be
- what behavior should be restored
- which parts are confirmed facts
- which parts remain unknown
- what the current evidence says about the affected area
- where the repair goal should stop

Do not convert a possible explanation into a confirmed root cause just because it sounds reasonable.

Do not decide the fix path yet. This step is only for defining the bug and the repair target more accurately.

### 5. Generate the Repair Path Through an Advocate/Skeptic/Arbiter Loop

Once the problem definition is stable enough, generate candidate repair paths.

First, let the primary agent prepare a context pack for the repair debate. That pack should at least include:

- the working result from Steps 1-4
- the current problem definition
- the confirmed facts
- the still-unknown parts
- the currently supported affected area

Then create three distinct sub-agents:

- **Advocate** proposes the current best repair path and explains why it should work.
- **Skeptic** attacks that path, looking for holes, missing cases, false premises, and cheaper or safer alternatives.
- **Arbiter** decides whether the Skeptic has raised something new that still matters, or whether the current rebuttal has already been answered well enough.

Let those three sub-agents run the debate loop. The primary agent should not interfere round by round. It should wait for the cleaned result to come back.

Keep looping while the Skeptic can still raise a new substantial rebuttal.

A substantial rebuttal should be something like:

- the current path cannot actually achieve the repair goal
- the current path depends on a premise that still has not been established
- the current path misses a high-risk branch, failure mode, or regression surface
- there is a materially safer, simpler, or easier-to-verify alternative

You may stop the loop when:

- there is no longer a new substantial rebuttal
- the current rebuttal has already been answered well enough
- two consecutive rounds add nothing that would change the next-step judgment
- continuing would only repeat earlier points without improving the decision

Do not stop the loop just to save time or tokens if the Skeptic is still surfacing decision-relevant problems.

When the loop ends, carry forward a cleaned conclusion, not a raw round-by-round transcript.

That conclusion should at least retain:

- the chosen repair path
- the main objections that survived or were answered
- any important remaining uncertainty
- why this path won over the other live candidates

### 6. Check Feasibility Before Touching Code

Before implementing, check whether the chosen repair path can actually be carried out in the current project.

Look at things like:

- whether the current environment supports the repair
- whether required dependencies or premises are actually present
- whether the path would break nearby behavior or system constraints
- whether an unresolved Skeptic objection still blocks implementation

If feasibility fails, do not blur all failures together:

- If the **repair path itself does not work**, return to Step 5.
- If the **environment still is not clear enough**, return to Step 3, keep sensing, and then re-run Step 4.

### 7. Implement With Tight Local Checks

This step has two substeps and may loop.

#### 7A. Implement the Repair

Make the smallest coherent repair that solves the issue.

Rules:

- use the least code that actually solves the problem
- do not add extra features
- do not create one-off abstraction for its own sake
- do not add flexibility or configurability the task does not need
- touch only what must be touched
- do not "clean up" nearby code just because you are there
- do not refactor healthy code
- match the existing code style
- remove orphaned imports, variables, or functions created by the repair

#### 7B. Run the Closest Local Checks

Run small, direct checks that are most likely to catch whether this round of implementation is broken.

Do not force one fixed checklist on every project.

Use the checks that best fit the current codebase and current change, such as:

- file-level or function-level review for leftover mistakes
- the local path most directly affected by the repair
- the nearest relevant test
- compile/build checks if this project has them
- unit or local integration tests if this project has them

The goal is not to run everything. The goal is to quickly catch obvious problems in the current repair round.

If these local checks fail, go back to 7A and continue repairing.

Step 7 does **not** get to declare the bug fixed. It only gets to declare that the current implementation round is locally clean enough to move on.

### 8. Validate the Repair

This is the step that determines whether the bug is actually fixed.

Validation should cover at least:

- the original failure path
- the restored success path
- obvious regressions near the touched area
- other behavior directly tied to the repair target

Be explicit about what was confirmed by:

- static inspection
- execution or test results
- and what still has not been verified

If validation fails, route the failure correctly:

- If it is a **repair-path problem**, return to Step 5.
- If it is an **implementation problem**, return to Step 7.
- If it is still an **environment understanding problem**, return to Step 3, keep sensing, and then re-run Step 4.

Only Step 8 is allowed to conclude whether the bug is really fixed.

### 9. Deliver the User-Facing Result

After validation, turn the repair result into the final user-facing answer.

That answer should make these things clear:

- whether the bug is actually fixed now
- what the problem was
- how it was fixed
- what changed or what areas were affected
- why you can now say it is fixed, or why you still cannot say that yet

Do not pour the whole investigation back onto the user.

Do not expand the testing process for its own sake, but do make the judgment basis clear enough that the user can understand why this result is being claimed.

## Communication Contract

Default user-facing style:

- short progress updates
- concise findings
- clear statement of the current repair path
- clear statement of whether the bug is fixed yet

Do not:

- paste long execution traces
- expose chain-of-thought style internal reasoning
- force the full workflow headings into the reply unless the user explicitly wants a formal write-up
- turn routine implementation details into user-facing decision points

## Default Output Shape

By default, keep the visible output close to this shape:

1. whether the bug is fixed now
2. what was wrong
3. how you fixed it
4. what changed or what areas were affected
5. why you can now say it is fixed, or why you still cannot say that yet

Do not dump the full testing process unless it is necessary to explain why the repair is still uncertain.

## Reuse and Recording

Record a reusable decision only when the conclusion is likely to matter again.

Use this path when a reusable record is warranted:

- `docs/decision-records/yeizi-command-bug-workflow.md`

Do not create or update that record for every routine use.

## Do

- think broadly and speak concisely
- inspect before proposing
- keep facts separate from guesses
- challenge the leading repair path before committing to it
- keep Step 7, Step 8, and Step 9 distinct
- keep going through implementation and validation when the user expects a fix

## Don't

- do not turn this into a requirement-definition workflow
- do not stop at analysis when the user expects repair
- do not present unverified inference as confirmed fact
- do not skip feasibility or validation
- do not say the bug is fixed before Step 8 supports that conclusion
- do not ask the user to pick among options you can already rule out
- do not replay the full internal debate transcript back to the user

## One-Sentence Rule

When the user explicitly invokes `/yeizi-command-bug-workflow`, lightly parse the bug report, sense the relevant environment, fully define the problem, challenge the repair path through an Advocate/Skeptic/Arbiter loop, check feasibility, implement with tight local checks, validate the result, and then tell the user whether the bug is fixed and why you can say so.
