import type { AppErrorCode } from "@/error/code"

/**
 * 项目统一错误码类型。
 */
type AppErrorCodeType = (typeof AppErrorCode)[keyof typeof AppErrorCode]

/**
 * 错误定义结构。
 *
 * `buildMessage` 故意使用方法简写而非函数类型属性，让具体错误条目可以把参数类型收窄到 `AppErrorParamsMap[code]` 后直接声明在签名上，从而无需在函数体内使用 `as` 类型断言。
 */
interface AppErrorDefinition {
  /**
   * 面向用户展示的错误标题。
   */
  title: string

  /**
   * 根据参数构建错误消息。
   *
   * 故意使用方法简写而非函数类型属性，让具体错误条目的 `buildMessage` 可以把入参收窄到 `AppErrorParamsMap[code]` 后直接声明在签名上，从而无需在函数体内使用 `as` 类型断言。
   */
  // eslint-disable-next-line ts/method-signature-style
  buildMessage(params: AppErrorParamsMap[AppErrorCodeType]): string
}

/**
 * 错误代码与参数结构映射。
 */
interface AppErrorParamsMap {
  [AppErrorCode.UNEXPECTED_ERROR]: undefined
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: undefined
  [AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT]: undefined
  [AppErrorCode.PACKAGE_CONFIG_NOT_FOUND]: undefined
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: undefined
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: { platformName: string }
  [AppErrorCode.PLATFORM_NOT_FOUND]: { platformNameList: string[] }
  [AppErrorCode.SKILL_OPTION_EMPTY]: undefined
  [AppErrorCode.SKILL_NOT_FOUND]: {
    skillNameList: string[]
  }
  [AppErrorCode.PROMPT_UNAVAILABLE]: undefined
  [AppErrorCode.PROMPT_CANCELLED]: undefined
  [AppErrorCode.REMOTE_REPOSITORY_EMPTY]: undefined
  [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: undefined
  [AppErrorCode.FILE_COPY_FAILED]: { sourcePath: string, targetPath: string }
  [AppErrorCode.DIRECTORY_REMOVE_FAILED]: { directoryPath: string }
}

export type { AppErrorCodeType as AppErrorCode, AppErrorDefinition, AppErrorParamsMap }
