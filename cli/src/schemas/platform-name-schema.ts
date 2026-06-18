import { z } from "zod"

import { SupportedPlatform } from "@/types/platform"

export const supportedPlatformNameSchema = z.enum([
  SupportedPlatform.CODEX,
  SupportedPlatform.CLAUDE,
  SupportedPlatform.TRAE,
])
