import type { SkillItem } from "@/types/skill"

import { AppError, AppErrorCode } from "@/error"

/**
 * 根据技能名称组装完整的技能清单条目。
 *
 * @param skillList - 远端技能条目列表。
 * @param selectedSkillNameList - 选中的技能名称列表。
 * @returns 对应的技能条目列表。
 * @throws 任意选中技能在清单中找不到时抛出错误。
 *
 * @example
 * ```typescript
 * buildSelectedSkillList(
 *   [{ skillName: 'typescript', skillVersion: '1.0.0' }],
 *   ['typescript']
 * )
 * // [{ skillName: 'typescript', skillVersion: '1.0.0' }]
 * ```
 */
function buildSelectedSkillList(
  skillList: SkillItem[],
  selectedSkillNameList: string[],
): SkillItem[] {
  const skillItemBySkillNameMap = new Map(skillList.map(skillItem => [skillItem.skillName, skillItem]))
  const missingSkillNameList = selectedSkillNameList.filter(
    skillNameItem => !skillItemBySkillNameMap.has(skillNameItem),
  )

  if (missingSkillNameList.length > 0) {
    throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNameList: missingSkillNameList },
    })
  }

  return selectedSkillNameList.map(
    skillNameItem => skillItemBySkillNameMap.get(skillNameItem)!,
  )
}

export { buildSelectedSkillList }
