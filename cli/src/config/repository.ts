/**
 * 远端 yeizi-skills 仓库配置。
 */
const repositoryConfig = {
  /**
   * GitHub 仓库所有者（用户名或组织名）。
   */
  repositoryOwner: "chungeplus",
  /**
   * GitHub 仓库名称。
   */
  repositoryName: "yeizi-skills",
  /**
   * 拼接 raw URL 与 Contents API ?ref= 时使用的分支名。
   */
  repositoryBranch: "main",
} as const

export { repositoryConfig }
