import type { AppErrorCode, AppErrorOptions } from "@/types/error"

import { getAppErrorDefinition } from "./definitions"

/**
 * 项目统一应用错误类型。
 */
class AppError extends Error {
  /**
   * 错误代码。
   */
  public readonly code: AppErrorCode

  /**
   * 面向用户展示的错误标题。
   */
  public readonly title: string

  /**
   * 创建应用错误实例。
   *
   * @param code - 错误代码。
   * @param options - 错误附加选项。
   */
  public constructor(code: AppErrorCode, options?: AppErrorOptions) {
    const definition = getAppErrorDefinition(code)
    const params = options?.params

    super(definition.buildMessage(params), {
      cause: options?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}

export { AppError }
