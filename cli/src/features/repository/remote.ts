import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { downloadTemplate } from "giget"

import { remoteConfig } from "@/config"

class RepositoryContentService {
  private static remoteConfig = remoteConfig

  private static repositoryDirectoryPath: string | undefined

  private static initRepositoryContentPromise: Promise<[void]> | undefined

  public static async initRepositoryContent(): Promise<[void]> {
    if (RepositoryContentService.initRepositoryContentPromise === undefined) {
      RepositoryContentService.initRepositoryContentPromise = Promise.all([
        RepositoryContentService.createLoadRepositoryDirectoryPathPromise(),
      ])
    }

    return RepositoryContentService.initRepositoryContentPromise
  }

  private static async createLoadRepositoryDirectoryPathPromise(): Promise<void> {
    const repositoryDirectoryPath = await RepositoryContentService.loadRepositoryDirectoryPath()
    RepositoryContentService.repositoryDirectoryPath = repositoryDirectoryPath
  }

  private static async loadRepositoryDirectoryPath(): Promise<string> {
    const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

    const downloadResult = await downloadTemplate(RepositoryContentService.getRepositoryRequestPath(), {
      dir: tempDirectoryPath,
      forceClean: true,
    })

    return downloadResult.dir
  }

  private static getRepositoryRequestPath(): string {
    return `gh:${RepositoryContentService.remoteConfig.remoteOwner}/${RepositoryContentService.remoteConfig.remoteName}#${RepositoryContentService.remoteConfig.remoteBranch}`
  }

  public static async getRepositoryDirectoryPath(): Promise<string> {
    await RepositoryContentService.initRepositoryContent()

    return RepositoryContentService.repositoryDirectoryPath!
  }

  public static async getRepositorySkillDirectoryPath(): Promise<string> {
    const repositoryDirectoryPath = await RepositoryContentService.getRepositoryDirectoryPath()

    return join(repositoryDirectoryPath, RepositoryContentService.remoteConfig.remoteSkillDirectoryPath)
  }

  public static async removeContent(): Promise<void> {
    if (RepositoryContentService.repositoryDirectoryPath === undefined) {
      RepositoryContentService.initRepositoryContentPromise = undefined
      return
    }

    await rm(RepositoryContentService.repositoryDirectoryPath, { recursive: true })
    RepositoryContentService.repositoryDirectoryPath = undefined
    RepositoryContentService.initRepositoryContentPromise = undefined
  }
}

export { RepositoryContentService }