import type { SkillEntry } from "@/types/skill"

import { AppError, AppErrorCode } from "@/error"

/**
 * 根据技能名称组装完整的技能条目列表。
 *
 * 流程：把远端技能按 name 建索引，过滤出选中名单中缺失的技能名，若有缺失抛 {@link AppError}；
 * 否则按 selectedSkillNameList 顺序映射回 SkillEntry。
 *
 * @param skillEntryList - 远端技能条目列表。
 * @param selectedSkillNameList - 用户选中的技能名称列表。
 * @returns 与 selectedSkillNameList 顺序对应的技能条目列表。
 * @throws 任意选中技能在远端条目中找不到时抛出 {@link AppError}。
 *
 * @example
 * ```typescript
 * buildSelectedSkillList(
 *   [{ name: "yeizi-demo", description: "示例技能" }],
 *   ["yeizi-demo"],
 * )
 * // [{ name: "yeizi-demo", description: "示例技能" }]
 * ```
 */
function buildSelectedSkillList(
  skillEntryList: SkillEntry[],
  selectedSkillNameList: string[],
): SkillEntry[] {
  const skillEntryByNameMap = new Map(
    skillEntryList.map(skillEntryItem => [skillEntryItem.name, skillEntryItem]),
  )
  const missingSkillNameList = selectedSkillNameList.filter(
    selectedSkillNameItem => !skillEntryByNameMap.has(selectedSkillNameItem),
  )

  if (missingSkillNameList.length > 0) {
    throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNameList: missingSkillNameList },
    })
  }

  return selectedSkillNameList.map(
    selectedSkillNameItem => skillEntryByNameMap.get(selectedSkillNameItem)!,
  )
}

export { buildSelectedSkillList }
