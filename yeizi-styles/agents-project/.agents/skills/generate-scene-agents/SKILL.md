---
name: generate-scene-agents
description: Use when the user explicitly invokes `/generate-scene-agents`, asks to generate or refresh a final `agents-project/agents/<scene>.md`, provides a business-scene description and wants the skill to determine the matching scene rule source, or wants the skill to recommend which technology rules should be read before generation. Do not use this skill to design or fill missing scene rule sources or technology rule sources.
---

# Generate Scene Agents

## Overview

Generate the final `agents-project/agents/<scene>.md` from confirmed rule sources.

This skill produces the final AI-facing scene AGENTS document.
The output must stay strict, stable, and hard to misread across repeated generations.
It does not define or repair the scene rule source or technology rule source.

This skill is also the full confirmation workflow for scene selection and technology-rule selection.
It can start from a business-scene description, recommend scene candidates, recommend technology-rule candidates, stop when rule sources are missing, and generate only after the project manager confirms the full reading range.

## When to Use

Use this skill when:
- the user explicitly runs `/generate-scene-agents`
- the user wants to generate `agents-project/agents/<scene>.md`
- the user wants to refresh `agents-project/agents/<scene>.md`
- the user provides a business-scene description and wants this skill to determine the matching scene rule source
- the user wants the skill to recommend which technology rules should be read before generation

Do not use this skill when:
- the user is still designing the scene rule source itself
- the user is still designing the technology rule source itself
- the user wants to discuss candidate tech schemes before locking the generation range
- the user wants this skill to fill missing `rules-project/rules/scenes/*-rules.md` or `rules-project/rules/technologies/*`

## Required Inputs

Required:
- a business-scene description or a scene name candidate

Optional:
- a user-suggested scene candidate
- a user-suggested technology-rule range

The skill must still confirm both the final scene and the final technology-rule range before generation.

## Read First

- `agents-project/README.md`
- `agents-project/AGENTS.md`
- `rules-project/rules/projects/shared-rules.md`
- all current `rules-project/rules/scenes/*-rules.md`
- all current top-level directories under `rules-project/rules/technologies/`

## Process

1. Read the `agents-project` guidance first.
2. Read `rules-project/rules/projects/shared-rules.md` as the shared-rule bucket.
3. Scan all current `rules-project/rules/scenes/*-rules.md`.
4. Extract the user's business-scene description from the current request.
   - Do not assume the user's wording is already the final scene id.
5. Match all scene rule sources against the user's request.
   - Rank candidates by descending match quality.
   - The highest-confidence match becomes the default candidate.
   - Present the ranked plausible scene candidates from the current `rules-project/rules/scenes/*-rules.md` scan, not only the default candidate.
   - Show the candidate scene file path, whether it is the default candidate, and the match reasons for every candidate you present.
   - Match reasons must be explainable. Use only signals such as scene file-name matches, scene-title matches, business-keyword matches, directory-skeleton matches, and command-word matches.
6. Ask the project manager to confirm the scene.
   - Allow confirming the default candidate.
   - Allow choosing another presented candidate.
   - Allow explicitly saying that no current scene rule source is suitable.
   - If no suitable scene exists, stop and direct the project manager to add or repair `rules-project/rules/scenes/*-rules.md`.
7. After scene confirmation, read only the confirmed `rules-project/rules/scenes/<scene>-rules.md`.
8. Extract only code-technology categories from the confirmed scene file's `技术方案`.
   - Only extract language, framework, and code-technology categories such as `TypeScript`, `Vue`, `React`, `CSS`, and `HTML`.
   - Do not treat tools or libraries such as `vite`, `axios`, `commander`, `zod`, or `eslint` as technology-rule categories.
   - If the scene `技术方案` does not provide clear code-technology categories, stop and direct the project manager to repair the scene rule source.
9. Scan all current top-level directories under `rules-project/rules/technologies/`.
10. For each extracted code-technology category, match the available technology-rule directories.
    - Rank candidates by descending match quality.
    - The highest-confidence match becomes the default candidate for that technology category.
    - Present the ranked plausible technology-rule candidates for that category from the current `rules-project/rules/technologies/*` scan, not only the default candidate.
    - Show the technology category, the candidate technology-rule directory, whether it is the default candidate, and the match reasons for every candidate you present.
    - Match reasons must be explainable. Use only signals such as technology-name matches, rule-title matches, and direct coverage of the language or framework.
    - If a technology category has no suitable technology-rule directory, stop and direct the project manager to add or repair `rules-project/rules/technologies/*`.
11. Confirm technology rules one category at a time.
    - Allow accepting the default candidate.
    - Allow choosing another presented candidate.
    - Allow explicitly saying that no current technology-rule directory is suitable.
    - If the project manager says no suitable technology-rule directory exists, stop and direct the project manager to add or repair `rules-project/rules/technologies/*`.
12. After every technology category is handled, present one total confirmation view.
    - Show the confirmed scene.
    - Show the final selected technology-rule directory for each extracted technology category.
    - Show that `rules-project/rules/projects/shared-rules.md` will also be read.
    - Do not continue until the project manager explicitly confirms this final reading range.
13. Read the confirmed technology rules.
14. Merge same-topic technology rules before writing.
    - merge only true duplicates or near-duplicates
    - keep complementary rules separate
    - keep the strongest directly judgeable wording when two rules overlap
    - keep scope, examples, and exception boundaries when they change how the rule is applied
    - do not shorten away useful constraints just to save tokens
    - do not keep two separate entries for the same meaning
    - do not merge two rules only because they belong to the same broad topic
15. Inventory the confirmed scene rule source before writing.
    - extract confirmed project execution facts
    - extract confirmed tech choices and responsibilities
    - extract confirmed scene-specific business rules
    - extract confirmed scene-specific implementation boundaries
    - extract confirmed scene directory skeleton
16. Keep rule granularity stable before writing.
    - keep scene rules atomic by default
    - keep shared project rules atomic by default
    - keep technology rules atomic by default
    - only merge true duplicates or near-duplicates inside the same source layer and the same target section
    - do not build one new rule from multiple different source rules just because they sound related
    - one final rule should keep one topic
17. Merge the three confirmed rule-source layers by responsibility:
    - `rules-project/rules/scenes/<scene>-rules.md` controls scene project rules, tech scheme, scene boundaries, and directory reference
    - confirmed `rules-project/rules/technologies/*` controls technology and code rules
    - `rules-project/rules/projects/shared-rules.md` controls shared development rules
    - Keep directory content layered.
    - general directory-classification rules stay in the technology-and-code-rules section
    - scene directory skeleton stays in the directory-reference section
18. Map the source buckets into the final output sections like this:
    - put scene `项目规则` into final `项目规则`
    - put scene `业务规则` into final `项目规则`
    - put scene `实现边界` into final `项目规则`
    - put scene `技术方案` into final `技术方案`
    - put shared project rules into final `通用开发规则`
    - put selected technology rules into final `技术与代码规则`
    - put the scene directory skeleton into final `目录参考`
    - inside final `项目规则`, keep this order: execution facts first, then scene business rules, then scene implementation boundaries
19. Do not merge sentences across source layers.
    - do not rewrite one final rule so it mixes scene content with shared content
    - do not rewrite one final rule so it mixes shared content with technology content
    - do not rewrite one final rule so it mixes scene project facts with scene implementation boundaries when they are different topics
20. If a conflict appears, keep this source layering.
21. Generate `agents-project/agents/<scene>.md`.
22. Run a hard final review before output.

## Output Format

Write `agents-project/agents/<scene>.md` with exactly these sections:

- `## 项目规则`
- `## 技术方案`
- `## 通用开发规则`
- `## 技术与代码规则`
- `## 目录参考`

Do not add any extra top-level `#` title above these sections.

Use them like this:
- `项目规则`: confirmed execution facts, scene-specific business rules, and scene-specific implementation boundaries only
- `技术方案`: confirmed tech choices and responsibilities only
- `通用开发规则`: shared project rules only
- `技术与代码规则`: selected technology rules only
- `目录参考`: final scene structure reference only

## Guardrails

- Treat `agents/<scene>.md` as an AI execution contract, not a loose human summary.
- Do not fill or redesign `rules-project/rules/scenes/<scene>-rules.md`.
- Do not fill or redesign `rules-project/rules/technologies/*`.
- Do not redesign the tech scheme.
- Do not add candidate options into the final output.
- Do not guess unconfirmed commands, paths, entry files, directory structure, or responsibilities.
- Do not let lower-layer rules override already confirmed scene choices.
- Do not drop scene `业务规则` or scene `实现边界` just because the final output has no same-named top-level section.
- Do not silently omit a confirmed tech choice or confirmed tool responsibility from the final `技术方案`.
- Do not over-merge atomic scene rules, shared rules, or technology rules into broader summary rules.
- Do not soften, summarize away, or drop strong constraints from the rule sources only because they make the file longer.
- Do not replace directly judgeable rules with softer advice when generating the final AGENTS output.
- Do not introduce extra AI freedom that could change project structure, section meaning, responsibility boundaries, or implementation limits.
- Do not mix scene-layer, shared-layer, and technology-layer content into the same final rule body.
- Do not paste general directory-classification text into the directory-reference section.
- Do not move the scene directory skeleton into the technology-and-code-rules section.
- Do not over-merge complementary technology rules into one vague summary.
- Do not let two runs from the same confirmed rule sources produce different structure, different section meaning, or different constraint boundaries.
- Do not include source notes, generation notes, maintenance notes, discussion text, or candidate options in the final output.
- Do not continue to generation when the scene is not explicitly confirmed.
- Do not continue to generation when the technology-rule range is not explicitly confirmed.
- Do not treat tools or libraries as technology-rule categories.
- Do not continue after the project manager says the current scene candidate or technology-rule range is unsuitable.

## Final Check

Before output, confirm these things:
- the 5 required sections are complete and in the correct order
- the three rule-source layers are not mixed into the wrong sections
- each final rule body stays inside one source layer
- scene rules, shared rules, and technology rules were not merged into cross-layer summary rules
- no unconfirmed information was added during generation
- the chosen scene rule source was explicitly confirmed by the project manager
- the chosen technology-rule range was explicitly confirmed by the project manager
- every extracted code-technology category maps to a confirmed technology-rule directory
- no tool or library was incorrectly treated as a technology-rule category
- every confirmed scene tech choice appears in the final `技术方案`
- every confirmed scene business rule is preserved in final `项目规则`
- every confirmed scene implementation boundary is preserved in final `项目规则`
- the confirmed technology-rule range fully covers the extracted code-technology categories from the confirmed scene
- the directory-classification rules and scene directory skeleton are still separated
- the strongest confirmed constraints were preserved instead of softened for brevity
- the same confirmed rule sources would produce a stable final file if generated again
