import { AppErrorCode } from "./error-code"

/**
 * 错误码与统一标题映射。
 */
export const APP_ERROR_TITLE_BY_CODE = {
  [AppErrorCode.UNEXPECTED_ERROR]: "程序异常",
  [AppErrorCode.CLI_USAGE_INVALID]: "命令用法错误",
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: "程序配置错误",
  [AppErrorCode.PACKAGE_CONFIG_INVALID]: "程序配置错误",
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: "参数错误",
  [AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]: "参数缺失",
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: "平台不受支持",
  [AppErrorCode.SKILL_OPTION_EMPTY]: "参数错误",
  [AppErrorCode.SKILL_OPTION_INVALID]: "参数错误",
  [AppErrorCode.SKILL_NOT_FOUND]: "技能不存在",
  [AppErrorCode.PROMPT_UNAVAILABLE]: "交互不可用",
  [AppErrorCode.PROMPT_CANCELLED]: "已取消操作",
  [AppErrorCode.SKILL_DOCUMENT_MISSING]: "技能文档缺失",
  [AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]: "技能版本异常",
  [AppErrorCode.SKILL_FILES_NOT_LOADED]: "技能文件异常",
  [AppErrorCode.SKILL_INSTALL_PATH_INVALID]: "技能路径异常",
  [AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]: "技能安装异常",
  [AppErrorCode.REMOTE_SKILL_INDEX_INVALID]: "远端数据异常",
  [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: "远端数据异常",
  [AppErrorCode.GITHUB_CONTENTS_INVALID]: "远端数据异常",
  [AppErrorCode.GITHUB_REQUEST_FAILED]: "远端请求失败",
  [AppErrorCode.GITHUB_REQUEST_TIMEOUT]: "远端请求超时",
  [AppErrorCode.GITHUB_CONTENT_PATH_INVALID]: "远端路径异常",
  [AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]: "远端文件异常",
} as const
