---
name: generate-scene-agents
description: Use when generating or refreshing final files under `agents/`, matching a business-scene request to `../rules-project/rules/scenes/*-rules.md`, or confirming which technology rules should be read before scene-agent generation.
---

# Generate Scene Agents

## Overview

Generate the final `agents/<scene>.md` from confirmed rule sources.

Handle scene matching, technology-rule matching, and final reading-range confirmation before writing.
Do not create, repair, or redesign scene rule sources, technology rule sources, or the confirmed tech scheme.

## Inputs

- Required: a business-scene description
- Optional: a user-suggested scene name candidate
- Optional: a user-suggested code-technology category set
- Optional: a user-suggested technology-rule range

Confirm the final scene, the final code-technology categories, and the final technology-rule range before generation.

## Read First

- `README.md`
- `AGENTS.md`
- `../rules-project/rules/projects/shared-rules.md`
- the current file paths, file names, titles, and scene-identification headings for `../rules-project/rules/scenes/*-rules.md`
- the current top-level directory names under `../rules-project/rules/technologies/`
- Before scene confirmation, use only lightweight scene-identification metadata from the current request, scene file paths, scene file names, scene titles, and scene headings needed to distinguish business scope.
- Do not read full unconfirmed scene-rule bodies or unconfirmed technology-rule contents before the corresponding confirmation step.

## Workflow

1. Read `README.md` and `AGENTS.md`.
2. Read `../rules-project/rules/projects/shared-rules.md` as the shared-rule bucket.
3. Scan `../rules-project/rules/scenes/*-rules.md` by lightweight scene-identification metadata only.
4. Extract the user's business-scene description from the current request.
   - Do not assume the user's wording is already the final scene id or final scene file name.
5. Rank scene candidates against the request.
   - Assign a default candidate only when at least one plausible match exists.
   - Present the ranked plausible candidates, not only the default candidate.
   - Show the candidate scene file path, default status, and explainable match reasons for every presented candidate.
   - Use only current scan-boundary signals such as scene file-name matches, scene-title matches, scene-heading matches, and direct string alignment between the request and the scanned scene-identification metadata.
   - If all current matches are weak, ambiguous, or implausible, stop and direct the project manager to add or repair `../rules-project/rules/scenes/*-rules.md`.
6. Ask the project manager to confirm the scene.
   - Allow confirming the default candidate.
   - Allow choosing another presented candidate.
   - Allow explicitly rejecting all current candidates.
   - If no suitable scene exists, stop and direct the project manager to add or repair `../rules-project/rules/scenes/*-rules.md`.
7. Derive the final scene id from the confirmed scene file name.
   - Use the confirmed `../rules-project/rules/scenes/<scene>-rules.md` file name as the only scene-id source.
   - Remove the trailing `-rules.md` from the confirmed file name to get the final scene id.
   - Use that final scene id for the output file name under `agents/`.
8. Read only the confirmed `../rules-project/rules/scenes/<scene>-rules.md`.
9. Extract initial code-technology category candidates from the confirmed scene file's `技术方案`.
   - Extract only language, framework, and code-technology categories such as `TypeScript`, `Vue`, `React`, `CSS`, and `HTML`.
   - Do not treat tools or libraries such as `vite`, `axios`, `commander`, `zod`, or `eslint` as technology-rule categories by themselves.
   - Treat tool, library, entry-file, extension, and command signals as evidence for a code-technology category when the scene file strongly implies one.
   - Normalize strong `ts`, `.ts`, `tsc`, or `TypeScript` signals into a `TypeScript` candidate when they clearly point to the same code-technology category.
   - Present the initial extracted category set as a recommendation, not a final decision.
10. Ask the project manager to confirm the final code-technology categories before technology-rule matching.
   - Allow confirming the recommended category set.
   - Allow adding a missing category such as `TypeScript`.
   - Allow removing a mis-extracted category.
   - Allow renaming or replacing a category before matching.
   - Stop only if the project manager decides not to continue.
11. Scan the current top-level directories under `../rules-project/rules/technologies/` by lightweight metadata only.
12. Auto-map technology-rule directories for each confirmed code-technology category.
    - Normalize the confirmed category name and match it against the normalized top-level technology directory names.
    - If one exact normalized directory match exists, select that directory automatically.
    - If multiple plausible matches exist, present the conflicting candidate directories and ask the project manager to choose, revise the category, or continue without a directory for that category.
    - If no plausible match exists, present the gap and warning to the project manager instead of stopping automatically.
13. Present one final reading-range confirmation after all technology categories are handled.
    - Show the confirmed scene.
    - Show the final confirmed code-technology categories.
    - Show the final selected technology-rule directory for each category, or show that no directory was selected for that category.
    - Show that `../rules-project/rules/projects/shared-rules.md` is included in the final reading range.
    - If any confirmed category has no selected technology-rule directory, show the gap explicitly and require the project manager to decide whether to continue with partial technology-rule coverage.
    - Do not continue until the project manager explicitly confirms the full reading range.
14. Read all files under the confirmed existing technology-rule directories.
15. Prepare the source buckets before writing.
    - Inventory the confirmed scene rule source: execution facts, tech choices and responsibilities, scene business rules, scene implementation boundaries, and scene directory skeleton.
    - Preserve every confirmed source rule heading and every confirmed normative sentence by default.
    - Preserve recommended, not recommended, example, and code-block content when it exists under a confirmed source rule.
    - Prefer structural remapping over paraphrasing. Move a rule into the correct final section before considering any rewrite.
    - When a source rule has multiple sentences, keep all of them unless a true duplicate already preserves the same constraint with the same strength and boundary.
    - Merge technology rules only when they are true duplicates or near-duplicates.
    - Keep complementary rules separate.
    - Keep the strongest directly judgeable wording when two rules overlap.
    - Keep scope, examples, and exception boundaries when they change how a rule is applied.
    - Keep scene rules, shared rules, and technology rules atomic by default.
    - Do not build one final rule from multiple different source rules only because they sound related.
16. Merge the three confirmed rule-source layers by responsibility.
    - `../rules-project/rules/scenes/<scene>-rules.md` controls scene project rules, tech scheme, scene boundaries, and directory reference.
    - Confirmed existing `../rules-project/rules/technologies/*` controls technology and code rules.
    - `../rules-project/rules/projects/shared-rules.md` controls shared development rules.
    - Keep general directory-classification rules in `技术与代码规则`.
    - Keep the scene directory skeleton in `目录参考`.
17. Map the source buckets into the final sections.
    - Put scene `项目规则`, `业务规则`, and `实现边界` into final `项目规则`.
    - Keep final `项目规则` ordered as execution facts first, then scene business rules, then scene implementation boundaries.
    - Put scene `技术方案` into final `技术方案`.
    - Put shared project rules into final `通用开发规则`.
    - Put selected existing technology rules into final `技术与代码规则`.
    - Put the scene directory skeleton into final `目录参考`.
    - Preserve source rule headings verbatim whenever the section move allows it.
    - If a source rule group heading must be nested deeper after remapping, shift the heading level mechanically instead of renaming the heading text.
18. Keep source layers separate while writing.
    - Do not rewrite one final rule so it mixes scene content with shared content.
    - Do not rewrite one final rule so it mixes shared content with technology content.
    - Do not rewrite one final rule so it mixes different scene topics when they should stay separate.
    - If a conflict appears, preserve the confirmed source layering.
19. Generate `agents/<scene>.md`.
   - The output file name must match the final scene id derived from the confirmed scene file name.
   - Example: `../rules-project/rules/scenes/cli-tool-rules.md` -> `agents/cli-tool.md`.
20. Run the final check before output.

## Output

Write `agents/<scene>.md` with exactly these sections, in this order:

- `## 项目规则`
- `## 技术方案`
- `## 通用开发规则`
- `## 技术与代码规则`
- `## 目录参考`

Do not add any extra top-level `#` title above these sections.

Use the sections like this:

- `项目规则`: confirmed execution facts, scene-specific business rules, and scene-specific implementation boundaries only
- `技术方案`: confirmed tech choices and responsibilities only
- `通用开发规则`: shared project rules only
- `技术与代码规则`: selected technology rules only
- `目录参考`: final scene structure reference only

## Guardrails

- Treat `agents/<scene>.md` as an AI execution contract, not a loose human summary.
- Do not create, repair, or redesign `../rules-project/rules/scenes/<scene>-rules.md`.
- Do not create, repair, or redesign `../rules-project/rules/technologies/*`.
- Do not redesign the confirmed tech scheme.
- Do not add candidate options to the final output.
- Do not add source notes, generation notes, maintenance notes, or discussion text to the final output.
- Do not guess unconfirmed commands, paths, entry files, directory structure, or responsibilities.
- Do not let lower-layer rules override confirmed scene choices.
- Do not drop confirmed scene business rules or confirmed scene implementation boundaries when mapping them into final `项目规则`.
- Do not silently omit a confirmed tech choice or confirmed tool responsibility from final `技术方案`.
- Do not drop the second sentence, exception sentence, boundary sentence, or qualifier sentence from a confirmed source rule.
- Do not paraphrase a confirmed source rule into a shorter version only for readability or brevity.
- Do not omit recommended, not recommended, or example blocks from a confirmed source rule unless the project manager explicitly asked for a compressed output mode.
- Do not over-merge scene rules, shared rules, or technology rules into broader summary rules.
- Do not soften, summarize away, or drop strong constraints only because they make the file longer.
- Do not replace directly judgeable rules with softer advice.
- Do not mix scene-layer, shared-layer, and technology-layer content into the same final rule body.
- Do not move general directory-classification rules into `目录参考`.
- Do not move the scene directory skeleton into `技术与代码规则`.
- Do not continue when the scene is not explicitly confirmed.
- Do not continue when the code-technology categories are not explicitly confirmed.
- Do not continue when the technology-rule range is not explicitly confirmed.
- Do not treat tools or libraries as technology-rule categories by themselves.
- Do not overrule the project manager's confirmed code-technology categories just because the initial extraction was incomplete.
- Do not stop automatically only because a confirmed category has no current `../rules-project/rules/technologies/*` match.
- Do not ask the project manager to reconfirm an automatically selected exact technology-rule directory unless the match is ambiguous or missing.
- Do not continue after the project manager rejects the current scene candidate set, code-technology category set, or technology-rule range.
- Do not let repeated runs from the same confirmed rule sources drift in structure, section meaning, or constraint boundaries.

## Final Check

Before output, confirm all of these:

- the 5 required sections are complete and in the correct order
- the three rule-source layers are mapped into the correct final sections
- each final rule body stays inside one source layer
- no unconfirmed information was added during generation
- the chosen scene rule source was explicitly confirmed by the project manager
- the final output file name was derived from the confirmed scene file name by removing `-rules.md`
- the final code-technology categories were explicitly confirmed by the project manager
- the chosen technology-rule range was explicitly confirmed by the project manager
- every exact technology-rule directory match was auto-selected from the confirmed category name without unnecessary extra confirmation
- every confirmed category without a selected technology-rule directory was explicitly acknowledged by the project manager before generation
- no tool or library was treated as a technology-rule category by itself
- every confirmed source rule heading appears in the final output, either at the same text or at a mechanically nested heading level with the same text
- every confirmed normative sentence from the source rules is preserved in the final output unless an exact duplicate already preserves it
- every confirmed scene execution fact is preserved in final `项目规则`
- every confirmed scene tech choice appears in final `技术方案`
- every confirmed scene business rule is preserved in final `项目规则`
- every confirmed scene implementation boundary is preserved in final `项目规则`
- the confirmed technology-rule range matches the project manager's final decision for each confirmed code-technology category
- directory-classification rules and the scene directory skeleton remain separated
- the strongest confirmed constraints were preserved instead of softened for brevity
- the same confirmed rule sources would produce a stable final file if generated again
