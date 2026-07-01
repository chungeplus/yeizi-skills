import type { SkillFrontmatter } from "@/types/skill"
import { z } from "zod"

/**
 * 技能文档 frontmatter 的校验 schema。
 *
 * 仅强校验 name 与 description；使用 passthrough 保留 frontmatter 上可能存在的额外字段（如版本号、tags）、
 * 但不参与业务读取。
 */
const skillFrontmatterSchema: z.ZodSchema<SkillFrontmatter> = z
  .object({
    /**
     * 技能名称。
     */
    name: z.string().min(1, "技能名不能为空。"),
    /**
     * 技能简介。
     */
    description: z.string().min(1, "技能描述不能为空。"),
  })
  .passthrough()

export { skillFrontmatterSchema }
