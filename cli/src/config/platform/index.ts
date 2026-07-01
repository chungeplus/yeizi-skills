import { homedir } from "node:os"
import { join } from "node:path"

const userHomeDirectoryPath = homedir()

/**
 * 平台配置映射。
 * 加新平台或修改平台目录段只需要在这里调整。
 */
const platformConfig = {
  platformList: [
    {
      platformName: "codex",
      platformHomeDirectoryPath: join(userHomeDirectoryPath, ".codex"),
      platformSkillDirectoryPath: join(userHomeDirectoryPath, ".codex", "skills"),
    },
    {
      platformName: "claude",
      platformHomeDirectoryPath: join(userHomeDirectoryPath, ".claude"),
      platformSkillDirectoryPath: join(userHomeDirectoryPath, ".claude", "skills"),
    },
    {
      platformName: "trae",
      platformHomeDirectoryPath: join(userHomeDirectoryPath, ".trae"),
      platformSkillDirectoryPath: join(userHomeDirectoryPath, ".trae", "skills"),
    },
    {
      platformName: "all",
      platformHomeDirectoryPath: join(userHomeDirectoryPath, ".yeizi-skills"),
      platformSkillDirectoryPath: join(userHomeDirectoryPath, ".yeizi-skills", "skills"),
    },
  ],

} as const

export { platformConfig }
