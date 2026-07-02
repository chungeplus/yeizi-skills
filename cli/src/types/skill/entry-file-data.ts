/**
 * 技能文档 frontmatter 结构，对齐 Claude Code 官方约定，仅包含 name 与 description 两个字段。
 */
interface SkillFrontmatter {
  /**
   * 技能名称。
   */
  name: string

  /**
   * 技能简介。
   */
  description: string
}

export type { SkillFrontmatter }
