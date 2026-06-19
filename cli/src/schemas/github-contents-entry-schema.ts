import { z } from "zod"

const githubContentsEntrySchema = z.object({
  type: z.string().min(1, "GitHub 条目类型不能为空。"),
  path: z.string().min(1, "GitHub 条目路径不能为空。"),
  download_url: z.string().url("GitHub 下载地址格式不正确。").nullable(),
}).passthrough()

const githubContentsEntryListSchema = z.array(githubContentsEntrySchema)

export { githubContentsEntryListSchema, githubContentsEntrySchema }
