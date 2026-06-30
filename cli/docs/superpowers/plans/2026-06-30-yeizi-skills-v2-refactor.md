# yeizi-skills v2 重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 CLI 从"伪 npm 式带版本号包管理器"重构为"git 仓库即数据源、覆盖即升级、双命令（install + list）"的轻量分发器；删除 update 命令；对齐 Claude Code 官方 frontmatter（`name` + `description`）。

**Architecture:** 单一数据源 = 远端 GitHub 仓库本身。所有命令先用 giget 拉仓库到临时目录、扫 `yeizi-*` 子目录得到 SkillEntry 列表、按需复制到本地各平台 skills 目录。无 manifest.json、无版本号、无 GitHub API 调用。

**Tech Stack:** TypeScript 5 / Bun / commander / zod / inquirer / giget / gray-matter / boxen / chalk

## Global Constraints

- 项目无单元测试基础设施。每个任务的验证 gate = `bun run typecheck`（必过）+ `bun run lint`（必过；只关注本次新增/修改文件的 lint 错为 0）。最终任务加一次手工烟测。
- 严格遵循 `cli/CLAUDE.md` 全部规则：命名（小写中划线文件名、`List`/`Map`/`Set`/`Item` 后缀、`selected` 前缀、`is`/`has`/`can` 布尔前缀、动作+对象函数名）、TypeScript（`const` 对象式枚举、`interface` 对象类型、禁 `any`/`unknown`/`as`、`as const` 例外）、语句（禁三目、禁 switch、禁关键字循环、串行异步用 for-of + await）、注释（TSDoc）、目录（`types/` 镜像、`schemas/` 镜像、`features/` 业务、`tools/` 通用、桶导出仅最小目录、禁 `export *`）、错误（统一 AppError + AppErrorCode）。
- 平台名集合：`codex` / `claude` / `trae` / `all`，目录段位置在 `cli/src/config/platform.ts`
- 远端仓库坐标：`gh:chungeplus/yeizi-skills#main`
- 临时目录前缀：`yeizi-skills-repo-`（位于 `os.tmpdir()`）
- 工作分支：当前已经在 `brainstorm/manifest-removal-refactor`，所有任务在此分支提交
- 提交格式：每个任务一次 git commit，message 以 `feat:` / `refactor:` / `chore:` / `docs:` 开头，末尾附 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 行

---

## 文件结构总览（重构后）

### 删除（含整目录）

```
cli/src/service/                                      # 整个删除
cli/src/commands/update/                              # 整个删除
cli/src/types/command/update/                         # 整个删除
cli/src/features/github/load-manifest-config.ts
cli/src/features/skill/manifest-config.ts
cli/src/features/skill/document-parser.ts
cli/src/schemas/skill/manifest-config.ts
cli/src/types/skill/manifest-config.ts
manifest.json                                         # 仓库根
```

### 新增

无新建模块文件。所有新功能加入既有文件。

### 修改

```
cli/src/types/skill/frontmatter.ts        # 字段重命名 skillName→name + 加 description + 删 skillVersion
cli/src/types/skill/index.ts              # 桶导出更新
cli/src/types/skill/comparison.ts         # SkillComparisonRow 重写 + 引入 SkillEntry
cli/src/types/skill/install-result.ts     # 加 NO_CHANGE 状态适配
cli/src/schemas/skill/frontmatter.ts      # 重写 zod schema：name+description+passthrough
cli/src/constants/skill/comparison-status.ts  # 重写为 4 态
cli/src/constants/skill/install-status.ts     # 加 NO_CHANGE
cli/src/features/github/repository.ts     # 去 preferOffline；加 scanSkillEntryList
cli/src/features/github/index.ts          # 桶导出更新
cli/src/tools/filesystem/index.ts         # 桶导出加 compareDirectoryContentHash
cli/src/tools/filesystem/directory.ts     # 加 compareDirectoryContentHash 函数
cli/src/features/skill/comparison-builder.ts  # 重写 buildComparisonRows，删 update 相关
cli/src/features/skill/selected-builder.ts    # 入参类型对齐 SkillEntry
cli/src/features/skill/copier.ts          # 加 hash 比对，复制前判断
cli/src/features/skill/prompt.ts          # choice 带 description；删 promptSkillNameListToUpdate
cli/src/features/skill/index.ts           # 桶导出更新
cli/src/commands/install/command.ts       # 整段重写为 scan → prompt → copy（含 hash 比对）
cli/src/commands/list/command.ts          # 整段重写为 scan → render 4 态表
cli/src/main.ts                           # 移除 UpdateCommand 注册
cli/src/error/code.ts                     # 删 REMOTE_SKILL_CATALOG_INVALID；加 REMOTE_REPOSITORY_EMPTY
cli/src/error/definitions.ts              # 同步增删 buildMessage
cli/src/types/error/types.ts              # AppErrorParamsMap 同步
cli/package.json                          # 移除 axios + semver + @types/semver 依赖
yeizi-auto-self-review/SKILL.md           # 删 version 行（仓库根）
yeizi-command-bug-workflow/SKILL.md       # 删 version 行（仓库根）
yeizi-command-pair-program/SKILL.md       # 删 version 行（仓库根）
```

---

## 任务列表

15 个任务依次实施。后任务依赖前任务的类型/接口产出。

### Task 1: 类型层重写（SkillEntry + 状态枚举）

**Files:**
- Modify: cli/src/types/skill/frontmatter.ts
- Modify: cli/src/types/skill/comparison.ts
- Modify: cli/src/types/skill/install-result.ts
- Modify: cli/src/types/skill/index.ts
- Delete: cli/src/types/skill/manifest-config.ts
- Modify: cli/src/constants/skill/comparison-status.ts
- Modify: cli/src/constants/skill/install-status.ts

**Interfaces produced:**

SkillFrontmatter（name: string + description: string）；SkillEntry（name + description）；SkillComparisonRow（platformName + skillName + description + statusMessage）；SkillInstallResult（成功/无变化/失败三态联合）；SkillComparisonStatus 4 态常量；SkillInstallStatus 3 态常量。

- [ ] **Step 1: 重写 cli/src/types/skill/frontmatter.ts**

替换整个文件为对齐 Claude Code 官方约定的 interface：仅包含 name + description 两个 string 字段，全部加 TSDoc，导出 type SkillFrontmatter。

- [ ] **Step 2: 重写 cli/src/constants/skill/comparison-status.ts**

替换为 4 态对象式枚举：INSTALLED="已安装"、NOT_INSTALLED="未安装"、REMOTE_REMOVED="远端已移除"、MISSING_SKILLS_DIRECTORY="该平台的 skills 目录不存在"。as const，导出 SkillComparisonStatus。

- [ ] **Step 3: 重写 cli/src/constants/skill/install-status.ts**

替换为 3 态：SUCCESS="success"、NO_CHANGE="no-change"、FAILED="failed"。as const。

- [ ] **Step 4: 重写 cli/src/types/skill/comparison.ts**

引入 SkillEntry interface（name + description）；用 `import { SkillComparisonStatus } from "@/constants/skill/comparison-status"` 取值；用 `type SkillComparisonStatusType = (typeof SkillComparisonStatus)[keyof typeof SkillComparisonStatus]` 推类型；重写 SkillComparisonRow 字段为 platformName + skillName + description + statusMessage（删除 remoteVersion/localVersion）。export 加 SkillEntry 类型。

- [ ] **Step 5: 重写 cli/src/types/skill/install-result.ts**

按"成功 / 无变化 / 失败"三态联合定义 SkillInstallResult。导入 SkillInstallStatus 值用于 status 字段类型字面量。失败分支含 error: AppError 字段。

- [ ] **Step 6: 用 git rm 删 cli/src/types/skill/manifest-config.ts**

命令：`git rm cli/src/types/skill/manifest-config.ts`

- [ ] **Step 7: 重写 cli/src/types/skill/index.ts 桶导出**

只 re-export 现存类型/值：SkillComparisonStatus（值）、SkillComparisonRow（type）、SkillEntry（type）、SkillFrontmatter（type）、SkillInstallStatus（值）、SkillInstallResult（type）。移除 ManifestConfig / ManifestConfigPayload / SkillItem 的导出。

- [ ] **Step 8: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：本任务修改文件内部无报错；其它文件因仍引用旧类型有报错，预期内（后续任务修复）。

- [ ] **Step 9: 提交**

```bash
git add cli/src/types/skill/ cli/src/constants/skill/
git commit -m "refactor(types): rewrite skill types for v2

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: schema 层（passthrough frontmatter）

**Files:**
- Modify: cli/src/schemas/skill/frontmatter.ts
- Delete: cli/src/schemas/skill/manifest-config.ts

**Interfaces produced:**

`skillFrontmatterSchema: z.ZodSchema<SkillFrontmatter>` —— 校验 name + description 两字段为非空 string，用 passthrough 容忍历史 version 字段。

- [ ] **Step 1: 重写 cli/src/schemas/skill/frontmatter.ts**

新内容：从 @/types/skill 导入 SkillFrontmatter 类型；声明 `skillFrontmatterSchema: z.ZodSchema<SkillFrontmatter> = z.object({ name: z.string().min(1, "技能名不能为空。"), description: z.string().min(1, "技能描述不能为空。") }).passthrough()`；导出 skillFrontmatterSchema。

- [ ] **Step 2: 删 cli/src/schemas/skill/manifest-config.ts**

命令：`git rm cli/src/schemas/skill/manifest-config.ts`

- [ ] **Step 3: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：本任务修改文件内部无报错。

- [ ] **Step 4: 提交**

```bash
git add cli/src/schemas/skill/
git commit -m "refactor(schemas): rewrite frontmatter schema with passthrough, drop manifest schema

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: tools/filesystem 加 compareDirectoryContentHash

**Files:**
- Modify: cli/src/tools/filesystem/directory.ts
- Modify: cli/src/tools/filesystem/index.ts

**Interfaces produced:**

`compareDirectoryContentHash(sourceDirectoryPath: string, targetDirectoryPath: string): Promise<boolean>` —— 递归 SHA-256 比对两目录的内容；target 不存在或非目录时直接返回 false。

- [ ] **Step 1: 修改 cli/src/tools/filesystem/directory.ts，追加 compareDirectoryContentHash 函数**

在 import 区合并新增 `createHash` from "node:crypto"、`existsSync` from "node:fs"、`readdir, readFile, stat` from "node:fs/promises"（与既有 cp, rm 合并、按 perfectionist 排序）、`join, sep` from "node:path"。

新增私有 helper `computeDirectoryContentHash(directoryPath: string): Promise<string>` —— 递归收集文件相对路径 + 文件内容的 SHA-256，最后把所有 `<relativePath> <hash>` 行排序拼接、再做一次 SHA-256 作为整体哈希。遍历用 `readdir(path, { withFileTypes: true })` + sorted by name + `for...of`（CLAUDE.md 禁 for/while 关键字、只允许 for...of 配 await）。

新增 export `compareDirectoryContentHash(sourceDirectoryPath, targetDirectoryPath): Promise<boolean>` —— 先 existsSync 判断 target，再 stat 确认 isDirectory，最后调两次 computeDirectoryContentHash 比对。

- [ ] **Step 2: 更新 cli/src/tools/filesystem/index.ts 桶导出**

新内容：`export { compareDirectoryContentHash, copyDirectory, removeDirectory } from "./directory"`

- [ ] **Step 3: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：本任务新增内容无类型错误。

- [ ] **Step 4: 跑 lint（仅本任务文件）**

命令：`cd cli && bun run lint src/tools/filesystem/`

预期：0 error。

- [ ] **Step 5: 提交**

```bash
git add cli/src/tools/filesystem/
git commit -m "feat(tools/filesystem): add compareDirectoryContentHash

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: features/github（去 preferOffline + 加 scanSkillEntryList）

**Files:**
- Modify: cli/src/features/github/repository.ts
- Delete: cli/src/features/github/load-manifest-config.ts
- Modify: cli/src/features/github/index.ts

**Interfaces consumed:**
- SkillEntry from @/types/skill
- skillFrontmatterSchema from @/schemas/skill/frontmatter
- AppError, AppErrorCode from @/error（注：REMOTE_REPOSITORY_EMPTY 此时尚未在 code.ts 中添加，Task 9 才补，所以本任务的 typecheck 会有该错误码 missing 的报错——属于预期内）

**Interfaces produced:**
- getRepositoryDirectoryPath(): Promise<string>
- scanSkillEntryList(repositoryDirectoryPath: string): Promise<SkillEntry[]>

- [ ] **Step 1: 重写 cli/src/features/github/repository.ts**

import 区：默认 `import { default as matter } from "gray-matter"`、`import { downloadTemplate } from "giget"`、`import { mkdtemp, readdir, readFile } from "node:fs/promises"`、`import { tmpdir } from "node:os"`、`import { existsSync } from "node:fs"`、`import { join } from "node:path"`、`import { repositoryConfig } from "@/config/repository"`、`import { AppError, AppErrorCode } from "@/error"`、`import { skillFrontmatterSchema } from "@/schemas/skill/frontmatter"`。

getRepositoryDirectoryPath：在 mkdtemp(join(tmpdir(), "yeizi-skills-repo-")) 上 downloadTemplate，传 dir + forceClean: true（**不传 preferOffline**），返回 downloadResult.dir。带 TSDoc + @example。

scanSkillEntryList：readdir(repositoryDirectoryPath, { withFileTypes: true })，过滤 isDirectory() && name.startsWith("yeizi-")；空集合时 throw new AppError(AppErrorCode.REMOTE_REPOSITORY_EMPTY)；遍历用 for...of，逐个 join 出 SKILL.md 路径、existsSync 跳过、readFile + matter + skillFrontmatterSchema.parse；try/catch 内吞解析失败（per-skill 容错），catch 块用 `continue`；最后 sort by name 返回。

- [ ] **Step 2: 删 cli/src/features/github/load-manifest-config.ts**

命令：`git rm cli/src/features/github/load-manifest-config.ts`

- [ ] **Step 3: 重写 cli/src/features/github/index.ts 桶导出**

新内容：`export { getRepositoryDirectoryPath, scanSkillEntryList } from "./repository"`

- [ ] **Step 4: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：本任务文件本身只有 1 个错（REMOTE_REPOSITORY_EMPTY missing）；Task 9 修复。

- [ ] **Step 5: 跑 lint（仅本任务文件）**

命令：`cd cli && bun run lint src/features/github/`

预期：0 error。

- [ ] **Step 6: 提交**

```bash
git add cli/src/features/github/
git commit -m "refactor(features/github): scan skill entries from repo dir, drop manifest loader

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: features/skill 重写

**Files:**
- Delete: cli/src/features/skill/manifest-config.ts
- Delete: cli/src/features/skill/document-parser.ts
- Modify: cli/src/features/skill/comparison-builder.ts
- Modify: cli/src/features/skill/selected-builder.ts
- Modify: cli/src/features/skill/copier.ts
- Modify: cli/src/features/skill/prompt.ts
- Modify: cli/src/features/skill/index.ts

**Interfaces consumed:**
- SkillEntry, SkillComparisonRow, SkillInstallResult from @/types/skill
- SkillComparisonStatus, SkillInstallStatus from @/types/skill（值导出，Task 1 提供）
- PlatformItem, PlatformName from @/types/platform
- compareDirectoryContentHash, copyDirectory from @/tools/filesystem

**Interfaces produced:**
- buildComparisonRows(remoteSkillEntryList, selectedPlatformList): Promise<SkillComparisonRow[]>
- buildSelectedSkillList(skillEntryList, selectedSkillNameList): SkillEntry[]
- copySkillEntryToPlatformItem(skillEntry, platformItem, repositoryDirectoryPath): Promise<SkillInstallResult>
- promptSkillNameList(skillEntryList): Promise<string[]>

**已删除符号：** ManifestConfigService、parseSkillVersion、parseFrontmatter、buildUpdateRows、buildUpdateSkillNameList、buildSelectedRows、promptSkillNameListToUpdate。

- [ ] **Step 1: 删 cli/src/features/skill/manifest-config.ts**

命令：`git rm cli/src/features/skill/manifest-config.ts`

- [ ] **Step 2: 删 cli/src/features/skill/document-parser.ts**

命令：`git rm cli/src/features/skill/document-parser.ts`

- [ ] **Step 3: 重写 cli/src/features/skill/comparison-builder.ts**

import：`type { PlatformItem } from "@/types/platform"`、`type { SkillComparisonRow, SkillEntry } from "@/types/skill"`、`{ existsSync } from "node:fs"`、`{ readdir } from "node:fs/promises"`、`{ SkillComparisonStatus } from "@/types/skill"`。

buildComparisonRows 流程：构造 remoteSkillEntryByNameMap；对每个 platformItem：若 !existsSync(platformSkillDirectoryPath) → 全部行打 MISSING_SKILLS_DIRECTORY；否则 readdir 取本地 yeizi-* 子目录、构 localSkillNameSet；对每个远端 entry 推一行（INSTALLED 或 NOT_INSTALLED）；对本地有但远端没有的孤儿名再推一行 REMOTE_REMOVED（description: ""）。**禁 for/while 关键字**——用 for...of 和数组方法。

只 export buildComparisonRows。删 buildUpdateRows / buildUpdateSkillNameList / buildSelectedRows。

- [ ] **Step 4: 重写 cli/src/features/skill/selected-builder.ts**

入参从旧的 SkillItem[] 改为 SkillEntry[]；用 Map.has 找缺失项；缺失时抛 AppError(AppErrorCode.SKILL_NOT_FOUND, { params: { skillNameList: missing } })；返回按 selectedSkillNameList 顺序的 SkillEntry 数组。带 TSDoc + @example。

- [ ] **Step 5: 重写 cli/src/features/skill/copier.ts**

函数名 `copySkillEntryToPlatformItem`（替换旧的 copySkillItemToPlatformItem）；入参 `(skillEntry: SkillEntry, platformItem: PlatformItem, repositoryDirectoryPath: string)`。流程：`resolve` 出源/目标目录；try 内先调 `compareDirectoryContentHash` 比对，相同 → 返回 NO_CHANGE 结果；否则 `copyDirectory` + 返回 SUCCESS；catch 内先 `instanceof AppError` 直接装失败结果，再 `instanceof Error` 包成 AppError(FILE_COPY_FAILED, { params: { sourcePath, targetPath }, cause })，否则 throw 传播。带 TSDoc + @example。

- [ ] **Step 6: 重写 cli/src/features/skill/prompt.ts**

只保留 `promptSkillNameList(skillEntryList: SkillEntry[]): Promise<string[]>`；inquirer choice 形态：`{ name: \`\${skillEntryItem.name}\n    └ \${skillEntryItem.description}\`, value: skillEntryItem.name, short: skillEntryItem.name }`，description 为空时只展示 name 不带换行。**删除 promptSkillNameListToUpdate**。

- [ ] **Step 7: 重写 cli/src/features/skill/index.ts 桶导出**

新内容：
```typescript
export { buildComparisonRows } from "./comparison-builder"
export { copySkillEntryToPlatformItem } from "./copier"
export { parseSkillNameList } from "./name-parser"
export { promptSkillNameList } from "./prompt"
export { buildSelectedSkillList } from "./selected-builder"
```

- [ ] **Step 8: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：commands 仍有未重写报错；本任务文件内部 0 错。

- [ ] **Step 9: 跑 lint（仅本任务文件）**

命令：`cd cli && bun run lint src/features/skill/`

预期：0 error。

- [ ] **Step 10: 提交**

```bash
git add cli/src/features/skill/
git commit -m "refactor(features/skill): rewrite to SkillEntry model, drop manifest/document-parser/update helpers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 删除 update 命令与类型

**Files:**
- Delete: cli/src/commands/update/（整目录）
- Delete: cli/src/types/command/update/（整目录）

- [ ] **Step 1: 删除 update 命令目录**

命令：`git rm -r cli/src/commands/update`

- [ ] **Step 2: 删除 update 类型目录**

命令：`git rm -r cli/src/types/command/update`

- [ ] **Step 3: 提交**

```bash
git commit -m "refactor(commands): drop update command and its types

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 重写 install 命令

**Files:**
- Modify: cli/src/commands/install/command.ts

**Interfaces consumed:**
- getRepositoryDirectoryPath, scanSkillEntryList from @/features/github
- buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList from @/features/platform
- buildSelectedSkillList, copySkillEntryToPlatformItem, parseSkillNameList, promptSkillNameList from @/features/skill
- renderSummaryDisplay from @/features/display
- removeDirectory from @/tools/filesystem
- SkillInstallStatus from @/types/skill

- [ ] **Step 1: 重写 cli/src/commands/install/command.ts**

整段重写。删除 ManifestConfigService 依赖。InstallCommand 类成员：

- platformConfig: PlatformConfigService（构造函数 getInstance）
- optionList：保留 --platform / --skill 两项（同现版）
- 私有方法 buildSelectedPlatformNameList(availablePlatformNameList, inputPlatformNameList)：与 list/update 一致风格
- 私有方法 buildSelectedSkillNameList(remoteSkillEntryList: SkillEntry[], inputSkillNameList: string[])：有值用值、无值调 promptSkillNameList(remoteSkillEntryList)
- 私有方法 batchInstallSkillEntryListToPlatformList(skillEntryList, platformList, repositoryDirectoryPath): SkillInstallResult[]：双 for-of 遍历，逐对调 copySkillEntryToPlatformItem，结果 push
- 私有方法 buildInstallSummaryMessageList(resultList): string[]：成功 → "已为平台 X 安装技能 Y。"；NO_CHANGE → "平台 X 上的技能 Y 无变化、已跳过。"；FAILED → "为平台 X 安装技能 Y 失败：<error.message>"
- public execute(commandOptions)：先解析 selectedPlatformNameList → buildSelectedPlatformList → getRepositoryDirectoryPath；try 内 scanSkillEntryList → buildSelectedSkillNameList → buildSelectedSkillList → batchInstall → buildSummary → renderSummaryDisplay("安装完成", messages)；finally 块用嵌套 try/catch 包 removeDirectory，失败时抛 DIRECTORY_REMOVE_FAILED
- register(program)：保留 commander 注册逻辑（与现版一致）

- [ ] **Step 2: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：list/main 仍有错；本任务文件内部 0 错。

- [ ] **Step 3: 跑 lint（仅本任务文件）**

命令：`cd cli && bun run lint src/commands/install/`

预期：0 error。

- [ ] **Step 4: 提交**

```bash
git add cli/src/commands/install/
git commit -m "refactor(commands/install): rewrite to scan-driven flow with hash comparison

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 重写 list 命令

**Files:**
- Modify: cli/src/commands/list/command.ts

**Interfaces consumed:**
- getRepositoryDirectoryPath, scanSkillEntryList from @/features/github
- buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList from @/features/platform
- buildComparisonRows from @/features/skill
- removeDirectory from @/tools/filesystem

- [ ] **Step 1: 重写 cli/src/commands/list/command.ts**

整段重写。删除 ManifestConfigService 依赖。ListCommand 类成员：

- platformConfig: PlatformConfigService
- descriptionTruncateLimit = 60（私有 readonly）
- optionList：保留 --platform
- 私有方法 buildSelectedPlatformNameList（同 install）
- 私有方法 truncateDescription(description: string): string —— 超 60 字符尾加 "…"
- 私有方法 renderComparisonTable(title, comparisonRowList)：表头改为 ["平台", "技能", "状态", "介绍"]；body 列 [platformName, skillName, statusMessage, truncateDescription(description)]；boxen + chalk 包裹打印
- public execute(commandOptions)：解析平台 → buildSelectedPlatformList → getRepositoryDirectoryPath → try 内 scanSkillEntryList → buildComparisonRows → renderComparisonTable("技能列表", rows)；finally 嵌套 try/catch 包 removeDirectory，失败时抛 DIRECTORY_REMOVE_FAILED
- register(program)：保留 commander 注册逻辑

- [ ] **Step 2: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：main 仍有 UpdateCommand 报错；本任务文件内部 0 错。

- [ ] **Step 3: 跑 lint（仅本任务文件）**

命令：`cd cli && bun run lint src/commands/list/`

预期：0 error。

- [ ] **Step 4: 提交**

```bash
git add cli/src/commands/list/
git commit -m "refactor(commands/list): rewrite to scan-driven 4-state table with description column

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: error 增删（REMOTE_SKILL_CATALOG_INVALID → REMOTE_REPOSITORY_EMPTY）

**Files:**
- Modify: cli/src/error/code.ts
- Modify: cli/src/error/definitions.ts
- Modify: cli/src/types/error/types.ts

- [ ] **Step 1: 修改 cli/src/error/code.ts**

删除 `REMOTE_SKILL_CATALOG_INVALID: "remote-skill-catalog-invalid",` 这一项（含其上方 TSDoc 注释）。在原位插入：

```typescript
/**
 * 远端仓库根目录下没有任何 yeizi-* 子目录（仓库异常）。
 */
REMOTE_REPOSITORY_EMPTY: "remote-repository-empty",
```

- [ ] **Step 2: 修改 cli/src/types/error/types.ts**

`AppErrorParamsMap` 中删除 `[AppErrorCode.REMOTE_SKILL_CATALOG_INVALID]: undefined`；新增 `[AppErrorCode.REMOTE_REPOSITORY_EMPTY]: undefined`。

- [ ] **Step 3: 修改 cli/src/error/definitions.ts**

删除 `[AppErrorCodeValues.REMOTE_SKILL_CATALOG_INVALID]: { ... },` 整段。在原位添加：

```typescript
[AppErrorCodeValues.REMOTE_REPOSITORY_EMPTY]: {
  title: "远端仓库异常",
  buildMessage: () => "远端仓库未发现任何技能，请检查仓库内容。",
},
```

- [ ] **Step 4: 跑 typecheck**

命令：`cd cli && bun run typecheck`

预期：REMOTE_REPOSITORY_EMPTY missing 报错此时应消失。剩余报错应只剩 main.ts（UpdateCommand 未摘）。

- [ ] **Step 5: 跑 lint**

命令：`cd cli && bun run lint src/error/ src/types/error/`

预期：0 error。

- [ ] **Step 6: 提交**

```bash
git add cli/src/error/ cli/src/types/error/
git commit -m "refactor(error): swap REMOTE_SKILL_CATALOG_INVALID for REMOTE_REPOSITORY_EMPTY

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: main.ts 移除 UpdateCommand

**Files:**
- Modify: cli/src/main.ts

- [ ] **Step 1: 编辑 cli/src/main.ts**

删除 `import { UpdateCommand } from "@/commands/update"`；删除 `new UpdateCommand().register(program)`。createProgram 中只剩 ListCommand + InstallCommand 两个注册行。

- [ ] **Step 2: 跑完整 typecheck**

命令：`cd cli && bun run typecheck`

**预期：通过、0 error。** 这是第一个应该全过的检查点。如有残留错误立即修复。

- [ ] **Step 3: 跑完整 lint**

命令：`cd cli && bun run lint`

预期：0 error（warnings 可接受）。如有 lint error 立即修复。

- [ ] **Step 4: 提交**

```bash
git add cli/src/main.ts
git commit -m "refactor(main): unregister UpdateCommand

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: 删除 service/ 整目录

**Files:**
- Delete: cli/src/service/

- [ ] **Step 1: 确认 service/ 下无使用方**

命令：`cd cli && grep -rn "@/service" src/`

预期：无输出（或全文 0 行）。如有，先找出使用方修复。

- [ ] **Step 2: 删除整目录**

命令：`git rm -r cli/src/service`

- [ ] **Step 3: 跑完整 check**

命令：`cd cli && bun run check`

预期：通过、0 error。

- [ ] **Step 4: 提交**

```bash
git commit -m "chore: remove src/service/ directory

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: package.json 去依赖

**Files:**
- Modify: cli/package.json
- Modify: cli/bun.lock（自动生成）

- [ ] **Step 1: 编辑 cli/package.json**

dependencies 中删 axios（"^1.18.0"）、semver（"^7.7.2"）；devDependencies 中删 @types/semver（如有）。dependencies 应剩 7 项：boxen / chalk / commander / giget / gray-matter / inquirer / zod。

- [ ] **Step 2: 重新生成 lockfile**

命令：`cd cli && bun install`

- [ ] **Step 3: 跑完整 check**

命令：`cd cli && bun run check`

预期：通过、0 error。

- [ ] **Step 4: 提交**

```bash
git add cli/package.json cli/bun.lock
git commit -m "chore(deps): drop axios + semver

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: 仓库根三个 SKILL.md 去 version 行

**Files（注意：在仓库根、不在 cli/ 下）：**
- Modify: yeizi-auto-self-review/SKILL.md
- Modify: yeizi-command-bug-workflow/SKILL.md
- Modify: yeizi-command-pair-program/SKILL.md

- [ ] **Step 1: 删除 yeizi-auto-self-review/SKILL.md 的 version 行**

文件路径：`C:/Users/yeizi/Desktop/yeizi-skills/yeizi-auto-self-review/SKILL.md`

frontmatter 当前形态：

```yaml
---
name: yeizi-auto-self-review
version: 1.0.0
description: |
  Use when ...
---
```

改为：

```yaml
---
name: yeizi-auto-self-review
description: |
  Use when ...
---
```

只删 `version: 1.0.0` 行，**不动 description 的多行 YAML block scalar**。

- [ ] **Step 2: 删除 yeizi-command-bug-workflow/SKILL.md 的 version 行**

同样的处理：删 `version: 1.0.0` 行，保留 name 与 description。

- [ ] **Step 3: 删除 yeizi-command-pair-program/SKILL.md 的 version 行**

Read 该文件确认 frontmatter 形态后，删 version 行。

- [ ] **Step 4: 提交（在仓库根，跳出 cli/）**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && git add yeizi-auto-self-review/SKILL.md yeizi-command-bug-workflow/SKILL.md yeizi-command-pair-program/SKILL.md
git commit -m "chore(skills): drop version frontmatter field across 3 SKILL.md

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: 删除仓库根 manifest.json

**Files:**
- Delete: manifest.json（仓库根）

- [ ] **Step 1: 删除文件**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && git rm manifest.json
```

- [ ] **Step 2: 提交**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && git commit -m "chore: remove remote manifest.json

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: 最终验证 + 手工烟测

**Files:** 无文件修改；纯验证。

- [ ] **Step 1: 跑完整 check（最后一次）**

命令：`cd cli && bun run check`

预期：通过、0 error。

- [ ] **Step 2: 手工烟测 list（无平台参数）**

命令：`cd cli && bun run ./src/bin/cli.ts list`

预期：弹 inquirer 多选平台 → 选 1+ → 渲染 4 列表（平台 / 技能 / 状态 / 介绍）。状态列出现"已安装"/"未安装"/"远端已移除"/"平台 skills 目录缺失"之一。介绍列内容来自 SKILL.md frontmatter description，超 60 字符尾部应有省略号。

- [ ] **Step 3: 手工烟测 list（带平台参数）**

命令：`cd cli && bun run ./src/bin/cli.ts list --platform claude`

预期：不弹 prompt 直接渲染 claude 平台的表格。

- [ ] **Step 4: 手工烟测 install**

命令：`cd cli && bun run ./src/bin/cli.ts install --platform claude`

预期：拉仓库（数秒）→ 弹多选 prompt 展示远端技能（每项一行：技能名 + 缩进 description）→ 选一项 → 复制到 `~/.claude/skills/<skillName>/` → summary 显示"已为平台 'claude' 安装技能 'X'。"

如果选了之前装过且远端无变化的技能，summary 应显示"平台 'claude' 上的技能 'X' 无变化、已跳过。"

- [ ] **Step 5: 验证 update 命令已下线**

命令：`cd cli && bun run ./src/bin/cli.ts update`

预期：commander 提示 `error: unknown command 'update'` 或类似。

- [ ] **Step 6: 验证目录已删除**

命令：`cd cli && ls src/service src/commands/update src/types/command/update 2>&1`

预期：三个 ls 全报 No such file or directory。

- [ ] **Step 7: 验证 dependencies 个数**

命令：`cd cli && cat package.json`

预期：dependencies 块只剩 7 个 key（boxen / chalk / commander / giget / gray-matter / inquirer / zod）。

- [ ] **Step 8: working tree 干净**

命令：`cd cli && git status --short`

预期：无未提交改动（前面所有任务都已 commit）。

- [ ] **Step 9: 里程碑空提交**

```bash
cd cli && git commit --allow-empty -m "chore: yeizi-skills v2 refactor complete

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义

所有任务复选框都打勾后：

- ✅ `bun run check` 全过
- ✅ 手工烟测：list / install 在至少一个平台上行为符合预期
- ✅ update 命令已下线（commander 报 unknown command）
- ✅ src/service/ / src/commands/update/ / src/types/command/update/ 目录已删
- ✅ manifest.json（仓库根）已删
- ✅ 仓库根 3 个 SKILL.md 已去 version 行
- ✅ package.json dependencies 从 9 降到 7（无 axios、无 semver）
- ✅ 所有改动以 atomic commit 提交到 `brainstorm/manifest-removal-refactor` 分支
