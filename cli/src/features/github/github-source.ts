import type { SkillManifest } from "@/types/skill"

import type { DownloadedSkillFile } from "@/types/source"
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { AppError } from "@/errors"
import { parseSkillManifest } from "@/features/skill"
import { loadSkillManifest } from "@/service/apis"

import { downloadSkill } from "./download-skill"

/**
 * 递归读取目录下所有文件。
 *
 * @param directoryPath - 目录路径。
 * @param baseDirectoryPath - 用于计算相对路径的基准目录。
 * @returns 文件路径列表（相对于基准目录）。
 */
async function readFilePathsRecursive(
  directoryPath: string,
  baseDirectoryPath: string,
): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true })

  const subFilePathLists = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        return readFilePathsRecursive(fullPath, baseDirectoryPath)
      }

      if (entry.isFile()) {
        return [fullPath]
      }

      return []
    }),
  )

  return subFilePathLists.flat()
}

/**
 * 加载远端技能清单。
 *
 * @returns 远端技能清单。
 *
 * @example
 * loadSkillManifest() => Promise<SkillManifest>
 */
async function loadGitHubSkillManifest(): Promise<SkillManifest> {
  const rawManifest = await loadSkillManifest()

  return parseSkillManifest(rawManifest)
}

/**
 * 加载指定技能的全部文件。
 *
 * @param skillName - 技能名称。
 * @returns 下载后的技能文件列表。
 * @throws 文件路径逃出技能根目录时抛出 {@link AppError}。
 *
 * @example
 * loadSkillFiles("yeizi-demo") => Promise<DownloadedSkillFile[]>
 */
async function loadSkillFiles(skillName: string): Promise<DownloadedSkillFile[]> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), `yeizi-skill-${skillName}-`))

  try {
    const downloadResult = await downloadSkill(skillName, tempDirectoryPath)
    const extractedDirectoryPath = downloadResult.dir
    const filePathList = await readFilePathsRecursive(extractedDirectoryPath, extractedDirectoryPath)

    const downloadedSkillFileList = await Promise.all(
      filePathList.map(async (filePath) => {
        const fileContents = await readFile(filePath, "utf8")

        return {
          relativeFilePath: filePath.slice(extractedDirectoryPath.length + 1),
          fileContents,
        }
      }),
    )

    return downloadedSkillFileList
  }
  finally {
    await rm(tempDirectoryPath, { force: true, recursive: true })
  }
}

/**
 * 校验远端技能版本是否与清单一致。
 *
 * @param skillManifestEntry - 技能清单条目。
 * @param loadedSkillFileList - 已加载技能文件列表。
 * @returns 校验完成后的 Promise。
 * @throws 技能文档缺失或版本不匹配时抛出 {@link AppError}。
 */

export { loadGitHubSkillManifest, loadSkillFiles }
