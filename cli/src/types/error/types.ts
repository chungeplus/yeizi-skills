import type { AppErrorCode } from "@/error/code"

/**
 * 项目统一错误码类型。
 */
type AppErrorCodeType = (typeof AppErrorCode)[keyof typeof AppErrorCode]

/**
 * 错误定义结构。
 */
interface AppErrorDefinition {
  /**
   * 面向用户展示的错误标题。
   */
  title: string

  /**
   * 根据参数构建错误消息。
   */
  buildMessage: (params: AppErrorParamsMap[AppErrorCodeType]) => string
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
