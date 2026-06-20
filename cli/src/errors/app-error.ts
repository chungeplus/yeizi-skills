import type { AppErrorCodeName, IAppErrorParamsMap } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

/**
 * 应用错误附加选项。
 */
interface IAppErrorOptions {
  /**
   * 原始错误对象。
   */
  cause?: Error

  /**
   * 错误消息模板所需参数。
   */
  params?: IAppErrorParamsMap[AppErrorCodeName]
}

/**
 * 项目统一应用错误类型。
 */
class AppError extends Error {
  /**
   * 错误代码。
   */
  public readonly code: AppErrorCodeName

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
  public constructor(code: AppErrorCodeName, options?: IAppErrorOptions) {
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
