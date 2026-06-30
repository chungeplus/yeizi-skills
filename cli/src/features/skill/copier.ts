import type { PlatformItem } from "@/types/platform"
import type { SkillInstallResult, SkillItem } from "@/types/skill"

import { resolve } from "node:path"

import { AppError, AppErrorCode } from "@/error"
import { copyDirectory } from "@/tools/filesystem"
import { SkillInstallStatus } from "@/types/skill"

/**
 * 把单个技能复制到单个平台，捕获文件复制失败，转换成对应的安装结果项。
 *
 * @param skillItem - 当前要安装的技能条目。
 * @param platformItem - 当前要安装到的平台目录。
 * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
 * @returns 该次复制的安装结果项。
 *
 * @example
 * ```typescript
 * await copySkillItemToPlatformItem(
 *   { skillName: "yeizi-demo", skillVersion: "1.0.0" },
 *   { platformName: "codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" },
 *   "/tmp/repo-download",
 * )
 * // { platformName: "codex", skillName: "yeizi-demo", status: "success" }
 * ```
 */
async function copySkillItemToPlatformItem(
  skillItem: SkillItem,
  platformItem: PlatformItem,
  repositoryDirectoryPath: string,
): Promise<SkillInstallResult> {
  const skillSourceDirectoryPath = resolve(repositoryDirectoryPath, skillItem.skillName)
  const targetSkillDirectoryPath = resolve(platformItem.platformSkillDirectoryPath, skillItem.skillName)

  try {
    await copyDirectory(skillSourceDirectoryPath, targetSkillDirectoryPath)

    return {
      platformName: platformItem.platformName,
      skillName: skillItem.skillName,
      status: SkillInstallStatus.SUCCESS,
    }
  }
  catch (error) {
    const appError = error instanceof Error
      ? new AppError(AppErrorCode.FILE_COPY_FAILED, {
          params: { sourcePath: skillSourceDirectoryPath, targetPath: targetSkillDirectoryPath },
          cause: error,
        })
      : new AppError(AppErrorCode.FILE_COPY_FAILED, {
          params: { sourcePath: skillSourceDirectoryPath, targetPath: targetSkillDirectoryPath },
        })

    return {
      platformName: platformItem.platformName,
      skillName: skillItem.skillName,
      status: SkillInstallStatus.FAILED,
      error: appError,
    }
  }
}

export { copySkillItemToPlatformItem }
