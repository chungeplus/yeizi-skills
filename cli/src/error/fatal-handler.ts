import process from "node:process"
import { CommanderError } from "commander"

import { AppError } from "./app"
import { AppErrorCode } from "./code"
import { buildCommanderAppError } from "./commander-adapter"
import { renderErrorDisplay } from "./display"

/**
 * 判断当前错误是否是 Commander 抛出的非失败退出。
 *
 * @param error - 待判断的错误。
 * @returns true 表示错误来自 Commander 但属于 --help/--version 这类主动退出。
 *
 * @example
 * ```typescript
 * isCommanderNonFailure(new CommanderError(0, "commander.helpDisplayed", "")) // true
 * ```
 */
function isCommanderNonFailure(error: Error): error is CommanderError {
  return error instanceof CommanderError && error.exitCode === 0
}

/**
 * 程序统一错误出口：归一化错误、渲染提示并设置 process.exitCode。
 *
 * @param error - 任意来源的捕获错误。
 * @returns 无返回值。
 *
 * @example
 * ```typescript
 * handleFatalError(new AppError(AppErrorCode.UNEXPECTED_ERROR))
 * ```
 */
function handleFatalError(error: Error): void {
  if (isCommanderNonFailure(error)) {
    process.exitCode = error.exitCode
    return
  }

  const fatalError = wrapAsFatalAppError(error)

  renderErrorDisplay(fatalError.title, fatalError.message)
  process.exitCode = 1
}

/**
 * 把任意错误归一化为带 code/title/message 的 {@link AppError}。
 *
 * @param error - 任意来源的捕获错误。
 * @returns 归一化后的应用错误。
 *
 * @example
 * ```typescript
 * wrapAsFatalAppError(new Error("boom")) // AppError { code: "unexpected-error", ... }
 * ```
 */
function wrapAsFatalAppError(error: Error): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof CommanderError) {
    return buildCommanderAppError(error)
  }

  if (error.name === "ExitPromptError") {
    return new AppError(AppErrorCode.PROMPT_CANCELLED, { cause: error })
  }

  return new AppError(AppErrorCode.UNEXPECTED_ERROR, { cause: error })
}

export { handleFatalError }
