/**
 * 支持的平台名称常量。
 */
const SupportedPlatform = {
  CODEX: "codex",
  CLAUDE: "claude",
  TRAE: "trae",
} as const

/**
 * 支持的平台名称类型。
 */
type SupportedPlatformName = (typeof SupportedPlatform)[keyof typeof SupportedPlatform]

/**
 * 平台技能目录目标。
 */
interface IPlatformTarget {
  // 平台名称。
  platformName: SupportedPlatformName

  // 平台 skills 目录绝对路径。
  skillsDirectoryPath: string

  // 平台的 skills 目录是否存在。
  hasSkillsDirectory: boolean
}

export { SupportedPlatform }
export type { IPlatformTarget, SupportedPlatformName }
