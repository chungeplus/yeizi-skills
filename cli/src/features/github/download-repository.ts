import { downloadTemplate } from "giget"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { repositoryConfig } from "@/config/repository"

/**
 * 下载完整技能仓库到本地临时目录。
 *
 * @returns 仓库临时目录路径
 */
async function downloadRepository(): Promise<string> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

  const result = await downloadTemplate(
    `gh:${repositoryConfig.owner}/${repositoryConfig.repo}#${repositoryConfig.branch}`,
    {
      dir: tempDirectoryPath,
      forceClean: true,
      preferOffline: true,
    },
  )

  return result.dir
}

export { downloadRepository }
