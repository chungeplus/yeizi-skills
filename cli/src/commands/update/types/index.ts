import type { CommandOptionsRecord } from "@/types"

/**
 * update 命令的选项结构。
 */
interface IUpdateCommandOptions extends CommandOptionsRecord {
  /**
   * 要更新的平台列表。
   */
  platform?: string

  /**
   * 要更新的技能列表。
   */
  skill?: string
}

export type { IUpdateCommandOptions }
