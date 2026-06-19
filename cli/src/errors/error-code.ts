/**
 * 项目统一错误码。
 */
const AppErrorCode = {
  /**
   * 发生了未预期的错误。
   */
  UNEXPECTED_ERROR: "unexpected-error",
  /**
   * CLI 参数使用不正确。
   */
  CLI_USAGE_INVALID: "cli-usage-invalid",
  /**
   * package.json 中缺少 bin 配置。
   */
  PACKAGE_BIN_CONFIG_MISSING: "package-bin-missing",
  /**
   * package.json 配置格式不正确。
   */
  PACKAGE_CONFIG_INVALID: "package-config-invalid",
  /**
   * 平台选项为空。
   */
  PLATFORM_OPTION_EMPTY: "platform-option-empty",
  /**
   * 非交互式模式下缺少必填选项。
   */
  NON_INTERACTIVE_OPTION_REQUIRED: "non-interactive-option-required",
  /**
   * 当前平台不支持该操作。
   */
  PLATFORM_NOT_SUPPORTED: "platform-not-supported",
  /**
   * Skill 选项为空。
   */
  SKILL_OPTION_EMPTY: "skill-option-empty",
  /**
   * Skill 选项格式不正确。
   */
  SKILL_OPTION_INVALID: "skill-option-invalid",
  /**
   * 找不到指定的 Skill。
   */
  SKILL_NOT_FOUND: "skill-not-found",
  /**
   * 当前环境不支持交互式提示。
   */
  PROMPT_UNAVAILABLE: "prompt-unavailable",
  /**
   * 用户取消了交互式提示。
   */
  PROMPT_CANCELLED: "prompt-cancelled",
  /**
   * Skill 文档文件缺失。
   */
  SKILL_DOCUMENT_MISSING: "skill-document-missing",
  /**
   * Skill 文档版本不匹配。
   */
  SKILL_DOCUMENT_VERSION_MISMATCH: "skill-document-version-mismatch",
  /**
   * Skill 文件加载失败。
   */
  SKILL_FILES_NOT_LOADED: "skill-files-not-loaded",
  /**
   * Skill 安装路径无效。
   */
  SKILL_INSTALL_PATH_INVALID: "skill-install-path-invalid",
  /**
   * Skill 目录恢复失败。
   */
  SKILL_DIRECTORY_RESTORE_FAILED: "skill-directory-restore-failed",
  /**
   * 远端 Skill 索引格式不正确。
   */
  REMOTE_SKILL_INDEX_INVALID: "remote-skill-index-invalid",
  /**
   * 远端 Skill 文档格式不正确。
   */
  REMOTE_SKILL_DOCUMENT_INVALID: "remote-skill-document-invalid",
  /**
   * GitHub 返回的内容格式不正确。
   */
  GITHUB_CONTENTS_INVALID: "github-contents-invalid",
  /**
   * GitHub 请求失败。
   */
  GITHUB_REQUEST_FAILED: "github-request-failed",
  /**
   * GitHub 请求超时。
   */
  GITHUB_REQUEST_TIMEOUT: "github-request-timeout",
  /**
   * GitHub 内容路径无效。
   */
  GITHUB_CONTENT_PATH_INVALID: "github-content-path-invalid",
  /**
   * GitHub 下载链接缺失。
   */
  GITHUB_DOWNLOAD_URL_MISSING: "github-download-url-missing",
} as const

/**
 * 项目统一错误码类型。
 */
type AppErrorCodeName = (typeof AppErrorCode)[keyof typeof AppErrorCode]

interface IAppErrorDefinition {
  title: string
  buildMessage: (params: IAppErrorParamsMap[AppErrorCodeName]) => string
}

interface IAppErrorParamsMap {
  [AppErrorCode.UNEXPECTED_ERROR]: undefined
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: undefined
  [AppErrorCode.PACKAGE_CONFIG_INVALID]: { kind: "invalid-format" } | { kind: "not-found" }
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: undefined
  [AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]: {
    optionName: "--platform" | "--skill"
    actionName: "查看" | "安装" | "更新"
    targetName: "平台" | "技能"
  }
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: { platformName: string }
  [AppErrorCode.SKILL_OPTION_EMPTY]: undefined
  [AppErrorCode.SKILL_OPTION_INVALID]: undefined
  [AppErrorCode.SKILL_NOT_FOUND]: {
    skillNames: readonly [string, ...string[]]
  }
  [AppErrorCode.PROMPT_UNAVAILABLE]: undefined
  [AppErrorCode.PROMPT_CANCELLED]: undefined
  [AppErrorCode.SKILL_DOCUMENT_MISSING]: { skillName: string }
  [AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]: { skillName: string }
  [AppErrorCode.SKILL_FILES_NOT_LOADED]: { skillName: string }
  [AppErrorCode.SKILL_INSTALL_PATH_INVALID]: { relativeFilePath: string }
  [AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]: { skillName: string }
  [AppErrorCode.REMOTE_SKILL_INDEX_INVALID]: undefined
  [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: undefined
  [AppErrorCode.GITHUB_CONTENTS_INVALID]: undefined
  [AppErrorCode.GITHUB_REQUEST_FAILED]: { kind: "status-code", statusCode: number } | { kind: "network-retry" } | { kind: "generic" }
  [AppErrorCode.GITHUB_REQUEST_TIMEOUT]: {
    timeoutSeconds: number
  }
  [AppErrorCode.GITHUB_CONTENT_PATH_INVALID]: { contentPath: string }
  [AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]: { contentPath: string }
}

function getAppErrorDefinition(code: AppErrorCodeName): IAppErrorDefinition {
  return ({
    [AppErrorCode.UNEXPECTED_ERROR]: {
      title: "程序异常",
      buildMessage: () => "程序执行失败，请稍后重试。",
    },
    [AppErrorCode.CLI_USAGE_INVALID]: {
      title: "命令用法错误",
      buildMessage: (params) => {
        const cliUsageInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.CLI_USAGE_INVALID]

        return cliUsageInvalidParams.detailMessage
      },
    },
    [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: {
      title: "程序配置错误",
      buildMessage: () => "package.json 中缺少 bin 配置。",
    },
    [AppErrorCode.PACKAGE_CONFIG_INVALID]: {
      title: "程序配置错误",
      buildMessage: (params) => {
        const packageConfigInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.PACKAGE_CONFIG_INVALID]

        if (packageConfigInvalidParams.kind === "invalid-format") {
          return "package.json 配置格式不正确。"
        }

        return "未找到 package.json。"
      },
    },
    [AppErrorCode.PLATFORM_OPTION_EMPTY]: {
      title: "参数错误",
      buildMessage: () => "请至少提供一个平台。",
    },
    [AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]: {
      title: "参数缺失",
      buildMessage: (params) => {
        const nonInteractiveOptionRequiredParams = params as IAppErrorParamsMap[typeof AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]

        return `当前环境不支持交互提示，请使用 ${nonInteractiveOptionRequiredParams.optionName} 显式指定要${nonInteractiveOptionRequiredParams.actionName}的${nonInteractiveOptionRequiredParams.targetName}。`
      },
    },
    [AppErrorCode.PLATFORM_NOT_SUPPORTED]: {
      title: "平台不受支持",
      buildMessage: (params) => {
        const platformNotSupportedParams = params as IAppErrorParamsMap[typeof AppErrorCode.PLATFORM_NOT_SUPPORTED]

        return `平台“${platformNotSupportedParams.platformName}”不受支持。`
      },
    },
    [AppErrorCode.SKILL_OPTION_EMPTY]: {
      title: "参数错误",
      buildMessage: () => "请至少提供一个技能。",
    },
    [AppErrorCode.SKILL_OPTION_INVALID]: {
      title: "参数错误",
      buildMessage: () => "技能名称必须以 yeizi- 开头。",
    },
    [AppErrorCode.SKILL_NOT_FOUND]: {
      title: "技能不存在",
      buildMessage: (params) => {
        const skillNotFoundParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_NOT_FOUND]

        if (skillNotFoundParams.skillNames.length === 1) {
          return `技能“${skillNotFoundParams.skillNames[0]}”不存在。`
        }

        return `以下技能不存在：${skillNotFoundParams.skillNames.join("、")}。`
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
    [AppErrorCode.SKILL_DOCUMENT_MISSING]: {
      title: "技能文档缺失",
      buildMessage: (params) => {
        const skillDocumentMissingParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_DOCUMENT_MISSING]

        return `远端技能“${skillDocumentMissingParams.skillName}”缺少 SKILL.md 文件。`
      },
    },
    [AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]: {
      title: "技能版本异常",
      buildMessage: (params) => {
        const skillDocumentVersionMismatchParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]

        return `远端技能“${skillDocumentVersionMismatchParams.skillName}”的 SKILL.md 版本与索引不一致。`
      },
    },
    [AppErrorCode.SKILL_FILES_NOT_LOADED]: {
      title: "技能文件异常",
      buildMessage: (params) => {
        const skillFilesNotLoadedParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_FILES_NOT_LOADED]

        return `技能“${skillFilesNotLoadedParams.skillName}”的文件尚未加载完成。`
      },
    },
    [AppErrorCode.SKILL_INSTALL_PATH_INVALID]: {
      title: "技能路径异常",
      buildMessage: (params) => {
        const skillInstallPathInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_INSTALL_PATH_INVALID]

        return `下载文件路径“${skillInstallPathInvalidParams.relativeFilePath}”超出了技能根目录。`
      },
    },
    [AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]: {
      title: "技能安装异常",
      buildMessage: (params) => {
        const skillDirectoryRestoreFailedParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]

        return `技能“${skillDirectoryRestoreFailedParams.skillName}”安装失败后，原始技能目录无法自动恢复，请手动检查本地 skills 目录。`
      },
    },
    [AppErrorCode.REMOTE_SKILL_INDEX_INVALID]: {
      title: "远端数据异常",
      buildMessage: () => "远端技能索引格式不正确。",
    },
    [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: {
      title: "远端数据异常",
      buildMessage: () => "技能文档 frontmatter 格式不正确。",
    },
    [AppErrorCode.GITHUB_CONTENTS_INVALID]: {
      title: "远端数据异常",
      buildMessage: () => "GitHub 内容响应格式不正确。",
    },
    [AppErrorCode.GITHUB_REQUEST_FAILED]: {
      title: "远端请求失败",
      buildMessage: (params) => {
        const gitHubRequestFailedParams = params as IAppErrorParamsMap[typeof AppErrorCode.GITHUB_REQUEST_FAILED]

        if (gitHubRequestFailedParams.kind === "status-code") {
          return `GitHub 请求失败，状态码为 ${gitHubRequestFailedParams.statusCode}。`
        }

        if (gitHubRequestFailedParams.kind === "network-retry") {
          return "GitHub 请求失败，请检查网络后重试。"
        }

        return "GitHub 请求失败。"
      },
    },
    [AppErrorCode.GITHUB_REQUEST_TIMEOUT]: {
      title: "远端请求超时",
      buildMessage: (params) => {
        const gitHubRequestTimeoutParams = params as IAppErrorParamsMap[typeof AppErrorCode.GITHUB_REQUEST_TIMEOUT]

        return `GitHub 请求超时，请检查网络后重试（${gitHubRequestTimeoutParams.timeoutSeconds} 秒）。`
      },
    },
    [AppErrorCode.GITHUB_CONTENT_PATH_INVALID]: {
      title: "远端路径异常",
      buildMessage: (params) => {
        const gitHubContentPathInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.GITHUB_CONTENT_PATH_INVALID]

        return `GitHub 内容条目的路径“${gitHubContentPathInvalidParams.contentPath}”超出了技能根目录。`
      },
    },
    [AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]: {
      title: "远端文件异常",
      buildMessage: (params) => {
        const gitHubDownloadUrlMissingParams = params as IAppErrorParamsMap[typeof AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]

        return `GitHub 内容条目“${gitHubDownloadUrlMissingParams.contentPath}”缺少下载地址。`
      },
    },
  } satisfies Record<AppErrorCodeName, IAppErrorDefinition>)[code]
}

export { AppErrorCode, getAppErrorDefinition }
export type { AppErrorCodeName, IAppErrorParamsMap }
