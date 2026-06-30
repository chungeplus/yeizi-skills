import { AppError, AppErrorCode } from "@/error"
import { splitCsvString } from "@/tools/string"

/**
 * 解析技能选项值。
 *
 * @param rawSkillOptionValue - 逗号分隔的技能选项值。
 * @returns 解析后的技能名称列表；未传入时返回空列表。
 * @throws 技能选项已传入但解析后为空时抛出 {@link AppError}。
 *
 * @example
 * ```typescript
 * parseSkillNameList("yeizi-demo,yeizi-helper") // ["yeizi-demo", "yeizi-helper"]
 * ```
 */
function parseSkillNameList(rawSkillOptionValue: string | undefined): string[] {
  if (rawSkillOptionValue === undefined) {
    return []
  }

  const skillNameList = splitCsvString(rawSkillOptionValue)

  if (skillNameList.length === 0) {
    throw new AppError(AppErrorCode.SKILL_OPTION_EMPTY)
  }

  return skillNameList
}

export { parseSkillNameList }
