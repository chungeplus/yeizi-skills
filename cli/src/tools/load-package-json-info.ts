import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { AppError, AppErrorCode } from "@/errors"
import { packageJsonInfoSchema } from "@/schemas"

const packageJsonPath = resolvePackageJsonPath()
type PackageJsonPayload = Parameters<typeof packageJsonInfoSchema.parse>[0]

/**
 * 加载并校验 package.json 中会用到的程序信息。
 *
 * @returns 通过 schema 校验后的 package.json 信息。
 */
export function loadPackageJsonInfo(): ReturnType<typeof packageJsonInfoSchema.parse> {
  try {
    const packageJsonPayload = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJsonPayload

    return packageJsonInfoSchema.parse(packageJsonPayload)
  }
  catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error))

    throw new AppError(
      AppErrorCode.PACKAGE_CONFIG_INVALID,
      {
        params: { kind: "invalid-format" },
        cause,
      },
    )
  }
}

function resolvePackageJsonPath(): string {
  let currentDirectoryPath = dirname(fileURLToPath(import.meta.url))

  while (true) {
    const candidatePath = resolve(currentDirectoryPath, "package.json")

    if (existsSync(candidatePath)) {
      return candidatePath
    }

    const parentDirectoryPath = dirname(currentDirectoryPath)

    if (parentDirectoryPath === currentDirectoryPath) {
      throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
        params: { kind: "not-found" },
      })
    }

    currentDirectoryPath = parentDirectoryPath
  }
}
