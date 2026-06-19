import { z } from "zod"

const csvOptionValueSchema = z
  .string()
  .trim()
  .min(1, "逗号分隔选项值不能为空。")

export { csvOptionValueSchema }
