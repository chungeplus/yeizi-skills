import type { CommandOptionsRecord } from "@/types"

/**
 * list 命令的选项结构。
 */
export interface IListCommandOptions extends CommandOptionsRecord {
  // 要查看的平台列表。
  platform?: string
}
