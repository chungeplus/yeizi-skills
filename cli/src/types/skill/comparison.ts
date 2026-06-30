import type { PlatformName } from "../platform"

/**
 * 技能条目，对齐 Claude Code 官方 frontmatter（name + description）。
 */
interface SkillEntry {
  /**
   * 技能名称。
   */
  name: string

  /**
   * 技能简介。
   */
  description: string
}

/**
 * 技能比较结果行。
 */
interface SkillComparisonRow {
  /**
   * 平台名称。
   */
  platformName: PlatformName

  /**
   * 技能名称。
   */
  skillName: string

  /**
   * 技能简介。
   */
  description: string

  /**
   * 当前技能状态消息。
   */
  statusMessage: string
}

export type { SkillComparisonRow, SkillEntry }
