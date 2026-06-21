import type { z } from "zod"
import type { ISkillIndex, ISkillIndexEntry } from "@/types/skill"

import type {
  IDownloadedSkillFile,
  IGitHubApi,
  IGitHubContentsEntry,
  ISkillSource,
} from "@/types/source"

import { githubApi } from "@/apis/github"
import {
  buildContentsApiUrl,
  buildSkillsJsonUrl,
} from "@/apis/github/github-endpoint-builder"
import { AppError, AppErrorCode } from "@/errors"
import { parseSkillIndex, SkillDocumentParser } from "@/features/skill"
import { githubContentsEntryListSchema } from "@/schemas"

type GitHubContentsPayload = z.input<typeof githubContentsEntryListSchema>

/**
 * 解析 GitHub Contents API 条目。
 *
 * @param githubContentsPayload - 未校验的 GitHub Contents API 载荷。
 * @returns 归一化后的 GitHub 条目列表。
 * @example
 * parseGitHubContentsEntries([{ type: "file", path: "yeizi-demo/SKILL.md", download_url: "https://example.com" }]) => [{ type: "file", path: "yeizi-demo/SKILL.md", downloadUrl: "https://example.com" }]
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
  private readonly client: IGitHubApi = githubApi
  private readonly skillDocumentParser = new SkillDocumentParser()

  /**
   * 加载远端技能索引。
   *
   * @returns 远端技能索引。
   *
   * @example
   * loadSkillIndex() => Promise<ISkillIndex>
   */
  public async loadSkillIndex(): Promise<ISkillIndex> {
    return parseSkillIndex(await this.client.loadJson(buildSkillsJsonUrl()))
  }

  /**
   * 加载指定技能的全部文件。
   *
   * @param skillName - 技能名称。
   * @returns 下载后的技能文件列表。
   *
   * @example
   * loadSkillFiles("yeizi-demo") => Promise<IDownloadedSkillFile[]>
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
   *
   * @example
   * validateRemoteSkillVersion({ name: "yeizi-demo", version: "1.0.0" }) => Promise<void>
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
   * 按数组顺序加载 GitHub 目录下的全部文件内容。
   *
   * @param githubContentPath - GitHub 仓库内的目录路径。
   * @returns 路径和内容组成的文件列表。
   *
   * @example
   * loadGitHubFileEntries("yeizi-demo") => Promise<Array<{ path: string, fileContents: string }>>
   */
  private async loadGitHubFileEntries(
    githubContentPath: string,
  ): Promise<Array<{ path: string, fileContents: string }>> {
    const githubContentEntries = await this.loadGitHubContentsDirectory(githubContentPath)

    return githubContentEntries.reduce<Promise<Array<{ path: string, fileContents: string }>>>(
      async (accumulator, githubContentEntry) => {
        const accumulatedFiles = await accumulator
        const loadedForEntry = await this.loadGitHubFileEntry(githubContentEntry)

        return [...accumulatedFiles, ...loadedForEntry]
      },
      Promise.resolve([]),
    )
  }

  private async loadGitHubFileEntry(
    githubContentEntry: IGitHubContentsEntry,
  ): Promise<Array<{ path: string, fileContents: string }>> {
    if (githubContentEntry.type === "dir") {
      return this.loadGitHubFileEntries(githubContentEntry.path)
    }

    if (githubContentEntry.type !== "file") {
      return []
    }

    if (githubContentEntry.downloadUrl === null) {
      throw new AppError(AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING, {
        params: { contentPath: githubContentEntry.path },
      })
    }

    return [{
      path: githubContentEntry.path,
      fileContents: await this.client.loadText(githubContentEntry.downloadUrl),
    }]
  }

  /**
   * 加载 GitHub 指定目录下的条目列表。
   *
   * @param githubContentPath - GitHub 仓库内的目录路径。
   * @returns 解析后的 GitHub 条目列表。
   */
  private async loadGitHubContentsDirectory(githubContentPath: string): Promise<IGitHubContentsEntry[]> {
    const githubContentsPayload = await this.client.loadJson<GitHubContentsPayload>(buildContentsApiUrl(githubContentPath))

    return parseGitHubContentsEntries(githubContentsPayload)
  }
}

export { GitHubSkillSource }
