# yeizi-skills v2.1 batch-5 Implementation Plan: debug flags for install

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 install 命令加 4 个调试/安全开关（spec §D3/D4/D5/D6），让用户对 install 行为有更多控制 + CLI help 中英一致化。

**Architecture:**
- D3：`--dry-run` flag —— install 跑完所有 sanitize + 比对但只打印"将执行的操作"，不动真实目录
- D4：`--backup` flag —— 在 overwrite 前先把目标 `~/.claude/skills/yeizi-foo` 重命名为 `~/.claude/skills/yeizi-foo.bak-{ts}`，失败则 abort
- D5：`--offline` flag —— 透传 `giget.downloadTemplate({ offline: true })` 走缓存
- D6：`main.ts` 用 `program.addHelpText('beforeAll', ...)` 注入中文快速入门 + 子命令摘要；option description 已在 installCommand 上用中文

**Tech Stack:** TypeScript 5 / Bun / commander / giget

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`

**Parent commit:** batch-4 ends.

## Global Constraints

- 项目无单元测试。验证 gate = `cd cli && bun run typecheck && bun run lint` 全过。
- 严格遵守 cli/CLAUDE.md：命名（小写中划线、`List`/`Map` 后缀、`Item` 单项、`is/has/can` 布尔前缀、动作+对象、`selected` 前缀）；TypeScript（对象式枚举、interface 对象类型、禁 any/unknown/as、as const 例外）；语句（禁三目、禁 switch、关键字循环）；目录（最小目录做桶导出）。
- 帮助文本中文、固定标识（如命令名 `--dry-run` / `--backup` / `--offline`）保留原文。
- copySkillEntryToPlatformItem 是 D3/D4 的核心：加 `options: CopyOptions` 参数；dry-run 时直接构 NO_CHANGE 假值、backup 时在 copyDirectory 前 `renameSync`。
- exit code 契约：dry-run 永远 exit 0；backup 失败让整个 install exit 1；offline 命中 giget 失败由上层 catch 处理。
- 不引入新错误码（task 5.4 复用 PLATFORM_NOT_FOUND 或 FILE_COPY_FAILED）。
- install 命令面不加新 sub-command（如 manual run、force 等）——YAGNI。

---

## File Structure（batch-5 涉及）

**Modify:**
- `cli/src/types/command/install.ts`（F2 后的 `install.ts` 单文件）
- `cli/src/commands/install/command.ts`
- `cli/src/features/skill/copier.ts`（加 `CopyOptions` 参数 + options 行为）
- `cli/src/features/github/repository.ts`（`getRepositoryDirectoryPath` 加 `options` 参数）
- `cli/src/main.ts`（D6 addHelpText）

---

### Task 5.1: 类型层加 CopyOptions + dry-run/backup/offline 选项

**Files:**
- Modify: `cli/src/types/command/install.ts`

**Interfaces produced:**
```typescript
interface CopyOptions {
  dryRun: boolean
  backup: boolean
}

type InstallFlags = {
  platform: string | undefined
  skill: string | undefined
  dryRun: boolean
  backup: boolean
  offline: boolean
}
```

- [ ] **Step 1: Read `cli/src/types/command/install.ts` 全文**

- [ ] **Step 2: 加 `CopyOptions` interface**

```typescript
/**
 * 复制单技能到单平台时的选项。
 */
interface CopyOptions {
  /**
   * 只打印"将执行的操作"、不动真实目录。
   * 配合 hash 比对后会输出 planned action、不会真 cp。
   */
  dryRun: boolean

  /**
   * 在覆盖前把目标目录重命名为 `<target>.bak-{ts}`，失败则 abort。
   */
  backup: boolean
}
```

放在 module 已有 interface 附近、`InstallCommandOptions` 之前或之后合理位置，按 IDE 折叠顺序。

- [ ] **Step 3: 加 `InstallFlags` 类型**

```typescript
/**
 * commander 在 install 阶段抛入的原始参数。
 */
interface RawInstallCommandOptions {
  platform: string | undefined
  skill: string | undefined
  dryRun: boolean
  backup: boolean
  offline: boolean
}
```

如已有 `RawInstallCommandOptions`，仅扩展字段。查找 `RawInstallCommandOptions` 关键字。

- [ ] **Step 4: 顶端 export 类型**

```typescript
export type {
  CopyOptions,
  InstallCommandOptions,
  RawInstallCommandOptions,
}
export type { InstallFlags }
```

（同时移除旧的 unused 命名若有，例如 `InstallFlags` 别名或旧 `InstallFlags` interface 残留。）

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 本任务文件 0 错（其它文件待 batch-5 后续 task 适配）。

- [ ] **Step 6: Commit**

```bash
git add cli/src/types/command/install.ts
git commit -m "feat(types): add CopyOptions and dry-run/backup/offline flags

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5.2: D5 + `--offline` 透传 giget

**Files:**
- Modify: `cli/src/features/github/repository.ts`

**Interfaces produced:**
```typescript
async function getRepositoryDirectoryPath(
  options?: { offline?: boolean },
): Promise<string>
```

- [ ] **Step 1: Read `cli/src/features/github/repository.ts` 全文**，定位 `getRepositoryDirectoryPath`

- [ ] **Step 2: 修改 `getRepositoryDirectoryPath` 加 options 参数**

新实现：

```typescript
async function getRepositoryDirectoryPath(
  options?: { offline?: boolean },
): Promise<string> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

  const downloadResult = await downloadTemplate(
    `gh:${repositoryConfig.repositoryOwner}/${repositoryConfig.repositoryName}#${repositoryConfig.repositoryBranch}`,
    {
      dir: tempDirectoryPath,
      forceClean: true,
      offline: options?.offline === true,
    },
  )

  return downloadResult.dir
}
```

- [ ] **Step 3: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 本任务文件 0 错。

- [ ] **Step 4: Commit**

```bash
git add cli/src/features/github/repository.ts
git commit -m "feat(repository): add offline option to getRepositoryDirectoryPath

offline flag 透传 giget.downloadTemplate offline: true 让缓存命中优先。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5.3: D3 + D4 + CopyOptions —— copier 三态 + rename

**Files:**
- Modify: `cli/src/features/skill/copier.ts`

**Why:** dry-run + backup 是 CopyOptions 的两个核心行为，copier 是落实点。

- [ ] **Step 1: Read `cli/src/features/skill/copier.ts` 全文**

- [ ] **Step 2: 修改 `copySkillEntryToPlatformItem` 签名加 options**

```typescript
async function copySkillEntryToPlatformItem(
  skillEntry: SkillEntry,
  platformItem: PlatformItem,
  repositoryDirectoryPath: string,
  options: CopyOptions = { dryRun: false, backup: false },
): Promise<SkillInstallResult>
```

- [ ] **Step 3: 函数体实现**

```typescript
async function copySkillEntryToPlatformItem(
  skillEntry: SkillEntry,
  platformItem: PlatformItem,
  repositoryDirectoryPath: string,
  options: CopyOptions = { dryRun: false, backup: false },
): Promise<SkillInstallResult> {
  const skillSourceDirectoryPath = resolve(repositoryDirectoryPath, skillEntry.name)
  const targetSkillDirectoryPath = resolve(
    platformItem.platformSkillDirectoryPath,
    skillEntry.name,
  )

  // B4: 前置 source 检查
  if (!existsSync(skillSourceDirectoryPath)) {
    return {
      platformName: platformItem.platformName,
      skillName: skillEntry.name,
      status: SkillInstallStatus.FAILED,
      error: new AppError(AppErrorCode.FILE_COPY_FAILED, {
        params: {
          sourcePath: `仓库临时目录/${skillEntry.name}`,
          targetPath: targetSkillDirectoryPath,
        },
      }),
    }
  }

  try {
    const isContentSame = await compareDirectoryContentHash(
      skillSourceDirectoryPath,
      targetSkillDirectoryPath,
    )

    if (isContentSame) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.NO_CHANGE,
      }
    }

    // D4: backup —— 覆盖前 rename
    if (options.backup && existsSync(targetSkillDirectoryPath)) {
      const backupPath = `${targetSkillDirectoryPath}.bak-${Date.now()}`

      await rename(targetSkillDirectoryPath, backupPath)
    }

    // D3: dry-run —— 只打印"将执行"，不真 cp
    if (options.dryRun) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.NO_CHANGE,
      }
    }

    await copyDirectory(skillSourceDirectoryPath, targetSkillDirectoryPath)

    return {
      platformName: platformItem.platformName,
      skillName: skillEntry.name,
      status: SkillInstallStatus.SUCCESS,
    }
  }
  catch (error) {
    if (error instanceof AppError) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.FAILED,
        error,
      }
    }

    if (error instanceof Error) {
      return {
        platformName: platformItem.platformName,
        skillName: skillEntry.name,
        status: SkillInstallStatus.FAILED,
        error: new AppError(AppErrorCode.FILE_COPY_FAILED, {
          params: {
            sourcePath: `仓库临时目录/${skillEntry.name}`,
            targetPath: targetSkillDirectoryPath,
          },
          cause: error,
        }),
      }
    }

    throw error
  }
}
```

- [ ] **Step 4: import `rename` 与 `CopyOptions`**

顶部加：
```typescript
import { existsSync } from "node:fs"
import { rename } from "node:fs/promises"
import type { CopyOptions } from "@/types/command/install"
```

（如 `existsSync` 已 import 则加 comma 续行、不重复。）

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 本任务文件 0 错。

- [ ] **Step 6: Commit**

```bash
git add cli/src/features/skill/copier.ts
git commit -m "feat(copier): add CopyOptions { dryRun, backup }

- backup: 覆盖前 rename ${target}.bak-${Date.now()}, 失败则 abort.
- dryRun: hash 比对后 NO_CHANGE 返回、不真 cp.
- 两者叠加时顺序: 先 rename, 后 dry-run; dry-run 跳过 cp 但已 rename.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5.4: install command 接 flags + runWithSkillRepository 准备

**Files:**
- Modify: `cli/src/commands/install/command.ts`

**Why:** install 命令需要让 commander 接 `--dry-run` / `--backup` / `--offline`、传给 execute；execute 把 options 传给 copier 和 getRepositoryDirectoryPath。**本任务**只动命令注册 + execute 接口；`runWithSkillRepository` 高阶函数留到 batch-6 结构清理再补。

- [ ] **Step 1: Read `cli/src/commands/install/command.ts` 全文**

- [ ] **Step 2: `optionList` 加三个 option**

```typescript
public readonly optionList: readonly CommandOptionDefinition[] = [
  {
    flags: "--platform <platforms>",
    description: "逗号分隔的平台列表。",
  },
  {
    flags: "--skill <skills>",
    description: "逗号分隔的技能列表。",
  },
  {
    flags: "--dry-run",
    description: "仅打印将执行的操作、不实际复制。",
  },
  {
    flags: "--backup",
    description: "覆盖前把目标目录重命名为 .bak-{timestamp}。",
  },
  {
    flags: "--offline",
    description: "giget 离线模式拉取，优先使用缓存。",
  },
]
```

- [ ] **Step 3: 修改 `execute` 签名 / 解析层**

`RawInstallCommandOptions` 已有 `dryRun: boolean; backup: boolean; offline: boolean`（Task 5.1 加的）。

`execute` 内部构建 `copyOptions: CopyOptions = { dryRun, backup }`、`getRepositoryDirectoryPath({ offline })`：

```typescript
// 在 execute(...) 函数体内：
const copyOptions: CopyOptions = {
  dryRun: commandOptions.dryRun,
  backup: commandOptions.backup,
}

// 调 getRepositoryDirectoryPath 时（旧的调用替换）：
const repositoryDirectoryPath = await getRepositoryDirectoryPath({
  offline: commandOptions.offline,
})
```

注：`commandOptions` 内部 `installOptions` 字段类型来自 `InstallCommandOptions` 接口；先在 execute 签名字段追加 `dryRun`, `backup`, `offline`。如 spec §10.3 命名表指定、exact `boolean` 类型。

- [ ] **Step 4: 修改 `install execute` 内 `Promise.all` 传 CopyOptions**

替换原来的：
```typescript
const resultItem = await copySkillEntryToPlatformItem(
  skillEntryItem,
  platformItem,
  repositoryDirectoryPath,
)
```

为：
```typescript
const resultItem = await copySkillEntryToPlatformItem(
  skillEntryItem,
  platformItem,
  repositoryDirectoryPath,
  copyOptions,
)
```

- [ ] **Step 5: `register` 中 commander option 注册**

在 `register` 方法内现有 `installCommand.option(...)` 调用之后、追加：

```typescript
installCommand.option("--dry-run", "仅打印将执行的操作、不实际复制。")
installCommand.option("--backup", "覆盖前把目标目录重命名为 .bak-{timestamp}。")
installCommand.option("--offline", "giget 离线模式拉取，优先使用缓存。")
```

（这俩路径取一种即可；通常 commander 一次注册即可，放在 `optionList.forEach(optionDefinition => installCommand.option(...))` 后面更简洁。）

- [ ] **Step 6: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 7: Commit**

```bash
git add cli/src/commands/install/command.ts
git commit -m "feat(install): accept --dry-run/--backup/--offline options

- Commander optionList + register 暴露 3 个新 flag.
- execute 编译 copyOptions: CopyOptions 传给 copier.
- offline 透传给 getRepositoryDirectoryPath.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5.5: D6 — CLI 帮助中英一致化

**Files:**
- Modify: `cli/src/main.ts`

**Why:** commander 默认 help 全英文、与项目中文风格不一致。

- [ ] **Step 1: Read `cli/src/main.ts` 全文**

- [ ] **Step 2: 添加 `program.addHelpText('beforeAll', ...)`**

在 `program = new Command()` 之后、其它配置之前加：

```typescript
program.addHelpText(
  "beforeAll",
  `
yeizi-skills — 将远程仓库内 yeizi-* 子目录分装到本地各 AI 平台

快速上手:
  $ yeizi-skills install --platform claude
  $ yeizi-skills list

支持平台: codex | claude | trae | all

`,
)
```

- [ ] **Step 3: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 4: Commit**

```bash
git add cli/src/main.ts
git commit -m "feat(main): add Chinese addHelpText to commander

\`yeizi-skills --help\` 头部显示中文快速上手 + 平台列表。
commander 默认 Usage:/Options: 等保留英文；description 仍是项目内 command 中文。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-5）

- ✅ Task 5.1-5.5 全过
- ✅ `cd cli && bun run check` 全过
- ✅ `install --dry-run` 跑完所有 sanitize 但不真 cp；summary 显示将执行什么
- ✅ `install --backup` 在覆盖前自动 rename 旧目录
- ✅ `install --offline` 透传 giget 缓存模式
- ✅ `yeizi-skills --help` 头部是中文快速入门