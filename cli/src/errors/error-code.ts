/**
 * 项目统一错误码。
 */
export const AppErrorCode = {
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
   * 远程 Skill 索引格式不正确。
   */
  REMOTE_SKILL_INDEX_INVALID: "remote-skill-index-invalid",
  /**
   * 远程 Skill 文档格式不正确。
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
   * GitHub 请求路径无效。
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
export type AppErrorCodeName = (typeof AppErrorCode)[keyof typeof AppErrorCode]
