import type { IPlatformTarget, SupportedPlatformName } from "@/types/platform"

import { existsSync } from "node:fs"
import { join } from "node:path"

import { PLATFORM_DIRECTORY_NAMES } from "@/constants"
import { AppError, AppErrorCode } from "@/errors"
import { csvOptionValueSchema, supportedPlatformNameSchema } from "@/schemas"

/**
 * 解析平台选项值。
 *
 * @param platformOptionValue - 逗号分隔的平台选项值。
 * @returns 解析后的平台列表。
 * @example parsePlatforms("codex,claude") => ["codex", "claude"]
 */
function parsePlatforms(platformOptionValue: string | undefined): SupportedPlatformName[] {
  const parsedPlatformNames = parseCsvOptionValues(platformOptionValue)

  return parsedPlatformNames.map((platformName) => {
    const parsedPlatformNameResult = supportedPlatformNameSchema.safeParse(platformName)

    if (parsedPlatformNameResult.success) {
      return parsedPlatformNameResult.data
    }

    throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
      params: { platformName },
    })
  })
}

/**
 * 组装平台目标目录。
 *
 * @param homeDirectoryPath - 用户主目录路径。
 * @param selectedPlatformNames - 选中的平台名称列表。
 * @returns 平台目标目录列表。
 * @example buildPlatformTargets("/Users/demo", ["codex"]) => [{ platformName: "codex", skillsDirectoryPath: "/Users/demo/.codex/skills", hasSkillsDirectory: false }]
 */
function buildPlatformTargets(
  homeDirectoryPath: string,
  selectedPlatformNames: readonly SupportedPlatformName[],
): IPlatformTarget[] {
  return selectedPlatformNames.map((platformName) => {
    const skillsDirectoryPath = join(homeDirectoryPath, PLATFORM_DIRECTORY_NAMES[platformName], "skills")

    return {
      platformName,
      skillsDirectoryPath,
      hasSkillsDirectory: existsSync(skillsDirectoryPath),
    }
  })
}

/**
 * 解析逗号分隔选项值。
 *
 * @param csvOptionValue - 逗号分隔的选项字符串。
 * @returns 去重后的字符串列表。
 * @example parseCsvOptionValues("codex,claude") => ["codex", "claude"]
 */
function parseCsvOptionValues(csvOptionValue: string | undefined): string[] {
  if (csvOptionValue === undefined) {
    return []
  }

  const validatedOptionValueResult = csvOptionValueSchema.safeParse(csvOptionValue)

  if (!validatedOptionValueResult.success) {
    throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
  }

  const parsedOptionValues = Array.from(new Set(validatedOptionValueResult.data
    .split(",")
    .map(optionValue => optionValue.trim())
    .filter(optionValue => optionValue.length > 0)))

  if (parsedOptionValues.length === 0) {
    throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
  }

  return parsedOptionValues
}

export { buildPlatformTargets, parsePlatforms }
