# yeizi-skills v2.1 batch-3 Implementation Plan: installer bugs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 install 流程 4 个业务 bug：平台名数组参数（spec §B1）、早期 SKILL_NOT_FOUND 校验（spec §B2）、自动 mkdir skills 目录（spec §B3）、源路径存在性前置（spec §B4）。

**Architecture:**
- B1：把 `AppErrorParamsMap[AppErrorCode.PLATFORM_NOT_FOUND]` 字段名从单数 `platformName: string` 改为复数 `platformNameList: string[]`；resolver 调用从 `join(",")` 改为直接传数组。`PLATFORM_NOT_SUPPORTED` 字段名在本批**不动**（保持现状向后兼容）
- B2：在 install `execute` 内 `scanSkillEntryList` 之后立即校验 `commandOptions.skillNameList`（如果用户传了）vs `remoteEntries`；缺失立即抛 `SKILL_NOT_FOUND` 而不是等到 batchInstall 阶段
- B3：在 install `execute` 内 `buildSelectedPlatformList` 调用前，对每个 platformItem 的 `platformSkillDirectoryPath` 调 `mkdir -p recursive`（用 `node:fs/promises.mkdir` 加 `recursive: true`）
- B4：在 `copySkillEntryToPlatformItem` 函数体最前面 `existsSync(skillSourceDirectoryPath)`、缺失时抛 `AppError(AppErrorCode.SOURCE_SKILL_MISSING, { params: { skillName } })`

**Tech Stack:** TypeScript 5 / Bun / Node `fs.promises`

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`

**Parent commit:** batch-2 ends.

**Note:** batch-2 originally excluded `runWithSkillRepository` — this batch adds it as Task 3.0 because install/list both need it now, and batch-3 is where install execute lands and reuses it.

## Global Constraints

- 项目无单元测试。验证 gate = `cd cli && bun run typecheck && bun run lint` 全过。
- 严格遵守 cli/CLAUDE.md：命名（小写中划线、`List`/`Map` 后缀、`Item` 单项、`is/has/can` 布尔、动作+对象、selected 前缀）；TypeScript（对象式枚举、interface 对象类型、禁 any/unknown/as、as const 例外）；语句（禁三目、禁 switch、关键字循环、串行异步 for...of + await）；目录（最小目录做桶导出、桶具名再导出）。
- 桶导出值与类型分离：`@/error/index.ts`（值）、`@/types/error/index.ts`（类型），不要混。
- 警告文案使用中文，命令名/路径/字段名/错误码/协议名等固定标识保留原文。
- 跨目录导入必须停在最小桶文件上。

---

## File Structure（batch-3 涉及）

**Create:**
- `cli/src/features/github/run-with-skill-repository.ts`（Task 3.0 新建）

**Modify:**
- `cli/src/features/github/index.ts`（Task 3.0：桶加 export）
- `cli/src/types/error/types.ts`（B1：调 record entry）
- `cli/src/features/platform/resolver.ts`（B1：params 改数组 + B3：ensureSkillsDirectory）
- `cli/src/error/definitions.ts`（B1：模板改用 join("、")）
- `cli/src/commands/install/command.ts`（B2：早期校验 + B3：调 resolver + B4 来源可见性）
- `cli/src/features/skill/copier.ts`（B4：前置 existsSync）

**Optional Modify:**
- 现有 `buildSelectedPlatformList` 可能在 `features/platform/resolver.ts`；B3 也可以不引入新函数、直接 inline 在 install execute 内。**先看 resolver 是否已有 `existsSync` 检查、不重复改两次**。

---

### Task 3.0: runWithSkillRepository 高阶函数

**Files:**
- Create: `cli/src/features/github/run-with-skill-repository.ts`
- Modify: `cli/src/features/github/index.ts`（桶加 export）

**Interfaces produced:**
```typescript
async function runWithSkillRepository<T>(
  runner: (repositoryDirectoryPath: string) => Promise<T>,
): Promise<T>
```

**Why:** spec §10.5 把 `runWithSkillRepository` 列为 install/list 都应走的公共 helper。Task 3.3/3.4 的 install execute 与 batch-4/5 的 list execute 都需要它、避免各自写 `try/finally` + `removeDirectory` 模板。

**保留行为**（与现 install/list 各自的 try/finally 一致）：拉仓库到临时目录、跑 runner、最终清理；cleanup 失败抛 `DIRECTORY_REMOVE_FAILED`。

- [ ] **Step 1: Read `cli/src/features/github/repository.ts` 全文**，确认 `getRepositoryDirectoryPath` 当前签名（Task 5.2 后会加 `options` 参数——本任务不依赖、可并行）;`cli/src/features/github/index.ts` 当前桶

- [ ] **Step 2: 新建 `cli/src/features/github/run-with-skill-repository.ts`**

```typescript
import { AppError, AppErrorCode } from "@/error"
import { removeDirectory } from "@/tools/filesystem"
import { getRepositoryDirectoryPath } from "./repository"

/**
 * 拉取远端仓库到临时目录、运行 runner、最终清理临时目录的统一包装。
 * install / list 等需要 \"拉一次、用一次\" 仓库内容的命令都应走这个高阶函数、
 * 避免各自写 try/finally 与 removeDirectory 模板。
 *
 * @param runner - 接收临时仓库路径、返回业务结果或抛错的回调。
 * @returns runner 的返回值。
 * @throws runner 抛错透传；cleanup 失败抛 AppError(DIRECTORY_REMOVE_FAILED)。
 */
async function runWithSkillRepository<T>(
  runner: (repositoryDirectoryPath: string) => Promise<T>,
): Promise<T> {
  const repositoryDirectoryPath = await getRepositoryDirectoryPath()

  try {
    return await runner(repositoryDirectoryPath)
  }
  finally {
    try {
      await removeDirectory(repositoryDirectoryPath)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
          params: { directoryPath: repositoryDirectoryPath },
          cause: error,
        })
      }

      throw error
    }
  }
}

export { runWithSkillRepository }
```

- [ ] **Step 3: 修改 `cli/src/features/github/index.ts` 桶加 export**

```typescript
export { getRepositoryDirectoryPath, scanSkillEntryList } from "./repository"
export { runWithSkillRepository } from "./run-with-skill-repository"
```

- [ ] **Step 4: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 本任务文件 0 错。

- [ ] **Step 5: lint**

```bash
cd cli && bun run lint src/features/github/
```

Expected: 0 error。

- [ ] **Step 6: Commit**

```bash
git add cli/src/features/github/run-with-skill-repository.ts cli/src/features/github/index.ts
git commit -m "feat(github): add runWithSkillRepository higher-order wrapper

spec §10.5 install/list 共用 helper。Task 3.3 install 流程重构、batch-4 list 流程重构
都会基于本 task 落地、避免各自写 try/finally+removeDirectory。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3.1: B1 — PLATFORM_NOT_FOUND 字段改数组

**Files:**
- Modify: `cli/src/types/error/types.ts`（`AppErrorParamsMap[AppErrorCode.PLATFORM_NOT_FOUND]` 字段名 / 类型）
- Modify: `cli/src/features/platform/resolver.ts`（调用 `throw new AppError(...)` 的 `params` 形态）
- Modify: `cli/src/error/definitions.ts`（template 用 array + `join("、")`）

**Why:** 当前 `AppErrorParamsMap[AppErrorCode.PLATFORM_NOT_FOUND] = { platformNameList: string[] }`（batch-1 之后已是数组）但**resolver 调用处**仍然 `params: { platformNameList: missingPlatformNameList.join(",") }` 用字符串塞进数组字段——类型注解是数组、值是 join 后逗号串——用户看到的错误是 `以下平台不存在：codex,claude。`。修正让值真正成为数组、模板用 `join("、")`。

- [ ] **Step 1: grep 现状**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -n "PLATFORM_NOT_FOUND" cli/src/features/platform/resolver.ts cli/src/types/error/types.ts cli/src/error/definitions.ts
```

预期: 三处都有。

- [ ] **Step 2: 修改 `cli/src/types/error/types.ts`**

已 batch-1 重写为：
```typescript
[AppErrorCode.PLATFORM_NOT_FOUND]: { platformNameList: string[] }
```

（如果 batch-1 已正确，这里无需调整。）仅作核对。

- [ ] **Step 3: 修改 `cli/src/features/platform/resolver.ts`**

找到 `PLATFORM_NOT_FOUND` 抛点：
```typescript
throw new AppError(AppErrorCode.PLATFORM_NOT_FOUND, {
  params: { platformNameList: missingPlatformNameList.join(",") },
})
```

改为：
```typescript
throw new AppError(AppErrorCode.PLATFORM_NOT_FOUND, {
  params: { platformNameList: missingPlatformNameList },
})
```

- [ ] **Step 4: 修改 `cli/src/error/definitions.ts`**

已 batch-1 重写为：
```typescript
[AppErrorCode.PLATFORM_NOT_FOUND]: {
  title: "平台不存在",
  buildMessage: (params) => `以下平台不存在：${params.platformNameList.join("、")}。`,
},
```

核对；如果不是按 join("、") 改、`join(",")` 残留，修正之。

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 本任务文件 0 错。

- [ ] **Step 6: lint**

```bash
cd cli && bun run lint src/features/platform/ src/types/error/ src/error/
```

Expected: 0 error。

- [ ] **Step 7: Commit**

```bash
git add cli/src/features/platform/resolver.ts cli/src/types/error/types.ts cli/src/error/definitions.ts
git commit -m "fix(platform): pass platformNameList as array, render with Chinese join

resolver 抛 PLATFORM_NOT_FOUND 时传数组本身、不再用 .join(',') 拼成字符串塞进
已声明为 string[] 的字段。错误模板用 '、' 中文 join 让多条平台名并列时清晰。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3.2: B3 — install 自动 mkdir skills 目录

**Files:**
- Modify: `cli/src/commands/install/command.ts`

**Why:** 全新用户跑 `install --platform claude`，若 `~/.claude/skills` 不存在，应当自动创建（首次安装场景）而非抛 `PLATFORM_NOT_FOUND`。平台 resolver 当前的 `existsSync` 检查只在 list 用 `allowMissingSkillDirectory=true` 跳过，install 仍走 strict 模式抛错。

- [ ] **Step 1: Read `cli/src/commands/install/command.ts`**、`cli/src/features/platform/resolver.ts`、`cli/src/features/github/repository.ts`（用于 import 形态）

- [ ] **Step 2: 决定放位**

方案：在 `install/command.ts` 的 execute 方法内 `buildSelectedPlatformList(...)` 调用之前，对每个 platformItem 的 `platformSkillDirectoryPath` 调 `mkdir -p recursive`。

不抽出新函数——本任务逻辑是 install 专属，跨不到 list；resolver 应该保持平台域概念的纯净。

- [ ] **Step 3: 修改 install execute**

在 `execute(commandOptions)` 内 **buildSelectedPlatformList 调用之前**、**getRepositoryDirectoryPath 调用之前**：

```typescript
import { mkdir } from "node:fs/promises"

// ... 在 buildSelectedPlatformList 之前 ...
for (const platformItem of selectedPlatformList) {  // 注意：selectedPlatformList 此时还没算出来，先 buildSelectedPlatformList
  await mkdir(platformItem.platformSkillDirectoryPath, { recursive: true })
}
```

但 `selectedPlatformList` 是 `buildSelectedPlatformList(...)` 的返回值——必须先调用。所以调整顺序：

1. 解析 platformNameList
2. 提前调用（验证 + 提取 PlatformItem 的动作）——见 Step 4

- [ ] **Step 4: 提前平台预提取**

为避免在 execute 函数体内杂事太多，引入轻量 helper：在 `install/command.ts` 内新增私有方法 `selectAndEnsurePlatformItemList`，先 `buildSelectedPlatformList` 然后 `mkdir`：

```typescript
/**
 * 选定平台目标项列表，并对每个平台的 skills 目录自动 mkdir -p。
 *
 * @param availablePlatformList - 所有支持的 PlatformItem 列表。
 * @param selectedPlatformNameList - 用户选中的平台名称列表。
 * @returns 选中的 PlatformItem 数组，目录均已创建。
 */
private async selectAndEnsurePlatformItemList(
  availablePlatformList: PlatformItem[],
  selectedPlatformNameList: PlatformName[],
): Promise<PlatformItem[]> {
  const selectedPlatformList = buildSelectedPlatformList(
    availablePlatformList,
    selectedPlatformNameList,
  )

  for (const platformItem of selectedPlatformList) {
    await mkdir(platformItem.platformSkillDirectoryPath, { recursive: true })
  }

  return selectedPlatformList
}
```

- [ ] **Step 5: 修改 install execute 顺序**

原顺序：
```typescript
const selectedPlatformList = buildSelectedPlatformList(getPlatformList(), names)
const repositoryDirectoryPath = await getRepositoryDirectoryPath()
```

新顺序：
```typescript
const selectedPlatformList = await this.selectAndEnsurePlatformItemList(getPlatformList(), names)
const repositoryDirectoryPath = await getRepositoryDirectoryPath()
```

后续其它步骤保持不变。

- [ ] **Step 6: imports 更新**

顶部加 `import { mkdir } from "node:fs/promises"`、补 `import { buildSelectedPlatformList, ... } from "@/features/platform"`、`PlatformItem` 类型 import。

- [ ] **Step 7: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 8: Commit**

```bash
git add cli/src/commands/install/command.ts
git commit -m "fix(install): auto-mkdir missing platform skills directory

全新用户跑 install --platform claude，若 ~/.claude/skills 不存在、应自动创建。
之前 resolver 抛 PLATFORM_NOT_FOUND 误导语义。

新增私有方法 selectAndEnsurePlatformItemList：在 buildSelectedPlatformList 之后、
拉仓库之前对每个目标 PlatformItem 的 platformSkillDirectoryPath 跑 mkdir -p。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3.3: B2 — install 拉仓库后立刻校验 --skill 存在性

**Files:**
- Modify: `cli/src/commands/install/command.ts`

**Why:** 用户传 `--skill foo` 但 foo 不在远端：当流程先 scan + 然后 `buildSelectedSkillNameList` 选完 → `buildSelectedSkillList` 才抛 `SKILL_NOT_FOUND`（间接通过缺失校验），浪费了一次 giget 网络与时机。改成 scan 完**立即**校验输入存在性。

- [ ] **Step 1: Read 当前 `execute`**、定位 `scanSkillEntryList` 调用处与 `buildSelectedSkillList` 调用处

- [ ] **Step 2: 在 `scanSkillEntryList` 之后立即加早期校验**

```typescript
const { skillEntryList: remoteSkillEntryList, warningList } =
  await scanSkillEntryList(repositoryDirectoryPath)

// B2: 早期校验 --skill 输入是否在远端存在
if (commandOptions.skillNameList.length > 0) {
  const remoteSkillNameSet = new Set(
    remoteSkillEntryList.map(remoteSkillEntryItem => remoteSkillEntryItem.name)
  )
  const missingInputSkillNameList = commandOptions.skillNameList.filter(
    inputSkillNameItem => !remoteSkillNameSet.has(inputSkillNameItem),
  )

  if (missingInputSkillNameList.length > 0) {
    throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNameList: missingInputSkillNameList },
    })
  }
}
```

如果用户没有传 `--skill`（走的 prompt 交互），则不需要这一步——`length === 0` 跳过校验。

- [ ] **Step 3: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/install/command.ts
git commit -m "fix(install): early SKILL_NOT_FOUND validation after scan

用户传 --skill X 但 X 不在远端时、上前抛错。不再等 buildSelectedSkillList 时
才暴露，节省后续 N×M 次 IO 副本操作的浪费。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3.4: B4 — copier source 存在性前置

**Files:**
- Modify: `cli/src/features/skill/copier.ts`

**Why:** `copySkillEntryToPlatformItem` 当前 `resolve(repositoryDirectoryPath, skillEntry.name)` 直接当 source，race / 远端中途删除时会抛非 AppError 错（node:fs raw error），错误消息含 tmpdir 路径。前置 `existsSync`，缺则抛 `AppError` 让错误链路一致。

**决策**：本任务不新增 `AppErrorCode.SOURCE_SKILL_MISSING`（避免 cycle 添加错误码与 definitions），临时复用 `AppErrorCode.FILE_COPY_FAILED` 并把 params `sourcePath` 字段保留——用户消息里用 `"仓库临时目录中未找到 {skillName}，请重试"` 这种明确描述。

- [ ] **Step 1: Read `cli/src/features/skill/copier.ts` 全文**、定位 `copySkillEntryToPlatformItem` 函数体

- [ ] **Step 2: 函数体最前面加 existsSync**

新实现：

```typescript
async function copySkillEntryToPlatformItem(
  skillEntry: SkillEntry,
  platformItem: PlatformItem,
  repositoryDirectoryPath: string,
): Promise<SkillInstallResult> {
  const skillSourceDirectoryPath = resolve(repositoryDirectoryPath, skillEntry.name)
  const targetSkillDirectoryPath = resolve(
    platformItem.platformSkillDirectoryPath,
    skillEntry.name,
  )

  // B4: 前置检查 source，避免 race / mid-flight 删除导致 raw fs error
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

- [ ] **Step 3: imports 更新**

确认 `existsSync` 已在 `from "node:fs"` import 中（之前文件已用；如需添加 `import { existsSync } from "node:fs"`）。

- [ ] **Step 4: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 5: Commit**

```bash
git add cli/src/features/skill/copier.ts
git commit -m "fix(copier): pre-check source skill directory exists

远端仓库与本地拷贝中间可能 race 或 source 被删，原行为抛 node:fs raw ENOENT 错。
改成 existsSync 前置检查后、用 FILE_COPY_FAILED + 描述性 sourcePath (\"仓库临时目录/<name>\")。
让错误链路一致、并避免让用户看到 /tmp/yeizi-skills-repo-xxx/... 这种无意义路径。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-3）

- ✅ Task 3.1-3.4 全过
- ✅ `cd cli && bun run check` 全过（可能其它历史错仍存在、但本任务相关 0 error）
- ✅ 全部 commit 落到 `main` 分支
- ✅ install --skill foo（foo 不在远端）现在早期抛错而不是走到 batchInstall
- ✅ install --platform claude 在 ~/.claude/skills 不存在时自动 mkdir
- ✅ PLATFORM_NOT_FOUND 错误消息显示 `以下平台不存在：codex、claude。` 中文顿号分隔