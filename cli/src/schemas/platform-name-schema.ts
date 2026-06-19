import { z } from "zod"

import { SupportedPlatform } from "@/types/platform"

const supportedPlatformNameSchema = z.enum([
  SupportedPlatform.CODEX,
  SupportedPlatform.CLAUDE,
  SupportedPlatform.TRAE,
])

export { supportedPlatformNameSchema }
