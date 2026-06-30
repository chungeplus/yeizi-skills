import type { PlatformItem } from "@/types/platform"
import type { SkillEntry, SkillInstallResult } from "@/types/skill"

import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { AppError, AppErrorCode } from "@/error"
import { compareDirectoryContentHash, copyDirectory } from "@/tools/filesystem"
import { SkillInstallStatus } from "@/types/skill"

/**
 * 把单个技能复制到单个平台。
 *
 * 流程：先用 {@link compareDirectoryContentHash} 比对源与目标，内容一致直接返回 NO_CHANGE；
 * 不一致再 {@link copyDirectory} 覆盖目标并返回 SUCCESS；
 * 抛出 {@link AppError} 时按失败结果原样回填，其他 Error 包成 FILE_COPY_FAILED 的 {@link AppError}，
 * 非 Error 异常直接向上传播。
 *
 * @param skillEntry - 当前要安装的技能条目。
 * @param platformItem - 当前要安装到的平台目录。
 * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
 * @returns 该次复制的安装结果项。
 *
 * @example
 * ```typescript
 * await copySkillEntryToPlatformItem(
 *   { name: "yeizi-demo", description: "示例技能" },
 *   { platformName: "codex", platformHomeDirectoryPath: "/Users/demo/.codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" },
 *   "/tmp/repo-download",
 * )
 * // { platformName: "codex", skillName: "yeizi-demo", status: "success" }
 * ```
 */
async function copySkillEntryToPlatformItem(
  skillEntry: SkillEntry,
  platformItem: PlatformItem,
  repositoryDirectoryPath: string,
): Promise<SkillInstallResult> {
  const skillSourceDirectoryPath = resolve(repositoryDirectoryPath, skillEntry.name)
  const targetSkillDirectoryPath = resolve(platformItem.platformSkillDirectoryPath, skillEntry.name)

  // B4: 前置检查 source，避免 race / mid-flight 删除导致 raw fs error
  if (!existsSync(skillSourceDirectoryPath)) {
    return {
      platformName: platformItem.platformName,
      skillName: skillEntry.name,
      status: SkillInstallStatus.FAILED,
      error: new AppError(AppErrorCode.FILE_COPY_FAILED, {
        params: {
          sourcePath: `仓库临时目录/${skillEntry.name}`,
          targetPath: targetSkillDirectoryPath,
        },
      }),
    }
  }

  try {
    const isContentIdentical = await compareDirectoryContentHash(
      skillSourceDirectoryPath,
      targetSkillDirectoryPath,
    )

    if (isContentIdentical) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.NO_CHANGE,
      }
    }

    await copyDirectory(skillSourceDirectoryPath, targetSkillDirectoryPath)

    return {
      platformName: platformItem.platformName,
      skillName: skillEntry.name,
      status: SkillInstallStatus.SUCCESS,
    }
  }
  catch (error) {
    if (error instanceof AppError) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.FAILED,
        error,
      }
    }

    if (error instanceof Error) {
      const appError = new AppError(AppErrorCode.FILE_COPY_FAILED, {
        params: { sourcePath: skillSourceDirectoryPath, targetPath: targetSkillDirectoryPath },
        cause: error,
      })

      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.FAILED,
        error: appError,
      }
    }

    throw error
  }
}

export { copySkillEntryToPlatformItem }
