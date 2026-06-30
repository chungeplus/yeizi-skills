/**
 * 命令选项定义。
 */
interface CommandOptionDefinition {
  /**
   * 命令行选项声明。
   */
  flags: string

  /**
   * 命令行选项说明。
   */
  description: string
}

export type { CommandOptionDefinition }
