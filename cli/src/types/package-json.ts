/**
 * package.json 中会用到的字段结构。
 */
export interface IPackageJsonInfo {
  // 命令行入口映射。
  bin: Record<string, string>

  // 程序说明。
  description: string

  // 程序版本。
  version: string
}
