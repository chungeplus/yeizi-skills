import type { PlatformItem } from "@/types/platform"
import type { SkillComparisonRow, SkillEntry } from "@/types/skill"

import { existsSync } from "node:fs"
import { readdir } from "node:fs/promises"

import { SkillComparisonStatus } from "@/types/skill"

/**
 * 远端技能名称前缀，本地子目录名称需要匹配该前缀才被视为受管技能。
 */
const YEIZI_SKILL_NAME_PREFIX = "yeizi-"

/**
 * 组装远端技能与本地各平台目录的比较结果行。
 *
 * 行集合由远端技能与各选中平台本地 yeizi-* 子目录并集而成，状态按 4 态判定：
 * - 平台 skills 目录缺失：远端每个技能为该平台推一行 MISSING_SKILLS_DIRECTORY，目录都不在不再展开本地孤儿。
 * - 远端技能在本地存在：INSTALLED。
 * - 远端技能在本地缺失：NOT_INSTALLED。
 * - 本地存在但远端已无：REMOTE_REMOVED，description 留空。
 *
 * @param remoteSkillEntryList - 远端技能条目列表。
 * @param selectedPlatformList - 当前选中的平台列表。
 * @returns 平台与技能交叉的比较结果行列表。
 *
 * @example
 * ```typescript
 * await buildComparisonRows(
 *   [{ name: "yeizi-demo", description: "示例技能" }],
 *   [{ platformName: "codex", platformHomeDirectoryPath: "/Users/demo/.codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" }],
 * )
 * // [{ platformName: "codex", skillName: "yeizi-demo", description: "示例技能", statusMessage: "未安装" }]
 * ```
 */
async function buildComparisonRows(
  remoteSkillEntryList: SkillEntry[],
  selectedPlatformList: PlatformItem[],
): Promise<SkillComparisonRow[]> {
  const remoteSkillEntryByNameMap = new Map(
    remoteSkillEntryList.map(remoteSkillEntryItem => [remoteSkillEntryItem.name, remoteSkillEntryItem]),
  )

  const comparisonRowList: SkillComparisonRow[] = []

  for (const platformItem of selectedPlatformList) {
    if (!existsSync(platformItem.platformSkillDirectoryPath)) {
      const missingDirectoryRowList = remoteSkillEntryList.map(remoteSkillEntryItem => ({
        platformName: platformItem.platformName,
        skillName: remoteSkillEntryItem.name,
        description: remoteSkillEntryItem.description,
        statusMessage: SkillComparisonStatus.MISSING_SKILLS_DIRECTORY,
      } satisfies SkillComparisonRow))
      comparisonRowList.push(...missingDirectoryRowList)
      continue
    }

    const directoryEntryList = await readdir(platformItem.platformSkillDirectoryPath, { withFileTypes: true })
    const localSkillNameSet = new Set(
      directoryEntryList
        .filter(directoryEntryItem => directoryEntryItem.isDirectory() && directoryEntryItem.name.startsWith(YEIZI_SKILL_NAME_PREFIX))
        .map(directoryEntryItem => directoryEntryItem.name),
    )

    const remoteRowList = remoteSkillEntryList.map((remoteSkillEntryItem) => {
      let statusMessage: SkillComparisonRow["statusMessage"] = SkillComparisonStatus.NOT_INSTALLED
      if (localSkillNameSet.has(remoteSkillEntryItem.name)) {
        statusMessage = SkillComparisonStatus.INSTALLED
      }

      return {
        platformName: platformItem.platformName,
        skillName: remoteSkillEntryItem.name,
        description: remoteSkillEntryItem.description,
        statusMessage,
      } satisfies SkillComparisonRow
    })
    comparisonRowList.push(...remoteRowList)

    const orphanRowList = Array.from(localSkillNameSet)
      .filter(localSkillNameItem => !remoteSkillEntryByNameMap.has(localSkillNameItem))
      .map(localSkillNameItem => ({
        platformName: platformItem.platformName,
        skillName: localSkillNameItem,
        description: "",
        statusMessage: SkillComparisonStatus.REMOTE_REMOVED,
      } satisfies SkillComparisonRow))
    comparisonRowList.push(...orphanRowList)
  }

  return comparisonRowList
}

export { buildComparisonRows }
