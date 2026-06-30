import process from "node:process"

import { Command } from "commander"

import { InstallCommand } from "@/commands/install"
import { ListCommand } from "@/commands/list"
import { AppError, AppErrorCode, handleFatalError } from "@/error"
import { loadPackageJsonInfo } from "@/tools/package-json/load-info"

/**
 * 创建 CLI 程序实例。
 *
 * @returns Commander 程序实例
 */
async function createProgram(): Promise<Command> {
  const packageJsonInfo = await loadPackageJsonInfo()
  const programNameList = Object.keys(packageJsonInfo.bin)

  if (programNameList.length === 0) {
    throw new AppError(AppErrorCode.PACKAGE_BIN_CONFIG_MISSING)
  }

  const program = new Command()

  program.exitOverride()
  program.configureOutput({
    outputError: () => { },
  })
  program.name(programNameList[0])
  program.description(packageJsonInfo.description)
  program.version(packageJsonInfo.version)

  new ListCommand().register(program)
  new InstallCommand().register(program)

  return program
}

/**
 * 运行 CLI 主入口流程。
 *
 * @returns Promise 完成时无返回值。
 */
async function runCli(): Promise<void> {
  try {
    const program = await createProgram()

    await program.parseAsync(process.argv)
  }
  catch (error) {
    if (error instanceof Error) {
      handleFatalError(error)
      return
    }

    handleFatalError(new AppError(AppErrorCode.UNEXPECTED_ERROR))
  }
}

export { runCli }
