---
name: dev-refine-and-self-review
description: |
  Use when a long software-delivery request signals post-task refinement, review, validation, or release-readiness work on the delivered result.
---

# Dev Refine And Self Review

It is a **keyword-triggered** post-task review skill. Its initial trigger is armed by a long software-delivery request plus an explicit review-oriented keyword, then executed only after the main long task has been completed. It also supports a narrow continuation mode for the immediately previous self-review result in the same thread. It does **not** require an explicit command such as `/dev-refine-and-self-review`, and it should not be used as a standalone user-triggered review command.

## Trigger Logic

Unless an exemption applies, activate this skill only through one of the two valid modes below.

### Mode A: Initial Trigger

Required conditions:

1. The current request includes a long software-delivery task that should be completed in the current workflow
2. The current request contains an explicit review-oriented keyword

### Mode B: Self-Review Continuation

Required conditions:

1. The immediately previous assistant turn already delivered a self-review from this skill
2. The very next user reply in the same thread clearly continues, accepts, or asks to execute that self-review suggestion
3. No unrelated task or topic change appears between the self-review and that follow-up reply

Do **not** wait for an explicit `/dev-refine-and-self-review` command. Do **not** activate this skill as a standalone manual review request from the user. Keywords alone are not enough for the initial trigger, and a long task without review-oriented keywords is not enough either. Continuation mode is allowed only for the immediately previous self-review in the same thread.

Typical deliverables include:

- PRDs, user stories, flows, acceptance criteria, release notes
- Prototypes, UI pages, design specs, component styles
- Frontend pages, components, state logic, API integration
- Backend APIs, services, scripts, jobs, database-related logic
- Test cases, validation notes, integration results, test/release instructions

Typical post-task keywords include refine, improve, polish, review, self-review, recheck, validate, prepare for testing, prepare for release, ready for testing, or ready for release.
Treat semantically equivalent Chinese phrasing the same way, such as `优化`, `完善`, `复查`, `自审`, `校验`, `提测前检查`, `发布前检查`, `准备提测`, `准备发布`, `可以提测了`, or `可以发布了`.
Do not treat broad delivery words such as continue, fix, complete, integrate, or migrate as standalone review triggers. They are too broad unless they are clearly part of an already active self-review continuation.

A long task does not only mean many lines changed. It can also mean completing a feature, bugfix pass, refactor step, page flow, integration milestone, testing pass, or release-prep step.

### Exemptions

- The user explicitly wants only the result, with no suggestions or extra commentary
- The final output must remain in a strict format such as pure JSON, pure patch, pure code, or a strict table
- The turn is only a greeting, yes/no answer, explanation, analysis, or brainstorming
- The change is genuinely tiny and low risk, such as a non-critical wording tweak or a style value that does not affect behavior

When judging whether something is tiny, look at risk scope, not just line count. A one-line change is not exempt if it affects core logic, permissions, state transitions, or a critical layout.

## Workflow

### Step 0: Determine Trigger Mode and Identify the Current Target

First determine whether this is:

- `Mode A: Initial Trigger`
- `Mode B: Self-Review Continuation`

`Immediate follow-up` means the **very next user turn** directly responding to the previous self-review result in the same thread, with no unrelated request inserted in between.

If `Mode A` is valid but the user says only "improve it", "review it", "recheck it", or similar language without naming the target, infer the file, module, page, document, or plan from the current context first. Ask the user only if the target is still unclear.

### Step 0.5: Detect Whether the User Is Continuing a Previous Self-Review Suggestion

If the user says "continue", "agreed", "do the next step", or similar wording, or equivalent Chinese continuation phrasing such as `继续`, `同意`, `按这个做`, or `执行下一步`, and the context clearly points to the immediately previous self-review suggestion, treat it as `Mode B: Self-Review Continuation` rather than a new trigger or a request to explain the suggestion again.

Rules:

- If the previous suggestion is a tight group of related steps that should be completed together, execute them as one batch
- If the previous round offered multiple mutually exclusive or very different options, ask the user before choosing one
- If the suggestion involves actions such as verify, inspect, open, compare, or test, actually do them; do not invent a verification report
- After execution, treat the updated result as the new current version and continue with self-review

### Step 1: Finish the User's Current Request First

If this is `Mode A`, complete the current long task first before spending effort on post-task self-review.

This skill should not be used as a standalone manual improvement request with no long task completed in the current workflow.
If the long task is still in progress, do not enter self-review yet even if a review-oriented keyword already appears.

### Step 2: Review the Updated Result

Treat the improved result, or the result after executing the previous suggestion, as the current version and inspect it again for:

- obvious omissions
- high-priority risks
- directly actionable next improvements
- readiness to move to the next stage

### Step 3: Give a Truthful Conclusion

There are three valid outcomes:

1. **Still has improvement room**
   Give 1-3 specific, actionable suggestions in priority order.
2. **Currently in good shape**
   State clearly that no high-priority issue was found in the verified scope and that the work can move forward.
3. **Insufficient verification / cannot conclude yet**
   State which evidence, tools, or context are still missing and why a high-confidence conclusion is not justified yet. If helpful, suggest the next verification step.

Do not invent filler suggestions just to have a list.

## Default Review Lens Selection

Pick the primary review lens from the final deliverable:

- PRDs, requirement specs, flows, acceptance criteria, version scope: product / requirements lens
- Prototypes, pages, components, visual specs, interaction drafts: design / frontend UI lens
- Frontend code, backend code, APIs, services, scripts, jobs: implementation lens
- Technical plans, architecture splits, technology choices, dependency governance: architecture lens
- Test cases, validation reports, integration results, walkthrough conclusions: testing / verification lens
- Test handoff notes, release notes, delivery checklists, status alignment: delivery lens

Default rules:

- If the deliverable is code, API, service, script, or module implementation, default to the implementation lens
- If a task spans multiple roles, keep only one primary lens based on the final deliverable
- Add secondary checks only when they are directly relevant; do not expand every task into an all-role audit

See [references/roles.md](references/roles.md) for the full lens table and typical symptoms.

## Verification and Scope

- Match the strength of the conclusion to the level of verification actually performed
- Do not write "verified" or "passed" if no real verification was executed
- If you use sampling, state the sampled scope, uncovered scope, and residual risk explicitly
- If the user asks for strict verification, full inspection, or a high-confidence conclusion, do not default to sampling
- If multiple deliverables changed together, check whether they stay aligned with each other

See the detailed guidance for evidence sources, cross-deliverable checks, and sampling:

- [references/validation.md](references/validation.md)
- [references/deliverables.md](references/deliverables.md)

## Output Guidance

When the output format allows it, the self-review conclusion should normally be visible to the user because this review result is part of the delivered outcome after the long task. It should still stay concise and should not become empty template filler.

Priority order:

1. Follow the user's required output format first.
2. Then follow the host or system response style.
3. Only then use the structures suggested by this skill.

Additional rules:

- For long-task completions, prefer a visible self-review conclusion unless the user explicitly asked for result-only output or the format forbids extra commentary
- Keep it short by default and avoid repeating the main output
- If the host already has a fixed closing structure, do not force this skill's format on top of it
- If the final output must be pure JSON, pure patch, pure code, or another fixed format, do not append extra commentary
- For tiny changes, internal self-review without extra visible output is acceptable

### Suggested Structure A: Still Has Improvement Room

```markdown
---

**Self-Review**

The current version completes the request, but there is still one high-value follow-up to address: [most important and most concrete improvement].

**Suggested Next Step**
- [directly actionable follow-up]
```

### Suggested Structure B: Currently in Good Shape

```markdown
---

**Self-Review**

The current version completes the request. Within the verified scope, no high-priority issue was found, and the work can move to the next stage.

**Suggested Next Step**
- [review / testing / commit / acceptance / next delivery step]
```

### Suggested Structure C: Insufficient Verification / Cannot Conclude Yet

```markdown
---

**Self-Review**

The current version completes the request, but the currently available evidence is not strong enough for a high-confidence conclusion.

**Current Gap**
- [missing evidence / missing tool access / missing context]

**Suggested Next Step**
- [additional verification / runtime result / page inspection / missing context]
```

## One-Sentence Rule

For software-delivery requests, arm this loop only through one of two valid modes: either the current request combines a long task with an explicit review-oriented keyword, or the very next user reply clearly continues the immediately previous self-review suggestion; then complete the main work first when needed, review the latest result once, and tell the user whether it still needs improvement, can move forward, or lacks enough verification.
