import type { SkillFrontmatter } from "@/types/skill"
import { z } from "zod"

import { skillVersionSchema } from "./manifest-config"

/**
 * 技能文档 frontmatter 的校验 schema。
 */
const skillFrontmatterSchema: z.ZodSchema<SkillFrontmatter> = z
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

export { skillFrontmatterSchema }
