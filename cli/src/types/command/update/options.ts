import type { PlatformName } from "@/types/platform"

/**
 * update 命令的原始输入选项。
 * 字段名直接对应 CLI 参数名。
 */
interface RawUpdateCommandOptions {
  /**
   * 逗号分隔的平台名称列表。
   */
  platform?: string

  /**
   * 逗号分隔的技能名称列表。
   */
  skill?: string
}

/**
 * update 命令的业务层选项。
 * 字段名见名知意，已解析为实际使用的类型。
 */
interface UpdateCommandOptions {
  /**
   * 平台名称列表。
   */
  platformNameList: PlatformName[]

  /**
   * 技能名称列表。
   */
  skillNameList: string[]
}

export type { RawUpdateCommandOptions, UpdateCommandOptions }
