import type { PlatformItem, PlatformName } from "@/types/platform"

import { existsSync } from "node:fs"
import { AppError, AppErrorCode } from "@/error"

import { supportedPlatformNameSchema } from "@/schemas/platform/supported-name"
import { splitCsvString } from "@/tools/string"

/**
 * 解析平台选项值。
 *
 * @param rawPlatformOptionValue - 逗号分隔的平台选项值。
 * @returns 解析后的平台列表；未传入时返回空列表。
 * @throws 平台选项已传入但解析后为空，或包含不受支持的平台时抛出 {@link AppError}。
 *
 * @example
 * ```typescript
 * parsePlatformNameList("codex,claude") // ["codex", "claude"]
 * ```
 */
function parsePlatformNameList(rawPlatformOptionValue: string | undefined): PlatformName[] {
  if (rawPlatformOptionValue === undefined) {
    return []
  }

  const platformNameList = splitCsvString(rawPlatformOptionValue)

  if (platformNameList.length === 0) {
    throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
  }

  return platformNameList.map((platformNameItem) => {
    const parsedPlatformNameResult = supportedPlatformNameSchema.safeParse(platformNameItem)

    if (parsedPlatformNameResult.success) {
      return parsedPlatformNameResult.data
    }

    throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
      params: { platformName: platformNameItem },
    })
  })
}

/**
 * 根据选中的平台名称筛选出对应的平台条目。
 *
 * `allowMissingSkillDirectory` 控制本地技能目录缺失时的行为：
 * - `false`（默认）：严格校验，任一选中平台的技能目录不存在时抛错。install 命令使用此模式，保证后续复制有目标目录。
 * - `true`：容忍技能目录缺失，直接返回对应的 {@link PlatformItem}，由调用方在后续渲染层（如 comparison-builder）单独处理缺失态。list 命令使用此模式。
 *
 * @param platformList - 全部平台条目列表。
 * @param selectedPlatformNameList - 选中的平台名称列表。
 * @param allowMissingSkillDirectory - 是否容忍选中平台的本地技能目录不存在，默认 `false`（严格）。
 * @returns 选中的平台条目列表。
 * @throws 任意选中平台在配置中找不到时抛出 {@link AppError}（错误码 `PLATFORM_NOT_SUPPORTED`）。
 * @throws `allowMissingSkillDirectory` 为 `false` 且任意选中平台对应技能目录不存在时抛出 {@link AppError}（错误码 `PLATFORM_NOT_FOUND`）。
 *
 * @example
 * ```typescript
 * // install 调用：严格模式，技能目录不存在时抛错
 * buildSelectedPlatformList(
 *   [{ platformName: "codex", platformHomeDirectoryPath: "/Users/demo/.codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" }],
 *   ["codex"],
 * )
 * // [{ platformName: "codex", platformHomeDirectoryPath: "/Users/demo/.codex", platformSkillDirectoryPath: "/Users/demo/.codex/skills" }]
 * ```
 *
 * @example
 * ```typescript
 * // list 调用：容忍技能目录缺失，由后续渲染层处理
 * buildSelectedPlatformList(
 *   [{ platformName: "claude-code", platformHomeDirectoryPath: "/Users/demo/.claude", platformSkillDirectoryPath: "/Users/demo/.claude/skills" }],
 *   ["claude-code"],
 *   true,
 * )
 * // 即使 /Users/demo/.claude/skills 不存在也照常返回，不抛错
 * ```
 */
function buildSelectedPlatformList(
  platformList: PlatformItem[],
  selectedPlatformNameList: PlatformName[],
  allowMissingSkillDirectory: boolean = false,
): PlatformItem[] {
  const platformItemByNameMap = new Map(
    platformList.map(platformItem => [platformItem.platformName, platformItem]),
  )

  const missingPlatformNameList = selectedPlatformNameList.filter(
    platformNameItem => !platformItemByNameMap.has(platformNameItem),
  )

  if (missingPlatformNameList.length > 0) {
    throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
      params: { platformName: missingPlatformNameList.join(",") },
    })
  }

  if (!allowMissingSkillDirectory) {
    const notFoundPlatformNameList = selectedPlatformNameList.filter((platformNameItem) => {
      const platformItem = platformItemByNameMap.get(platformNameItem)!
      return !existsSync(platformItem.platformSkillDirectoryPath)
    })

    if (notFoundPlatformNameList.length > 0) {
      throw new AppError(AppErrorCode.PLATFORM_NOT_FOUND, {
        params: { platformNameList: notFoundPlatformNameList },
      })
    }
  }

  return selectedPlatformNameList.map(platformNameItem => platformItemByNameMap.get(platformNameItem)!)
}

export { buildSelectedPlatformList, parsePlatformNameList }
