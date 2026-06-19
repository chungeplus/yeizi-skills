import { AppError, AppErrorCode } from "@/errors"
import { csvOptionValueSchema, skillNameSchema } from "@/schemas"

/**
 * 解析技能选项值。
 *
 * @param skillOptionValue - 逗号分隔的技能选项值。
 * @returns 解析后的技能名称列表。
 * @example parseSkillNames("yeizi-demo,yeizi-helper") => ["yeizi-demo", "yeizi-helper"]
 */
function parseSkillNames(skillOptionValue?: string): string[] {
  if (skillOptionValue === undefined) {
    return []
  }

  const parsedSkillOptionResult = csvOptionValueSchema.safeParse(skillOptionValue)

  if (!parsedSkillOptionResult.success) {
    throw new AppError(AppErrorCode.SKILL_OPTION_EMPTY)
  }

  const parsedSkillNames = Array.from(new Set(parsedSkillOptionResult.data
    .split(",")
    .map(skillName => skillName.trim())
    .filter(skillName => skillName.length > 0)))

  if (parsedSkillNames.length === 0) {
    throw new AppError(AppErrorCode.SKILL_OPTION_EMPTY)
  }

  return parsedSkillNames.map((skillName) => {
    const parsedSkillNameResult = skillNameSchema.safeParse(skillName)

    if (parsedSkillNameResult.success) {
      return parsedSkillNameResult.data
    }

    throw new AppError(AppErrorCode.SKILL_OPTION_INVALID)
  })
}

export { parseSkillNames }
