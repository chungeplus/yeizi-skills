import type { SkillFrontmatter } from "@/types/skill"

import matter from "gray-matter"

import { AppError, AppErrorCode } from "@/error"
import { skillFrontmatterSchema } from "@/schemas/skill/frontmatter"

/**
 * 解析技能文档 frontmatter。
 *
 * @param skillDocumentContent - 技能文档内容。
 * @returns 解析后的 frontmatter 结构。
 * @throws frontmatter 格式不正确时抛出 {@link AppError}。
 *
 * @example
 * ```typescript
 * parseFrontmatter(`
 * ---
 * skillName: yeizi-demo
 * skillVersion: 1.0.0
 * ---
 * `)
 * // { skillName: "yeizi-demo", skillVersion: "1.0.0" }
 * ```
 */
function parseFrontmatter(skillDocumentContent: string): SkillFrontmatter {
  try {
    const frontmatterResult = matter(skillDocumentContent)
    return skillFrontmatterSchema.parse(frontmatterResult.data)
  }
  catch (error) {
    if (error instanceof Error) {
      throw new AppError(AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID, { cause: error })
    }
    throw new AppError(AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID)
  }
}

/**
 * 解析技能版本号。
 *
 * @param skillDocumentContent - 技能文档内容。
 * @returns 技能版本号。
 * @throws frontmatter 格式不正确时抛出 {@link AppError}。
 *
 * @example
 * ```typescript
 * parseSkillVersion(`
 * ---
 * skillName: yeizi-demo
 * skillVersion: 1.0.0
 * ---
 * `)
 * // "1.0.0"
 * ```
 */
function parseSkillVersion(skillDocumentContent: string): string {
  return parseFrontmatter(skillDocumentContent).skillVersion
}

export { parseSkillVersion }
