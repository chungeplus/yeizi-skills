import type { ISkillIndex, ISkillIndexEntry } from "../skill"

/**
 * 下载后的技能文件。
 */
interface IDownloadedSkillFile {
  /**
   * 相对技能根目录的文件路径。
   */
  relativeFilePath: string

  /**
   * 文件文本内容。
   */
  fileContents: string
}

/**
 * GitHub HTTP client 接口。
 */
interface IGitHubApi {
  /**
   * 加载 JSON 响应。
   */
  loadJson: <T = unknown>(url: string) => Promise<T>

  /**
   * 加载文本响应。
   */
  loadText: (url: string) => Promise<string>
}

/**
 * 技能源接口。
 */
interface ISkillSource {
  /**
   * 加载技能索引。
   */
  loadSkillIndex: () => Promise<ISkillIndex>

  /**
   * 加载指定技能的全部文件。
   */
  loadSkillFiles: (skillName: string) => Promise<IDownloadedSkillFile[]>

  /**
   * 校验远端技能版本是否与索引一致。
   */
  validateRemoteSkillVersion: (
    skillIndexEntry: ISkillIndexEntry,
    loadedSkillFiles?: IDownloadedSkillFile[],
  ) => Promise<void>
}

/**
 * GitHub Contents API 条目结构。
 */
interface IGitHubContentsEntry {
  /**
   * 条目类型。
   */
  type: string

  /**
   * 仓库内的完整路径。
   */
  path: string

  /**
   * 文件下载地址。
   */
  downloadUrl: string | null
}

export type {
  IDownloadedSkillFile,
  IGitHubApi,
  IGitHubContentsEntry,
  ISkillSource,
}
