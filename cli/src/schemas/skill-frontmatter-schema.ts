import { z } from "zod"

import { skillNameSchema, skillVersionSchema } from "./skill-index-schema"

export const skillFrontmatterSchema = z
  .object({
    name: skillNameSchema,
    version: skillVersionSchema,
    description: z.string().trim().min(1, "技能说明不能为空。").optional(),
  })
  .strict()
