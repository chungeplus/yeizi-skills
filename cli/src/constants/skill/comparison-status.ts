/**
 * 技能比较状态常量。
 */
const SkillComparisonStatus = {
  INSTALLED: "已安装",
  NOT_INSTALLED: "未安装",
  REMOTE_REMOVED: "远端已移除",
  MISSING_SKILLS_DIRECTORY: "该平台的 skills 目录不存在",
} as const

export { SkillComparisonStatus }
