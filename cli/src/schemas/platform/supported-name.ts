import type { PlatformName } from "@/types/platform"

import { z } from "zod"

import { platformConfig } from "@/config/platform"

/**
 * 受支持平台名称的校验 schema。
 * 取值集合与 {@link platformConfig} 的条目名称保持一致。
 */
const supportedPlatformNameSchema = z.string().refine(
  (platformNameValue): platformNameValue is PlatformName => {
    return platformConfig.platformList.some(platformItem => platformItem.platformName === platformNameValue)
  },
  "不受支持的平台名称。",
)

export { supportedPlatformNameSchema }
