import process from "node:process"

import { Command } from "commander"

import { registerCommands } from "@/commands"
import { AppError, AppErrorCode, handleFatalError } from "@/errors"
import { loadPackageJsonInfo } from "@/tools"

/**
 * 创建 CLI 程序实例。
 *
 * @returns Commander 程序实例
 */
function createProgram(): Command {
  const packageJsonInfo = loadPackageJsonInfo()
  const programNames = Object.keys(packageJsonInfo.bin)

  if (programNames.length === 0) {
    throw new AppError(AppErrorCode.PACKAGE_BIN_CONFIG_MISSING)
  }

  const program = new Command()

  program.exitOverride()
  program.configureOutput({
    outputError: () => {},
  })
  program.name(programNames[0])
  program.description(packageJsonInfo.description)
  program.version(packageJsonInfo.version)

  registerCommands(program)

  return program
}

/**
 * 运行 CLI 主入口流程。
 */
async function runCli(): Promise<void> {
  try {
    const program = createProgram()

    await program.parseAsync(process.argv)
  }
  catch (error) {
    let normalizedError: Error

    if (error instanceof Error) {
      normalizedError = error
    }
    else {
      normalizedError = new Error(String(error))
    }

    handleFatalError(normalizedError)
  }
}

export default runCli
