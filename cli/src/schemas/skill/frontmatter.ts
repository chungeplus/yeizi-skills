import type { SkillFrontmatter } from "@/types/skill"
import { z } from "zod"

/**
 * 技能文档 frontmatter 的校验 schema。
 *
 * 使用 passthrough 容忍历史遗留的 version 等额外字段，仅强校验 name 与 description。
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
