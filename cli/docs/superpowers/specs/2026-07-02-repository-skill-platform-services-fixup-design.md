# Repository / Skill / Platform Services 重构收尾设计

## 背景

v2.1-cleanup 分支已经完成了大半的拆分重构：
- `src/config/repository/index.ts` 拆成 `src/config/remote.ts`（`repositoryConfig` 改为 `remoteConfig`，新增 `remoteSkillDirectoryPath` 字段）和 `src/config/platform.ts`
- `src/features/github/repository.ts` + `src/features/github/run-with-skill-repository.ts` 拆成 `src/features/repository/remote.ts` + `src/features/skill/remote.ts`
- `src/features/platform/{local,remote}.ts` 是从旧的 `resolver.ts` 衍生出来的 service 形式

但是 `src/features/repository/remote.ts`、`src/features/skill/remote.ts`、`src/features/platform/local.ts`、`src/features/platform/remote.ts` 这四个文件处于"半成品"状态：类名、字段名、导入路径彼此不对齐，`install/list` 命令引用的方法名也对不上，导致 `npm run build` 无法通过。

这次任务是把四个文件按调用方的预期收尾到位，**行为保持与重构前一致**，只是把标识符和模块路径对齐。

## 范围

### 修改的文件

- `src/features/repository/remote.ts`：完整重写
- `src/features/skill/remote.ts`：完整重写
- `src/features/platform/remote.ts`：完整重写
- `src/features/platform/index.ts`：补一行导出

### 不修改的文件

- `src/features/platform/local.ts`：当前 `LocalPlatformService` 实现正确，保留不动
- `src/features/repository/index.ts`：已经正确导出 `RepositoryContentService`
- `src/features/skill/index.ts`：已经正确导出 `SkillContentService`（从 `./remote`）
- `src/config/remote.ts`、`src/config/platform.ts`、`src/config/index.ts`：已正确
- `src/commands/install/command.ts`、`src/commands/list/command.ts`：调用方不变

## 设计

### `RepositoryContentService`（位于 `src/features/repository/remote.ts`）

替换掉当前混乱的 `RemoteSkillService`/`RemoteRepositoryService` 混合体，统一为 `RepositoryContentService` 类。

```typescript
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { downloadTemplate } from "giget"

import { remoteConfig } from "@/config"

class RepositoryContentService {
  private static remoteConfig = remoteConfig
  private static repositoryDirectoryPath: string | undefined
  private static initRepositoryContentPromise: Promise<[void]> | undefined

  public static async initRepositoryContent(): Promise<[void]>
  public static async getRepositoryDirectoryPath(): Promise<string>
  public static async getRepositorySkillDirectoryPath(): Promise<string>
  public static async removeContent(): Promise<void>

  private static getRepositoryRequestPath(): string
  private static async createLoadRepositoryDirectoryPathPromise(): Promise<void>
  private static async loadRepositoryDirectoryPath(): Promise<string>
}

export { RepositoryContentService }
```

要点：
- 类名和导出名均为 `RepositoryContentService`，对齐 `src/features/repository/index.ts` 的桶导出
- 不再 import `RemoteRepositoryConfig` 或 `RemoteConfig` 类型——`remoteConfig` 已经是带 `as const` 的字面量对象，直接拿值用，不需要单独抽类型
- `remoteConfig` 从 `@/config` 导入（`src/config/remote.ts` 的桶出口），不再 import 不存在的 `@/config/repository`
- 字段重命名：
  - 删除无用的 `remoteDownloadLocalTempDirectoryPath`
  - 改 `initRemoteSkillPromise` → `initRepositoryContentPromise`
  - 补 `repositoryDirectoryPath: string | undefined`
- 方法重命名：
  - `initRepositoryContent()` 匹配 install/list 调用方
  - `getRepositoryDirectoryPath()` 匹配 install/list 和 `skill/copy.ts` 调用方
  - `removeContent()` 匹配 list 命令调用方（原 `removeRepositoryContent` 改名）
  - **新增** `getRepositorySkillDirectoryPath()`：把 `getRepositoryDirectoryPath()` 的结果和 `remoteConfig.remoteSkillDirectoryPath` 拼起来，给 `SkillContentService` 用
- `getRepositoryRequestPath()` 私有方法拼出 `gh:${owner}/${name}#${branch}`

### `SkillContentService`（位于 `src/features/skill/remote.ts`）

替换掉当前混乱的 `RemoteSkillService`，统一为 `SkillContentService` 类。

```typescript
import type { SkillItem, SkillName } from "@/types/skill"

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import matter from "gray-matter"

import { AppError, AppErrorCode } from "@/error"
import { RepositoryContentService } from "@/features/repository"
import { skillEntryFileObjectSchema } from "@/schemas/skill/entry-file-data"

const SKILL_ENTRY_FILE_NAME = "SKILL.md"

class SkillContentService {
  private static remoteSkillList: SkillItem[] | undefined
  private static initSkillContentPromise: Promise<[void]> | undefined

  public static async initSkillContent(): Promise<[void]>
  public static async validateSkillNameListExistInSkillList(skillNameList: SkillName[]): Promise<void>
  public static async getRemoteSkillList(): Promise<SkillItem[]>

  private static async createLoadRemoteSkillListPromise(): Promise<void>
  private static async loadSkillList(): Promise<SkillItem[]>
}

export { SkillContentService }
```

要点：
- 类名和导出名均为 `SkillContentService`，对齐 `src/features/skill/index.ts` 的桶导出
- 移除自循环 `import type { SkillContentService } from "."`——这个 import 本来就是错的（自己导自己）
- 移除 `import { repositoryConfig } from "@/config/repository"`——`remoteConfig` 不再需要这个文件存在
- 移除对不存在的 `RemoteRepositoryService.getRemoteRepositorySkillDirectoryPath()` 的引用，改成 `RepositoryContentService.getRepositorySkillDirectoryPath()`
- 方法重命名匹配 install/list 调用方：
  - `initSkillContent()`
  - `validateSkillNameListExistInSkillList(skillNameList)`（原 `validateSkillNameListExistInRemoteSkillList` 改名）
  - `getRemoteSkillList()`（已正确）
- 私有方法重命名：
  - `initRemoteSkillPromise` → `initSkillContentPromise`
  - `createLoadRemoteSkillListPromise` → `createLoadRemoteSkillListPromise`（不变）
  - `loadRemoteSkillList` → `loadSkillList`（私有方法，调用方只看公开 API）
- 扫描逻辑保持当前实现：
  - 通过 `RepositoryContentService.getRepositorySkillDirectoryPath()` 拿到 skill 目录
  - `readdir(..., { withFileTypes: true })` 读目录
  - 每个子目录读 `SKILL.md`，用 `gray-matter` + `skillEntryFileObjectSchema` 解析 frontmatter
  - 提取 `name` 和 `description` 组成 `SkillItem`
  - 按 `skillName.localeCompare` 排序
- **不**加 `yeizi-` 前缀过滤（已与用户确认新仓库布局 `yeizi-skills/skill/<name>/SKILL.md` 不需要这个过滤）
- **不**加 warning 收集和空仓库抛 `REMOTE_REPOSITORY_EMPTY`——已与用户确认"新 skill/remote.ts 当前实现保留不动"

### `PlatformContentService`（位于 `src/features/platform/remote.ts`）

替换掉当前 `LocalPlatformService` 的复制粘贴副本，统一为 `PlatformContentService` 类。

```typescript
import type { PlatformConfig, PlatformItem } from "@/types/platform"

import { platformConfig } from "@/config"

class PlatformContentService {
  private static platformConfig: PlatformConfig = platformConfig
  private static platformList: PlatformItem[] | undefined
  private static initPlatformContentPromise: Promise<[void]> | undefined

  public static async initPlatformContent(): Promise<[void]>
  public static async getRemotePlatformList(): Promise<PlatformItem[]>

  private static async createLoadRemotePlatformListPromise(): Promise<void>
}

export { PlatformContentService }
```

要点：
- 类名和导出名均为 `PlatformContentService`，对齐 `src/features/platform/index.ts` 的桶导出
- `getRemotePlatformList()` 直接返回 `[...platformConfig.platformList]`，与"返回 platformConfig 里全部条目"语义一致
- 静态字段命名规范：去掉 `local` 前缀，因为这个 class 关注的是配置列表本身，不是本地检测
- 复用当前 `local.ts` 里的 `initXxx` / `createLoadXxxPromise` 模式，但加载逻辑只做"复制 platformConfig.platformList"，不做 `access` 检测

### `LocalPlatformService`（位于 `src/features/platform/local.ts`）

**完全不动**。当前文件已经正确实现了：
- `initLocalPlatform()` 一次性扫描本地存在的平台（`access` 通过 `platformHomeDirectoryPath`）
- `getLocalPlatformList()` 返回按 `platformName.localeCompare` 排序后的列表

### `src/features/platform/index.ts`

补一行导出：

```typescript
export { LocalPlatformService } from "./local"
export { PlatformContentService } from "./remote"
```

保证两个 service 都能从 `@/features/platform` 桶文件访问到。当前只导出 `PlatformContentService`，`LocalPlatformService` 没有对外入口。

## 调用链验证

`install` 命令（`src/commands/install/command.ts`）当前调用：
- `SkillContentService.initSkillContent()` ✓ 重命名后存在
- `RepositoryContentService.initRepositoryContent()` ✓ 重命名后存在
- `PlatformContentService.initPlatformContent()` ✓ 重命名后存在
- `SkillContentService.validateSkillNameListExistInSkillList(inputSkillNameList)` ✓ 重命名后存在
- `promptSkillNameList()` ✓ 不变
- `promptPlatformNameList()` ✓ 不变
- `buildPlatformList(selectedPlatformNameList)` ✓ 不变（依赖 `PlatformContentService.getRemotePlatformList`）
- `buildSelectedSkillList(selectedSkillNameList)` ✓ 不变
- `copySkillListToPlatformList(selectedSkillList, selectedPlatformList)` ✓ 不变（依赖 `RepositoryContentService.getRepositoryDirectoryPath`）

`list` 命令（`src/commands/list/command.ts`）当前调用：
- `promptPlatformNameList()` ✓ 不变
- `buildPlatformList(selectedPlatformNameList)` ✓ 不变
- `SkillContentService.getRemoteSkillList()` ✓ 已存在
- `buildComparisonRows(remoteSkillList, selectedPlatformList)` ✓ 不变
- `RepositoryContentService.removeContent()` ✓ 重命名后存在

## 不在范围内

- 不动 `LocalPlatformService` 的 `access` 检测逻辑
- 不动 `buildSelectedSkillList` / `buildComparisonRows` / `buildPlatformList` / `copySkillListToPlatformList` 等纯函数
- 不动 `promptSkillNameList` / `promptPlatformNameList` 等 inquirer 封装
- 不加 `yeizi-` 前缀过滤、不加 warning 收集、不加 `REMOTE_REPOSITORY_EMPTY` 错误码
- 不重构 `RepositoryConfig` 类型定义（保持现状）
- 不引入新的工具函数或新文件

## 已知不在范围内的预存问题

`src/commands/install/command.ts:60` 当前以单参数调用 `buildSelectedSkillList(selectedSkillNameList)`，但 `buildSelectedSkillList` 的签名是 `(remoteSkillList: SkillItem[], selectedSkillNameList: string[]): SkillItem[]`。本次任务不修这个调用方问题——它属于 install 命令自己的清理范围，不在四个 service 文件的收尾范围里。如果安装流程跑起来报类型错，需要单独跟进。