import type { PlatformItem } from "@/types/platform"
import type { SkillComparisonRow, SkillItem } from "@/types/skill"

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import semver from "semver"

import { SkillComparisonStatus } from "@/types/skill"
import { parseSkillVersion } from "./document-parser"

/**
 * 组装平台与技能的比较结果。
 *
 * @param skillList - 远端技能清单条目列表。
 * @param platformList - 平台目标目录列表。
 * @returns 比较结果行列表。
 *
 * @example
 * ```typescript
 * await buildComparisonRows(
 *   [{ skillName: "yeizi-demo", skillVersion: "1.0.0" }],
 *   [{ platformName: "codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" }],
 * )
 * // [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.0", localVersion: null, statusMessage: "该技能尚未安装。" }]
 * ```
 */
async function buildComparisonRows(
  skillList: SkillItem[],
  platformList: PlatformItem[],
): Promise<SkillComparisonRow[]> {
  const resultRowList: SkillComparisonRow[] = []

  for (const platformItem of platformList) {
    for (const skillItem of skillList) {
      const localSkillDocumentPath = join(
        platformItem.platformSkillDirectoryPath,
        skillItem.skillName,
        "SKILL.md",
      )

      try {
        const localSkillDocumentContent = await readFile(localSkillDocumentPath, "utf8")
        const localSkillVersion = parseSkillVersion(localSkillDocumentContent)
        let statusMessage: SkillComparisonRow["statusMessage"] = SkillComparisonStatus.UP_TO_DATE

        if (semver.lt(localSkillVersion, skillItem.skillVersion)) {
          statusMessage = SkillComparisonStatus.UPDATE_AVAILABLE
        }

        resultRowList.push({
          platformName: platformItem.platformName,
          skillName: skillItem.skillName,
          remoteVersion: skillItem.skillVersion,
          localVersion: localSkillVersion,
          statusMessage,
        } satisfies SkillComparisonRow)
      }
      catch {
        resultRowList.push({
          platformName: platformItem.platformName,
          skillName: skillItem.skillName,
          remoteVersion: skillItem.skillVersion,
          localVersion: null,
          statusMessage: SkillComparisonStatus.NOT_INSTALLED,
        } satisfies SkillComparisonRow)
      }
    }
  }

  return resultRowList
}

/**
 * 组装需要更新的比较结果行。
 *
 * @param comparisonRowList - 完整比较结果行列表。
 * @returns 仅包含可更新项的结果行列表。
 *
 * @example
 * ```typescript
 * buildUpdateRows([
 *   {
 *     platformName: "codex",
 *     skillName: "yeizi-demo",
 *     remoteVersion: "1.1.0",
 *     localVersion: "1.0.0",
 *     statusMessage: "有可用更新"
 *   }
 * ])
 * // [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.1.0", localVersion: "1.0.0", statusMessage: "有可用更新" }]
 * ```
 */
function buildUpdateRows(comparisonRowList: SkillComparisonRow[]): SkillComparisonRow[] {
  return comparisonRowList.filter(
    comparisonRow =>
      comparisonRow.statusMessage === SkillComparisonStatus.UPDATE_AVAILABLE
      || comparisonRow.statusMessage === SkillComparisonStatus.LOCAL_SKILL_INVALID,
  )
}

/**
 * 组装可更新技能名称列表。
 *
 * @param comparisonRowList - 可更新结果行列表。
 * @returns 去重后的技能名称列表。
 *
 * @example
 * ```typescript
 * buildUpdateSkillNameList([
 *   {
 *     platformName: "codex",
 *     skillName: "yeizi-demo",
 *     remoteVersion: "1.1.0",
 *     localVersion: "1.0.0",
 *     statusMessage: "有可用更新"
 *   }
 * ])
 * // ["yeizi-demo"]
 * ```
 */
function buildUpdateSkillNameList(comparisonRowList: SkillComparisonRow[]): string[] {
  return Array.from(new Set(comparisonRowList.map(comparisonRow => comparisonRow.skillName)))
}

/**
 * 组装用户选中后的结果行列表。
 *
 * @param comparisonRowList - 可选结果行列表。
 * @param selectedSkillNameList - 选中的技能名称列表。
 * @returns 过滤后的结果行列表。
 *
 * @example
 * ```typescript
 * buildSelectedRows(
 *   [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.1.0", localVersion: "1.0.0", statusMessage: "有可用更新" }],
 *   ["yeizi-demo"],
 * )
 * // [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.1.0", localVersion: "1.0.0", statusMessage: "有可用更新" }]
 * ```
 */
function buildSelectedRows(
  comparisonRowList: SkillComparisonRow[],
  selectedSkillNameList: string[],
): SkillComparisonRow[] {
  const selectedSkillNameSet = new Set(selectedSkillNameList)

  return comparisonRowList.filter(comparisonRow => selectedSkillNameSet.has(comparisonRow.skillName))
}

export {
  buildComparisonRows,
  buildSelectedRows,
  buildUpdateRows,
  buildUpdateSkillNameList,
}
