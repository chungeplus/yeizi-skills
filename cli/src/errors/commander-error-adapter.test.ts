import { describe, expect, it } from "bun:test"
import { CommanderError } from "commander"

import { AppErrorCode } from "@/errors"
import { buildCommanderAppError, isCommanderNonFailure } from "@/errors/commander-error-adapter"

describe("Commander error adapter", () => {
  it("maps unknown options into CLI usage errors", () => {
    const commanderError = new CommanderError(1, "commander.unknownOption", "error: unknown option '--skill'")
    const appError = buildCommanderAppError(commanderError)

    expect(appError.code).toBe(AppErrorCode.CLI_USAGE_INVALID)
    expect(appError.title).toBe("命令用法错误")
    expect(appError.message).toBe("选项“--skill”不受支持，请使用 --help 查看可用选项。")
  })

  it("treats helpDisplayed as a non-failure exit", () => {
    const commanderError = new CommanderError(0, "commander.helpDisplayed", "(outputHelp)")

    expect(isCommanderNonFailure(commanderError)).toBe(true)
  })
})
