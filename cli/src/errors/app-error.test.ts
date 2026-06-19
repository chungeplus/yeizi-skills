import { describe, expect, it } from "bun:test"

import { AppError, AppErrorCode } from "@/errors"

describe("AppError", () => {
  it("uses the definition title and default message for code-only errors", () => {
    const error = new AppError(AppErrorCode.UNEXPECTED_ERROR)

    expect(error.title).toBe("程序异常")
    expect(error.message).toBe("程序执行失败，请稍后重试。")
  })

  it("builds a single-skill not-found message from typed params", () => {
    const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNames: ["yeizi-react"] },
    })

    expect(error.title).toBe("技能不存在")
    expect(error.message).toBe("技能“yeizi-react”不存在。")
  })

  it("preserves cause while building a status-code GitHub failure message", () => {
    const cause = new Error("network")
    const error = new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
      params: { kind: "status-code", statusCode: 404 },
      cause,
    })

    expect(error.cause).toBe(cause)
    expect(error.message).toBe("GitHub 请求失败，状态码为 404。")
  })

  it("keeps the legacy title and message constructor working", () => {
    const cause = new Error("legacy")
    const error = new AppError(
      AppErrorCode.CLI_USAGE_INVALID,
      "命令用法错误",
      "legacy message",
      { cause },
    )

    expect(error.title).toBe("命令用法错误")
    expect(error.message).toBe("legacy message")
    expect(error.cause).toBe(cause)
  })
})
