import type { ISkillIndex } from "@/types/skill"

import { AppError, AppErrorCode } from "@/errors"
import { skillIndexSchema } from "@/schemas"

/**
 * 解析技能索引数据。
 *
 * @param skillIndexPayload - 未校验的技能索引载荷。
 * @returns 校验后的技能索引结构。
 * @example parseSkillIndex({ skills: [{ name: "yeizi-demo", version: "1.0.0" }] }) => { skills: [{ name: "yeizi-demo", version: "1.0.0" }] }
 */
export function parseSkillIndex(skillIndexPayload: unknown): ISkillIndex {
  try {
    return skillIndexSchema.parse(skillIndexPayload)
  }
  catch (error) {
    throw new AppError(
      AppErrorCode.REMOTE_SKILL_INDEX_INVALID,
      "远端数据异常",
      "远端技能索引格式不正确。",
      { cause: error },
    )
  }
}
