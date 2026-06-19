import type { IPlatformTarget, SupportedPlatformName } from "@/types/platform"

import { existsSync } from "node:fs"
import { join } from "node:path"

import { PLATFORM_DIRECTORY_NAMES } from "@/constants"
import { AppError, AppErrorCode } from "@/errors"
import { csvOptionValueSchema, supportedPlatformNameSchema } from "@/schemas"

/**
 * 瑙ｆ瀽骞冲彴閫夐」鍊笺€?
 *
 * @param platformOptionValue - 閫楀彿鍒嗛殧鐨勫钩鍙伴€夐」鍊笺€?
 * @returns 瑙ｆ瀽鍚庣殑骞冲彴鍒楄〃銆?
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
 * 缁勮骞冲彴鐩爣鐩綍銆?
 *
 * @param homeDirectoryPath - 鐢ㄦ埛涓荤洰褰曡矾寰勩€?
 * @param selectedPlatformNames - 閫変腑鐨勫钩鍙板悕绉板垪琛ㄣ€?
 * @returns 骞冲彴鐩爣鐩綍鍒楄〃銆?
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
 * 瑙ｆ瀽閫楀彿鍒嗛殧閫夐」鍊笺€?
 *
 * @param csvOptionValue - 閫楀彿鍒嗛殧鐨勯€夐」瀛楃涓层€?
 * @returns 鍘婚噸鍚庣殑瀛楃涓插垪琛ㄣ€?
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
