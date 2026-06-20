import type { Command } from "commander"

/**
 * 命令选项定义。
 */
interface ICommandOptionDefinition {
  /**
   * 命令行选项声明。
   */
  flags: string

  /**
   * 命令行选项说明。
   */
  description: string
}

/**
 * 命令选项允许的值类型。
 */
type CommandOptionValue = boolean | string | string[] | undefined

/**
 * 命令选项对象。
 */
type CommandOptionsRecord = Record<string, CommandOptionValue>

/**
 * 命令对象公共接口。
 *
 * @typeParam TOptions - 命令选项类型。
 */
interface ICommand<TOptions extends CommandOptionsRecord> {
  /**
   * 用于注册到 Commander 的命令名称。
   */
  readonly command: string

  /**
   * 展示在帮助信息中的命令说明。
   */
  readonly description: string

  /**
   * 命令支持的选项定义列表。
   */
  readonly options: readonly ICommandOptionDefinition[]

  /**
   * 把当前命令注册到 Commander 程序对象。
   */
  register: (program: Command) => void

  /**
   * 执行当前命令的业务逻辑。
   */
  execute: (options: TOptions) => Promise<void>
}

export type { CommandOptionsRecord, CommandOptionValue, ICommand, ICommandOptionDefinition }
