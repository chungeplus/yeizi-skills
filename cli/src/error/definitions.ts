import type {
  AppErrorCodeType,
  AppErrorDefinition,
  AppErrorParamsMap,
} from "@/types/error"

import { AppErrorCode } from "./code"

/**
 * 错误代码到错误定义的查找表。
 *
 * 使用 `[K in AppErrorCodeType]: AppErrorDefinition<K>` 的注解确保字面量覆盖所有错误码；
 * 每个 entry 的 `buildMessage` 入参通过 `AppErrorParamsMap[typeof AppErrorCode.X]`
 * 显式标注在函数签名上，避免在函数体内再次使用 `as` 类型断言。
 */
const errorDefinitionMap: {
  [K in AppErrorCodeType]: AppErrorDefinition<K>
} = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  [AppErrorCode.CLI_USAGE_INVALID]: {
    title: "命令用法错误",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.CLI_USAGE_INVALID]) =>
      params.detailMessage,
  },
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: {
    title: "程序配置错误",
    buildMessage: () => "package.json 中缺少 bin 配置。",
  },
  [AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT]: {
    title: "程序配置错误",
    buildMessage: () => "package.json 配置格式不正确。",
  },
  [AppErrorCode.PACKAGE_CONFIG_NOT_FOUND]: {
    title: "程序配置错误",
    buildMessage: () => "未找到 package.json。",
  },
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个平台。",
  },
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: {
    title: "平台不受支持",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.PLATFORM_NOT_SUPPORTED]) =>
      `平台"${params.platformName}"不受支持。`,
  },
  [AppErrorCode.PLATFORM_NOT_FOUND]: {
    title: "平台不存在",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.PLATFORM_NOT_FOUND]) =>
      `以下平台不存在：${params.platformNameList.join("、")}。`,
  },
  [AppErrorCode.SKILL_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个技能。",
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "技能不存在",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.SKILL_NOT_FOUND]) => {
      if (params.skillNameList.length === 1) {
        return `技能"${params.skillNameList[0]}"不存在。`
      }

      return `以下技能不存在：${params.skillNameList.join("、")}。`
    },
  },
  [AppErrorCode.PROMPT_UNAVAILABLE]: {
    title: "交互不可用",
    buildMessage: () => "当前环境不支持交互提示，请显式传入命令所需参数后重试。",
  },
  [AppErrorCode.PROMPT_CANCELLED]: {
    title: "已取消操作",
    buildMessage: () => "已取消本次操作。",
  },
  [AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
    title: "远端仓库异常",
    buildMessage: () => "远端仓库未发现任何技能，请检查仓库内容。",
  },
  [AppErrorCode.FILE_COPY_FAILED]: {
    title: "文件复制失败",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.FILE_COPY_FAILED]) =>
      `从"${params.sourcePath}"复制到"${params.targetPath}"失败。`,
  },
  [AppErrorCode.DIRECTORY_REMOVE_FAILED]: {
    title: "删除目录失败",
    buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.DIRECTORY_REMOVE_FAILED]) =>
      `删除临时目录"${params.directoryPath}"失败。`,
  },
}

/**
 * 根据错误代码获取统一错误定义。
 *
 * 通过泛型 `K` 维持 `buildMessage` 入参与错误码的关联，让返回类型自动收窄到对应 entry 的形状。
 *
 * @param code - 错误代码。
 * @returns 对应的错误定义。
 *
 * @example
 * ```typescript
 * getAppErrorDefinition(AppErrorCode.UNEXPECTED_ERROR)
 * // { title: "程序异常", buildMessage: () => "程序执行失败，请稍后重试。" }
 * ```
 */
function getAppErrorDefinition<K extends AppErrorCodeType>(code: K): AppErrorDefinition<K> {
  return errorDefinitionMap[code]
}

export { errorDefinitionMap, getAppErrorDefinition }
