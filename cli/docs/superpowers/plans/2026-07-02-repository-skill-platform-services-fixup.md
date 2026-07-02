# Repository / Skill / Platform Services 收尾 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/features/repository/remote.ts`、`src/features/skill/remote.ts`、`src/features/platform/remote.ts` 三个半成品 service 文件按 install/list 命令的调用预期收尾到位，行为与重构前一致，仅调整标识符和模块路径。

**Architecture:** 逐个重写三个 service 文件 + 补 `src/features/platform/index.ts` 一行导出。每个 service 用 `initXxx` 一次性加载 + `getXxx` 暴露数据的模式，私有方法 `createLoadXxxPromise` + `loadXxxList` 做实际 IO。所有验证走 `bun run check` 和 `bun run build`。

**Tech Stack:** TypeScript, Bun, giget, gray-matter, ESLint, `tsc --noEmit`。本项目没有 `*.test.ts`（验证靠 `bun run check`）。

## Global Constraints

- 不动 `src/features/platform/local.ts`（已是正确的 `LocalPlatformService` 实现）
- 不动 `src/commands/install/command.ts`、`src/commands/list/command.ts`（调用方不变）
- 不动 `src/config/*`（已正确）
- 不动 `src/features/skill/{builder,copy,parser,prompt}.ts` 和 `src/features/platform/{prompt,resolver}.ts`
- 不引入新文件、新工具函数、新错误码
- 不加 `yeizi-` 前缀过滤、不加 warning 收集、不加 `REMOTE_REPOSITORY_EMPTY` 错误码
- 验证命令：`bun run check`（= `tsc --noEmit && eslint .`）、`bun run build`
- 每个任务单独一个 commit，commit message 使用 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

## File Structure

- `src/features/repository/remote.ts`
  - 替换为 `RepositoryContentService` 类（`initRepositoryContent` / `getRepositoryDirectoryPath` / `getRepositorySkillDirectoryPath` / `removeContent`）
- `src/features/skill/remote.ts`
  - 替换为 `SkillContentService` 类（`initSkillContent` / `validateSkillNameListExistInSkillList` / `getRemoteSkillList`）
- `src/features/platform/remote.ts`
  - 替换为 `PlatformContentService` 类（`initPlatformContent` / `getRemotePlatformList`）
- `src/features/platform/index.ts`
  - 补一行 `export { LocalPlatformService } from "./local"`

## 接口约定

下游需要消费以下 API（每个任务的实现者都要按这套签名写）：

```typescript
// @/features/repository
class RepositoryContentService {
  public static initRepositoryContent(): Promise<[void]>
  public static getRepositoryDirectoryPath(): Promise<string>
  public static getRepositorySkillDirectoryPath(): Promise<string>
  public static removeContent(): Promise<void>
}

// @/features/skill
class SkillContentService {
  public static initSkillContent(): Promise<[void]>
  public static validateSkillNameListExistInSkillList(skillNameList: SkillName[]): Promise<void>
  public static getRemoteSkillList(): Promise<SkillItem[]>
}

// @/features/platform
class PlatformContentService {
  public static initPlatformContent(): Promise<[void]>
  public static getRemotePlatformList(): Promise<PlatformItem[]>
}

class LocalPlatformService {  // 已存在，不动
  public static initLocalPlatform(): Promise<[void]>
  public static getLocalPlatformList(): Promise<PlatformItem[]>
}
```

---

### Task 1: 重写 `src/features/repository/remote.ts` 为 `RepositoryContentService`

**Files:**
- Modify: `src/features/repository/remote.ts`（完整重写）

**Interfaces:**
- Consumes: `remoteConfig` from `@/config`（`src/config/remote.ts` 的桶出口，含 `remoteOwner` / `remoteName` / `remoteBranch` / `remoteSkillDirectoryPath`）
- Produces: `RepositoryContentService` 类的四个公开方法

- [ ] **Step 1: 完整重写 `src/features/repository/remote.ts`**

整个文件替换为以下内容：

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

  public static async initRepositoryContent(): Promise<[void]> {
    if (RepositoryContentService.initRepositoryContentPromise === undefined) {
      RepositoryContentService.initRepositoryContentPromise = Promise.all([
        RepositoryContentService.createLoadRepositoryDirectoryPathPromise(),
      ])
    }

    return RepositoryContentService.initRepositoryContentPromise
  }

  private static async createLoadRepositoryDirectoryPathPromise(): Promise<void> {
    const repositoryDirectoryPath = await RepositoryContentService.loadRepositoryDirectoryPath()
    RepositoryContentService.repositoryDirectoryPath = repositoryDirectoryPath
  }

  private static async loadRepositoryDirectoryPath(): Promise<string> {
    const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

    const downloadResult = await downloadTemplate(RepositoryContentService.getRepositoryRequestPath(), {
      dir: tempDirectoryPath,
      forceClean: true,
    })

    return downloadResult.dir
  }

  private static getRepositoryRequestPath(): string {
    return `gh:${RepositoryContentService.remoteConfig.remoteOwner}/${RepositoryContentService.remoteConfig.remoteName}#${RepositoryContentService.remoteConfig.remoteBranch}`
  }

  public static async getRepositoryDirectoryPath(): Promise<string> {
    await RepositoryContentService.initRepositoryContent()

    return RepositoryContentService.repositoryDirectoryPath!
  }

  public static async getRepositorySkillDirectoryPath(): Promise<string> {
    const repositoryDirectoryPath = await RepositoryContentService.getRepositoryDirectoryPath()

    return join(repositoryDirectoryPath, RepositoryContentService.remoteConfig.remoteSkillDirectoryPath)
  }

  public static async removeContent(): Promise<void> {
    if (RepositoryContentService.repositoryDirectoryPath === undefined) {
      RepositoryContentService.initRepositoryContentPromise = undefined
      return
    }

    await rm(RepositoryContentService.repositoryDirectoryPath, { recursive: true })
    RepositoryContentService.repositoryDirectoryPath = undefined
    RepositoryContentService.initRepositoryContentPromise = undefined
  }
}

export { RepositoryContentService }
```

- [ ] **Step 2: 运行 `bun run check` 验证**

Run: `bun run check`
Expected: 退出码 0，无 TS 错误，无 lint 错误。

注：本步可能仍有 `src/features/skill/remote.ts` 和 `src/features/platform/remote.ts` 的旧引用导致的错误——那些是 Task 2 / Task 3 解决的问题。验证本任务时只检查本文件本身在 `tsc` 下的报错是否消失。可以用 `bunx tsc --noEmit 2>&1 | grep -E "features/repository/remote" | head` 确认无相关报错。

- [ ] **Step 3: 提交**

```bash
git add src/features/repository/remote.ts
git commit -m "refactor(repository): rewrite remote.ts as RepositoryContentService

把 github repository + run-with-skill-repository 合并为单个
RepositoryContentService，方法名匹配 install/list 调用方。
新增 getRepositorySkillDirectoryPath 给 skill service 用。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 重写 `src/features/skill/remote.ts` 为 `SkillContentService`

**Files:**
- Modify: `src/features/skill/remote.ts`（完整重写）

**Interfaces:**
- Consumes: `RepositoryContentService.getRepositorySkillDirectoryPath()` from Task 1
- Produces: `SkillContentService` 类的三个公开方法

- [ ] **Step 1: 完整重写 `src/features/skill/remote.ts`**

整个文件替换为以下内容：

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

  public static async initSkillContent(): Promise<[void]> {
    if (SkillContentService.initSkillContentPromise === undefined) {
      SkillContentService.initSkillContentPromise = Promise.all([
        SkillContentService.createLoadRemoteSkillListPromise(),
      ])
    }

    return SkillContentService.initSkillContentPromise
  }

  private static async createLoadRemoteSkillListPromise(): Promise<void> {
    const remoteSkillList = await SkillContentService.loadRemoteSkillList()
    SkillContentService.remoteSkillList = remoteSkillList
  }

  private static async loadRemoteSkillList(): Promise<SkillItem[]> {
    const remoteSkillDirectoryPath = await RepositoryContentService.getRepositorySkillDirectoryPath()
    const remoteSkillDirectoryEntryList = await readdir(remoteSkillDirectoryPath, { withFileTypes: true })

    const remoteSkillList: SkillItem[] = await Promise.all(
      remoteSkillDirectoryEntryList.map(async (remoteSkillDirectoryEntryItem) => {
        const skillEntryFilePath = join(remoteSkillDirectoryPath, remoteSkillDirectoryEntryItem.name, SKILL_ENTRY_FILE_NAME)
        const rawSkillEntryFileText = await readFile(skillEntryFilePath, "utf-8")
        const rawSkillEntryFileObject = skillEntryFileObjectSchema.parse(matter(rawSkillEntryFileText).data)
        return {
          skillName: rawSkillEntryFileObject.name,
          skillDescription: rawSkillEntryFileObject.description,
        }
      }),
    )

    remoteSkillList.sort((leftSkillItem, rightSkillItem) =>
      leftSkillItem.skillName.localeCompare(rightSkillItem.skillName),
    )

    return remoteSkillList
  }

  public static async validateSkillNameListExistInSkillList(skillNameList: SkillName[]): Promise<void> {
    await SkillContentService.initSkillContent()

    const notExistSkillNameList = skillNameList.filter(skillName =>
      !SkillContentService.remoteSkillList!.some(skillItem => skillItem.skillName === skillName),
    )

    if (notExistSkillNameList.length > 0) {
      throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
        params: { skillNameList: notExistSkillNameList },
      })
    }
  }

  public static async getRemoteSkillList(): Promise<SkillItem[]> {
    await SkillContentService.initSkillContent()

    return SkillContentService.remoteSkillList!
  }
}

export { SkillContentService }
```

- [ ] **Step 2: 运行 `bun run check` 验证**

Run: `bun run check`
Expected: 退出码 0，无 TS 错误，无 lint 错误。

注：可能仍有 `src/features/platform/remote.ts` 的旧导出（仍是 `LocalPlatformService`）导致 `src/commands/install/command.ts` 和 `src/commands/list/command.ts` 调用的 `PlatformContentService.initPlatformContent` 找不到——那是 Task 3 解决的问题。

- [ ] **Step 3: 提交**

```bash
git add src/features/skill/remote.ts
git commit -m "refactor(skill): rewrite remote.ts as SkillContentService

把旧 github/repository.ts 的 scanSkillEntryList 搬过来，
去掉 yeizi- 前缀过滤和 warning 收集（新仓库布局下 skill/ 子目录
只放技能，不再需要）。方法名匹配 install/list 调用方。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 重写 `src/features/platform/remote.ts` 为 `PlatformContentService`

**Files:**
- Modify: `src/features/platform/remote.ts`（完整重写）

**Interfaces:**
- Consumes: `platformConfig` from `@/config`（`src/config/platform.ts` 的桶出口，含 `platformList` 字段）
- Produces: `PlatformContentService` 类的两个公开方法

- [ ] **Step 1: 完整重写 `src/features/platform/remote.ts`**

整个文件替换为以下内容：

```typescript
import type { PlatformConfig, PlatformItem } from "@/types/platform"

import { platformConfig } from "@/config"

class PlatformContentService {
  private static platformConfig: PlatformConfig = platformConfig

  private static platformList: PlatformItem[] | undefined

  private static initPlatformContentPromise: Promise<[void]> | undefined

  public static async initPlatformContent(): Promise<[void]> {
    if (PlatformContentService.initPlatformContentPromise === undefined) {
      PlatformContentService.initPlatformContentPromise = Promise.all([
        PlatformContentService.createLoadPlatformListPromise(),
      ])
    }

    return PlatformContentService.initPlatformContentPromise
  }

  private static async createLoadPlatformListPromise(): Promise<void> {
    const platformList: PlatformItem[] = [...PlatformContentService.platformConfig.platformList]

    platformList.sort((leftPlatformItem, rightPlatformItem) =>
      leftPlatformItem.platformName.localeCompare(rightPlatformItem.platformName),
    )

    PlatformContentService.platformList = platformList
  }

  public static async getRemotePlatformList(): Promise<PlatformItem[]> {
    await PlatformContentService.initPlatformContent()

    return PlatformContentService.platformList!
  }
}

export { PlatformContentService }
```

要点：
- 静态字段 `platformList` 名字与 `LocalPlatformService` 的 `localPlatformList` 区分开——本类关注的是配置列表，不是本地检测结果
- `getRemotePlatformList()` 内部返回的是初始化时排好序的副本数组，外部修改不会影响内部状态
- 用 `[...platformConfig.platformList]` 而不是直接 `as PlatformItem[]` 转换——避免 `readonly` 字段类型不匹配

- [ ] **Step 2: 运行 `bun run check` 验证**

Run: `bun run check`
Expected: 退出码 0，无 TS 错误，无 lint 错误。

预期 install/list 命令现在能正常解析 `PlatformContentService` 的方法。如果还有错误，多半是 `src/features/platform/index.ts` 没导出 `LocalPlatformService`（Task 4 解决）或者其他旧引用。

- [ ] **Step 3: 提交**

```bash
git add src/features/platform/remote.ts
git commit -m "refactor(platform): rewrite remote.ts as PlatformContentService

替换掉 LocalPlatformService 的复制粘贴副本。
PlatformContentService.getRemotePlatformList() 返回 platformConfig
里全部条目（与旧逻辑一致），按 platformName 排序。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 在 `src/features/platform/index.ts` 补 `LocalPlatformService` 导出

**Files:**
- Modify: `src/features/platform/index.ts`（补一行导出）

- [ ] **Step 1: 修改 `src/features/platform/index.ts`**

把当前内容：

```typescript
export { PlatformContentService } from "./remote"
```

替换为：

```typescript
export { LocalPlatformService } from "./local"
export { PlatformContentService } from "./remote"
```

- [ ] **Step 2: 运行 `bun run check` 验证**

Run: `bun run check`
Expected: 退出码 0，无 TS 错误，无 lint 错误。

- [ ] **Step 3: 提交**

```bash
git add src/features/platform/index.ts
git commit -m "refactor(platform): export LocalPlatformService from index barrel

LocalPlatformService 之前没有从 @/features/platform 桶文件导出，
外部消费方需要直接 import './local'。补到桶里统一入口。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 完整构建验证

**Files:** 无

- [ ] **Step 1: 运行完整 `bun run check`**

Run: `bun run check`
Expected: 退出码 0，无 TS 错误，无 lint 错误。

- [ ] **Step 2: 运行 `bun run build`**

Run: `bun run build`
Expected: 退出码 0，`dist/` 生成成功。

- [ ] **Step 3: 验证 import 链路完整**

Run:
```bash
grep -rn "from \"@/config/repository\"" src/ 2>&1
grep -rn "RemoteSkillService\|RemoteRepositoryService" src/ 2>&1
```

Expected：两条 grep 都没有输出。如果有残留，按提示找到对应文件清理。

- [ ] **Step 4: 不单独提交**

本任务只做最终验证，不引入新改动。如果前 4 个任务都做对了，本任务应该全部通过。如果发现遗漏，回到对应任务修复后再跑一次。

---

## 已知不在范围内

- `src/commands/install/command.ts:60` 单参数调用 `buildSelectedSkillList(selectedSkillNameList)`：函数签名是 `(remoteSkillList, selectedSkillNameList)`，install 命令只传了第二个。这是 pre-existing 调用方问题，不在四个 service 文件的收尾范围。`bun run check` 可能因此报错——遇到时单独跟进 install 命令的清理。
- 不动 `LocalPlatformService` 的 `access` 检测逻辑
- 不重构 `RepositoryConfig` 类型定义
- 不引入新文件、新工具函数、新错误码
