import { CommanderError } from "commander"

import { AppError } from "./app-error"
import { AppErrorCode } from "./error-code"

type CommanderMessageBuilder = (error: CommanderError) => string
type CommanderMessageBuilders = Record<string, CommanderMessageBuilder>

export function isCommanderNonFailure(error: Error): error is CommanderError {
  return error instanceof CommanderError && error.exitCode === 0
}

export function buildCommanderAppError(error: CommanderError): AppError<typeof AppErrorCode.CLI_USAGE_INVALID> {
  return new AppError(AppErrorCode.CLI_USAGE_INVALID, {
    params: {
      detailMessage: buildCommanderErrorMessage(error),
    },
    cause: error,
  })
}

export function buildCommanderErrorMessage(error: CommanderError): string {
  const builders: CommanderMessageBuilders = {
    "commander.unknownCommand": currentError =>
      `命令“${extractQuotedValue(currentError.message) ?? "未知命令"}”不存在，请使用 --help 查看可用命令。`,
    "commander.unknownOption": currentError =>
      `选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”不受支持，请使用 --help 查看可用选项。`,
    "commander.optionMissingArgument": currentError =>
      `选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”缺少参数值。`,
    "commander.missingMandatoryOptionValue": currentError =>
      `缺少必填选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”。`,
    "commander.missingArgument": currentError =>
      `缺少必填参数“${extractQuotedValue(currentError.message) ?? "未知参数"}”。`,
    "commander.excessArguments": currentError =>
      buildExcessArgumentsMessage(currentError.message),
  }

  const builder = builders[error.code]

  if (builder !== undefined) {
    return builder(error)
  }

  return "命令参数不正确，请使用 --help 查看正确用法。"
}

function buildExcessArgumentsMessage(message: string): string {
  const matchedResult = message.match(/Expected (\d+) arguments? but got (\d+)\./)

  if (matchedResult === null) {
    return "命令参数过多，请使用 --help 查看正确用法。"
  }

  return `命令参数过多，期望 ${matchedResult[1]} 个，实际收到 ${matchedResult[2]} 个。`
}

function extractQuotedValue(message: string): string | null {
  const matchedResult = message.match(/'([^']+)'/)

  return matchedResult?.[1] ?? null
}
