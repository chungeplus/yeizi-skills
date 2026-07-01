import type { PlatformName } from "./name"

/**
 * 单个平台的配置条目。
 */
interface PlatformItem {
  /**
   * 平台名称。
   */
  platformName: PlatformName

  /**
   * 平台主目录绝对路径。
   */
  platformHomeDirectoryPath: string

  /**
   * 平台技能目录绝对路径。
   */
  platformSkillDirectoryPath: string
}

/**
 * 平台配置整体结构。
 */
interface PlatformConfig {
  /**
   * 平台条目列表。
   */
  readonly platformList: readonly PlatformItem[]
}

export type { PlatformConfig, PlatformItem }
