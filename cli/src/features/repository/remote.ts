import type { RepositoryConfig } from "@/types/config"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "node:path"
import { downloadTemplate } from "giget"

import { repositoryConfig } from "@/config"

class RemoteRepositoryService {
  private static repositoryConfig: RepositoryConfig = repositoryConfig

  private static localRepositoryDirectoryPath: string | undefined

  private static initRemoteRepositoryPromise: Promise<[void]> | null

  public static async initRemoteRepository(): Promise<[void]> {
    if (RemoteRepositoryService.initRemoteRepositoryPromise === null) {
      RemoteRepositoryService.initRemoteRepositoryPromise = Promise.all([
        RemoteRepositoryService.createLoadLocalRepositoryDirectoryPathPromise(),
      ])
    }

    return RemoteRepositoryService.initRemoteRepositoryPromise
  }

  private static async createLoadLocalRepositoryDirectoryPathPromise(): Promise<void> {
    const localRepositoryDirectoryPath = await RemoteRepositoryService.loadLocalRepositoryDirectoryPath()
    RemoteRepositoryService.localRepositoryDirectoryPath = localRepositoryDirectoryPath!
  }

  private static async loadLocalRepositoryDirectoryPath(): Promise<string> {
    const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

    const downloadResult = await downloadTemplate(RemoteRepositoryService.getRemoteRepositoryRequestPath(), {
      dir: tempDirectoryPath,
      forceClean: true,
    })

    return downloadResult.dir
  }

  private static getRemoteRepositoryRequestPath(): string {
    const {
      repositoryOwner,
      repositoryName,
      repositoryBranch,
    } = RemoteRepositoryService.repositoryConfig

    return `gh:${repositoryOwner}/${repositoryName}#${repositoryBranch}`
  }

  public static async getLocalRepositoryDirectoryPath(): Promise<string> {
    await RemoteRepositoryService.initRemoteRepository()

    return RemoteRepositoryService.localRepositoryDirectoryPath!
  }

  public static async getLocalRepositorySkillDirectoryPath(): Promise<string> {
    await RemoteRepositoryService.initRemoteRepository()

    return join(
      RemoteRepositoryService.localRepositoryDirectoryPath!,
      RemoteRepositoryService.repositoryConfig.repositorySkillDirectoryName,
    )
  }

  public static async removeLocalRepositoryDirectory(): Promise<void> {
    if (RemoteRepositoryService.localRepositoryDirectoryPath === undefined) {
      return
    }
    await rm(RemoteRepositoryService.localRepositoryDirectoryPath, { recursive: true })
    RemoteRepositoryService.localRepositoryDirectoryPath = undefined
    RemoteRepositoryService.initRemoteRepositoryPromise = null
  }
}

export { RemoteRepositoryService }
