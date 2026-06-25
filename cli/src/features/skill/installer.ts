import type { PlatformTarget, SkillComparisonRow, SkillManifestEntry } from "@/types"
import { existsSync } from "node:fs"
import { access, cp, mkdtemp, rename, rm } from "node:fs/promises"
import { isAbsolute, join, relative, resolve } from "node:path"
import { AppError, AppErrorCode } from "@/errors"

import { downloadRepository } from "@/features/github/download-repository"

/**
 * 更新本地技能目录。
 *
 * @param skillsDirectoryPath - 平台 skills 根目录路径。
 * @param skillManifestEntry - 目标技能清单条目。
 * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
 * @returns 安装完成后的 Promise。
 * @throws 技能文档缺失、路径非法或目录恢复失败时抛出错误。
 */
async function updateSkillDirectory(
  skillsDirectoryPath: string,
  skillManifestEntry: SkillManifestEntry,
  repositoryDirectoryPath: string,
): Promise<void> {
  const skillSourceDirectoryPath = resolve(repositoryDirectoryPath, "skills", skillManifestEntry.name)
  const skillDocumentPath = resolve(skillSourceDirectoryPath, "SKILL.md")

  try {
    await access(skillDocumentPath)
  }
  catch {
    throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
      params: { skillName: skillManifestEntry.name },
    })
  }

  const temporaryRootDirectoryPath = await mkdtemp(
    join(skillsDirectoryPath, `.${skillManifestEntry.name}-install-`),
  )
  const stagingSkillDirectoryPath = join(temporaryRootDirectoryPath, skillManifestEntry.name)
  const targetSkillDirectoryPath = join(skillsDirectoryPath, skillManifestEntry.name)
  const backupSkillDirectoryPath = join(temporaryRootDirectoryPath, `${skillManifestEntry.name}-backup`)
  let hasMovedTargetDirectoryToBackup = false
  let hasMovedStagingDirectoryToTarget = false
  let canRemoveTemporaryRootDirectory = true

  try {
    const relativeDirectoryPath = relative(repositoryDirectoryPath, skillSourceDirectoryPath)

    if (
      relativeDirectoryPath === ""
      || relativeDirectoryPath.startsWith("..")
      || isAbsolute(relativeDirectoryPath)
    ) {
      throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
        params: { relativeFilePath: relativeDirectoryPath },
      })
    }

    await cp(skillSourceDirectoryPath, stagingSkillDirectoryPath, {
      recursive: true,
      force: true,
    })

    try {
      await rename(targetSkillDirectoryPath, backupSkillDirectoryPath)
      hasMovedTargetDirectoryToBackup = true
    }
    catch (error) {
      if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
        throw error
      }

      if (!(error instanceof Error)) {
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
            params: { skillName: skillManifestEntry.name },
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

/**
 * 下载技能仓库并安装技能到多个平台。
 *
 * @param selectedSkillEntryList - 选中的技能清单条目。
 * @param platformTargetList - 目标平台列表。
 * @returns 安装过程产生的中文汇总消息列表。
 * @throws 技能目录未找到或路径非法时抛出 {@link AppError}。
 */
async function installSkillsToPlatforms(
  selectedSkillEntryList: SkillManifestEntry[],
  platformTargetList: PlatformTarget[],
): Promise<string[]> {
  const repositoryDirectoryPath = await downloadRepository()
  const messageList: string[] = []

  try {
    for (const skillManifestEntry of selectedSkillEntryList) {
      for (const platformTarget of platformTargetList) {
        await updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          skillManifestEntry,
          repositoryDirectoryPath,
        )
        messageList.push(`已为平台"${platformTarget.platformName}"安装技能"${skillManifestEntry.name}"。`)
      }
    }
  }
  finally {
    await rm(repositoryDirectoryPath, { force: true, recursive: true })
  }

  return messageList
}

/**
 * 下载技能仓库并更新技能到多个平台。
 *
 * @param selectedRowList - 选中的技能比较行（只包含可更新的技能）。
 * @param selectedSkillEntryList - 选中的技能清单条目。
 * @param platformTargetList - 目标平台列表。
 * @returns 更新过程产生的中文汇总消息列表。
 * @throws 技能未找到或技能目录不存在时抛出 {@link AppError}。
 */
async function updateSkillsToPlatforms(
  selectedRowList: SkillComparisonRow[],
  selectedSkillEntryList: SkillManifestEntry[],
  platformTargetList: PlatformTarget[],
): Promise<string[]> {
  const repositoryDirectoryPath = await downloadRepository()
  const messageList: string[] = []

  try {
    for (const platformTarget of platformTargetList) {
      if (!existsSync(platformTarget.skillsDirectoryPath)) {
        messageList.push(`已跳过平台"${platformTarget.platformName}"，因为它的 skills 目录不存在。`)
        continue
      }

      const matchedRowList = selectedRowList.filter(
        selectedRow => selectedRow.platformName === platformTarget.platformName,
      )

      for (const matchedRow of matchedRowList) {
        const matchedSkillEntry = selectedSkillEntryList.find(
          skillManifestEntry => skillManifestEntry.name === matchedRow.skillName,
        )

        if (matchedSkillEntry === undefined) {
          throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
            params: { skillNameList: [matchedRow.skillName] },
          })
        }

        await updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          matchedSkillEntry,
          repositoryDirectoryPath,
        )
        messageList.push(`已为平台"${platformTarget.platformName}"更新技能"${matchedSkillEntry.name}"。`)
      }
    }
  }
  finally {
    await rm(repositoryDirectoryPath, { force: true, recursive: true })
  }

  return messageList
}

export { installSkillsToPlatforms, updateSkillDirectory, updateSkillsToPlatforms }
