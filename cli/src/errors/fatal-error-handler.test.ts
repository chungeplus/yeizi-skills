import { beforeEach, describe, expect, it } from "bun:test"
import { CommanderError } from "commander"

import { AppError, AppErrorCode } from "@/errors"
import { handleFatalError, normalizeFatalError } from "@/errors/fatal-error-handler"

describe("fatal error handler", () => {
  beforeEach(() => {
    process.exitCode = undefined
  })

  it("returns existing app errors unchanged", () => {
    const appError = new AppError(AppErrorCode.UNEXPECTED_ERROR)

    expect(normalizeFatalError(appError)).toBe(appError)
  })

  it("normalizes commander errors through the adapter", () => {
    const commanderError = new CommanderError(1, "commander.missingArgument", "error: missing required argument 'skill'")
    const appError = normalizeFatalError(commanderError)

    expect(appError.code).toBe(AppErrorCode.CLI_USAGE_INVALID)
    expect(appError.message).toBe("缺少必填参数“skill”。")
  })

  it("marks help output as a success exit", () => {
    const originalConsoleError = console.error
    console.error = () => {}

    try {
      handleFatalError(new CommanderError(0, "commander.helpDisplayed", "(outputHelp)"))
    }
    finally {
      console.error = originalConsoleError
    }

    expect(process.exitCode).toBe(0)
  })
})
