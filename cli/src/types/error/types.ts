import type { AppErrorCode } from "@/error/code"

/**
 * 项目统一错误码类型。
 *
 * 由 `error/code` 中 `AppErrorCode` 常量对象的 value 类型派生，是所有错误条目的字面量联合。
 */
type AppErrorCodeType = (typeof AppErrorCode)[keyof typeof AppErrorCode]

/**
 * 错误代码类型别名。供下游按 `AppErrorCode` 习惯名称引用，与值常量 `AppErrorCode` 共同存在。
 */
type AppErrorCode = AppErrorCodeType

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
  [AppErrorCode.FILE_COPY_FAILED]: { sourcePath: string, targetPath: string }
  [AppErrorCode.DIRECTORY_REMOVE_FAILED]: { directoryPath: string }
}

/**
 * 单条错误定义结构。
 *
 * 通过条件类型分发把 `buildMessage` 入参收窄到 `AppErrorParamsMap[K]`；
 * 形如 `[K in AppErrorCodeType]: AppErrorDefinition<K>` 的字面量在每个 entry 内
 * 自动获得精确参数类型，无需函数体内再次使用 `as` 类型断言。
 */
interface AppErrorDefinition<K extends AppErrorCodeType = AppErrorCodeType> {
  /**
   * 面向用户展示的错误标题。
   */
  title: string

  /**
   * 根据参数构建错误消息。
   */
  buildMessage: (params: AppErrorParamsMap[K]) => string
}

export type {
  AppErrorCode,
  AppErrorCodeType,
  AppErrorDefinition,
  AppErrorParamsMap,
}
