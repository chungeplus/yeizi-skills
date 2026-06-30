import type { AppErrorCode, AppErrorParamsMap } from "./types"

/**
 * 应用错误附加选项。
 */
interface AppErrorOptions {
  /**
   * 原始错误对象。
   */
  cause?: Error

  /**
   * 错误消息模板所需参数。
   */
  params?: AppErrorParamsMap[AppErrorCode]
}

export type { AppErrorOptions }
