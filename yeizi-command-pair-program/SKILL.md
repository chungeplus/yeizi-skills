---
name: yeizi-command-pair-program
version: 1.0.0
description: |
  Use when the user explicitly invokes `/yeizi-command-pair-program` for a small-to-medium software question involving requirement review, solution comparison, architecture slices, refactor planning, testing strategy, integration planning, or release preparation.
---

# Yeizi Command Pair Program

This explicit paired-discussion skill uses **two distinct sub-agents** to pressure-test a small-to-medium software question, then returns a more mature answer or plan without exposing raw internal reasoning.

## Trigger Rules

- Trigger only on explicit `/yeizi-command-pair-program` use. Do not intercept normal replies automatically.
- Standard form: `/yeizi-command-pair-program <task>`
- Use this skill for small-to-medium issue discussion, not for broad multi-decision exploration across large uncertain scopes
- Debate length is internal to the skill. Do not accept user-configured round counts
- Always run at least `3` internal debate rounds between the two sub-agents
- Never exceed `10` internal debate rounds between the two sub-agents
- Do **not** infer discussion rounds from numbers or round instructions inside the task body
- If the command does not contain a clear task but the thread goal is obvious, continue from context; ask only if the target is still unclear

## Round Definition

- 1 round = **sub-agent A** presents or revises the current best solution, **sub-agent B** directly rebuts, stress-tests, or narrows it once, and the pair advances the debate by one full exchange
- Minimum behavior = `3` full debate rounds between the two sub-agents
- Maximum behavior = `10` full debate rounds between the two sub-agents
- After the minimum `3` rounds, continue until stable agreement or the `10`-round limit
- Even if partial consensus appears early, still complete at least the minimum `3` rounds before stopping
- Stable agreement = both sub-agents endorse the same conclusion and the same next step, with no decision-relevant disagreement left
- Every round must move the discussion forward: add constraints, revise assumptions, surface risk, reduce disagreement, or strengthen validation planning
- If two consecutive rounds add no meaningful new information, shift the remaining debate into risk ranking, validation-gap organization, decision comparison, or release checks instead of repeating the same argument
- If round `10` is reached without agreement, stop the debate and return the strongest supported path plus the remaining caveats to the primary agent instead of forcing false consensus

## Sub-Agent Role Selection

Create **two** sub-agents with distinct responsibilities.

- **Sub-agent A** should be the current best-fit solution proposer for the task
- **Sub-agent B** should be the rebuttal reviewer who challenges A's current solution, assumptions, and trade-offs

Role guidance:

- Requirements, PRDs, user stories, flows, scope, priority
  - Sub-agent A: `solution proposer` with a product / requirements lens
  - Sub-agent B: `challenger` or `acceptance reviewer`
- Technical plans, architecture design, module splits, technology choices
  - Sub-agent A: `solution proposer` with an architecture lens
  - Sub-agent B: `risk reviewer` or `migration reviewer`
- Frontend/backend implementation, refactors, fixes, API design
  - Sub-agent A: `solution proposer` with an implementation lens
  - Sub-agent B: `edge-case reviewer` or `regression reviewer`
- Test strategy, integration, release preparation, delivery checks
  - Sub-agent A: `solution proposer` with a verification / release lens
  - Sub-agent B: `failure-mode reviewer` or `rollback reviewer`

If a task spans multiple domains, pick the main role from the final deliverable, then use the second sub-agent to cover the most relevant complementary risk.

For these high-risk cases, Sub-agent B should prefer a forced risk lens:

- Authentication, authorization, secrets, payments, sensitive data: `security / privacy`
- Schema changes, data migration, cache consistency, async jobs: `data / integration`
- API contracts, frontend/backend integration, compatibility changes: `api / compatibility`
- Release windows, feature flags, monitoring, rollback, on-call concerns: `release / verifier`

If no strong complementary lens is needed, Sub-agent B should still act as an independent skeptic or validation-focused reviewer instead of repeating A.

## Workflow

### Step 0: Parse the Command

- Recognize `/yeizi-command-pair-program`
- Extract the task body
- If the user also gave format, scope, or other limits, record them as hard constraints first

### Step 1: Build the Primary Agent Context Pack

Before the paired discussion starts, the primary agent should combine the current project information, thread context, user request, constraints, known codebase facts, and any directly relevant ambiguity into one working context pack.

Then the primary agent should produce:

- a current best understanding of the task
- an initial proposed direction or answer frame
- a prompt for **sub-agent A** to propose the best-fit solution for this context
- a prompt for **sub-agent B** to rebut, pressure-test, and narrow A's current solution

The initial direction is only a starting point. It is not privileged. If the debate reveals a stronger path, the next round should replace the earlier direction instead of defending it by inertia.

### Step 2: Start the Two Sub-Agents

- If the host supports real sub-agents or delegation, start **two** sub-agents and pass only the minimum context required for the task
- Give the two sub-agents distinct roles; do not send them out as clones
- If the host does not support two real sub-agents, enter **degraded mode** and explicitly simulate `primary / sub-agent A / sub-agent B` in one instance
- In degraded mode, state this clearly in the final output: `This round did not use two independent sub-agents. It used a single-instance three-role self-check instead.`
- In degraded mode, do not present the result as independently confirmed multi-agent validation; if the conclusion depends on independent review, lower confidence and list it as residual risk
- In either mode, the two sub-agents do not finalize the user-facing answer directly; their job is to run a lightweight internal debate, then hand their discussion result and proposed solution back to the primary agent for synthesis

### Step 3: Run the Internal Debate

Run at least `3` rounds. After that, continue only as needed until stable agreement or the `10`-round cap. Each round should complete at least these actions:

1. The primary agent gives the two sub-agents the current task frame, current proposal, and current constraints
2. Sub-agent A proposes or revises the best-fit solution from its assigned lens
3. Sub-agent B directly rebuts that solution from its complementary lens
4. The next round starts from the updated state created by the previous exchange, not from a blank slate
5. Record the important updates from the debate: new constraints, invalidated assumptions, retained options, unresolved issues

Rules during execution:

- Do not let either sub-agent become a simple echo or cheerleader
- Do not let the two sub-agents collapse into the same perspective
- Do not reduce the exchange to two isolated reviews; **sub-agent B** must directly challenge **sub-agent A**, and **sub-agent A** must revise or defend based on that challenge
- If **sub-agent B** identifies a materially stronger path, let the next round promote that path into the main candidate instead of staying anchored to the original proposal
- Do not rewrite everything from scratch every round; focus on incremental correction
- If a disagreement fundamentally requires real verification, mark it as a validation-dependent disagreement instead of faking resolution
- If the debate reaches round `10` without stable agreement, stop and return the strongest supported solution plus the remaining caveats to the primary agent
- Keep the discussion focused on solution thinking, trade-offs, risks, and recommended direction rather than directly editing code

### Step 4: Merge the Discussion Result

After the internal debate stops, the two sub-agents return their debate output to the primary agent. The primary agent then condenses the result into:

- conclusions that reached consensus
- initial ideas that were revised or discarded
- disagreements that still matter and should be visible to the user
- risks that still require further validation before a high-confidence conclusion

### Step 5: Return the User-Facing Output

The default output should include:

1. `Main conclusion`
2. `Internal discussion summary`

If a meaningful disagreement still remains, also add:

3. `Key disagreement`

If a recommendation is still appropriate, also add:

4. `Recommended choice`

## Output Requirements

- Never expose the full internal round-by-round transcript
- Even if the user explicitly asks for the full internal discussion, return only a cleaned structured summary, key disagreements, and the conclusion
- `Main conclusion` gives the final answer, plan, review opinion, or recommended next action
- `Internal discussion summary` explains what the paired discussion corrected, removed, constrained, or added
- Unless the user explicitly asks for expansion, keep `Internal discussion summary` within `3` bullets and keep them conclusion-level
- If degraded mode was used, add one short execution note in the summary
- If there is a `Key disagreement`, keep only disagreements that actually affect the decision
- If the debate stopped at the `10`-round cap without full agreement, say so briefly and make the best-supported recommendation instead of adding user burden
- `Recommended choice` should clearly state which path is recommended and why
- If the user also requires a strict fixed format such as pure JSON, pure patch, or pure code, satisfy that first; if the summary cannot fit, say it was compressed or omitted instead of silently dropping it

## Recommended Output Structures

### Structure A: Main Conclusion Reached, No Key Disagreement

```markdown
**Main conclusion**

[formal answer to the user]

**Internal discussion summary**

- [most important correction or addition 1]
- [most important correction or addition 2]
- [optional risk/validation note]
```

### Structure B: Key Disagreement Remains

```markdown
**Main conclusion**

[currently recommended conclusion]

**Internal discussion summary**

- [consensus reached]
- [point revised or rejected]
- [constraint the user should know]

**Key disagreement**

- [decision-relevant disagreement]

**Recommended choice**

- [recommended option + rationale]
```

## Applicable Scope

Treat this skill as an explicit paired-discussion layer for small-to-medium software questions. It is useful for:

- requirement discussion and PRD shaping
- solution design and architecture comparison
- implementation advice and refactor decisions
- API design and integration strategy
- test planning, validation planning, and release preparation
- a more stable second-pass review of an existing output

## One-Sentence Rule

When the user explicitly invokes `/yeizi-command-pair-program`, let the primary agent build the context and two tailored sub-agent prompts, run a lightweight internal proposer-vs-rebuttal debate for at least `3` rounds and at most `10`, then return the final conclusion plus a concise internal discussion summary without directly editing code.
