import type { PlatformName } from "@/types/platform"

/**
 * install 命令的原始输入选项。
 * 字段名直接对应 CLI 参数名。
 */
interface RawInstallCommandOptions {
  /**
   * 逗号分隔的平台名称列表。
   */
  platform?: string

  /**
   * 逗号分隔的技能名称列表。
   */
  skill?: string

  /**
   * 仅打印将执行的操作、不实际复制。
   */
  dryRun: boolean

  /**
   * 覆盖前把目标目录重命名为 .bak-{timestamp}。
   */
  backup: boolean

  /**
   * giget 离线模式拉取，优先使用缓存。
   */
  offline: boolean
}

/**
 * 复制单技能到单平台时的选项。
 */
interface CopyOptions {
  /**
   * 只打印"将执行的操作"、不动真实目录。
   * 配合 hash 比对后会输出 planned action、不会真 cp。
   */
  dryRun: boolean

  /**
   * 在覆盖前把目标目录重命名为 `<target>.bak-{ts}`，失败则 abort。
   */
  backup: boolean
}

/**
 * install 命令的业务层选项。
 * 字段名见名知意，已解析为实际使用的类型。
 */
interface InstallCommandOptions {
  /**
   * 平台名称列表。
   */
  platformNameList: PlatformName[]

  /**
   * 技能名称列表。
   */
  skillNameList: string[]

  /**
   * 仅打印将执行的操作、不实际复制。
   */
  dryRun: boolean

  /**
   * 覆盖前把目标目录重命名为 .bak-{timestamp}。
   */
  backup: boolean

  /**
   * giget 离线模式拉取，优先使用缓存。
   */
  offline: boolean
}

export type { CopyOptions, InstallCommandOptions, RawInstallCommandOptions }
