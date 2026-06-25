import type { IPlatformTarget } from "@/types/platform"
import type { ISkillComparisonRow, ISkillIndexEntry } from "@/types/skill"

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import semver from "semver"

import { SkillComparisonStatus } from "@/types/skill"

import { SkillDocumentParser } from "./skill-document-parser"

const skillDocumentParser = new SkillDocumentParser()

/**
 * 组装平台与技能的比较结果。
 *
 * @param skillIndexEntries - 远端技能索引条目列表。
 * @param platformTargets - 平台目标目录列表。
 * @returns 比较结果行列表。
 * @example buildComparisonRows([{ name: "yeizi-demo", version: "1.0.0" }], [{ platformName: "codex", skillsDirectoryPath: "/tmp/skills", hasSkillsDirectory: false }]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.0", localVersion: null, statusMessage: "该平台的 skills 目录不存在。" }]
 */
function buildComparisonRows(
  skillIndexEntries: readonly ISkillIndexEntry[],
  platformTargets: readonly IPlatformTarget[],
): ISkillComparisonRow[] {
  return platformTargets.flatMap(platformTarget =>
    skillIndexEntries.map((skillIndexEntry) => {
      if (!platformTarget.hasSkillsDirectory) {
        return {
          platformName: platformTarget.platformName,
          skillName: skillIndexEntry.name,
          remoteVersion: skillIndexEntry.version,
          localVersion: null,
          statusMessage: SkillComparisonStatus.MISSING_SKILLS_DIRECTORY,
        } satisfies ISkillComparisonRow
      }

      const localSkillDocumentPath = join(
        platformTarget.skillsDirectoryPath,
        skillIndexEntry.name,
        "SKILL.md",
      )

      if (!existsSync(localSkillDocumentPath)) {
        return {
          platformName: platformTarget.platformName,
          skillName: skillIndexEntry.name,
          remoteVersion: skillIndexEntry.version,
          localVersion: null,
          statusMessage: SkillComparisonStatus.NOT_INSTALLED,
        } satisfies ISkillComparisonRow
      }

      try {
        const localSkillVersion = skillDocumentParser.parseSkillVersion(
          readFileSync(localSkillDocumentPath, "utf8"),
        )
        let statusMessage: ISkillComparisonRow["statusMessage"] = SkillComparisonStatus.UP_TO_DATE

        if (semver.lt(localSkillVersion, skillIndexEntry.version)) {
          statusMessage = SkillComparisonStatus.UPDATE_AVAILABLE
        }

        return {
          platformName: platformTarget.platformName,
          skillName: skillIndexEntry.name,
          remoteVersion: skillIndexEntry.version,
          localVersion: localSkillVersion,
          statusMessage,
        } satisfies ISkillComparisonRow
      }
      catch {
        return {
          platformName: platformTarget.platformName,
          skillName: skillIndexEntry.name,
          remoteVersion: skillIndexEntry.version,
          localVersion: null,
          statusMessage: SkillComparisonStatus.LOCAL_SKILL_INVALID,
        } satisfies ISkillComparisonRow
      }
    }),
  )
}

/**
 * 组装需要更新的比较结果行。
 *
 * @param comparisonRows - 完整比较结果行列表。
 * @returns 仅包含可更新项的结果行列表。
 * @example buildUpdateRows([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "该技能有可用更新。" }]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "该技能有可用更新。" }]
 */
function buildUpdateRows(comparisonRows: readonly ISkillComparisonRow[]): ISkillComparisonRow[] {
  return comparisonRows.filter(
    comparisonRow =>
      comparisonRow.statusMessage === SkillComparisonStatus.UPDATE_AVAILABLE
      || comparisonRow.statusMessage === SkillComparisonStatus.LOCAL_SKILL_INVALID,
  )
}

/**
 * 组装可更新技能名称列表。
 *
 * @param comparisonRows - 可更新结果行列表。
 * @returns 去重后的技能名称列表。
 * @example buildUpdateSkillNames([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "该技能有可用更新。" }]) => ["yeizi-demo"]
 */
function buildUpdateSkillNames(comparisonRows: readonly ISkillComparisonRow[]): string[] {
  return Array.from(new Set(comparisonRows.map(comparisonRow => comparisonRow.skillName)))
}

/**
 * 组装用户选中后的结果行列表。
 *
 * @param comparisonRows - 可选结果行列表。
 * @param selectedSkillNames - 选中的技能名称列表。
 * @returns 过滤后的结果行列表。
 * @example buildSelectedRows([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "该技能有可用更新。" }], ["yeizi-demo"]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "该技能有可用更新。" }]
 */
function buildSelectedRows(
  comparisonRows: readonly ISkillComparisonRow[],
  selectedSkillNames: readonly string[],
): ISkillComparisonRow[] {
  const selectedSkillNameSet = new Set(selectedSkillNames)

  return comparisonRows.filter(comparisonRow => selectedSkillNameSet.has(comparisonRow.skillName))
}

export {
  buildComparisonRows,
  buildSelectedRows,
  buildUpdateRows,
  buildUpdateSkillNames,
}
