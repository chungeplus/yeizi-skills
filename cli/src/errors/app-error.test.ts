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

  it("builds command-specific non-interactive guidance", () => {
    const error = new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
      params: {
        optionName: "--platform",
        actionName: "安装",
        targetName: "平台",
      },
    })

    expect(error.message).toBe("当前环境不支持交互提示，请使用 --platform 显式指定要安装的平台。")
  })

  it("builds the package-config not-found variant", () => {
    const error = new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
      params: { kind: "not-found" },
    })

    expect(error.message).toBe("未找到 package.json。")
  })

  it("builds a multi-skill not-found message", () => {
    const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: {
        skillNames: ["yeizi-react", "yeizi-vue"],
      },
    })

    expect(error.message).toBe("以下技能不存在：yeizi-react、yeizi-vue。")
  })
})
