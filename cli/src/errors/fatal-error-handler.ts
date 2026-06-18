import process from "node:process"

import { CommanderError } from "commander"

import { renderErrorDisplay } from "@/tools/error-display"

import { AppError } from "./app-error"
import { AppErrorCode } from "./error-code"

/**
 * 处理 CLI 致命错误。
 *
 * 统一将各种错误类型包装为可显示的 AppError，并输出到终端。
 *
 * @param error: 来自顶层捕获的任意错误对象
 */
function handleFatalError<T = unknown>(error: T): void {
  if (error instanceof CommanderError && error.exitCode === 0) {
    process.exitCode = 0
    return
  }

  if (error instanceof CommanderError && error.code === "commander.help") {
    process.exitCode = 0
    return
  }

  const fatalError = normalizeFatalError(error)

  renderErrorDisplay(fatalError.title, fatalError.message)
  process.exitCode = 1
}

/**
 * 将任意类型的错误归一化为 AppError。
 *
 * 根据错误类型转换为对应的错误码和提示信息。
 *
 * @param error: 任意来源的错误
 * @returns: 归一化后的 AppError 实例
 */
function normalizeFatalError<T = unknown>(error: T): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof CommanderError) {
    return new AppError(
      AppErrorCode.CLI_USAGE_INVALID,
      "命令用法错误",
      buildCommanderErrorMessage(error),
      { cause: error },
    )
  }

  if (error instanceof Error && error.name === "ExitPromptError") {
    return new AppError(
      AppErrorCode.PROMPT_CANCELLED,
      "已取消操作",
      "已取消本次操作。",
      { cause: error },
    )
  }

  if (error instanceof Error) {
    return new AppError(
      AppErrorCode.UNEXPECTED_ERROR,
      "程序异常",
      "程序执行失败，请稍后重试。",
      { cause: error },
    )
  }

  return new AppError(
    AppErrorCode.UNEXPECTED_ERROR,
    "程序异常",
    "发生了未知错误。",
    { cause: error },
  )
}

/**
 * 根据 CommanderError 构建用户友好的错误信息。
 *
 * 针对不同类型的 commander 错误，给出更清晰的中文提示。
 *
 * @param error: commander 抛出的错误
 * @returns: 格式化后的错误信息字符串
 */
function buildCommanderErrorMessage(error: CommanderError): string {
  switch (error.code) {
    case "commander.unknownCommand":
      return `命令“${extractQuotedValue(error.message) ?? "未知命令"}”不存在，请使用 --help 查看可用命令。`
    case "commander.unknownOption":
      return `选项“${extractQuotedValue(error.message) ?? "未知选项"}”不受支持，请使用 --help 查看可用选项。`
    case "commander.optionMissingArgument":
      return `选项“${extractQuotedValue(error.message) ?? "未知选项"}”缺少参数值。`
    case "commander.missingMandatoryOptionValue":
      return `缺少必填选项“${extractQuotedValue(error.message) ?? "未知选项"}”。`
    case "commander.missingArgument":
      return `缺少必填参数“${extractQuotedValue(error.message) ?? "未知参数"}”。`
    case "commander.excessArguments":
      return buildExcessArgumentsMessage(error.message)
    default:
      return "命令参数不正确，请使用 --help 查看正确用法。"
  }
}

/**
 * 构建参数过多错误的提示信息。
 *
 * 从 commander 的错误信息中提取期望和实际参数数量，生成更友好的提示。
 *
 * @param message: commander 原始错误信息
 * @returns: 格式化后的提示信息
 */
function buildExcessArgumentsMessage(message: string): string {
  const matchedResult = message.match(/Expected (\d+) arguments? but got (\d+)\./)

  if (matchedResult === null) {
    return "命令参数过多，请使用 --help 查看正确用法。"
  }

  return `命令参数过多，期望 ${matchedResult[1]} 个，实际收到 ${matchedResult[2]} 个。`
}

/**
 * 从错误信息中提取被单引号包裹的值。
 *
 * 常用于提取 commander 错误信息中的未知命令/选项名称。
 *
 * @param message: 错误信息字符串
 * @returns: 提取出的字符串，如果匹配失败返回 null
 */
function extractQuotedValue(message: string): string | null {
  const matchedResult = message.match(/'([^']+)'/)

  return matchedResult?.[1] ?? null
}

export { handleFatalError }
