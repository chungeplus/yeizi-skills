import type { ISkillIndexEntry } from "@/types/skill"
import type { IDownloadedSkillFile } from "@/types/source"

import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"

import { AppError, AppErrorCode } from "@/errors"

import { SkillDocumentParser } from "./skill-document-parser"

/**
 * 技能安装器。
 */
class SkillInstaller {
  private readonly skillDocumentParser = new SkillDocumentParser()

  /**
   * 更新本地技能目录。
   *
   * @param skillsDirectoryPath - 平台 skills 根目录路径。
   * @param skillIndexEntry - 目标技能索引条目。
   * @param downloadedSkillFiles - 已下载的技能文件列表。
   * @returns 安装完成后的 Promise。
   * @example updateSkillDirectory("/tmp/skills", { name: "yeizi-demo", version: "1.0.0" }, [{ relativeFilePath: "SKILL.md", fileContents: "---\\nname: yeizi-demo\\nversion: 1.0.0\\n---" }]) => Promise<void>
   */
  public async updateSkillDirectory(
    skillsDirectoryPath: string,
    skillIndexEntry: ISkillIndexEntry,
    downloadedSkillFiles: readonly IDownloadedSkillFile[],
  ): Promise<void> {
    const skillDocumentFile = downloadedSkillFiles.find(
      downloadedSkillFile => downloadedSkillFile.relativeFilePath === "SKILL.md",
    )

    if (skillDocumentFile === undefined) {
      throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
        params: { skillName: skillIndexEntry.name },
      })
    }

    const downloadedSkillVersion = this.skillDocumentParser.parseSkillVersion(skillDocumentFile.fileContents)

    if (downloadedSkillVersion !== skillIndexEntry.version) {
      throw new AppError(AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH, {
        params: { skillName: skillIndexEntry.name },
      })
    }

    const temporaryRootDirectoryPath = await mkdtemp(
      join(skillsDirectoryPath, `.${skillIndexEntry.name}-install-`),
    )
    const stagingSkillDirectoryPath = join(temporaryRootDirectoryPath, skillIndexEntry.name)
    const targetSkillDirectoryPath = join(skillsDirectoryPath, skillIndexEntry.name)
    const backupSkillDirectoryPath = join(temporaryRootDirectoryPath, `${skillIndexEntry.name}-backup`)
    let hasMovedTargetDirectoryToBackup = false
    let hasMovedStagingDirectoryToTarget = false
    let canRemoveTemporaryRootDirectory = true

    try {
      await mkdir(stagingSkillDirectoryPath, { recursive: true })
      await this.writeDownloadedSkillFilesSequentially(
        stagingSkillDirectoryPath,
        downloadedSkillFiles,
      )

      try {
        await rename(targetSkillDirectoryPath, backupSkillDirectoryPath)
        hasMovedTargetDirectoryToBackup = true
      }
      catch (error) {
        const renameError = error as NodeJS.ErrnoException

        if (renameError.code !== "ENOENT") {
          throw error
        }
      }

      await rename(stagingSkillDirectoryPath, targetSkillDirectoryPath)
      hasMovedStagingDirectoryToTarget = true

      await rm(backupSkillDirectoryPath, { force: true, recursive: true })
    }
    catch (error) {
      if (hasMovedTargetDirectoryToBackup && !hasMovedStagingDirectoryToTarget) {
        try {
          await rename(backupSkillDirectoryPath, targetSkillDirectoryPath)
        }
        catch (restoreError) {
          canRemoveTemporaryRootDirectory = false
          let cause: Error

          if (restoreError instanceof Error) {
            cause = restoreError
          }
          else {
            cause = new Error(String(restoreError))
          }

          throw new AppError(
            AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED,
            {
              params: { skillName: skillIndexEntry.name },
              cause,
            },
          )
        }
      }

      throw error
    }
    finally {
      if (canRemoveTemporaryRootDirectory) {
        await rm(temporaryRootDirectoryPath, { force: true, recursive: true })
      }
    }
  }

  private async writeDownloadedSkillFilesSequentially(
    stagingSkillDirectoryPath: string,
    downloadedSkillFiles: readonly IDownloadedSkillFile[],
    index = 0,
  ): Promise<void> {
    const downloadedSkillFile = downloadedSkillFiles[index]

    if (downloadedSkillFile === undefined) {
      return
    }

    const destinationFilePath = resolve(stagingSkillDirectoryPath, downloadedSkillFile.relativeFilePath)
    const relativeFilePath = relative(stagingSkillDirectoryPath, destinationFilePath)

    if (
      relativeFilePath === ""
      || relativeFilePath.startsWith("..")
      || isAbsolute(relativeFilePath)
    ) {
      throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
        params: { relativeFilePath: downloadedSkillFile.relativeFilePath },
      })
    }

    await mkdir(dirname(destinationFilePath), { recursive: true })
    await writeFile(destinationFilePath, downloadedSkillFile.fileContents, "utf8")

    await this.writeDownloadedSkillFilesSequentially(
      stagingSkillDirectoryPath,
      downloadedSkillFiles,
      index + 1,
    )
  }
}

export { SkillInstaller }
