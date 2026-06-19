import { z } from "zod"

const packageJsonInfoSchema = z.object({
  bin: z.record(z.string()),
  description: z.string().trim().min(1, "package.json 中缺少 description 配置。"),
  version: z.string().trim().min(1, "package.json 中缺少 version 配置。"),
}).passthrough()

export { packageJsonInfoSchema }
