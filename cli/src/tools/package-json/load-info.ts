import { access, readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { AppError, AppErrorCode } from "@/error"
import { packageJsonInfoSchema } from "@/schemas/tools/package-json-info"

/**
 * 加载并校验 package.json 中会用到的程序信息。
 *
 * @returns 通过 schema 校验后的 package.json 信息。
 * @throws package.json 不存在或格式不正确时抛出错误。
 *
 * @example
 * ```typescript
 * loadPackageJsonInfo()
 * // { name: "yeizi-skills", version: "0.1.0", bin: { "yeizi-skills": "dist/index.js" }, description: "..." }
 * ```
 */
async function loadPackageJsonInfo(): Promise<ReturnType<typeof packageJsonInfoSchema.parse>> {
  const packageJsonPath = await findPackageJsonPath(dirname(fileURLToPath(import.meta.url)))

  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf8")
    const packageJsonPayload: unknown = JSON.parse(packageJsonContent)

    return packageJsonInfoSchema.parse(packageJsonPayload)
  }
  catch (error) {
    if (error instanceof Error) {
      throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT, {
        cause: error,
      })
    }
    throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT)
  }
}

/**
 * 逐级向上查找 package.json 所在路径。
 *
 * @param currentDirectoryPath - 当前起始目录。
 * @returns 找到的 package.json 绝对路径。
 * @throws 到达文件系统根目录仍未找到时抛出错误。
 */
async function findPackageJsonPath(currentDirectoryPath: string): Promise<string> {
  const candidatePath = resolve(currentDirectoryPath, "package.json")

  try {
    await access(candidatePath)
    return candidatePath
  }
  catch {
    const parentDirectoryPath = dirname(currentDirectoryPath)

    if (parentDirectoryPath === currentDirectoryPath) {
      throw new AppError(AppErrorCode.PACKAGE_CONFIG_NOT_FOUND)
    }

    return findPackageJsonPath(parentDirectoryPath)
  }
}

export { loadPackageJsonInfo }
