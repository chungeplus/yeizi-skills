import { z } from "zod"

/**
 * package.json 中程序信息的校验 schema。
 */
const packageJsonInfoSchema = z.object({
  /**
   * CLI 命令名到入口脚本路径的映射；main 流程从这里读取顶层命令名。
   */
  bin: z.record(z.string()),
  /**
   * CLI 自描述；非空，用于 Commander 的 program.description。
   */
  description: z.string().trim().min(1, "package.json 中缺少 description 配置。"),
  /**
   * CLI 版本号；遵循 semver 规范，用于 Commander 的 program.version。
   */
  version: z.string().trim().min(1, "package.json 中缺少 version 配置。"),
}).passthrough()

export { packageJsonInfoSchema }
