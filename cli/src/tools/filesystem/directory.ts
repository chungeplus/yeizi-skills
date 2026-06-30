import { cp, rm } from "node:fs/promises"

/**
 * 递归复制目录。
 *
 * @param sourcePath - 源目录路径。
 * @param targetPath - 目标目录路径。
 * @throws 文件复制失败时抛出 `node:fs` 的原始错误。
 */
async function copyDirectory(sourcePath: string, targetPath: string): Promise<void> {
  await cp(sourcePath, targetPath, {
    recursive: true,
    force: true,
  })
}

/**
 * 删除目录。
 *
 * @param directoryPath - 要删除的目录路径。
 * @throws 删除失败时抛出 `node:fs` 的原始错误。
 */
async function removeDirectory(directoryPath: string): Promise<void> {
  await rm(directoryPath, { force: true, recursive: true })
}

export { copyDirectory, removeDirectory }
