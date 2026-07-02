import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { downloadTemplate } from "giget"

import { remoteConfig } from "@/config"

class RemoteSkillService {
  private static remoteConfig = remoteConfig

  private static repositoryDirectoryPath: string | undefined

  private static initRepositoryContentPromise: Promise<[void]> | undefined

  public static async initRepositoryContent(): Promise<[void]> {
    if (RemoteSkillService.initRepositoryContentPromise === undefined) {
      RemoteSkillService.initRepositoryContentPromise = Promise.all([
        RemoteSkillService.createLoadRepositoryDirectoryPathPromise(),
      ])
    }

    return RemoteSkillService.initRepositoryContentPromise
  }

  private static async createLoadRepositoryDirectoryPathPromise(): Promise<void> {
    const repositoryDirectoryPath = await RemoteSkillService.loadRepositoryDirectoryPath()
    RemoteSkillService.repositoryDirectoryPath = repositoryDirectoryPath
  }

  private static async loadRepositoryDirectoryPath(): Promise<string> {
    const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

    const downloadResult = await downloadTemplate(RemoteSkillService.getRepositoryRequestPath(), {
      dir: tempDirectoryPath,
      forceClean: true,
    })

    return downloadResult.dir
  }

  private static getRepositoryRequestPath(): string {
    return `gh:${RemoteSkillService.remoteConfig.remoteOwner}/${RemoteSkillService.remoteConfig.remoteName}#${RemoteSkillService.remoteConfig.remoteBranch}`
  }

  public static async getRepositoryDirectoryPath(): Promise<string> {
    await RemoteSkillService.initRepositoryContent()

    return RemoteSkillService.repositoryDirectoryPath!
  }

  public static async getRepositorySkillDirectoryPath(): Promise<string> {
    const repositoryDirectoryPath = await RemoteSkillService.getRepositoryDirectoryPath()

    return join(repositoryDirectoryPath, RemoteSkillService.remoteConfig.remoteSkillDirectoryPath)
  }

  public static async removeContent(): Promise<void> {
    if (RemoteSkillService.repositoryDirectoryPath === undefined) {
      RemoteSkillService.initRepositoryContentPromise = undefined
      return
    }

    await rm(RemoteSkillService.repositoryDirectoryPath, { recursive: true })
    RemoteSkillService.repositoryDirectoryPath = undefined
    RemoteSkillService.initRepositoryContentPromise = undefined
  }
}

export { RemoteSkillService as RepositoryContentService }
