import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { AppError, AppErrorCode } from "@/errors"
import { packageJsonInfoSchema } from "@/schemas"

const packageJsonPath = findPackageJsonPath(dirname(fileURLToPath(import.meta.url)))
type PackageJsonPayload = Parameters<typeof packageJsonInfoSchema.parse>[0]

/**
 * 加载并校验 package.json 中会用到的程序信息。
 *
 * @returns 通过 schema 校验后的 package.json 信息。
 */
function loadPackageJsonInfo(): ReturnType<typeof packageJsonInfoSchema.parse> {
  try {
    const packageJsonPayload = JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJsonPayload

    return packageJsonInfoSchema.parse(packageJsonPayload)
  }
  catch (error) {
    let cause: Error

    if (error instanceof Error) {
      cause = error
    }
    else {
      cause = new Error(String(error))
    }

    throw new AppError(
      AppErrorCode.PACKAGE_CONFIG_INVALID,
      {
        params: { kind: "invalid-format" },
        cause,
      },
    )
  }
}

function findPackageJsonPath(currentDirectoryPath: string): string {
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

  return findPackageJsonPath(parentDirectoryPath)
}

export { loadPackageJsonInfo }
