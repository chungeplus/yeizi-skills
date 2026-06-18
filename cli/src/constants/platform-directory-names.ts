import type { SupportedPlatformName } from "@/types/platform"

import { SupportedPlatform } from "@/types/platform"

/**
 * 平台技能目录名称映射。
 */
export const PLATFORM_DIRECTORY_NAMES: Record<SupportedPlatformName, string> = {
  [SupportedPlatform.CODEX]: ".codex",
  [SupportedPlatform.CLAUDE]: ".claude",
  [SupportedPlatform.TRAE]: ".trae",
}
