import type { Command } from "commander"

import { createInstallCommand } from "./install"
import { createListCommand } from "./list"
import { createUpdateCommand } from "./update"

/**
 * 向 Commander 程序注册全部子命令。
 *
 * @param program - Commander 程序实例。
 */
export function registerCommands(program: Command): void {
  createListCommand().register(program)
  createInstallCommand().register(program)
  createUpdateCommand().register(program)
}
