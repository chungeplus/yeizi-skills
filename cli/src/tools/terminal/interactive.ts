import process from "node:process"

import { AppError, AppErrorCode } from "@/error"

/**
 * 判断当前进程是否同时具备 stdin 和 stdout TTY。
 *
 * @returns stdin 与 stdout 都为 TTY 时返回 true，否则返回 false。
 *
 * @example
 * ```typescript
 * getInteractiveTerminal() // true
 * ```
 */
function getInteractiveTerminal(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

/**
 * 包裹 inquirer 调用的统一执行器，在非交互终端或用户取消时转抛业务错误。
 *
 * @param promptRunner - 执行 inquirer 提示并返回答案 Promise 的函数。
 * @returns inquirer 提示的答案。
 * @throws 终端非交互时抛出 AppError(PROMPT_UNAVAILABLE)；用户按 Ctrl+C 取消时抛出 AppError(PROMPT_CANCELLED)，并保留原始错误作为 cause。
 *
 * @example
 * ```typescript
 * executePrompt(() =>
 *   inquirer.prompt([
 *     { type: "checkbox", name: "items", message: "请选择。", choices: ["a"] }
 *   ])
 * )
 * ```
 */
async function executePrompt<TAnswers>(promptRunner: () => Promise<TAnswers>): Promise<TAnswers> {
  if (!getInteractiveTerminal()) {
    throw new AppError(AppErrorCode.PROMPT_UNAVAILABLE)
  }

  try {
    return await promptRunner()
  }
  catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      throw new AppError(AppErrorCode.PROMPT_CANCELLED, { cause: error })
    }

    if (error instanceof Error) {
      throw error
    }

    throw new AppError(AppErrorCode.UNEXPECTED_ERROR)
  }
}

export { executePrompt }
