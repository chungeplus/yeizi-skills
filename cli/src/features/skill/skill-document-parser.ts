import type { ISkillFrontmatter } from "@/types/skill"

import matter from "gray-matter"
import { AppError, AppErrorCode } from "@/errors"
import { skillFrontmatterSchema } from "@/schemas"

/**
 * 技能文档解析器。
 */
export class SkillDocumentParser {
  /**
   * 解析技能文档 frontmatter。
   *
   * @param skillDocumentContent - 技能文档内容。
   * @returns 解析后的 frontmatter 结构。
   * @example parseFrontmatter("---\nname: yeizi-demo\nversion: 1.0.0\n---") => { name: "yeizi-demo", version: "1.0.0" }
   */
  public parseFrontmatter(skillDocumentContent: string): ISkillFrontmatter {
    try {
      const frontmatterResult = matter(skillDocumentContent)

      return skillFrontmatterSchema.parse(frontmatterResult.data)
    }
    catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error))

      throw new AppError(
        AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID,
        "远端数据异常",
        "技能文档 frontmatter 格式不正确。",
        { cause },
      )
    }
  }

  /**
   * 解析技能版本号。
   *
   * @param skillDocumentContent - 技能文档内容。
   * @returns 技能版本号。
   * @example parseSkillVersion("---\nname: yeizi-demo\nversion: 1.0.0\n---") => "1.0.0"
   */
  public parseSkillVersion(skillDocumentContent: string): string {
    return this.parseFrontmatter(skillDocumentContent).version
  }
}
