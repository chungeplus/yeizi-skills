import type { CommanderMessageBuilderMap } from "@/types/error"
import { CommanderError } from "commander"
import { AppError } from "./app"
import { AppErrorCode } from "./code"

/**
 * 把 Commander 抛出的错误归一化为 {@link AppError}。
 *
 * @param error - Commander 抛出的错误。
 * @returns 携带 CLI_USAGE_INVALID 错误码的应用错误。
 *
 * @example
 * ```typescript
 * buildCommanderAppError(new CommanderError(1, "unknown command 'foo'"))
 * // AppError { code: "cli-usage-invalid", ... }
 * ```
 */
function buildCommanderAppError(error: CommanderError): AppError {
  return new AppError(AppErrorCode.CLI_USAGE_INVALID, {
    params: {
      detailMessage: buildCommanderErrorMessage(error),
    },
    cause: error,
  })
}

/**
 * 根据 Commander 错误码生成面向用户的提示消息。
 *
 * @param error - Commander 抛出的错误。
 * @returns 错误对应的中文提示消息。
 *
 * @example
 * ```typescript
 * buildCommanderErrorMessage({ code: "commander.unknownCommand", message: "..." })
 * // "命令“foo”不存在，请使用 --help 查看可用命令。"
 * ```
 */
function buildCommanderErrorMessage(error: CommanderError): string {
  const messageBuilderMap: CommanderMessageBuilderMap = {
    "commander.unknownCommand": currentError =>
      `命令“${extractQuotedValue(currentError.message)}”不存在，请使用 --help 查看可用命令。`,
    "commander.unknownOption": currentError =>
      `选项“${extractQuotedValue(currentError.message)}”不受支持，请使用 --help 查看可用选项。`,
    "commander.optionMissingArgument": currentError =>
      `选项“${extractQuotedValue(currentError.message)}”缺少参数值。`,
    "commander.missingMandatoryOptionValue": currentError =>
      `缺少必填选项“${extractQuotedValue(currentError.message)}”。`,
    "commander.missingArgument": currentError =>
      `缺少必填参数“${extractQuotedValue(currentError.message)}”。`,
    "commander.excessArguments": currentError =>
      buildExcessArgumentsMessage(currentError.message),
  }

  const builder = messageBuilderMap[error.code]

  if (builder !== undefined) {
    return builder(error)
  }

  return "命令参数不正确，请使用 --help 查看正确用法。"
}

/**
 * 解析 Commander 多余参数提示中的期望值与实际值。
 *
 * @param message - Commander 抛出的原始错误消息。
 * @returns 拼装后的中文提示消息。
 *
 * @example
 * ```typescript
 * buildExcessArgumentsMessage("error: too many arguments. Expected 1 arguments but got 3.")
 * // "命令参数过多，期望 1 个，实际收到 3 个。"
 * ```
 */
function buildExcessArgumentsMessage(message: string): string {
  const matchedResult = message.match(/Expected (\d+) arguments? but got (\d+)\./)

  if (matchedResult === null) {
    return "命令参数过多，请使用 --help 查看正确用法。"
  }

  return `命令参数过多，期望 ${matchedResult[1]} 个，实际收到 ${matchedResult[2]} 个。`
}

/**
 * 从 Commander 错误消息中提取单引号包裹的值。
 *
 * @param message - Commander 抛出的原始错误消息。
 * @returns 单引号内的字符串（Commander 已知错误码下必定存在）。
 *
 * @example
 * ```typescript
 * extractQuotedValue("error: unknown command 'foo'") // "foo"
 * ```
 */
function extractQuotedValue(message: string): string {
  const matchedResult = message.match(/'([^']+)'/)

  return matchedResult![1]
}

export { buildCommanderAppError }
