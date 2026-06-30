import type { AppErrorCode, AppErrorDefinition, AppErrorParamsMap } from "@/types/error"

import { AppErrorCode as AppErrorCodeValues } from "./code"

/**
 * 根据错误代码获取统一错误定义。
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
function getAppErrorDefinition(code: AppErrorCode): AppErrorDefinition {
  return ({
    [AppErrorCodeValues.UNEXPECTED_ERROR]: {
      title: "程序异常",
      buildMessage: () => "程序执行失败，请稍后重试。",
    },
    [AppErrorCodeValues.CLI_USAGE_INVALID]: {
      title: "命令用法错误",
      buildMessage: (params) => {
        const cliUsageInvalidParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.CLI_USAGE_INVALID]

        return cliUsageInvalidParams.detailMessage
      },
    },
    [AppErrorCodeValues.PACKAGE_BIN_CONFIG_MISSING]: {
      title: "程序配置错误",
      buildMessage: () => "package.json 中缺少 bin 配置。",
    },
    [AppErrorCodeValues.PACKAGE_CONFIG_INVALID_FORMAT]: {
      title: "程序配置错误",
      buildMessage: () => "package.json 配置格式不正确。",
    },
    [AppErrorCodeValues.PACKAGE_CONFIG_NOT_FOUND]: {
      title: "程序配置错误",
      buildMessage: () => "未找到 package.json。",
    },
    [AppErrorCodeValues.PLATFORM_OPTION_EMPTY]: {
      title: "参数错误",
      buildMessage: () => "请至少提供一个平台。",
    },
    [AppErrorCodeValues.PLATFORM_NOT_SUPPORTED]: {
      title: "平台不受支持",
      buildMessage: (params) => {
        const platformNotSupportedParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.PLATFORM_NOT_SUPPORTED]

        return `平台“${platformNotSupportedParams.platformName}”不受支持。`
      },
    },
    [AppErrorCodeValues.PLATFORM_NOT_FOUND]: {
      title: "平台不存在",
      buildMessage: (params) => {
        const platformNotFoundParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.PLATFORM_NOT_FOUND]

        return `以下平台不存在：${platformNotFoundParams.platformNameList.join("、")}。`
      },
    },
    [AppErrorCodeValues.SKILL_OPTION_EMPTY]: {
      title: "参数错误",
      buildMessage: () => "请至少提供一个技能。",
    },
    [AppErrorCodeValues.SKILL_NOT_FOUND]: {
      title: "技能不存在",
      buildMessage: (params) => {
        const skillNotFoundParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.SKILL_NOT_FOUND]

        if (skillNotFoundParams.skillNameList.length === 1) {
          return `技能“${skillNotFoundParams.skillNameList[0]}”不存在。`
        }

        return `以下技能不存在：${skillNotFoundParams.skillNameList.join("、")}。`
      },
    },
    [AppErrorCodeValues.PROMPT_UNAVAILABLE]: {
      title: "交互不可用",
      buildMessage: () => "当前环境不支持交互提示，请显式传入命令所需参数后重试。",
    },
    [AppErrorCodeValues.PROMPT_CANCELLED]: {
      title: "已取消操作",
      buildMessage: () => "已取消本次操作。",
    },
    [AppErrorCodeValues.REMOTE_REPOSITORY_EMPTY]: {
      title: "远端仓库异常",
      buildMessage: () => "远端仓库未发现任何技能，请检查仓库内容。",
    },
    [AppErrorCodeValues.REMOTE_SKILL_DOCUMENT_INVALID]: {
      title: "远端数据异常",
      buildMessage: () => "技能文档 frontmatter 格式不正确。",
    },
    [AppErrorCodeValues.FILE_COPY_FAILED]: {
      title: "文件复制失败",
      buildMessage: (params) => {
        const fileCopyFailedParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.FILE_COPY_FAILED]

        return `从“${fileCopyFailedParams.sourcePath}”复制到“${fileCopyFailedParams.targetPath}”失败。`
      },
    },
    [AppErrorCodeValues.DIRECTORY_REMOVE_FAILED]: {
      title: "删除目录失败",
      buildMessage: (params) => {
        const directoryRemoveFailedParams = params as AppErrorParamsMap[typeof AppErrorCodeValues.DIRECTORY_REMOVE_FAILED]

        return `删除临时目录“${directoryRemoveFailedParams.directoryPath}”失败。`
      },
    },
  } satisfies Record<AppErrorCode, AppErrorDefinition>)[code]
}

export { getAppErrorDefinition }
