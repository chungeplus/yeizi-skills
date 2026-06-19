import process from "node:process"
import { CommanderError } from "commander"

import { AppError } from "./app-error"
import { buildCommanderAppError, isCommanderNonFailure } from "./commander-error-adapter"
import { AppErrorCode } from "./error-code"
import { renderErrorDisplay } from "./error-display"

function handleFatalError(error: Error): void {
  if (isCommanderNonFailure(error)) {
    process.exitCode = error.exitCode
    return
  }

  const fatalError = normalizeFatalError(error)

  renderErrorDisplay(fatalError.title, fatalError.message)
  process.exitCode = 1
}

function normalizeFatalError(error: Error): AppError {
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

export { handleFatalError, normalizeFatalError }
