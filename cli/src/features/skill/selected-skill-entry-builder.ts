import type { ISkillIndex, ISkillIndexEntry } from "@/types/skill"

import { AppError, AppErrorCode } from "@/errors"

/**
 * 根据技能名称组装完整的技能索引条目。
 *
 * @param skillIndex - 远端技能索引。
 * @param selectedSkillNames - 选中的技能名称列表。
 * @returns 对应的技能索引条目列表。
 * @example buildSelectedSkillEntries({ skills: [{ name: "yeizi-demo", version: "1.0.0" }] }, ["yeizi-demo"]) => [{ name: "yeizi-demo", version: "1.0.0" }]
 */
export function buildSelectedSkillEntries(
  skillIndex: ISkillIndex,
  selectedSkillNames: readonly string[],
): ISkillIndexEntry[] {
  const skillEntryByName = new Map(skillIndex.skills.map(skillEntry => [skillEntry.name, skillEntry]))
  const missingSkillNames = selectedSkillNames.filter(skillName => !skillEntryByName.has(skillName))

  if (missingSkillNames.length > 0) {
    throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNames: toNonEmptyStringTuple(missingSkillNames) },
    })
  }

  return selectedSkillNames.map((skillName) => {
    const skillEntry = skillEntryByName.get(skillName)

    if (skillEntry === undefined) {
      throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
        params: { skillNames: [skillName] },
      })
    }

    return skillEntry
  })
}

function toNonEmptyStringTuple(values: readonly string[]): [string, ...string[]] {
  const [firstValue, ...remainingValues] = values

  if (firstValue === undefined) {
    throw new Error("Expected at least one skill name.")
  }

  return [firstValue, ...remainingValues]
}
