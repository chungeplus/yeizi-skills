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
  PACKAGE_CONFIG_INVALID_FORMAT: "package-config-invalid-format",
  /**
   * 未找到 package.json 文件。
   */
  PACKAGE_CONFIG_NOT_FOUND: "package-config-not-found",
  /**
   * 平台选项为空。
   */
  PLATFORM_OPTION_EMPTY: "platform-option-empty",
  /**
   * 当前平台不支持该操作。
   */
  PLATFORM_NOT_SUPPORTED: "platform-not-supported",
  /**
   * 找不到指定的平台目录。
   */
  PLATFORM_NOT_FOUND: "platform-not-found",
  /**
   * Skill 选项为空。
   */
  SKILL_OPTION_EMPTY: "skill-option-empty",
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
   * 远端仓库根目录下没有任何 yeizi-* 子目录（仓库异常）。
   */
  REMOTE_REPOSITORY_EMPTY: "remote-repository-empty",
  /**
   * 文件复制失败。
   */
  FILE_COPY_FAILED: "file-copy-failed",
  /**
   * 删除目录失败。
   */
  DIRECTORY_REMOVE_FAILED: "directory-remove-failed",
} as const

export { AppErrorCode }
