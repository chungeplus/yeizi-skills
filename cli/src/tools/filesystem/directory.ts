import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { cp, readdir, readFile, rm, stat } from "node:fs/promises"
import { join, sep } from "node:path"

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

/**
 * 递归计算目录内容的 SHA-256 哈希。
 *
 * 遍历目录下所有子项，按名称排序后逐项处理：文件读取内容并计算 SHA-256，子目录递归得到下层哈希。
 * 把每个子项拼成 `<name> <hash>` 行（子目录在 name 后追加 `sep` 标识，避免与同名文件冲突），
 * 按出现顺序拼接后再做一次 SHA-256 作为本目录整体哈希。
 *
 * @param directoryPath - 目录路径。
 * @returns 目录内容的整体 SHA-256 十六进制字符串。
 * @throws 读取目录或文件失败时抛出 `node:fs` 的原始错误。
 */
async function computeDirectoryContentHash(directoryPath: string): Promise<string> {
  const entryList = await readdir(directoryPath, { withFileTypes: true })
  const sortedEntryList = [...entryList].sort((entryItemA, entryItemB) => entryItemA.name.localeCompare(entryItemB.name))
  const lineList: string[] = []
  for (const entryItem of sortedEntryList) {
    const childPath = join(directoryPath, entryItem.name)
    if (entryItem.isDirectory()) {
      const childHash = await computeDirectoryContentHash(childPath)
      lineList.push(`${entryItem.name}${sep} ${childHash}`)
      continue
    }
    if (entryItem.isFile()) {
      const fileContent = await readFile(childPath)
      const fileHash = createHash("sha256").update(fileContent).digest("hex")
      lineList.push(`${entryItem.name} ${fileHash}`)
    }
  }
  return createHash("sha256").update(lineList.join("\n")).digest("hex")
}

/**
 * 比对两个目录的内容哈希。
 *
 * 先判断 `targetDirectoryPath` 是否存在且为目录；不满足直接返回 `false`。
 * 满足后分别计算两边的递归 SHA-256，hash 相同视为内容一致。
 *
 * @param sourceDirectoryPath - 源目录路径，必须存在且为目录。
 * @param targetDirectoryPath - 目标目录路径，允许不存在或非目录。
 * @returns 两侧内容一致返回 `true`；目标不存在、非目录或内容不同时返回 `false`。
 * @throws 源目录不存在或读取失败时抛出 `node:fs` 的原始错误。
 *
 * @example
 * ```typescript
 * const isSame = await compareDirectoryContentHash("/tmp/source", "/tmp/target")
 * if (isSame) {
 *   console.log("内容相同，可跳过覆盖")
 * }
 * ```
 */
async function compareDirectoryContentHash(
  sourceDirectoryPath: string,
  targetDirectoryPath: string,
): Promise<boolean> {
  if (!existsSync(targetDirectoryPath)) {
    return false
  }
  const targetStat = await stat(targetDirectoryPath)
  if (!targetStat.isDirectory()) {
    return false
  }
  const sourceHash = await computeDirectoryContentHash(sourceDirectoryPath)
  const targetHash = await computeDirectoryContentHash(targetDirectoryPath)
  return sourceHash === targetHash
}

export { compareDirectoryContentHash, copyDirectory, removeDirectory }
