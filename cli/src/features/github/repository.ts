import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { downloadTemplate } from "giget"

import { repositoryConfig } from "@/config/repository"

/**
 * 获取技能仓库本地目录路径（下载到临时目录）。
 *
 * @returns 仓库临时目录路径
 *
 * @example
 * ```typescript
 * await getRepositoryDirectoryPath() // "/tmp/yeizi-skills-repo-abc123"
 * ```
 */
async function getRepositoryDirectoryPath(): Promise<string> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

  const downloadResult = await downloadTemplate(
    `gh:${repositoryConfig.repositoryOwner}/${repositoryConfig.repositoryName}#${repositoryConfig.repositoryBranch}`,
    {
      dir: tempDirectoryPath,
      forceClean: true,
      preferOffline: true,
    },
  )

  return downloadResult.dir
}

export { getRepositoryDirectoryPath }
