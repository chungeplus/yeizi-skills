import type { CommandOptionsRecord } from "@/types"

/**
 * install 命令的选项结构。
 */
interface IInstallCommandOptions extends CommandOptionsRecord {
  // 要安装到的平台列表。
  platform?: string

  // 要安装的技能列表。
  skill?: string
}

export type { IInstallCommandOptions }
