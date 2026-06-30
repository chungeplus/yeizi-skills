import type { Command } from "commander"

import type { CommandOptionDefinition } from "./command-option"

/**
 * 命令公共接口。
 *
 * @typeParam TOptions - 命令选项类型。
 */
interface BaseCommand<TOptions> {
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
  readonly optionList: readonly CommandOptionDefinition[]

  /**
   * 把当前命令注册到 Commander 程序对象。
   */
  register: (program: Command) => void

  /**
   * 执行当前命令的业务逻辑。
   */
  execute: (options: TOptions) => Promise<void>
}

export type { BaseCommand }
