import type { IPlatformTarget } from "@/types/platform"
import type { ISkillComparisonRow, ISkillIndexEntry } from "@/types/skill"

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import semver from "semver"

import { SkillComparisonStatus } from "@/types/skill"

import { SkillDocumentParser } from "./skill-document-parser"

const skillDocumentParser = new SkillDocumentParser()

/**
 * 缁勮骞冲彴涓庢妧鑳界殑姣旇緝缁撴灉銆?
 *
 * @param skillIndexEntries - 杩滅鎶€鑳界储寮曟潯鐩垪琛ㄣ€?
 * @param platformTargets - 骞冲彴鐩爣鐩綍鍒楄〃銆?
 * @returns 姣旇緝缁撴灉琛屽垪琛ㄣ€?
 * @example buildComparisonRows([{ name: "yeizi-demo", version: "1.0.0" }], [{ platformName: "codex", skillsDirectoryPath: "/tmp/skills", hasSkillsDirectory: false }]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.0", localVersion: null, statusMessage: "璇ュ钩鍙扮殑 skills 鐩綍涓嶅瓨鍦ㄣ€? }]
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
 * 缁勮闇€瑕佹洿鏂扮殑姣旇緝缁撴灉琛屻€?
 *
 * @param comparisonRows - 瀹屾暣姣旇緝缁撴灉琛屽垪琛ㄣ€?
 * @returns 浠呭寘鍚彲鏇存柊椤圭殑缁撴灉琛屽垪琛ㄣ€?
 * @example buildUpdateRows([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "璇ยู妧鑳芥湁鍙敤鏇存柊銆? }]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "璇ยู妧鑳芥湁鍙敤鏇存柊銆? }]
 */
function buildUpdateRows(comparisonRows: readonly ISkillComparisonRow[]): ISkillComparisonRow[] {
  return comparisonRows.filter(
    comparisonRow =>
      comparisonRow.statusMessage === SkillComparisonStatus.UPDATE_AVAILABLE
      || comparisonRow.statusMessage === SkillComparisonStatus.LOCAL_SKILL_INVALID,
  )
}

/**
 * 缁勮鍙洿鏂版妧鑳藉悕绉板垪琛ㄣ€?
 *
 * @param comparisonRows - 鍙洿鏂扮粨鏋滆鍒楄〃銆?
 * @returns 鍘婚噸鍚庣殑鎶€鑳藉悕绉板垪琛ㄣ€?
 * @example buildUpdateSkillNames([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "璇ยู妧鑳芥湁鍙敤鏇存柊銆? }]) => ["yeizi-demo"]
 */
function buildUpdateSkillNames(comparisonRows: readonly ISkillComparisonRow[]): string[] {
  return Array.from(new Set(comparisonRows.map(comparisonRow => comparisonRow.skillName)))
}

/**
 * 缁勮鐢ㄦ埛閫変腑鍚庣殑缁撴灉琛屽垪琛ㄣ€?
 *
 * @param comparisonRows - 鍙€夌粨鏋滆鍒楄〃銆?
 * @param selectedSkillNames - 閫変腑鐨勬妧鑳藉悕绉板垪琛ㄣ€?
 * @returns 杩囨护鍚庣殑缁撴灉琛屽垪琛ㄣ€?
 * @example buildSelectedRows([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "璇ยู妧鑳芥湁鍙敤鏇存柊銆? }], ["yeizi-demo"]) => [{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.1", localVersion: "1.0.0", statusMessage: "璇ยู妧鑳芥湁鍙敤鏇存柊銆? }]
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
