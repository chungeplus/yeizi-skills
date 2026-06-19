import type { ISkillIndex } from "@/types/skill"

import { AppError, AppErrorCode } from "@/errors"
import { skillIndexSchema } from "@/schemas"

type SkillIndexPayload = Parameters<typeof skillIndexSchema.parse>[0]

/**
 * 解析技能索引数据。
 *
 * @param skillIndexPayload - 未校验的技能索引载荷。
 * @returns 校验后的技能索引结构。
 * @example parseSkillIndex({ skills: [{ name: "yeizi-demo", version: "1.0.0" }] }) => { skills: [{ name: "yeizi-demo", version: "1.0.0" }] }
 */
export function parseSkillIndex(skillIndexPayload: SkillIndexPayload): ISkillIndex {
  try {
    return skillIndexSchema.parse(skillIndexPayload)
  }
  catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error))

    throw new AppError(
      AppErrorCode.REMOTE_SKILL_INDEX_INVALID,
      { cause },
    )
  }
}
