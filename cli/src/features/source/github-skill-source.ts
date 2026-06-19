import type { ISkillIndex, ISkillIndexEntry } from "@/types/skill"
import type {
  IDownloadedSkillFile,
  IGitHubClient,
  IGitHubContentsEntry,
  ISkillSource,
} from "@/types/source"

import { REPOSITORY_CONFIG } from "@/config"
import { AppError, AppErrorCode } from "@/errors"
import { parseSkillIndex, SkillDocumentParser } from "@/features/skill"
import { githubContentsEntryListSchema } from "@/schemas"

import { FetchGitHubClient } from "./fetch-github-client"

type GitHubContentsPayload = Parameters<typeof githubContentsEntryListSchema.parse>[0]

/**
 * 解析 GitHub Contents API 条目。
 *
 * @param githubContentsPayload - 未校验的 GitHub Contents API 载荷。
 * @returns 归一化后的 GitHub 条目列表。
 * @example parseGitHubContentsEntries([{ type: "file", path: "yeizi-demo/SKILL.md", download_url: "https://example.com" }]) => [{ type: "file", path: "yeizi-demo/SKILL.md", downloadUrl: "https://example.com" }]
 */
function parseGitHubContentsEntries(githubContentsPayload: GitHubContentsPayload): IGitHubContentsEntry[] {
  try {
    const parsedEntries = githubContentsEntryListSchema.parse(githubContentsPayload)

    return parsedEntries.map(parsedEntry => ({
      type: parsedEntry.type,
      path: parsedEntry.path,
      downloadUrl: parsedEntry.download_url,
    }))
  }
  catch (error) {
    let cause: Error

    if (error instanceof Error) {
      cause = error
    }
    else {
      cause = new Error(String(error))
    }

    throw new AppError(
      AppErrorCode.GITHUB_CONTENTS_INVALID,
      { cause },
    )
  }
}

/**
 * 基于 GitHub 仓库的技能源实现。
 */
class GitHubSkillSource implements ISkillSource {
  private readonly gitHubClient: IGitHubClient = new FetchGitHubClient()
  private readonly repositoryOwner = REPOSITORY_CONFIG.owner
  private readonly repositoryName = REPOSITORY_CONFIG.repo
  private readonly repositoryBranch = REPOSITORY_CONFIG.branch
  private readonly skillDocumentParser = new SkillDocumentParser()

  /**
   * 加载远端技能索引。
   *
   * @returns 远端技能索引。
   * @example loadSkillIndex() => Promise<ISkillIndex>
   */
  public async loadSkillIndex(): Promise<ISkillIndex> {
    const skillIndexUrl = `https://raw.githubusercontent.com/${this.repositoryOwner}/${this.repositoryName}/${this.repositoryBranch}/skills.json`

    return parseSkillIndex(await this.gitHubClient.loadJson<Parameters<typeof parseSkillIndex>[0]>(skillIndexUrl))
  }

  /**
   * 加载指定技能的全部文件。
   *
   * @param skillName - 技能名称。
   * @returns 下载后的技能文件列表。
   * @example loadSkillFiles("yeizi-demo") => Promise<IDownloadedSkillFile[]>
   */
  public async loadSkillFiles(skillName: string): Promise<IDownloadedSkillFile[]> {
    const loadedGitHubFiles = await this.loadGitHubFileEntries(skillName)
    const skillRootPrefix = `${skillName}/`

    return loadedGitHubFiles.map((loadedGitHubFile) => {
      if (!loadedGitHubFile.path.startsWith(skillRootPrefix)) {
        throw new AppError(AppErrorCode.GITHUB_CONTENT_PATH_INVALID, {
          params: { contentPath: loadedGitHubFile.path },
        })
      }

      return {
        relativeFilePath: loadedGitHubFile.path.slice(skillRootPrefix.length),
        fileContents: loadedGitHubFile.fileContents,
      }
    })
  }

  /**
   * 校验远端技能版本是否与索引一致。
   *
   * @param skillIndexEntry - 技能索引条目。
   * @param loadedSkillFiles - 可选的已加载技能文件列表。
   * @returns 校验完成后的 Promise。
   * @example validateRemoteSkillVersion({ name: "yeizi-demo", version: "1.0.0" }) => Promise<void>
   */
  public async validateRemoteSkillVersion(
    skillIndexEntry: ISkillIndexEntry,
    loadedSkillFiles?: readonly IDownloadedSkillFile[],
  ): Promise<void> {
    let resolvedLoadedSkillFiles = loadedSkillFiles

    if (resolvedLoadedSkillFiles === undefined) {
      resolvedLoadedSkillFiles = await this.loadSkillFiles(skillIndexEntry.name)
    }

    const skillDocumentFile = resolvedLoadedSkillFiles.find(
      loadedSkillFile => loadedSkillFile.relativeFilePath === "SKILL.md",
    )

    if (skillDocumentFile === undefined) {
      throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
        params: { skillName: skillIndexEntry.name },
      })
    }

    const remoteSkillVersion = this.skillDocumentParser.parseSkillVersion(skillDocumentFile.fileContents)

    if (remoteSkillVersion !== skillIndexEntry.version) {
      throw new AppError(AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH, {
        params: { skillName: skillIndexEntry.name },
      })
    }
  }

  /**
   * 递归加载 GitHub 目录下的全部文件内容。
   *
   * @param githubContentPath - GitHub 仓库内的目录路径。
   * @returns 路径和内容组成的文件列表。
   * @example loadGitHubFileEntries("yeizi-demo") => Promise<Array<{ path: string, fileContents: string }>>
   */
  private async loadGitHubFileEntries(
    githubContentPath: string,
  ): Promise<Array<{ path: string, fileContents: string }>> {
    const githubContentEntries = await this.loadGitHubContentsDirectory(githubContentPath)
    const loadedFileEntries: Array<{ path: string, fileContents: string }> = []

    for (const githubContentEntry of githubContentEntries) {
      if (githubContentEntry.type === "dir") {
        loadedFileEntries.push(...(await this.loadGitHubFileEntries(githubContentEntry.path)))
        continue
      }

      if (githubContentEntry.type !== "file") {
        continue
      }

      if (githubContentEntry.downloadUrl === null) {
        throw new AppError(AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING, {
          params: { contentPath: githubContentEntry.path },
        })
      }

      loadedFileEntries.push({
        path: githubContentEntry.path,
        fileContents: await this.gitHubClient.loadText(githubContentEntry.downloadUrl),
      })
    }

    return loadedFileEntries
  }

  /**
   * 加载 GitHub 指定目录下的条目列表。
   */
  private async loadGitHubContentsDirectory(githubContentPath: string): Promise<IGitHubContentsEntry[]> {
    const githubContentsPayload = await this.gitHubClient.loadJson<GitHubContentsPayload>(this.buildContentsApiUrl(githubContentPath))

    return parseGitHubContentsEntries(githubContentsPayload)
  }

  /**
   * 组装 GitHub Contents API 地址。
   */
  private buildContentsApiUrl(githubContentPath: string): string {
    let encodedGitHubContentPath = ""

    if (githubContentPath.length > 0) {
      encodedGitHubContentPath = `/${githubContentPath}`
    }

    return `https://api.github.com/repos/${this.repositoryOwner}/${this.repositoryName}/contents${encodedGitHubContentPath}?ref=${this.repositoryBranch}`
  }
}

export { GitHubSkillSource }
