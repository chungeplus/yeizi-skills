# Verification Evidence and Sampling Review

## Evidence Sources

Before you write conclusions such as "within the verified scope", make the evidence source explicit. Use one or more of the following:

- Static review: code, docs, config, structure, or style inspection
- Runtime evidence: local execution, build results, command output, API responses, logs
- Browser or page inspection: rendering, layout, interaction states, scrolling, visibility
- Test output: unit tests, integration tests, regression tests, manual validation notes
- Document comparison: PRD, prototype, implementation, test notes, and delivery checklist alignment
- Manual walkthrough: structure checks, path checks, state checks based on the current context

Try to match the wording of the conclusion to the actual evidence source:

- Do not describe static review as runtime verification
- Do not describe sampling a few pages as full verification
- Do not describe document alignment as proof that the feature is usable

## Sampling Large Outputs

When the output is large enough that full review is disproportionately expensive, sampling is allowed. These thresholds are only heuristics, not hard rules:

- Code: roughly more than 300 lines
- HTML/CSS: roughly more than 500 lines
- Documents: roughly more than 1000 words or characters of meaningful content

### Sampling Rules

1. Always inspect:
   - Entry and exit logic, such as function boundaries or first-screen / bottom critical page areas
   - Declaration zones, such as `import`s, global state, CSS variables, or config sections
   - Start/end structure, such as opening and closing layout structure, module boundaries, document intro and ending
   - Shared styles or shared capabilities, such as common components, layout skeletons, theme variables
2. Sample additional representative sections:
   - Inspect 2-3 representative middle sections or modules
   - Cover different content types when possible, such as form page + list page + detail page, or initialization + main flow + error branch
   - Avoid inspecting only adjacent sections or overly similar samples
3. Explain the review scope:
   - State whether the review was full or sampled
   - If it was sampled, state the covered scope, uncovered scope, and residual risk

If the user explicitly asks for strict verification, full inspection, or a high-confidence conclusion, do not default to sampling.

## High-Risk Changes That Should Not Default to Sampling

Even if the output is large, do not default to sampling for these high-risk areas:

- Permission, authentication, login, registration, or risk-control logic
- Payment, charging, order-state transitions, or refund logic
- Release scripts, deployment workflows, or environment switching
- Data migration, bulk update, delete, or backfill scripts
- Critical paths that involve security boundaries, sensitive data, or external callbacks

If stronger verification cannot be completed in those cases, do not force a high-confidence pass conclusion. State the verification gap and residual risk explicitly.
