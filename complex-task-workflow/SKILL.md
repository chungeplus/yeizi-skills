---
name: "complex-task-workflow"
description: "Use when the user explicitly invokes `/complex-task-workflow` for a complex bug, technical problem, or uncertainty-heavy implementation task with cross-module risk, architectural impact, or unclear repair path."
---

# Complex Task Analysis and Convergence

This is a **command-triggered** workflow for complex software tasks. Use it only when the user explicitly invokes `/complex-task-workflow`, then define scope, converge key decisions, implement toward the result, and validate outcomes after delivery.

## Trigger Rules

- Trigger only on explicit `/complex-task-workflow` use. Do not intercept normal replies automatically.
- Standard form: `/complex-task-workflow <task>`
- Use this skill for complex bugs, technical problems, or uncertainty-heavy implementation work where the main agent judges complexity from the codebase and task reality.
- If the user invokes this skill for a trivial issue, compress it into the minimal path instead of forcing the full workflow.

## Best Fit After Explicit Invocation

After the user explicitly invokes `/complex-task-workflow`, this workflow is a good fit when any of the following is true:

- The task is medium complexity or higher
- There is meaningful technical uncertainty or implementation risk
- The work spans modules, layers, or dependencies
- There are multiple viable approaches that need comparison and convergence
- The task requires official docs, community references, or similar-project research
- The decision is worth recording for future reuse
- The main agent judges that a bug is complex rather than routine

Treat a bug as complex when one or more of the following is true:

- The expected fix is likely to touch more than `10` files
- The fix is likely to change project architecture, module boundaries, or cross-layer behavior
- The root cause or repair path is materially unclear or non-routine
- The current technical approach does not satisfy the project well enough and may need a deeper solution change
- The bug spans multiple modules, dependencies, integrations, or compatibility concerns

The main agent should judge bug complexity from the codebase and task reality instead of relying on whether the user labels it as complex.

## Compress the Workflow When

After explicit invocation, do not run the full workflow when:

- It is a low-risk small change
- The scope is clear and the codebase already has an established pattern
- There is no decision that would affect solution choice, success boundaries, or test goals

In these cases, keep only the minimal loop:

- Requirement analysis and boundaries
- Pre-implementation thinking
- Minimal necessary validation

## Inputs

Gather these inputs before starting:

- User goal
- Current scope and limits
- Known constraints
- Ambiguities
- Relevant code context

## Workflow

### 1. Define the Task

Start with a short checklist:

- Requirement analysis: goals, scope, constraints, ambiguities
- Success boundaries: what counts as done, what is out of scope
- Test goals: checks that must pass

### 2. Identify Key Decisions

Only elevate a question into a key technical decision if it affects:

- Solution choice
- Success boundaries
- Test goals

Do not elevate ordinary implementation details, low-risk syntax issues, or problems with an obvious existing pattern.

### 3. Collect Candidate Options

Collect information in this order:

1. Relevant implementations, tests, comments, and patterns in the current codebase
2. Official docs, official examples, or standards
3. Similar GitHub projects and code
4. Community discussions or broader web results as supporting evidence, not primary authority
5. A fit assessment against current project constraints

### 4. Review and Converge

Run an explicit review for each key question. Prefer at least two roles:

- One proposes a solution
- One raises objections, counterexamples, or boundary conditions

Continue until one of the following is true:

- The solution is stable
- No new valid objections remain
- Multiple equally viable options remain and require user confirmation

A valid objection is one that changes solution choice, success boundaries, or test goals.

### 5. Focused Self-Review and User Confirmation

Perform `1` focused self-review pass based on the current analysis. If the solution is still unstable or a high-risk boundary remains unclear, extend this step to at most `2` focused passes before asking the user or moving on. Focus on:

- Whether the solution satisfies the required boundaries
- Whether the test goals are covered
- Whether there is a simpler implementation path
- Whether equally viable unhandled options still exist

Ask the user only when necessary, and provide all of the following:

- Current question
- Candidate options
- Trade-offs
- Recommended option
- Recommendation rationale

### 6. Record the Conclusion

Maintain an updatable decision record when uncertainty is meaningful or the conclusion should be reused later.

Use a fixed file path in the current workspace:

- `docs/decision-records/complex-task-workflow.md`

Record maintenance rules:

- Always update the same file instead of scattering records across multiple documents
- Create the `docs/decision-records/` directory if it does not exist
- Keep one current answer for each decision question in that file
- Before writing, check whether the same problem content is already answered in the file
- Problem content is the primary identity rule for a decision record
- If two phrasings are trying to answer the same underlying problem content, treat them as the same decision record even when wording or framing differs
- If it exists, merge and replace the older content instead of leaving multiple conflicting answers for the same question
- Append a new section only when the question is genuinely different
- If the environment is read-only or the user explicitly does not want files written, include the record in the response and state that the file was not updated

Each record should include at least:

- Question
- Triggering scenario
- Research process
- Candidate options
- Final decision
- Rationale
- Applicability assumptions
- Invalidation conditions

### 7. Think Before Implementation

Before implementation, make these explicit:

- What is assumed
- What is still ambiguous
- Whether a simpler method exists
- Whether reusable prior conclusions already exist

If a new issue changes solution choice, success boundaries, or test goals, go back to the earlier analysis and convergence steps.

### 8. Implement Toward the Result

After convergence, implement the chosen path in code, structure, configuration, or related artifacts.

- This workflow is result-oriented. Do not stop at analysis if the user expects a fix or implementation.
- Keep the implementation aligned with the requirement analysis, chosen decision, and project constraints.
- If implementation reveals new facts that change solution choice, success boundaries, or test goals, return to the earlier analysis steps before continuing.

### 9. Validate and Roll Back

After implementation, run at least these checks:

- `1` full validation pass
- Check that the result matches the requirement analysis and success boundaries
- Check that the test goals are complete
- Check for obvious regressions

If the change is high-risk, cross-module, architectural, production-sensitive, or still validation-uncertain, extend validation to at most `3` focused passes instead of stopping after the first one.

If the result is off target, roll back based on the source:

- Requirement-definition issue: return to task definition
- Solution issue: return to analysis and convergence
- Implementation issue: return to implementation changes

## Outputs

After using this skill, output all or part of the following:

- Requirement analysis
- Success boundaries
- Test goals
- Key technical decisions
- Candidate options and final conclusions
- User confirmation items
- Decision record
- Validation results and rollback conclusions

If a reusable decision was recorded, mention the fixed file path explicitly in the output.

## Output Template

Recommended output structure:

1. Requirement Analysis and Success Boundaries
2. Key Technical Decisions
3. Candidate Options and Trade-offs
4. Final Plan
5. Test Goals and Validation Results
6. Risks, Rollback Points, or Pending Confirmations

## Do

- Define boundaries before discussing solutions
- Converge on the real problem before coding
- Ask the user with options and a recommendation
- Preserve reusable conclusions

## Don't

- Do not force trivial tasks into a complex workflow
- Do not skip task definition and jump straight to coding
- Do not discuss options without doing self-review
- Do not ask the user to choose before comparing options
- Do not mix ordinary implementation details into key technical decisions

## One-Sentence Rule

When the user explicitly invokes `/complex-task-workflow`, use this result-oriented workflow to analyze, implement, and validate a fix or solution for a complex bug or technical problem.
