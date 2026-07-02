import type { PlatformItem } from "@/types/platform"
import type { SkillItem } from "@/types/skill"

import { resolve } from "node:path"

import { RemoteRepositoryService } from "@/features/repository"
import { copyDirectory } from "@/tools/filesystem"

/**
 * 把技能条目按笛卡尔积（技能 × 平台）展开并复制到各平台。
 *
 * @param skillList - 技能条目列表。
 * @param platformList - 平台条目列表。
 */
async function copySkillListToPlatformList(
  skillList: SkillItem[],
  platformList: PlatformItem[],
): Promise<void> {
  const skillSourceRootDirectoryPath = await RemoteRepositoryService.getLocalRepositorySkillDirectoryPath()

  await Promise.all(
    skillList.flatMap(skillItem =>
      platformList.map(async platformItem =>
        copySkillItemToPlatformItem(skillItem, platformItem, skillSourceRootDirectoryPath),
      ),
    ),
  )
}

async function copySkillItemToPlatformItem(
  skillItem: SkillItem,
  platformItem: PlatformItem,
  skillSourceRootDirectoryPath: string,
): Promise<void> {
  const skillSourceDirectoryPath = resolve(skillSourceRootDirectoryPath, skillItem.skillName)
  const targetSkillDirectoryPath = resolve(platformItem.platformSkillDirectoryPath, skillItem.skillName)

  await copyDirectory(skillSourceDirectoryPath, targetSkillDirectoryPath)
}

export { copySkillListToPlatformList }
