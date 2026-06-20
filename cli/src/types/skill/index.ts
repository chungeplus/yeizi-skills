import type { SupportedPlatformName } from "../platform"

/**
 * 技能比较状态常量。
 */
const SkillComparisonStatus = {
  NOT_INSTALLED: "该技能尚未安装。",
  LOCAL_SKILL_INVALID: "本地技能已损坏，可通过 update 重新安装。",
  UP_TO_DATE: "该技能已经是最新版本。",
  UPDATE_AVAILABLE: "该技能有可用更新。",
  MISSING_SKILLS_DIRECTORY: "该平台的 skills 目录不存在。",
} as const

/**
 * 技能索引条目。
 */
interface ISkillIndexEntry {
  /**
   * 技能名称。
   */
  name: string

  /**
   * 技能版本。
   */
  version: string
}

/**
 * 技能索引结构。
 */
interface ISkillIndex {
  /**
   * 可用技能列表。
   */
  skills: ISkillIndexEntry[]
}

/**
 * 技能文档 frontmatter 结构。
 */
interface ISkillFrontmatter {
  /**
   * 技能名称。
   */
  name: string

  /**
   * 技能版本。
   */
  version: string

  /**
   * 技能说明。
   */
  description?: string
}

/**
 * 技能比较状态消息类型。
 */
type SkillComparisonStatusMessage = (typeof SkillComparisonStatus)[keyof typeof SkillComparisonStatus]

/**
 * 技能比较结果行。
 */
interface ISkillComparisonRow {
  /**
   * 平台名称。
   */
  platformName: SupportedPlatformName

  /**
   * 技能名称。
   */
  skillName: ISkillIndexEntry["name"]

  /**
   * 远端版本号。
   */
  remoteVersion: ISkillIndexEntry["version"]

  /**
   * 本地版本号。
   */
  localVersion: string | null

  /**
   * 当前技能状态消息。
   */
  statusMessage: SkillComparisonStatusMessage
}

export { SkillComparisonStatus }
export type { ISkillComparisonRow, ISkillFrontmatter, ISkillIndex, ISkillIndexEntry, SkillComparisonStatusMessage }
