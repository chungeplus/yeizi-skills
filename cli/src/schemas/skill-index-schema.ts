import semver from "semver"
import { z } from "zod"

export const skillNameSchema = z
  .string()
  .regex(/^yeizi-[a-z0-9-]+$/, "技能名称必须以 yeizi- 开头。")

export const skillVersionSchema = z
  .string()
  .refine(versionValue => semver.valid(versionValue) !== null, "版本号必须符合 semver 规范。")

export const skillIndexEntrySchema = z
  .object({
    name: skillNameSchema,
    version: skillVersionSchema,
  })
  .strict()

export const skillIndexSchema = z
  .object({
    skills: z.array(skillIndexEntrySchema).min(1, "skills 列表不能为空。"),
  })
  .strict()
