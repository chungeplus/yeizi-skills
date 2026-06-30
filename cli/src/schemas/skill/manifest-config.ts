import semver from "semver"
import { z } from "zod"

/**
 * 技能版本号校验 schema：符合 semver 规范。
 */
const skillVersionSchema = z
  .string()
  .refine(versionValue => semver.valid(versionValue) !== null, "版本号必须符合 semver 规范。")

/**
 * 单条技能的校验 schema。
 */
const skillSchema = z
  .object({
    /**
     * 技能名。
     */
    skillName: z.string(),
    /**
     * 技能版本号；遵循 semver 规范。
     */
    skillVersion: skillVersionSchema,
  })
  .strict()

/**
 * manifest.json 整体结构的校验 schema。
 */
const manifestConfigSchema = z
  .object({
    /**
     * 远端可用的全部技能；按 schema 至少包含 1 个。
     */
    skillList: z.array(skillSchema).min(1, "skills 列表不能为空。"),
  })
  .strict()

export { manifestConfigSchema, skillSchema, skillVersionSchema }
