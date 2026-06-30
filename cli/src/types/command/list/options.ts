import type { PlatformName } from "@/types/platform"

/**
 * list 命令的原始输入选项。
 * 字段名直接对应 CLI 参数名。
 */
interface RawListCommandOptions {
  /**
   * 逗号分隔的平台名称列表。
   */
  platform?: string
}

/**
 * list 命令的业务层选项。
 * 字段名见名知意，已解析为实际使用的类型。
 */
interface ListCommandOptions {
  /**
   * 平台名称列表。
   */
  platformNameList: PlatformName[]
}

export type { ListCommandOptions, RawListCommandOptions }
