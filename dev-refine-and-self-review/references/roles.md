# Review Lenses and Typical Symptoms

Adjust the review focus based on the primary lens. Keep the dimensions abstract and use the symptoms to spot common failure modes. The symptom list is not an exhaustive checklist; always judge it against the project phase and current deliverable.

| Review lens | Typical tasks / deliverables | Main review focus | Typical symptoms to investigate |
| --- | --- | --- | --- |
| Product / requirements | PRDs, user stories, flows, acceptance criteria, release notes | Closed-loop completeness, role/permission boundaries, exception flows, scope boundaries, acceptance framing | Main flow exists but exception flow is missing; feature exists but acceptance criteria do not; role exists but permission boundary does not; version scope drift; document and prototype disagree |
| Design / frontend UI | Prototypes, pages, components, design specs, interaction drafts | Layout completeness, interaction closure, visual consistency, state coverage, responsiveness | Elements overflow the page; unexpected blank scroll space; fixed elements overlap content; clicks have no feedback; same component type looks inconsistent; old styling remains |
| Implementation | Frontend code, backend code, APIs, services, scripts, jobs | Runtime risk, edge cases, exception handling, regression risk, maintainability | `null` / `undefined` not handled; async races; state not reset; duplicated logic; magic numbers; patch-like branch buildup; unclear backfill scope |
| Architecture / technical plan | Architecture plans, module splits, technology choices, dependency governance | Risk coverage, rollback / degradation, extensibility, dependency boundaries, cost and safety | A plan exists but no rollback; a dependency exists but no degradation path; extension points lack guardrails; ownership boundaries are blurry; cost ceiling is unclear; security boundary is unspecified; migration script has no rollback; schema change is not synchronized with upstream/downstream systems |
| Testing / verification | Test cases, validation records, integration conclusions, walkthrough results | Verification scope, evidence quality, pass conditions, omission risk | The conclusion is written without evidence; verified and unverified items are mixed together; a sampled conclusion is written as if full coverage happened; an integration issue has no reproduction path |
| Delivery | Test handoff notes, release notes, delivery checklists, status sync | Deliverable consistency, dependency alignment, status sync, clarity of next steps | The document differs from the actual artifact; paths or versions are out of sync; test-entry conditions are unclear; ownership boundaries are unclear; the next step has no owner or no starting point |

Default rules:

- If the deliverable is code, API, service, script, or module implementation, default to the implementation lens
- If the task spans multiple deliverables, choose the primary lens from the final deliverable first, then add only directly relevant secondary checks
