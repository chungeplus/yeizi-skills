# 规则符合性整改 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按更新后的 CLAUDE.md 规则，修复 `cli/src` 全树的目录结构与代码违规。

**Architecture:** 分三类整改——(1) 目录/文件结构（入口装配上移、外部访问能力归入 `apis/`、文件改名、压平过度分层）；(2) 明确代码违规（`let`→`const`、串行 await 改 `for...of`、三目改 `if`、`catch` 类型守卫、私有函数去 `@example`、集合 `XxxList`、去参数 `readonly`、收敛多余导出、布尔 `is` 前缀、补 schema 文档注释）；(3) 命名一致性。每个任务结束后运行 `bun run check` 验证类型与 lint，并提交。

**Tech Stack:** TypeScript 5.8、Bun 测试/构建、Commander、zod、axios、inquirer、ESLint（@antfu/eslint-config）。

## Global Constraints

逐条来自 CLAUDE.md，下列约束适用于本计划每一个任务：

- 目录门面文件 `index.ts` 仅允许 `export *` / `export { ... }` / `export type { ... }`，不承担实现或装配逻辑。
- 模块导出统一写在文件底部，不在声明处直接 `export`。
- 入口装配（创建程序、串联模块、注册命令）只留在入口层，不散落到业务/工具目录。
- 外部访问能力（文件系统、网络、终端交互）全项目集中在全局共享层 `src/apis`。
- 文件命名：符号文件名跟随主符号语义并转小写中划线；目录角色不重复到文件名；`index.ts` 只做目录门面。
- 注释用 TSDoc；类型/常量/配置/函数/类/方法用 `/** */`；只有可复用（被别的文件调用）的函数/方法写 `@example`，私有函数与入口流程函数不写。
- 集合命名用 `XxxList` 后缀，不用 `Xxxs` 简单复数。**例外**：绑定外部数据契约的字段（`skills`，镜像远端 `skills.json` 键名）保留原名。
- 函数参数签名不写 `readonly`，函数内不修改参数承载的数据。
- 串行 `await` 循环保留 `reduce(async …, Promise.resolve())` 写法（经确认作为「禁用关键字循环」规则下串行 await 的唯一例外）；不改写为 `for...of`。本次仅对这些 reduce 块做变量改名与 `const` 修正，不改结构。
- 禁止三目运算符，用 `if`。
- `catch` 内先用类型守卫（`instanceof` 等）收窄，不直接 `as` 断成具体类型。
- 布尔变量用 `is`/`has`/`can` 前缀。
- 不会被重新赋值的绑定用 `const`，会重新赋值的用 `let`，不用 `var`。
- 日志与错误信息用中文；命令名、路径、字段名、协议名等固定标识保留原文。
- 验证命令：`bun run check`（= `tsc --noEmit && eslint .`）；构建验证：`bun run build`。本仓库当前无测试文件，验证以 `check` + `build` 为准。

---

## File Structure

整改后受影响的文件布局（仅列变动项）：

```
src/
  apis/
    github/
      constants.ts            ← 由 api-configs.ts 改名（常量集合，目录已限定主题、唯一同类角色文件）
      github-api.ts           ← 收敛导出：仅 githubApi；GitHubApi 类与 IGitHubApiOptions 转文件内私有
      contents-parser.ts      ← parsedEntries → parsedEntryList
      url-builder.ts          ← 更新对 constants.ts 的导入路径
      index.ts                ← 更新桶导出（api-configs → constants）
    http-client/
      http-request-client.ts  ← 由 request.ts 改名（主符号 HttpRequestClient）；三目改 if；收敛导出
      index.ts                ← 更新桶导出路径
    package-json/             ← 新建：文件系统访问能力归入 apis
      load-package-json-info.ts  ← 由 src/tools/ 迁入
      index.ts                ← 新建桶导出
    prompt/                   ← 新建：终端交互能力归入 apis
      platform-skill-prompt.ts   ← 由 src/tools/prompt-service.ts 迁入并改名；getInteractiveTerminal 用 Boolean()
      index.ts                ← 新建桶导出
    index.ts                  ← 新建：聚合 apis 各子模块桶导出
  bin/
    cli.ts                    ← 改具名导入 { runCli }，统一 @/ 别名
  commands/
    install/
      command.ts              ← skillIndex 显式类型；布尔 is 前缀；reduce 块变量改名；导入路径更新
      command-options.ts      ← 由 install/types/install-command-options.ts 上移（压平分层）
      index.ts                ← 导出 InstallCommand + 命令选项类型
    list/
      command.ts              ← 布尔 is 前缀；导入路径更新
      command-options.ts      ← 由 list/types/list-command-options.ts 上移
      index.ts                ← 导出 ListCommand + 命令选项类型
    update/
      command.ts              ← updateRows 函数改名；布尔 is 前缀；reduce 块变量改名；导入路径更新
      command-options.ts      ← 由 update/types/update-command-options.ts 上移
      index.ts                ← 导出 UpdateCommand + 命令选项类型
    index.ts                  ← 移除 register-commands 导出（仅暴露命令公开能力）
    （删除 register-commands.ts，逻辑并入 main.ts）
    （删除 install|list|update/types/ 三个子目录）
  features/
    skill/
      parsers/
        skill-document.ts     ← SkillDocumentParser 类改为 parseFrontmatter / parseSkillVersion 两个具名函数
      skill-comparator.ts     ← 集合 XxxList；去 readonly；改用 parse* 函数
      skill-installer.ts      ← catch 类型守卫；集合 XxxList；去 readonly；改用 parse* 函数；reduce 块变量改名
    platform/
      platform-resolver.ts    ← 私有 parseCsvOptionValues 去 @example；集合 XxxList；去 readonly
    source/
      github-skill-source.ts  ← 私有方法去 @example；集合 XxxList；去 readonly；改用 parse* 函数；reduce 块变量改名
  errors/
    error-code.ts             ← 14 处 let→const；getAppErrorDefinition 补 @example；skillNames→skillNameList
    app-error.ts              ← let→const（definition/params）
    commander-error-adapter.ts← let→const；私有函数去 @example
    fatal-error-handler.ts    ← let→const（fatalError）
  schemas/
    supported-platform-name-schema.ts ← 由 platform-name-schema.ts 改名（跟随主符号 supportedPlatformNameSchema）
    csv-option-value-schema.ts        ← 补 /** */ 文档注释
    github-contents-entry-schema.ts   ← 补 /** */
    package-json-info-schema.ts       ← 补 /** */
    skill-frontmatter-schema.ts       ← 补 /** */
    skill-index-schema.ts             ← 补 /** */
    index.ts                  ← 更新桶导出（platform-name → supported-platform-name）
  config/
    repository.ts             ← 由 repository-config.ts 改名（目录角色不重复到文件名）
    index.ts                  ← 更新桶导出路径
  tools/
    display/                  ← 保留：renderSummaryDisplay / renderComparisonTableDisplay 去 readonly + 集合 XxxList
    parse-csv-option-values.ts← 集合 XxxList（parsedOptionValues → parsedOptionValueList）
    index.ts                  ← 移除 load-package-json-info / prompt-service 导出（已迁出）
  types/
    command/command.ts        ← options 字段 → optionList（集合命名）
  main.ts                     ← 改具名导出 { runCli }；并入 registerCommands 装配逻辑；导入路径更新
```

任务顺序自底向上：先做不牵动结构的纯文本违规（errors、schemas、display、parse-csv），再做改名与迁移（牵动导入路径），最后做入口装配上移与命令分层压平。每个任务自成可验证交付。

---

## Task 1: errors 子树 `let`→`const` 与文档注释

**Files:**
- Modify: `src/errors/error-code.ts`
- Modify: `src/errors/app-error.ts`
- Modify: `src/errors/commander-error-adapter.ts`
- Modify: `src/errors/fatal-error-handler.ts`

**Interfaces:**
- Consumes: 无（纯本地修正）
- Produces: `error-code.ts` 导出的 `IAppErrorParamsMap` 中 `SKILL_NOT_FOUND` 的字段由 `skillNames` 改名为 `skillNameList`（Task 7 的 `update/command.ts` 会用到新字段名）。其余导出签名不变。

- [ ] **Step 1: `error-code.ts` 把 14 处 `let xxxParams = params as ...` 改为 `const`**

`getAppErrorDefinition` 内每个 `buildMessage` 里形如 `let cliUsageInvalidParams = params as ...` 的绑定均无重新赋值，全部改 `const`。涉及行（当前行号）：176、188、204、212、228、248、256、264、272、280、300、316、324、332。逐个把行首 `let ` 改为 `const `。例如：

```ts
// 改前
let cliUsageInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.CLI_USAGE_INVALID]
// 改后
const cliUsageInvalidParams = params as IAppErrorParamsMap[typeof AppErrorCode.CLI_USAGE_INVALID]
```

- [ ] **Step 2: `error-code.ts` 把 `skillNames` 集合字段改名为 `skillNameList`**

第 140-142 行类型定义：

```ts
// 改前
[AppErrorCode.SKILL_NOT_FOUND]: {
  skillNames: readonly [string, ...string[]]
}
// 改后
[AppErrorCode.SKILL_NOT_FOUND]: {
  skillNameList: readonly [string, ...string[]]
}
```

第 225-235 行 `buildMessage` 内同步改引用：

```ts
[AppErrorCode.SKILL_NOT_FOUND]: {
  title: "技能不存在",
  buildMessage: (params) => {
    const skillNotFoundParams = params as IAppErrorParamsMap[typeof AppErrorCode.SKILL_NOT_FOUND]

    if (skillNotFoundParams.skillNameList.length === 1) {
      return `技能“${skillNotFoundParams.skillNameList[0]}”不存在。`
    }

    return `以下技能不存在：${skillNotFoundParams.skillNameList.join("、")}。`
  },
},
```

- [ ] **Step 3: `error-code.ts` 给 `getAppErrorDefinition` 补 `@example`**

该函数被 `app-error.ts` 跨文件调用，属可复用函数，需补 `@example`。第 161-166 行注释块改为：

```ts
/**
 * 根据错误代码获取统一错误定义。
 *
 * @param code - 错误代码。
 * @returns 对应的错误定义。
 *
 * @example
 * getAppErrorDefinition(AppErrorCode.UNEXPECTED_ERROR) => { title: "程序异常", buildMessage: () => "程序执行失败，请稍后重试。" }
 */
```

- [ ] **Step 4: `app-error.ts` 把构造函数内 `let` 改 `const`**

第 41-42 行：

```ts
// 改前
let definition = getAppErrorDefinition(code)
let params = options?.params
// 改后
const definition = getAppErrorDefinition(code)
const params = options?.params
```

- [ ] **Step 5: `commander-error-adapter.ts` 把 4 处 `let` 改 `const` 并给 2 个私有函数去 `@example`**

`const` 改动（均无重新赋值）：第 50 行 `let builders`、第 65 行 `let builder`、第 84 行 `let matchedResult`、第 103 行 `let matchedResult`，全部改 `const`。

私有函数去 `@example`（`buildExcessArgumentsMessage`、`extractQuotedValue` 均未在底部 `export {}` 中导出）：

第 80-82 行 `buildExcessArgumentsMessage` 注释块删除 `@example` 段，改为：

```ts
/**
 * 解析 Commander 多余参数提示中的期望值与实际值。
 *
 * @param message - Commander 抛出的原始错误消息。
 * @returns 拼装后的中文提示消息。
 */
```

第 93-101 行 `extractQuotedValue` 注释块删除 `@example` 段，改为：

```ts
/**
 * 从 Commander 错误消息中提取单引号包裹的值。
 *
 * @param message - Commander 抛出的原始错误消息。
 * @returns 成功提取时返回单引号内的字符串，否则返回 undefined。
 */
```

- [ ] **Step 6: `fatal-error-handler.ts` 把 `let fatalError` 改 `const`**

第 23 行：

```ts
// 改前
let fatalError = wrapAsFatalAppError(error)
// 改后
const fatalError = wrapAsFatalAppError(error)
```

- [ ] **Step 7: 运行验证**

Run: `bun run check`
Expected: PASS（无 tsc 错误、无 eslint 错误）

- [ ] **Step 8: Commit**

```bash
git add src/errors/
git commit -m "refactor(errors): let 改 const、补私有函数注释、skillNames 改 skillNameList"
```

---

## Task 2: schemas 文档注释补全与改名

**Files:**
- Modify: `src/schemas/csv-option-value-schema.ts`
- Modify: `src/schemas/github-contents-entry-schema.ts`
- Modify: `src/schemas/package-json-info-schema.ts`
- Modify: `src/schemas/skill-frontmatter-schema.ts`
- Modify: `src/schemas/skill-index-schema.ts`
- Rename: `src/schemas/platform-name-schema.ts` → `src/schemas/supported-platform-name-schema.ts`
- Modify: `src/schemas/index.ts`

**Interfaces:**
- Consumes: 无
- Produces: schema 导出符号名全部不变（`supportedPlatformNameSchema` 等），仅文件名与文档注释变化。`@/schemas` 桶导出对外不变。

- [ ] **Step 1: `csv-option-value-schema.ts` 补 `/** */`**

```ts
import { z } from "zod"

/**
 * 逗号分隔选项值的校验 schema：去空白后非空。
 */
const csvOptionValueSchema = z
  .string()
  .trim()
  .min(1, "逗号分隔选项值不能为空。")

export { csvOptionValueSchema }
```

- [ ] **Step 2: `github-contents-entry-schema.ts` 补 `/** */`**

在 `githubContentsEntrySchema`（第 3 行）和 `githubContentsEntryListSchema`（第 18 行）声明前各加文档块：

```ts
/**
 * 单条 GitHub Contents API 条目的校验 schema。
 */
const githubContentsEntrySchema = z.object({
```

```ts
/**
 * GitHub Contents API 条目列表的校验 schema。
 */
const githubContentsEntryListSchema = z.array(githubContentsEntrySchema)
```

- [ ] **Step 3: `package-json-info-schema.ts` 补 `/** */`**

在第 3 行 `packageJsonInfoSchema` 声明前加：

```ts
/**
 * package.json 中程序信息的校验 schema。
 */
const packageJsonInfoSchema = z.object({
```

- [ ] **Step 4: `skill-frontmatter-schema.ts` 补 `/** */`**

在第 5 行 `skillFrontmatterSchema` 声明前加：

```ts
/**
 * 技能文档 frontmatter 的校验 schema。
 */
const skillFrontmatterSchema = z
```

- [ ] **Step 5: `skill-index-schema.ts` 补 `/** */`**

为 4 个导出常量各加文档块（`skillNameSchema` 第 4 行、`skillVersionSchema` 第 8 行、`skillIndexEntrySchema` 第 12 行、`skillIndexSchema` 第 25 行）：

```ts
/**
 * 技能名校验 schema：以 yeizi- 开头。
 */
const skillNameSchema = z
  .string()
  .regex(/^yeizi-[a-z0-9-]+$/, "技能名称必须以 yeizi- 开头。")

/**
 * 技能版本号校验 schema：符合 semver 规范。
 */
const skillVersionSchema = z
  .string()
  .refine(versionValue => semver.valid(versionValue) !== null, "版本号必须符合 semver 规范。")

/**
 * 单条技能索引条目的校验 schema。
 */
const skillIndexEntrySchema = z
  .object({
```

```ts
/**
 * 技能索引整体结构的校验 schema。
 */
const skillIndexSchema = z
  .object({
```

- [ ] **Step 6: 重命名 `platform-name-schema.ts` 并补 `/** */`**

```bash
git mv src/schemas/platform-name-schema.ts src/schemas/supported-platform-name-schema.ts
```

编辑改名后的文件，给 schema 补文档块：

```ts
import { z } from "zod"

import { SupportedPlatform } from "@/types/platform"

/**
 * 受支持平台名称的校验 schema。
 */
const supportedPlatformNameSchema = z.enum([
  SupportedPlatform.CODEX,
  SupportedPlatform.CLAUDE,
  SupportedPlatform.TRAE,
])

export { supportedPlatformNameSchema }
```

- [ ] **Step 7: 更新 `schemas/index.ts` 桶导出路径**

```ts
export * from "./csv-option-value-schema"
export * from "./github-contents-entry-schema"
export * from "./package-json-info-schema"
export * from "./skill-frontmatter-schema"
export * from "./skill-index-schema"
export * from "./supported-platform-name-schema"
```

- [ ] **Step 8: 运行验证**

Run: `bun run check`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/schemas/
git commit -m "refactor(schemas): 补 schema 文档注释、platform-name-schema 改名跟随主符号"
```

---

## Task 3: tools/display 与 parse-csv 集合命名与 readonly

**Files:**
- Modify: `src/tools/display/command-summary.ts`
- Modify: `src/tools/display/comparison-table.ts`
- Modify: `src/tools/parse-csv-option-values.ts`

**Interfaces:**
- Consumes: `ISkillComparisonRow`（来自 `@/types/skill`，不变）
- Produces: `renderSummaryDisplay(title: string, summaryMessageList: string[])`、`renderComparisonTableDisplay(title: string, comparisonRowList: ISkillComparisonRow[])`、`parseCsvOptionValues(csvOptionValue: string | undefined): string[]`（签名去掉 `readonly`，参数改名；调用方 Task 7 同步更新）

- [ ] **Step 1: `command-summary.ts` 去 `readonly` + 集合改名**

```ts
import boxen from "boxen"
import chalk from "chalk"

/**
 * 渲染并显示命令汇总消息到 stdout。
 *
 * @param title - 标题文案。
 * @param summaryMessageList - 汇总消息列表。
 *
 * @example
 * renderSummaryDisplay("更新完成", ["已完成安装。"])
 */
function renderSummaryDisplay(title: string, summaryMessageList: string[]): void {
  console.log(boxen(
    chalk.yellow(summaryMessageList.join("\n")),
    {
      title: chalk.bold.green(title),
      titleAlignment: "center",
      padding: { top: 1, bottom: 1, left: 5, right: 5 },
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      textAlignment: "center",
    },
  ))
}

export { renderSummaryDisplay }
```

- [ ] **Step 2: `comparison-table.ts` 去 `readonly` + 集合改名**

参数 `comparisonRows`→`comparisonRowList`（去 `readonly`），函数内局部集合 `headerCells`→`headerCellList`、`dividerCells`→`dividerCellList`、`bodyRows`→`bodyRowList`、`lineRows`→`lineRowList`。回调单元素 `comparisonRow`、`lineCells` 保持（`lineCells` 是单行的单元格集合，可改 `lineCellList`）。改后：

```ts
function renderComparisonTableDisplay(
  title: string,
  comparisonRowList: ISkillComparisonRow[],
): void {
  const headerCellList = ["平台", "技能", "远端版本", "本地版本", "状态"]
  const dividerCellList = headerCellList.map(() => "---")
  const bodyRowList = comparisonRowList.map(comparisonRow => [
    comparisonRow.platformName,
    comparisonRow.skillName,
    comparisonRow.remoteVersion,
    comparisonRow.localVersion ?? "-",
    comparisonRow.statusMessage,
  ])
  const lineRowList = [headerCellList, dividerCellList, ...bodyRowList]
  const tableText = lineRowList.map(lineCellList => lineCellList.join(" | ")).join("\n")

  console.log(boxen(
    chalk.yellow(tableText),
    {
      title: chalk.bold.green(title),
      titleAlignment: "center",
      padding: { top: 1, bottom: 1, left: 5, right: 5 },
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      textAlignment: "left",
    },
  ))
}
```

注：原 `let headerCells` 等绑定无重新赋值，顺带改 `const`（符合 const 规则）。`@example` 中的字段保持不变。

- [ ] **Step 3: `parse-csv-option-values.ts` 集合改名**

第 25 行 `let parsedOptionValues` → `const parsedOptionValueList`（无重新赋值，同时改 const），并更新第 30、34 行引用：

```ts
const parsedOptionValueList = Array.from(new Set(validatedOptionValueResult.data
  .split(",")
  .map(optionValue => optionValue.trim())
  .filter(optionValue => optionValue.length > 0)))

if (parsedOptionValueList.length === 0) {
  throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
}

return parsedOptionValueList
```

第 19 行 `let validatedOptionValueResult` 无重新赋值，一并改 `const`。

- [ ] **Step 4: 运行验证**

Run: `bun run check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/
git commit -m "refactor(tools): display 与 parse-csv 集合改 XxxList、去参数 readonly"
```

---

## Task 4: apis/github 改名与导出收敛

**Files:**
- Rename: `src/apis/github/api-configs.ts` → `src/apis/github/constants.ts`
- Modify: `src/apis/github/github-api.ts`
- Modify: `src/apis/github/contents-parser.ts`
- Modify: `src/apis/github/url-builder.ts`
- Modify: `src/apis/github/index.ts`

**Interfaces:**
- Consumes: `repositoryConfig`（`@/config`）、`HttpRequestClient`（`@/apis/http-client`，Task 5 改名后路径不变，因为通过 `@/apis/http-client` 桶导入）、`ISkillIndex`/`IGitHubApi`/`IGitHubContentsEntry`（`@/types/*`）
- Produces: `githubApi`（单例，唯一对外导出）；`GitHubContentsPayload` 类型仍导出；移除 `GitHubApi` 类与 `IGitHubApiOptions` 的对外导出

- [ ] **Step 1: 重命名 `api-configs.ts` 为 `constants.ts`**

```bash
git mv src/apis/github/api-configs.ts src/apis/github/constants.ts
```

文件内容不变（已是 `RAW_BASE_URL` / `CONTENTS_BASE_URL` / `DEFAULT_TIMEOUT_MS` 常量集合）。

- [ ] **Step 2: 更新 `url-builder.ts` 导入路径**

第 3 行：

```ts
// 改前
import { CONTENTS_BASE_URL, RAW_BASE_URL } from "./api-configs"
// 改后
import { CONTENTS_BASE_URL, RAW_BASE_URL } from "./constants"
```

- [ ] **Step 3: `contents-parser.ts` 集合改名**

第 24 行 `let parsedEntries` → `const parsedEntryList`（无重新赋值），更新第 25 行引用：

```ts
const parsedEntryList = githubContentsEntryListSchema.parse(payload)
return parsedEntryList.map(parsedEntry => ({
  type: parsedEntry.type,
  path: parsedEntry.path,
  downloadUrl: parsedEntry.download_url,
}))
```

第 32 行 `let cause: Error` 会被重新赋值（if/else 两分支），保持 `let`。

- [ ] **Step 4: `github-api.ts` 收敛导出 + 更新导入路径**

把 `IGitHubApiOptions` 与 `GitHubApi` 类降为文件内私有，仅导出 `githubApi` 与 `GitHubContentsPayload`（后者由 contents-parser 重导出，github-api.ts 自身只导出 `githubApi`）。完整改写：

```ts
import type { GitHubContentsPayload } from "./contents-parser"
import type { ISkillIndex } from "@/types/skill"
import type { IGitHubApi, IGitHubContentsEntry } from "@/types/source"
import { HttpRequestClient } from "@/apis/http-client"
import { CONTENTS_BASE_URL, DEFAULT_TIMEOUT_MS } from "./constants"
import { parseContentsEntries } from "./contents-parser"
import { buildContentsApiUrl, buildSkillsJsonUrl } from "./url-builder"

/**
 * 基于 {@link HttpRequestClient} 的 GitHub API 客户端。
 */
class GitHubApi implements IGitHubApi {
  private readonly client: HttpRequestClient

  public constructor() {
    this.client = new HttpRequestClient({
      baseURL: CONTENTS_BASE_URL,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    })
  }

  public async loadSkillsIndex(): Promise<ISkillIndex> {
    return this.client.loadJson<ISkillIndex>(buildSkillsJsonUrl())
  }

  public async loadContentsEntries(path: string): Promise<IGitHubContentsEntry[]> {
    const payload = await this.client.loadJson<GitHubContentsPayload>(buildContentsApiUrl(path))
    return parseContentsEntries(payload)
  }

  public async loadRawFileContent(rawFileUrl: string): Promise<string> {
    return this.client.loadText(rawFileUrl)
  }
}

/**
 * 全项目共享的默认 GitHub API 客户端。
 */
const githubApi: IGitHubApi = new GitHubApi()

export { githubApi }
```

注：原 `loadContentsEntries` 内 `let payload` 无重新赋值，改 `const`。`HttpRequestClient` 构造仍传 `{ baseURL, timeoutMs }`（headers 在 Task 5 中保留为可选，无需传）。

- [ ] **Step 4b: 确认 `HttpRequestClient` 仍接受 `{ baseURL, timeoutMs }`**

Task 5 会把 `IHttpRequestClientOptions` 收为文件内私有，但 `HttpRequestClient` 构造函数仍保留该 options 参数（`github-api.ts` 是其唯一调用方，需传 `baseURL` 与 `timeoutMs`）。本步骤无需改动，仅作为 Task 5 的约束记录。

- [ ] **Step 5: 更新 `apis/github/index.ts` 桶导出**

```ts
export * from "./constants"
export * from "./contents-parser"
export * from "./github-api"
export * from "./url-builder"
```

（路径由 `./api-configs` 改为 `./constants`；其余不变。`github-api.ts` 现在只导出 `githubApi`，桶导出自动收窄。）

- [ ] **Step 6: 运行验证**

Run: `bun run check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/apis/github/
git commit -m "refactor(apis/github): api-configs 改名 constants、收敛 GitHubApi 导出、集合改名"
```

---

## Task 5: apis/http-client 改名、三目改 if、导出收敛

**Files:**
- Rename: `src/apis/http-client/request.ts` → `src/apis/http-client/http-request-client.ts`
- Modify: `src/apis/http-client/index.ts`

**Interfaces:**
- Consumes: `axios`
- Produces: `HttpRequestClient`（唯一对外导出类）。`getRetryDelayMs`、`MAX_ATTEMPTS`、`shouldRetry`、`HttpRequestError`、`IRequestClient`、`IHttpRequestClientOptions` 收为文件内私有。`HttpRequestClient` 构造函数保留 `options?: IHttpRequestClientOptions`（`github-api.ts` 传 `baseURL`/`timeoutMs`）。

- [ ] **Step 1: 重命名文件**

```bash
git mv src/apis/http-client/request.ts src/apis/http-client/http-request-client.ts
```

- [ ] **Step 2: 第 136 行三目运算符改 `if`**

`executeWithRetry` 的 catch 块（当前第 135-137 行）：

```ts
// 改前
catch (error) {
  let actualError = error instanceof Error ? error : new Error(String(error))
  let wrapped = wrapError(actualError)
// 改后
catch (error) {
  let actualError: Error

  if (error instanceof Error) {
    actualError = error
  }
  else {
    actualError = new Error(String(error))
  }

  const wrapped = wrapError(actualError)
```

注：`actualError` 在 if/else 两分支赋值，保留 `let`；`wrapped` 无重新赋值，改 `const`。

- [ ] **Step 3: 收敛文件底部导出**

把 export 区块（当前第 215-225 行）改为仅导出 `HttpRequestClient`：

```ts
export { HttpRequestClient }
```

删除对 `getRetryDelayMs`、`HttpRequestError`、`MAX_ATTEMPTS`、`shouldRetry`、`IHttpRequestClientOptions`、`IRequestClient` 的导出（它们在全项目无外部引用；类内部仍正常使用，无需删定义）。

- [ ] **Step 4: 复核 `getRetryDelayMs` 内三目**

`getRetryDelayMs`（当前第 53-57 行）使用 `Math.min`/`Math.random`，无三目；`shouldRetry`、`isRetryableStatus`、`wrapError` 均用 `if` 提前返回，无三目。仅 Step 2 一处三目，已处理。无额外改动。

- [ ] **Step 5: 更新 `http-client/index.ts` 桶导出路径**

```ts
export * from "./http-request-client"
```

- [ ] **Step 6: 运行验证**

Run: `bun run check`
Expected: PASS（`@/apis/github` 通过 `@/apis/http-client` 桶导入 `HttpRequestClient`，路径不变）

- [ ] **Step 7: Commit**

```bash
git add src/apis/http-client/
git commit -m "refactor(apis/http-client): request 改名、三目改 if、收敛导出"
```

---

## Task 6: 外部访问能力迁入 apis（package-json + prompt）

**Files:**
- Create: `src/apis/package-json/load-package-json-info.ts`（由 `src/tools/load-package-json-info.ts` 迁入）
- Create: `src/apis/package-json/index.ts`
- Create: `src/apis/prompt/platform-skill-prompt.ts`（由 `src/tools/prompt-service.ts` 迁入并改名）
- Create: `src/apis/prompt/index.ts`
- Create: `src/apis/index.ts`
- Delete: `src/tools/load-package-json-info.ts`
- Delete: `src/tools/prompt-service.ts`
- Modify: `src/tools/index.ts`
- Modify: `src/main.ts`（导入路径，Task 9 还会进一步改装配）

**Interfaces:**
- Consumes: `@/errors`、`@/schemas`、`@/types/platform`、`@/types/skill`、`inquirer`、node fs/path/url/process
- Produces:
  - `@/apis/package-json` 导出 `loadPackageJsonInfo(): ReturnType<typeof packageJsonInfoSchema.parse>`
  - `@/apis/prompt` 导出 `getInteractiveTerminal(): boolean`、`promptPlatformList(): Promise<SupportedPlatform[]>`、`promptSkillList(skillIndexEntryList: ISkillIndexEntry[]): Promise<string[]>`、`promptSkillListToUpdate(skillNameList: string[]): Promise<string[]>`
  - `@/apis` 桶聚合 `github` / `http-client` / `package-json` / `prompt`

- [ ] **Step 1: 迁移 `load-package-json-info.ts` 到 `apis/package-json/`**

```bash
mkdir -p src/apis/package-json
git mv src/tools/load-package-json-info.ts src/apis/package-json/load-package-json-info.ts
```

文件内容不变（`@/errors`、`@/schemas` 仍是别名导入，路径有效）。

- [ ] **Step 2: 新建 `apis/package-json/index.ts`**

```ts
export * from "./load-package-json-info"
```

- [ ] **Step 3: 迁移并改名 `prompt-service.ts` 到 `apis/prompt/platform-skill-prompt.ts`**

```bash
mkdir -p src/apis/prompt
git mv src/tools/prompt-service.ts src/apis/prompt/platform-skill-prompt.ts
```

- [ ] **Step 4: `platform-skill-prompt.ts` 把 `getInteractiveTerminal` 用 `Boolean()` 包裹**

第 17-19 行：

```ts
// 改前
function getInteractiveTerminal(): boolean {
  return process.stdin.isTTY && process.stdout.isTTY
}
// 改后
function getInteractiveTerminal(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}
```

（`isTTY` 为 `boolean | undefined`，原写法返回类型与签名不符；`Boolean()` 修正且不违反「判断不写 `=== true/false`」。文件内其余 `let answers` 无重新赋值，顺带改 `const`：第 31、61、91 行。）

- [ ] **Step 5: 新建 `apis/prompt/index.ts`**

```ts
export * from "./platform-skill-prompt"
```

- [ ] **Step 6: 新建 `apis/index.ts` 聚合桶导出**

```ts
export * from "./github"
export * from "./http-client"
export * from "./package-json"
export * from "./prompt"
```

- [ ] **Step 7: 更新 `tools/index.ts`，移除已迁出的两项**

```ts
export * from "./display"
export * from "./parse-csv-option-values"
```

- [ ] **Step 8: 更新所有引用方的导入路径**

引用 `loadPackageJsonInfo`、`getInteractiveTerminal`、`promptPlatformList`、`promptSkillList`、`promptSkillListToUpdate` 的文件需从 `@/tools` 改为 `@/apis`。受影响文件与改法：

`src/main.ts` 第 7 行：

```ts
// 改前
import { loadPackageJsonInfo } from "@/tools"
// 改后
import { loadPackageJsonInfo } from "@/apis"
```

`src/commands/install/command.ts` 第 8 行：

```ts
// 改前
import { getInteractiveTerminal, promptPlatformList, promptSkillList, renderSummaryDisplay } from "@/tools"
// 改后
import { getInteractiveTerminal, promptPlatformList, promptSkillList } from "@/apis"
import { renderSummaryDisplay } from "@/tools"
```

`src/commands/list/command.ts` 第 8 行：

```ts
// 改前
import { getInteractiveTerminal, promptPlatformList, renderComparisonTableDisplay } from "@/tools"
// 改后
import { getInteractiveTerminal, promptPlatformList } from "@/apis"
import { renderComparisonTableDisplay } from "@/tools"
```

`src/commands/update/command.ts` 第 8 行：

```ts
// 改前
import { getInteractiveTerminal, promptPlatformList, promptSkillListToUpdate, renderSummaryDisplay } from "@/tools"
// 改后
import { getInteractiveTerminal, promptPlatformList, promptSkillListToUpdate } from "@/apis"
import { renderSummaryDisplay } from "@/tools"
```

注：用 Grep 复核 `from "@/tools"` 中是否还混入这五个符号，确保无遗漏。

- [ ] **Step 9: 运行验证**

Run: `bun run check`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/apis/ src/tools/ src/main.ts src/commands/
git commit -m "refactor(apis): 文件系统与终端交互能力迁入 apis、prompt-service 改名"
```

---

## Task 7: features 串行循环、catch 守卫、集合命名、私有 @example、parser 函数化

**Files:**
- Modify: `src/features/skill/parsers/skill-document.ts`
- Modify: `src/features/skill/skill-installer.ts`
- Modify: `src/features/skill/skill-comparator.ts`
- Modify: `src/features/source/github-skill-source.ts`
- Modify: `src/features/platform/platform-resolver.ts`

**Interfaces:**
- Consumes: `@/apis/github`（`githubApi`）、`@/errors`、`@/types/*`、node fs/path、`gray-matter`、`semver`
- Produces:
  - `skill-document.ts` 改为导出 `parseFrontmatter(skillDocumentContent: string): ISkillFrontmatter` 与 `parseSkillVersion(skillDocumentContent: string): string` 两个具名函数（取代 `SkillDocumentParser` 类）
  - `buildComparisonRows(skillIndexEntryList: ISkillIndexEntry[], platformTargetList: IPlatformTarget[]): ISkillComparisonRow[]`、`buildUpdateRows(comparisonRowList: ISkillComparisonRow[]): ISkillComparisonRow[]`、`buildUpdateSkillNames(comparisonRowList): string[]`、`buildSelectedRows(comparisonRowList, selectedSkillNameList): ISkillComparisonRow[]`（签名去 readonly、集合改名）
  - `SkillInstaller.updateSkillDirectory(skillsDirectoryPath, skillIndexEntry, downloadedSkillFileList)` 去 readonly
  - `GitHubSkillSource` 方法签名 `validateRemoteSkillVersion(skillIndexEntry, loadedSkillFileList?)` 去 readonly

- [ ] **Step 1: `skill-document.ts` 把类改为两个具名函数**

完整改写（保留 `parseFrontmatter` 的 `@example`，因为它被 `skill-installer`/`github-skill-source`/`skill-comparator` 跨文件调用；`parseSkillVersion` 同样可复用，保留 `@example`）：

```ts
import type { ISkillFrontmatter } from "@/types/skill"

import matter from "gray-matter"
import { AppError, AppErrorCode } from "@/errors"
import { skillFrontmatterSchema } from "@/schemas"

/**
 * 解析技能文档 frontmatter。
 *
 * @param skillDocumentContent - 技能文档内容。
 * @returns 解析后的 frontmatter 结构。
 * @throws frontmatter 格式不正确时抛出 {@link AppError}。
 *
 * @example
 * parseFrontmatter("---\nname: yeizi-demo\nversion: 1.0.0\n---") => { name: "yeizi-demo", version: "1.0.0" }
 */
function parseFrontmatter(skillDocumentContent: string): ISkillFrontmatter {
  try {
    const frontmatterResult = matter(skillDocumentContent)

    return skillFrontmatterSchema.parse(frontmatterResult.data)
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
      AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID,
      { cause },
    )
  }
}

/**
 * 解析技能版本号。
 *
 * @param skillDocumentContent - 技能文档内容。
 * @returns 技能版本号。
 * @throws frontmatter 格式不正确时抛出 {@link AppError}。
 *
 * @example
 * parseSkillVersion("---\nname: yeizi-demo\nversion: 1.0.0\n---") => "1.0.0"
 */
function parseSkillVersion(skillDocumentContent: string): string {
  return parseFrontmatter(skillDocumentContent).version
}

export { parseFrontmatter, parseSkillVersion }
```

注：原 `let frontmatterResult` 改 `const`；`let cause` 在 if/else 赋值，保留 `let`。

- [ ] **Step 2: 确认 `features/skill/parsers/index.ts` 桶导出仍生效**

当前内容 `export * from "./skill-document"` 不变（现在导出两个函数而非类，桶导出自动适配）。无需改动。

- [ ] **Step 3: `skill-comparator.ts` 改用 parse 函数、集合改名、去 readonly、删无状态实例**

改 import（第 11、13 行）：

```ts
// 改前
import { SkillDocumentParser } from "./parsers/skill-document"

const skillDocumentParser = new SkillDocumentParser()
// 改后
import { parseSkillVersion } from "./parsers/skill-document"
```

`buildComparisonRows` 签名（第 25-28 行）去 readonly、集合改名：

```ts
function buildComparisonRows(
  skillIndexEntryList: ISkillIndexEntry[],
  platformTargetList: IPlatformTarget[],
): ISkillComparisonRow[] {
  return platformTargetList.flatMap(platformTarget =>
    skillIndexEntryList.map((skillIndexEntry) => {
```

第 58 行调用改为函数：

```ts
// 改前
let localSkillVersion = skillDocumentParser.parseSkillVersion(
  readFileSync(localSkillDocumentPath, "utf8"),
)
// 改后
const localSkillVersion = parseSkillVersion(
  readFileSync(localSkillDocumentPath, "utf8"),
)
```

第 61 行 `let statusMessage` 在 if 分支会被重新赋值，保留 `let`。

`buildUpdateRows`（第 97 行）、`buildUpdateSkillNames`（第 114 行）参数 `comparisonRows`→`comparisonRowList`（去 readonly）：

```ts
function buildUpdateRows(comparisonRowList: ISkillComparisonRow[]): ISkillComparisonRow[] {
  return comparisonRowList.filter(
    comparisonRow =>
      comparisonRow.statusMessage === SkillComparisonStatus.UPDATE_AVAILABLE
      || comparisonRow.statusMessage === SkillComparisonStatus.LOCAL_SKILL_INVALID,
  )
}
```

```ts
function buildUpdateSkillNames(comparisonRowList: ISkillComparisonRow[]): string[] {
  return Array.from(new Set(comparisonRowList.map(comparisonRow => comparisonRow.skillName)))
}
```

`buildSelectedRows`（第 128-135 行）参数去 readonly、集合改名：

```ts
function buildSelectedRows(
  comparisonRowList: ISkillComparisonRow[],
  selectedSkillNameList: string[],
): ISkillComparisonRow[] {
  const selectedSkillNameSet = new Set(selectedSkillNameList)

  return comparisonRowList.filter(comparisonRow => selectedSkillNameSet.has(comparisonRow.skillName))
}
```

（`@example` 内字段值不变。`let selectedSkillNameSet` 改 `const`。）

- [ ] **Step 4: `skill-installer.ts` 改用 parse 函数、catch 守卫、去 readonly、reduce 块变量改名**

改 import（第 9 行）并删除类字段（第 18 行）：

```ts
// 改前
import { SkillDocumentParser } from "./parsers/skill-document"
// 改后
import { parseSkillVersion } from "./parsers/skill-document"
```

删除第 15-18 行的字段声明：

```ts
// 删除这段
/**
 * 技能文档解析器实例。
 */
private readonly skillDocumentParser = new SkillDocumentParser()
```

`updateSkillDirectory` 签名第 35 行去 readonly + 集合改名：

```ts
public async updateSkillDirectory(
  skillsDirectoryPath: string,
  skillIndexEntry: ISkillIndexEntry,
  downloadedSkillFileList: IDownloadedSkillFile[],
): Promise<void> {
  const skillDocumentFile = downloadedSkillFileList.find(
    downloadedSkillFile => downloadedSkillFile.relativeFilePath === "SKILL.md",
  )
```

第 47 行调用改函数：

```ts
// 改前
let downloadedSkillVersion = this.skillDocumentParser.parseSkillVersion(skillDocumentFile.fileContents)
// 改后
const downloadedSkillVersion = parseSkillVersion(skillDocumentFile.fileContents)
```

第 76-82 行 catch 用类型守卫（去 `as`）：

```ts
// 改前
catch (error) {
  let renameError = error as NodeJS.ErrnoException

  if (renameError.code !== "ENOENT") {
    throw error
  }
}
// 改后
catch (error) {
  if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
    throw error
  }

  if (!(error instanceof Error)) {
    throw error
  }
}
```

注：原逻辑是「`code !== "ENOENT"` 才重抛，`ENOENT` 吞掉」。改写后语义等价——非 Error 一律重抛；是 Error 且有 code 且非 ENOENT 时重抛；其余（ENOENT 或无 code 的 Error）吞掉。`writeDownloadedSkillFiles` 的 `private` 方法签名第 134 行同样去 readonly + 集合改名。

第 132-155 行 `writeDownloadedSkillFiles` 保留 `reduce(async …, Promise.resolve())` 串行结构（按确认作为串行 await 例外），仅做参数集合改名与 `const` 修正：

```ts
private async writeDownloadedSkillFiles(
  stagingSkillDirectoryPath: string,
  downloadedSkillFileList: IDownloadedSkillFile[],
): Promise<void> {
  await downloadedSkillFileList.reduce(async (previousStep, downloadedSkillFile) => {
    await previousStep

    const destinationFilePath = resolve(stagingSkillDirectoryPath, downloadedSkillFile.relativeFilePath)
    const relativeFilePath = relative(stagingSkillDirectoryPath, destinationFilePath)

    if (
      relativeFilePath === ""
      || relativeFilePath.startsWith("..")
      || isAbsolute(relativeFilePath)
    ) {
      throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
        params: { relativeFilePath: downloadedSkillFile.relativeFilePath },
      })
    }

    await mkdir(dirname(destinationFilePath), { recursive: true })
    await writeFile(destinationFilePath, downloadedSkillFile.fileContents, "utf8")
  }, Promise.resolve())
}
```

注：原 `let destinationFilePath`/`let relativeFilePath` 无重新赋值，改 `const`；reduce 结构不变。

并更新第 67-70 行对该方法的调用，传参名改 `downloadedSkillFileList`（实参变量名 `downloadedSkillFiles` 是 `updateSkillDirectory` 的参数，已在 Step 4 改名，调用处用新名）：

```ts
await this.writeDownloadedSkillFiles(
  stagingSkillDirectoryPath,
  downloadedSkillFileList,
)
```

注：`updateSkillDirectory` 内 `let hasMovedTargetDirectoryToBackup`、`let hasMovedStagingDirectoryToTarget`、`let canRemoveTemporaryRootDirectory` 会被重新赋值，保留 `let`；`let temporaryRootDirectoryPath`、`let stagingSkillDirectoryPath`、`let targetSkillDirectoryPath`、`let backupSkillDirectoryPath` 无重新赋值，改 `const`；catch 内 `let cause` 在 if/else 赋值保留 `let`。

- [ ] **Step 5: `github-skill-source.ts` 改 parse 函数、私有方法去 @example、去 readonly、reduce 块变量改名**

改 import（第 11 行）并删字段（第 17-20 行）：

```ts
// 改前
import { parseSkillIndex, SkillDocumentParser } from "@/features/skill"
// 改后
import { parseSkillIndex, parseSkillVersion } from "@/features/skill"
```

删除第 17-20 行的 `skillDocumentParser` 字段声明。

第 43 行 `loadSkillFiles` 内 `let loadedGitHubFiles`→`const`、集合名保留语义；第 47 行 `loadedGitHubFiles.map` 不变（非串行 await，是同步 map）。

`validateRemoteSkillVersion` 签名第 71-74 行去 readonly + 集合改名：

```ts
public async validateRemoteSkillVersion(
  skillIndexEntry: ISkillIndexEntry,
  loadedSkillFileList?: IDownloadedSkillFile[],
): Promise<void> {
  let resolvedLoadedSkillFileList = loadedSkillFileList

  if (resolvedLoadedSkillFileList === undefined) {
    resolvedLoadedSkillFileList = await this.loadSkillFiles(skillIndexEntry.name)
  }

  const skillDocumentFile = resolvedLoadedSkillFileList.find(
    loadedSkillFile => loadedSkillFile.relativeFilePath === "SKILL.md",
  )
```

（`resolvedLoadedSkillFileList` 在 if 分支重新赋值，保留 `let`。）

第 91 行调用改函数：

```ts
// 改前
let remoteSkillVersion = this.skillDocumentParser.parseSkillVersion(skillDocumentFile.fileContents)
// 改后
const remoteSkillVersion = parseSkillVersion(skillDocumentFile.fileContents)
```

第 100-108 行私有方法 `loadGitHubFileEntries` 删 `@example`：

```ts
/**
 * 按数组顺序加载 GitHub 目录下的全部文件内容。
 *
 * @param githubContentPath - GitHub 仓库内的目录路径。
 * @returns 路径和内容组成的文件列表。
 */
```

第 112-123 行 `loadGitHubFileEntries` 保留 `reduce<Promise<…>>(async …, Promise.resolve([]))` 串行结构（按确认作为串行 await 例外），仅做变量集合改名与 `const` 修正：

```ts
private async loadGitHubFileEntries(
  githubContentPath: string,
): Promise<Array<{ path: string, fileContents: string }>> {
  const githubContentEntryList = await githubApi.loadContentsEntries(githubContentPath)

  return githubContentEntryList.reduce<Promise<Array<{ path: string, fileContents: string }>>>(
    async (accumulator, githubContentEntry) => {
      const accumulatedFileList = await accumulator
      const loadedForEntryList = await this.loadGitHubFileEntry(githubContentEntry)

      return [...accumulatedFileList, ...loadedForEntryList]
    },
    Promise.resolve([]),
  )
}
```

注：`loadGitHubFileEntry` 私有方法（第 132 行起）已无 `@example`，保持不变；其内 `let fileContents`→`const`。

- [ ] **Step 6: `platform-resolver.ts` 私有函数去 @example、集合改名、去 readonly**

`buildPlatformTargets` 签名第 45-47 行去 readonly + 集合改名：

```ts
function buildPlatformTargets(
  selectedPlatformNameList: SupportedPlatform[],
): IPlatformTarget[] {
  return selectedPlatformNameList.map((platformName) => {
    const skillsDirectoryPath = join(homedir(), platformDirectoryNames[platformName], "skills")

    return {
      platformName,
      skillsDirectoryPath,
      hasSkillsDirectory: existsSync(skillsDirectoryPath),
    }
  })
}
```

`parsePlatforms` 内第 21 行 `let parsedPlatformNames`→`const parsedPlatformNameList`，并更新第 23 行引用；第 24 行 `let parsedPlatformNameResult`→`const`：

```ts
function parsePlatforms(platformOptionValue: string | undefined): SupportedPlatform[] {
  const parsedPlatformNameList = parseCsvOptionValues(platformOptionValue)

  return parsedPlatformNameList.map((platformName) => {
    const parsedPlatformNameResult = supportedPlatformNameSchema.safeParse(platformName)

    if (parsedPlatformNameResult.success) {
      return parsedPlatformNameResult.data
    }

    throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
      params: { platformName },
    })
  })
}
```

第 59-89 行私有函数 `parseCsvOptionValues`（未在底部 `export {}` 中）删 `@example`，并集合改名 + const：

```ts
/**
 * 解析逗号分隔选项值。
 *
 * @param csvOptionValue - 逗号分隔的选项字符串。
 * @returns 去重后的字符串列表。
 * @throws 选项为空或格式不合法时抛出 {@link AppError}。
 */
function parseCsvOptionValues(csvOptionValue: string | undefined): string[] {
  if (csvOptionValue === undefined) {
    return []
  }

  const validatedOptionValueResult = csvOptionValueSchema.safeParse(csvOptionValue)

  if (!validatedOptionValueResult.success) {
    throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
  }

  const parsedOptionValueList = Array.from(new Set(validatedOptionValueResult.data
    .split(",")
    .map(optionValue => optionValue.trim())
    .filter(optionValue => optionValue.length > 0)))

  if (parsedOptionValueList.length === 0) {
    throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)
  }

  return parsedOptionValueList
}
```

注：该文件存在一个与 `@/tools/parse-csv-option-values` 重复的私有 `parseCsvOptionValues`。本任务不合并（属另一议题），仅按规则修正其注释与命名。

- [ ] **Step 7: 运行验证**

Run: `bun run check`
Expected: PASS（`skill-comparator`/`skill-installer`/`github-skill-source` 改用 `parseFrontmatter`/`parseSkillVersion` 函数，且 `command.ts` 调用 `updateSkillDirectory`/`validateRemoteSkillVersion` 的实参类型兼容——传入的是普通数组，去 readonly 后兼容）

- [ ] **Step 8: Commit**

```bash
git add src/features/
git commit -m "refactor(features): parser 函数化、catch 守卫、集合命名、去 readonly、reduce 块变量改名"
```

---

## Task 8: types/command 集合命名

**Files:**
- Modify: `src/types/command/command.ts`

**Interfaces:**
- Consumes: `ICommandOptionDefinition`（同目录）
- Produces: `ICommand` 接口的 `options` 字段改名为 `optionList`（Task 9 的命令类实现同步改字段名）

- [ ] **Step 1: `command.ts` 把 `options` 字段改 `optionList`**

第 24 行（当前）：

```ts
// 改前
readonly options: readonly ICommandOptionDefinition[]
// 改后
readonly optionList: readonly ICommandOptionDefinition[]
```

注：接口字段上的 `readonly` 是 TS 只读修饰，CLAUDE.md「参数签名不写 readonly」约束的是**函数参数**，接口字段只读属性不在此列，保留。仅改集合命名。

- [ ] **Step 2: 运行验证（预期失败，提示实现类未改）**

Run: `bun run check`
Expected: FAIL — `InstallCommand`/`ListCommand`/`UpdateCommand` 仍声明 `options`，TS 报 `optionList` 缺失。这是预期的，Task 9 修复。

注：Task 8 与 Task 9 共同构成「`options`→`optionList` 改名」一个完整可验证交付。若按 subagent-driven 分派，Task 8 不单独提交，与 Task 9 合并验证后提交。

- [ ] **Step 3: 不单独提交，进入 Task 9**

---

## Task 9: commands 压平分层、装配上移、串行 await、布尔命名、optionList 落地

**Files:**
- Create: `src/commands/install/command-options.ts`（由 `install/types/install-command-options.ts` 内容上移）
- Create: `src/commands/list/command-options.ts`
- Create: `src/commands/update/command-options.ts`
- Delete: `src/commands/install/types/`（整目录）
- Delete: `src/commands/list/types/`（整目录）
- Delete: `src/commands/update/types/`（整目录）
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/list/command.ts`
- Modify: `src/commands/update/command.ts`
- Modify: `src/commands/install/index.ts`
- Modify: `src/commands/list/index.ts`
- Modify: `src/commands/update/index.ts`
- Modify: `src/commands/index.ts`
- Delete: `src/commands/register-commands.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `@/apis`、`@/errors`、`@/features/*`、`@/tools`、`@/types`、`commander`
- Produces:
  - 各命令目录 `command-options.ts` 导出 `IInstallCommandOptions`/`IListCommandOptions`/`IUpdateCommandOptions`
  - `@/commands` 导出 `InstallCommand`/`ListCommand`/`UpdateCommand`（不再导出 `registerCommands`）
  - `main.ts` 内部完成命令注册装配（不再从 `@/commands` 导入 `registerCommands`）

- [ ] **Step 1: 上移三个命令选项类型文件**

```bash
git mv src/commands/install/types/install-command-options.ts src/commands/install/command-options.ts
git mv src/commands/list/types/list-command-options.ts src/commands/list/command-options.ts
git mv src/commands/update/types/update-command-options.ts src/commands/update/command-options.ts
```

三个文件内容不变（各含一个 interface，`@/types` 别名导入有效）。

- [ ] **Step 2: 删除空的 types 子目录**

```bash
rm -rf src/commands/install/types src/commands/list/types src/commands/update/types
```

- [ ] **Step 3: 更新三个命令目录的 `index.ts`**

`src/commands/install/index.ts`：

```ts
export * from "./command"
export * from "./command-options"
```

`src/commands/list/index.ts`：

```ts
export * from "./command"
export * from "./command-options"
```

`src/commands/update/index.ts`：

```ts
export * from "./command"
export * from "./command-options"
```

（复核三个原 index.ts 当前内容若为 `export * from "./command"` 与 `export * from "./types"`，把 `./types` 改为 `./command-options`。）

- [ ] **Step 4: `install/command.ts` 改导入、optionList、布尔命名、reduce 块变量改名**

第 2 行 import 类型路径改为 `./command-options`：

```ts
import type { IInstallCommandOptions } from "./command-options"
```

第 35 行字段 `options`→`optionList`：

```ts
public readonly optionList: readonly ICommandOptionDefinition[] = [
```

第 63 行布尔变量加 `is` 前缀，并更新第 73、91 行引用：

```ts
const isInteractiveTerminal = getInteractiveTerminal()
```
```ts
if (!isInteractiveTerminal) {
```

第 88 行 `let skillIndex` 显式类型（消除 evolving-any）：

```ts
// 改前
let skillIndex
// 改后
let skillIndex: ISkillIndex | undefined
```

并在第 9-16 行类型导入块补 `ISkillIndex`：

```ts
import {
  ICommand,
  ICommandOptionDefinition,
  IDownloadedSkillFile,
  IPlatformTarget,
  ISkillIndex,
  ISkillIndexEntry,
  SupportedPlatform,
} from "@/types"
```

第 136-140 行 `register` 内 `this.options.forEach` 改 `this.optionList.forEach`：

```ts
const installCommand = program.command(this.command).description(this.description)

this.optionList.forEach((optionDefinition) => {
  installCommand.option(optionDefinition.flags, optionDefinition.description)
})
```

（`this.optionList.forEach` 是同步遍历、无 await，符合「同步循环用数组方法」，保留。`let installCommand`→`const`。）

模块级 `installSkills`（第 159 行）与 `installToPlatforms`（第 197 行）的 `summaryMessages` 参数改名 `summaryMessageList`，保留第 166、204 行的 `reduce(async …, Promise.resolve())` 串行结构（按确认作为串行 await 例外），仅做参数/变量改名与 `const` 修正：

`installSkills` 改写：

```ts
async function installSkills(
  platformTarget: IPlatformTarget,
  selectedSkillEntryList: ISkillIndexEntry[],
  loadedSkillFileListByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessageList: string[],
): Promise<void> {
  await selectedSkillEntryList.reduce(async (previousStep, skillIndexEntry) => {
    await previousStep

    const loadedSkillFileList = loadedSkillFileListByName.get(skillIndexEntry.name)

    if (loadedSkillFileList === undefined) {
      throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
        params: { skillName: skillIndexEntry.name },
      })
    }

    await skillInstaller.updateSkillDirectory(
      platformTarget.skillsDirectoryPath,
      skillIndexEntry,
      loadedSkillFileList,
    )
    summaryMessageList.push(`已为平台“${platformTarget.platformName}”安装技能“${skillIndexEntry.name}”。`)
  }, Promise.resolve())
}
```

`installToPlatforms` 改写：

```ts
async function installToPlatforms(
  platformTargetList: IPlatformTarget[],
  selectedSkillEntryList: ISkillIndexEntry[],
  loadedSkillFileListByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessageList: string[],
): Promise<void> {
  await platformTargetList.reduce(async (previousStep, platformTarget) => {
    await previousStep

    if (!platformTarget.hasSkillsDirectory) {
      summaryMessageList.push(`已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`)
    }
    else {
      await installSkills(
        platformTarget,
        selectedSkillEntryList,
        loadedSkillFileListByName,
        skillInstaller,
        summaryMessageList,
      )
    }
  }, Promise.resolve())
}
```

`execute` 内（第 105-127 行）相应变量与调用同步改名：`platformTargets`→`platformTargetList`、`selectedSkillEntries`→`selectedSkillEntryList`、`loadedSkillFilesByName`→`loadedSkillFileListByName`、`summaryMessages`→`summaryMessageList`，并把这些 `let` 中无重新赋值的改 `const`（`platformTargetList`、`resolvedSkillIndex`、`selectedSkillEntryList`、`loadedSkillFileListByName`、`summaryMessageList` 均 const）。`selectedSkillNames`→`selectedSkillNameList` 会被重新赋值，保留 `let`。`selectedPlatformNames`→`selectedPlatformNameList` 会被重新赋值，保留 `let`。`requestedSkillNames`→`requestedSkillNameList`、`requestedPlatformNames`→`requestedPlatformNameList` 改 `const`。`renderSummaryDisplay("安装完成", summaryMessageList)`。

注：因 Task 3 已把 `renderSummaryDisplay` 第二参数改名为 `summaryMessageList`（仅形参名，传参按位置兼容），此处实参变量名独立，无强制要求，但为一致性统一改名。

- [ ] **Step 5: `list/command.ts` 改导入、optionList、布尔命名**

第 2 行：

```ts
import type { IListCommandOptions } from "./command-options"
```

第 28 行：

```ts
public readonly optionList: readonly ICommandOptionDefinition[] = [
```

第 47 行布尔加前缀，更新第 52 行引用：

```ts
const isInteractiveTerminal = getInteractiveTerminal()
```
```ts
if (!isInteractiveTerminal) {
```

第 48-49 行 `requestedPlatformNames`/`selectedPlatformNames` 改名为 `requestedPlatformNameList`/`selectedPlatformNameList`（后者重新赋值保留 let，前者 const），第 65-67 行 `skillIndex`/`platformTargets`/`comparisonRows`→`const skillIndex`/`platformTargetList`/`comparisonRowList`。第 78-82 行 `register` 内 `this.options`→`this.optionList`，`let listCommand`→`const`。第 69 行 `renderComparisonTableDisplay("技能列表", comparisonRowList)`。

- [ ] **Step 6: `update/command.ts` 改导入、optionList、布尔命名、函数改名、reduce 块变量改名**

第 2 行：

```ts
import type { IUpdateCommandOptions } from "./command-options"
```

第 35 行：

```ts
public readonly optionList: readonly ICommandOptionDefinition[] = [
```

第 63 行布尔加前缀，更新第 68、89 行引用：

```ts
const isInteractiveTerminal = getInteractiveTerminal()
```

模块级函数 `updateRows`（第 187 行）与局部变量 `updateRows`（第 101 行）同名两义——把**函数**改名为 `updateSkillsForPlatform`（表达真实动作）。第 256 行调用处同步改名。

`execute` 内变量改名与 const 化：`requestedPlatformNames`→`requestedPlatformNameList`(const)、`selectedPlatformNames`→`selectedPlatformNameList`(let，重新赋值)、`requestedSkillNames`→`requestedSkillNameList`(const)、`platformTargets`→`platformTargetList`(const)、`comparisonRows`→`comparisonRowList`(const)、`updateRows`(局部)→`updateRowList`(const)、`selectedSkillNames`→`selectedSkillNameList`(let)、`requestedSkillEntries`→`requestedSkillEntryList`(const)、`selectedRows`→`selectedRowList`(const)、`selectedRowSkillNames`→`selectedRowSkillNameList`(const)、`selectedSkillNameSet`(const)、`selectedSkillEntries`→`selectedSkillEntryList`(const)、`loadedSkillFilesByName`→`loadedSkillFileListByName`(const)、`skippedSkillNames`→`skippedSkillNameList`(const)、`summaryMessages`→`summaryMessageList`(const)。

`updateSkillsForPlatform`（原 `updateRows`，第 187-223 行）保留 `reduce(async …, Promise.resolve())` 串行结构（按确认作为串行 await 例外），仅改名与 `const` 修正：

```ts
async function updateSkillsForPlatform(
  platformTarget: IPlatformTarget,
  matchedRowList: ISkillComparisonRow[],
  selectedSkillEntryList: ISkillIndexEntry[],
  loadedSkillFileListByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessageList: string[],
): Promise<void> {
  await matchedRowList.reduce(async (previousStep, matchedRow) => {
    await previousStep

    const matchedSkillEntry = selectedSkillEntryList.find(
      skillIndexEntry => skillIndexEntry.name === matchedRow.skillName,
    )

    if (matchedSkillEntry === undefined) {
      throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
        params: { skillNameList: [matchedRow.skillName] },
      })
    }

    const loadedSkillFileList = loadedSkillFileListByName.get(matchedSkillEntry.name)

    if (loadedSkillFileList === undefined) {
      throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
        params: { skillName: matchedSkillEntry.name },
      })
    }

    await skillInstaller.updateSkillDirectory(
      platformTarget.skillsDirectoryPath,
      matchedSkillEntry,
      loadedSkillFileList,
    )
    summaryMessageList.push(`已为平台“${platformTarget.platformName}”更新技能“${matchedSkillEntry.name}”。`)
  }, Promise.resolve())
}
```

注：`skillNames`→`skillNameList` 对应 Task 1 改的错误参数字段名。

`updatePlatforms`（第 237-266 行）保留 `reduce(async …, Promise.resolve())` 串行结构，仅改名调用：

```ts
async function updatePlatforms(
  platformTargetList: IPlatformTarget[],
  selectedRowList: ISkillComparisonRow[],
  selectedSkillEntryList: ISkillIndexEntry[],
  loadedSkillFileListByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessageList: string[],
): Promise<void> {
  await platformTargetList.reduce(async (previousStep, platformTarget) => {
    await previousStep

    if (!platformTarget.hasSkillsDirectory) {
      summaryMessageList.push(`已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`)
    }
    else {
      const matchedRowList = selectedRowList.filter(
        selectedRow => selectedRow.platformName === platformTarget.platformName,
      )

      await updateSkillsForPlatform(
        platformTarget,
        matchedRowList,
        selectedSkillEntryList,
        loadedSkillFileListByName,
        skillInstaller,
        summaryMessageList,
      )
    }
  }, Promise.resolve())
}
```

第 162-167 行 `register` 内 `this.options`→`this.optionList`，`let updateCommand`→`const`。`execute` 第 145-152 行调用 `updatePlatforms(platformTargetList, selectedRowList, selectedSkillEntryList, loadedSkillFileListByName, this.skillInstaller, summaryMessageList)`。第 116 行 `buildSelectedSkillEntries` 调用参数名同步。

注：`update/command.ts` 第 6 行从 `@/features/skill` 导入的 `buildComparisonRows`/`buildSelectedRows`/`buildUpdateRows`/`buildUpdateSkillNames` 签名在 Task 7 已去 readonly + 形参改名（仅形参名，按位置传参兼容），调用处无需改动。

- [ ] **Step 7: 装配上移——把 `registerCommands` 并入 `main.ts`**

`src/main.ts` 改写（具名导出 `runCli`、内联注册命令、移除对 `@/commands` 的 `registerCommands` 导入、改用各命令类）：

```ts
import process from "node:process"

import { Command } from "commander"

import { loadPackageJsonInfo } from "@/apis"
import { InstallCommand, ListCommand, UpdateCommand } from "@/commands"
import { AppError, AppErrorCode, handleFatalError } from "@/errors"

/**
 * 创建 CLI 程序实例并注册全部子命令。
 *
 * @returns Commander 程序实例。
 */
function createProgram(): Command {
  const packageJsonInfo = loadPackageJsonInfo()
  const programNameList = Object.keys(packageJsonInfo.bin)

  if (programNameList.length === 0) {
    throw new AppError(AppErrorCode.PACKAGE_BIN_CONFIG_MISSING)
  }

  const program = new Command()

  program.exitOverride()
  program.configureOutput({
    outputError: () => {},
  })
  program.name(programNameList[0])
  program.description(packageJsonInfo.description)
  program.version(packageJsonInfo.version)

  new ListCommand().register(program)
  new InstallCommand().register(program)
  new UpdateCommand().register(program)

  return program
}

/**
 * 运行 CLI 主入口流程。
 */
async function runCli(): Promise<void> {
  try {
    const program = createProgram()

    await program.parseAsync(process.argv)
  }
  catch (error) {
    let normalizedError: Error

    if (error instanceof Error) {
      normalizedError = error
    }
    else {
      normalizedError = new Error(String(error))
    }

    handleFatalError(normalizedError)
  }
}

export { runCli }
```

注：`programNames`→`programNameList`（集合命名）；`let packageJsonInfo`/`let program`→`const`；`let normalizedError` 在 if/else 赋值保留 `let`。装配逻辑（创建 program、注册三个命令）现集中在入口层 `main.ts`。

- [ ] **Step 8: 删除 `register-commands.ts` 并更新 `commands/index.ts`**

```bash
rm src/commands/register-commands.ts
```

`src/commands/index.ts` 改为（移除装配导出，只暴露命令公开能力）：

```ts
export * from "./install"
export * from "./list"
export * from "./update"
```

- [ ] **Step 9: `bin/cli.ts` 改具名导入并统一别名**

```ts
#!/usr/bin/env node

import { runCli } from "@/main"

void runCli()
```

注：确认 `tsconfig.json` 的 `@/*` 别名覆盖 `src/main.ts`，且 `scripts/build.ts` 的 bundler 能解析别名（项目其余文件已统一用 `@/`，bin 入口同样适用）。若构建对入口别名解析有问题（Step 11 验证时暴露），回退为 `import { runCli } from "../main"`。

- [ ] **Step 10: 运行类型与 lint 验证**

Run: `bun run check`
Expected: PASS

- [ ] **Step 11: 运行构建验证**

Run: `bun run build`
Expected: PASS（产物 `dist/index.js` 正常生成，入口 `src/bin/cli.ts` 别名解析成功）

- [ ] **Step 12: Commit**

```bash
git add src/commands/ src/main.ts src/bin/ src/types/command/
git commit -m "refactor(commands): 压平 types 分层、装配上移 main、optionList 与布尔命名、reduce 块变量改名"
```

---

## Task 10: 全量验证与收尾

**Files:**
- 无新增改动；仅验证

- [ ] **Step 1: 全树 `index.ts` 纯桶导出复核**

Run（PowerShell/bash 均可用 Grep 工具）：检查每个 `src/**/index.ts` 仅含 `export` 语句。
逐一确认：`apis/index.ts`、`apis/github/index.ts`、`apis/http-client/index.ts`、`apis/package-json/index.ts`、`apis/prompt/index.ts`、`commands/index.ts` 及三个命令子目录 index、`config/index.ts`、`constants/index.ts`、`errors/index.ts`、`features/**/index.ts`、`schemas/index.ts`、`tools/**/index.ts`、`types/**/index.ts`。
Expected: 全部仅 `export *` / `export { }` / `export type { }`。

- [ ] **Step 2: 残留旧符号与旧路径扫描**

用 Grep 确认无残留：
- `from "./api-configs"`、`from "./request"`、`from "./types"`（commands 下）、`from "../main"`、`register-commands`、`SkillDocumentParser`、`skillDocumentParser`、`@example`（私有函数处已删）、`this.options`（应为 `this.optionList`）、`skillNames:`（应为 `skillNameList:`）。
Expected: 无匹配（或仅匹配到合法用途，如 `skills` 外部契约字段保留）。

注：`reduce(async …)` 串行结构按确认保留，不在扫描清理之列。

- [ ] **Step 3: 运行完整验证链**

Run: `bun run check && bun run build`
Expected: PASS

- [ ] **Step 4: 确认无临时文件残留**

确认本次未产生临时/调试文件。
Expected: `git status` 仅显示预期改动。

- [ ] **Step 5: Commit（如有收尾改动）**

```bash
git add -A
git commit -m "chore: 规则符合性整改全量验证收尾"
```

---

## Self-Review

**1. Spec coverage（审计违规 → 任务映射）：**
- errors 子树 let→const ✅ Task 1
- 私有函数误写 @example（commander-error-adapter ×2、platform-resolver、github-skill-source）✅ Task 1/7
- getAppErrorDefinition 缺 @example ✅ Task 1
- schemas 11 处缺 /** */ ✅ Task 2
- platform-name-schema 改名 ✅ Task 2
- display 去 readonly + 集合命名 ✅ Task 3
- parse-csv 集合命名 ✅ Task 3
- api-configs 改名 constants ✅ Task 4
- GitHubApi/IGitHubApiOptions 收敛导出 ✅ Task 4
- contents-parser 集合命名 ✅ Task 4
- request.ts 改名 + 三目改 if + 收敛导出 ✅ Task 5
- load-package-json-info / prompt-service 迁入 apis ✅ Task 6
- getInteractiveTerminal Boolean() ✅ Task 6
- SkillDocumentParser 类改函数 ✅ Task 7
- skill-installer catch 守卫/集合/readonly/reduce 变量改名 ✅ Task 7
- github-skill-source 私有 @example/集合/readonly/reduce 变量改名 ✅ Task 7
- skill-comparator 集合/readonly/parse 函数 ✅ Task 7
- platform-resolver 私有 @example/集合/readonly ✅ Task 7
- ICommand.options → optionList ✅ Task 8/9
- commands types 压平分层 ✅ Task 9
- registerCommands 装配上移 ✅ Task 9
- main.ts 具名导出 + bin/cli.ts 具名导入 ✅ Task 9
- install/command.ts skillIndex evolving-any ✅ Task 9
- 布尔 interactiveTerminal → is 前缀（3 处）✅ Task 9
- update/command.ts updateRows 同名两义 ✅ Task 9
- install/update reduce 串行块变量改名（保留 reduce 结构，4 处）✅ Task 9

**2. Placeholder scan：** 无 TBD/TODO；每个改码步骤均给出完整代码块。

**3. Type consistency：**
- `skillNames`→`skillNameList`：Task 1 改类型定义，Task 9 改 `update/command.ts` 调用处（`params: { skillNameList: [...] }`）。一致。
- `options`→`optionList`：Task 8 改接口，Task 9 改三个实现类字段与 `this.optionList.forEach`。一致。
- `parseSkillVersion`/`parseFrontmatter`：Task 7 由类方法改具名函数，三处调用方（skill-installer、github-skill-source、skill-comparator）同任务内同步。一致。
- `HttpRequestClient` 构造保留 options 参数：Task 5 收敛导出但不删构造参数，Task 4 仍传 `{ baseURL, timeoutMs }`。一致。
- `@/apis` 桶：Task 6 新建 `apis/index.ts`，Task 4/5 的 github/http-client 已有各自 index，聚合无冲突。

**注（规则口径，已裁决）：** CLAUDE.md statement-rules「禁用关键字循环」一节统一禁用 `for/for...in/for...of/while/do...while`，但未给出「串行 await 的合规写法」。项目现有 6 处用 `reduce(async …, Promise.resolve())` 做串行 await。经用户确认：**保留 `reduce` 串行写法，作为「禁用关键字循环」规则下串行 await 的唯一例外，不改写为 `for...of`。** 本计划据此对这些 reduce 块只做变量改名与 `const` 修正，不动结构。涉及文件：`skill-installer.ts`、`github-skill-source.ts`、`install/command.ts`、`update/command.ts`。
