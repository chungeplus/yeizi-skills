# 规则符合性整改（第二轮，service 结构）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按当前 CLAUDE.md，修复 `cli/src` 当前树（含新 `service/` 层）的明确规则违规，并完成两项已确认的结构调整：`service/` 改名去空泛词、外部访问能力集中。

**Architecture:** 三段——(1) 叶子级纯修复（命名/注释/类型标注，零连锁）；(2) 签名收紧与出参重构（局部，影响 1-2 调用方）；(3) 结构调整（CSV 去重收口、外部访问能力集中、`service/` 改名连锁，放最后一次性同步路径）。每段后跑 `bun run check` 验证。

**Tech Stack:** TypeScript 5.8、Bun、Commander、zod、axios、inquirer、ESLint（@antfu，prefer-const 已开启强制）。

## Global Constraints

- 不重赋值用 `const`；模块导出写文件底部；`index.ts` 仅桶导出（`export *`/`export {}`/`export type {}`）。
- 集合命名 `XxxList`，Map/Set 用描述性命名（`xxxMap`/`xxxSet`）；布尔用 `is`/`has`/`can`。
- 参数签名不写 `readonly`，函数内不原地修改参数承载的数据。
- 只有可复用（被别文件调用）的函数/方法写 `@example`；私有函数、入口流程函数不写。
- 串行 `await` 保留 `reduce(async …, Promise.resolve())`（本项目已裁决例外，不改 `for...of`）。
- `catch` 先类型守卫收窄，不裸 `as`。
- 外部访问能力（fs、网络、终端交互）全项目集中在统一访问层，私有模块/工具层不承载。
- 命名不用空泛词（`service`/`common`/`util`/`manager`）；目录角色不重复到文件名。
- 日志与错误信息中文；命令名/路径/字段名保留原文。
- 验证：`bun run check`（tsc + eslint）必须 EXIT 0；构建 `bun run build`。
- **本轮不做的边界项**（用户已裁决「只修明确违规」）：`skill-installer` 类→函数、`repository-config.ts`/`error-code.ts`/`command-summary.ts`/`csv-option-value.ts` 改名、`skill-manifest.ts` schema 拆分、`skill-comparison.ts` 文案拆分、校验落点统一、`error-code.ts` 的 `as` 判别联合重构、`fatal-error-handler` 的 `@example`、schemas/types 平行重复。这些不在本计划范围，不要顺手做。

## 新访问层命名约定

`service/` 改名为 **`external-access/`**（语义、完整词、直指「访问外部系统」）。下属保持 `apis/github/` 与 `request/`。外部访问能力集中后，该层还将接收从 `tools/` 迁入的 fs 访问与终端交互。
> 若用户在审阅时希望用别的名字（如 `gateways`），只需把本计划中所有 `external-access` 字样替换即可。

---

## Task 1: 叶子级纯命名/注释/类型修复

**Files:**
- Modify: `src/service/request/http-request-client.ts`
- Modify: `src/errors/commander-error-adapter.ts`
- Modify: `src/constants/platform-directory-names.ts`
- Modify: `src/features/skill/builders/selected-skill-entry.ts`
- Modify: `src/features/skill/parsers/skill-name.ts`
- Modify: `src/commands/install/command.ts`

**Interfaces:**
- Consumes: 无跨任务依赖
- Produces: `HttpRequestError.isRetryable`（取代 `retryable`，仅本文件内引用）；其余为文件内修正

- [ ] **Step 1: `http-request-client.ts` 布尔 `retryable`→`isRetryable`**

涉及当前行：17（字段）、19/23（构造参数与赋值）、30（`@param`）、34/38（`shouldRetry` 参数与 return）、133（`wrapped.retryable` 读取）。把这一组 `retryable` 统一改 `isRetryable`：

```ts
// 字段
public readonly isRetryable: boolean
// 构造函数
public constructor(message: string, status: number | null, isRetryable: boolean, options?: { cause?: Error }) {
  super(message, options)
  this.name = "HttpRequestError"
  this.status = status
  this.isRetryable = isRetryable
}
// shouldRetry
function shouldRetry(isRetryable: boolean, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS) {
    return false
  }
  return isRetryable
}
// 第 133 行读取
if (attempt >= MAX_ATTEMPTS || !shouldRetry(wrapped.isRetryable, attempt)) {
```

注：`isRetryableStatus`（函数名）已合规不动；`new HttpRequestError(..., isRetryableStatus(status), ...)` 的传参位置不变（实参是 `isRetryableStatus(...)` 的返回值）。`@param retryable` 改为 `@param isRetryable`。

- [ ] **Step 2: `commander-error-adapter.ts` Record 命名**

第 14 行类型 `CommanderMessageBuilders`→`CommanderMessageBuilderMap`；第 57 行变量 `builders`→`messageBuilderMap`（含其后 `messageBuilderMap[...]` 引用全部同步）。这是 Record 映射，用 `Map` 后缀表意。

- [ ] **Step 3: `platform-directory-names.ts` 注释改准确**

成员取值是 `.codex`/`.claude`/`.trae`（平台在用户主目录下的根目录段），skills 目录由 `platform-resolver` 用 `join(home, 段, "skills")` 另拼。把对象注释与各成员注释从「skills 目录名」改为准确描述，如：

```ts
/**
 * 各平台在用户主目录下的根目录段（后续再拼接 skills 子目录）。
 */
```
成员注释同理改为「<平台> 在用户主目录下的根目录段」。不改键名/取值/变量名（变量名归类问题属本轮不做的边界项）。

- [ ] **Step 4: `selected-skill-entry.ts` 去元组重建**

第 25 行当前：`params: { skillNameList: [missingSkillNameList[0], ...missingSkillNameList.slice(1)] as [string, ...string[]] }`。该处上方已有 `if (missingSkillNameList.length > 0)` 校验，直接断言即可：

```ts
params: { skillNameList: missingSkillNameList as [string, ...string[]] },
```

- [ ] **Step 5: `skill-name.ts` 可选参数对齐**

第 13 行 `function parseSkillNames(skillOptionValue?: string)` 改为与 `parsePlatforms`/`parseCsvOptionValues` 一致的 `string | undefined`：

```ts
function parseSkillNames(skillOptionValue: string | undefined): string[] {
```

- [ ] **Step 6: `install/command.ts` platform 守卫对齐 + evolving-any 标注**

(a) 第 65-71 行 install 自建 `if (commandOptions.platform !== undefined)` 守卫 + 中间变量，与 list/update 不一致。`parsePlatforms` 本就接受 `string | undefined`，对齐为：

```ts
const requestedPlatformNameList = parsePlatforms(commandOptions.platform)
let selectedPlatformNameList = requestedPlatformNameList
```
（删除多余的 undefined 判断与中间赋值，保留后续 `if (selectedPlatformNameList.length === 0)` 分支。）

(b) 第 83 行 `let skillManifest` 隐式 evolving-any，显式标注（`ISkillManifest` 从 `@/types` 导入，确认导入块已含或补上）：

```ts
let skillManifest: ISkillManifest | undefined
```

- [ ] **Step 7: 验证**

Run: `cd "C:/Users/yeizi/Desktop/yeizi-skills/cli" && bun run check`
Expected: EXIT 0（typecheck + eslint 全过）

- [ ] **Step 8: Commit（本会话不提交则跳过，按用户 main 上改不提交惯例）**

---

## Task 2: 补 TSDoc

**Files:**
- Modify: `src/service/apis/github/github-api.ts`
- Modify: `src/service/request/http-request-client.ts`

**Interfaces:**
- Consumes: Task 1 的 `isRetryable` 改名（同文件）
- Produces: 无签名变化

- [ ] **Step 1: `github-api.ts` 三个公开方法补 TSDoc**

`loadSkillManifest`、`loadContentsEntries`、`loadRawFileContent` 当前无 `/** */`。它们是被 `github-skill-source` 复用的对外方法，补 `@param`（有参的）/`@returns`/`@example`：

```ts
/**
 * 加载远端技能清单。
 *
 * @returns 远端技能清单。
 *
 * @example
 * githubApi.loadSkillManifest() => Promise<ISkillManifest>
 */
async loadSkillManifest(): Promise<ISkillManifest> {
```
```ts
/**
 * 加载仓库指定路径下的目录条目。
 *
 * @param path - 仓库内目录路径。
 * @returns 归一化后的目录条目列表。
 *
 * @example
 * githubApi.loadContentsEntries("yeizi-demo") => Promise<IGitHubContentsEntry[]>
 */
async loadContentsEntries(path: string): Promise<IGitHubContentsEntry[]> {
```
```ts
/**
 * 加载仓库内原始文件内容。
 *
 * @param rawFileUrl - raw 文件下载地址。
 * @returns 文件文本内容。
 *
 * @example
 * githubApi.loadRawFileContent("https://raw.githubusercontent.com/...") => Promise<string>
 */
async loadRawFileContent(rawFileUrl: string): Promise<string> {
```
（按文件实际方法签名/类名调整；若是 class 方法带 `public` 修饰则保留。）

- [ ] **Step 2: `http-request-client.ts` 两个公开方法补 TSDoc**

`loadJson`、`loadText`（当前约 195/202 行）补 `@param url`/`@returns`/`@example`：

```ts
/**
 * 加载并返回 JSON 响应。
 *
 * @param url - 请求地址。
 * @returns 反序列化后的 JSON 数据。
 *
 * @example
 * client.loadJson<ISkillManifest>("https://...") => Promise<ISkillManifest>
 */
public async loadJson<T>(url: string): Promise<T> {
```
```ts
/**
 * 加载并返回文本响应。
 *
 * @param url - 请求地址。
 * @returns 响应文本。
 *
 * @example
 * client.loadText("https://...") => Promise<string>
 */
public async loadText(url: string): Promise<string> {
```
注：`loadJson<T>` 的泛型是「输入推导输出」的合法用法（调用方决定返回类型），不在本轮泛型整改范围。

- [ ] **Step 3: 验证**

Run: `bun run check`
Expected: EXIT 0

- [ ] **Step 4: Commit（同上，跳过）**

---

## Task 3: 签名收紧与内联类型抽取（features/source）

**Files:**
- Modify: `src/features/source/github-skill-source.ts`
- Modify: `src/types/source/skill-source.ts`

**Interfaces:**
- Consumes: 无
- Produces: `ISkillSource.validateRemoteSkillVersion(skillManifestEntry, loadedSkillFileList)` 参数改必传（删除 optional）；`github-skill-source` 内新增文件私有 `interface IGitHubFileEntry { path: string; fileContents: string }`

- [ ] **Step 1: 抽取内联匿名类型**

`github-skill-source.ts` 中 `{ path: string, fileContents: string }` 在返回值与 reduce 泛型处重复 3 次（约 103/106/126 行）。在文件顶部（import 之后、class 之前）定义文件私有 interface，并在文件底部统一导出区不导出它（保持私有）：

```ts
/**
 * GitHub 目录下单个文件的路径与内容。
 */
interface IGitHubFileEntry {
  path: string
  fileContents: string
}
```
把三处 `Array<{ path: string, fileContents: string }>` 改为 `IGitHubFileEntry[]`，`Promise<Array<{...}>>` 改为 `Promise<IGitHubFileEntry[]>`。
> 落点说明：该类型只在本文件用，按「类型内容：只在单文件用就留当前文件」留在 `github-skill-source.ts` 内，不导出、不进 `@/types`。

- [ ] **Step 2: `validateRemoteSkillVersion` 参数改必传**

当前 `loadedSkillFileList?: IDownloadedSkillFile[]` 可选 + undefined 时自加载分支（约 66-74 行），但两个调用方（`install/command.ts`、`update/command.ts`）都已传入文件列表，自加载分支死代码。改为必传并删兜底：

```ts
public async validateRemoteSkillVersion(
  skillManifestEntry: ISkillManifestEntry,
  loadedSkillFileList: IDownloadedSkillFile[],
): Promise<void> {
  const skillDocumentFile = loadedSkillFileList.find(...)
  // 删除原 `let resolvedLoadedSkillFileList = ...; if (undefined) { ... = await this.loadSkillFiles(...) }` 整段
  ...
}
```

- [ ] **Step 3: 同步接口 `ISkillSource`**

`src/types/source/skill-source.ts` 的 `validateRemoteSkillVersion` 签名把 `loadedSkillFileList?` 的 `?` 去掉，改必传：

```ts
validateRemoteSkillVersion: (
  skillManifestEntry: ISkillManifestEntry,
  loadedSkillFileList: IDownloadedSkillFile[],
) => Promise<void>
```
（核对当前接口里的参数名，与实现保持一致。）

- [ ] **Step 4: 验证**

Run: `bun run check`
Expected: EXIT 0（两个调用方本就传参，不应报错；若报"缺参数"说明有第三调用方，按必传补齐）

- [ ] **Step 5: Commit（跳过）**

---

## Task 4: commands 出参重构（消除原地 push）

**Files:**
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/update/command.ts`

**Interfaces:**
- Consumes: Task 1 Step 6 对 install 的改动（同文件，注意基于最新内容编辑）
- Produces: `installSkills`/`installToPlatforms`/`updateSkillsOnPlatform`/`updatePlatforms` 改为返回 `string[]`，不再接收可变 `summaryMessageList` 出参

- [ ] **Step 1: `install/command.ts` helper 改返回值**

当前 `installSkills`、`installToPlatforms` 接收 `summaryMessageList: string[]` 并 `.push()`（原地改入参，违反「函数内不原地修改参数承载数据」）。改为收集并返回新数组。

`installSkills` 改写（保留 reduce 串行结构，用累加器收集消息）：

```ts
async function installSkills(
  platformTarget: IPlatformTarget,
  selectedSkillEntryList: ISkillManifestEntry[],
  loadedSkillFileMap: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
): Promise<string[]> {
  return selectedSkillEntryList.reduce(async (previousStep, skillManifestEntry) => {
    const messageList = await previousStep

    const loadedSkillFileList = loadedSkillFileMap.get(skillManifestEntry.name)

    if (loadedSkillFileList === undefined) {
      throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
        params: { skillName: skillManifestEntry.name },
      })
    }

    await skillInstaller.updateSkillDirectory(
      platformTarget.skillsDirectoryPath,
      skillManifestEntry,
      loadedSkillFileList,
    )
    return [...messageList, `已为平台“${platformTarget.platformName}”安装技能“${skillManifestEntry.name}”。`]
  }, Promise.resolve<string[]>([]))
}
```

`installToPlatforms` 改写（聚合各平台返回的消息）：

```ts
async function installToPlatforms(
  platformTargetList: IPlatformTarget[],
  selectedSkillEntryList: ISkillManifestEntry[],
  loadedSkillFileMap: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
): Promise<string[]> {
  return platformTargetList.reduce(async (previousStep, platformTarget) => {
    const messageList = await previousStep

    if (!platformTarget.hasSkillsDirectory) {
      return [...messageList, `已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`]
    }

    const platformMessageList = await installSkills(
      platformTarget,
      selectedSkillEntryList,
      loadedSkillFileMap,
      skillInstaller,
    )
    return [...messageList, ...platformMessageList]
  }, Promise.resolve<string[]>([]))
}
```

`execute` 内调用处改为接收返回值（删掉 `const summaryMessageList: string[] = []` 出参写法）：

```ts
const summaryMessageList = await installToPlatforms(
  platformTargetList,
  selectedSkillEntryList,
  loadedSkillFileMap,
  this.skillInstaller,
)

renderSummaryDisplay("安装完成", summaryMessageList)
```

注：原 `loadedSkillFilesByName` 是 Map，按 Map 描述命名规则可保留原名或统一为 `loadedSkillFileMap`；若改名需同步 execute 内构造处与全部引用。**保守起见保留现有 `loadedSkillFilesByName` 名**（Map 命名属合法例外），只动 push→return。上面示例的 `loadedSkillFileMap` 按文件现有变量名替换。

- [ ] **Step 2: `update/command.ts` helper 改返回值**

`updateSkillsOnPlatform`、`updatePlatforms` 同样的 `.push()` 反模式（约 175-211、225-254 行）。同 install 模式改为返回 `string[]`：`updateSkillsOnPlatform` 用 reduce 累加器收集「已更新」消息并返回；`updatePlatforms` 聚合各平台消息返回。

`execute` 内当前 `summaryMessageList` 先由 `skippedSkillNameList.map(...)` 初始化（跳过消息），再传入 `updatePlatforms` 被 push。改为：

```ts
const skippedMessageList = skippedSkillNameList.map(
  skippedSkillName => `已跳过技能“${skippedSkillName}”，因为它当前没有可用更新。`,
)

const updatedMessageList = await updatePlatforms(
  platformTargetList,
  selectedRowList,
  selectedSkillEntryList,
  loadedSkillFilesByName,
  this.skillInstaller,
)

renderSummaryDisplay("更新完成", [...skippedMessageList, ...updatedMessageList])
```

`updateSkillsOnPlatform` 改写（保留 reduce 串行，累加器收集）：

```ts
async function updateSkillsOnPlatform(
  platformTarget: IPlatformTarget,
  matchedRowList: ISkillComparisonRow[],
  selectedSkillEntryList: ISkillManifestEntry[],
  loadedSkillFilesByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
): Promise<string[]> {
  return matchedRowList.reduce(async (previousStep, matchedRow) => {
    const messageList = await previousStep

    const matchedSkillEntry = selectedSkillEntryList.find(
      skillManifestEntry => skillManifestEntry.name === matchedRow.skillName,
    )

    if (matchedSkillEntry === undefined) {
      throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
        params: { skillNameList: [matchedRow.skillName] },
      })
    }

    const loadedSkillFileList = loadedSkillFilesByName.get(matchedSkillEntry.name)

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
    return [...messageList, `已为平台“${platformTarget.platformName}”更新技能“${matchedSkillEntry.name}”。`]
  }, Promise.resolve<string[]>([]))
}
```

`updatePlatforms` 改写（聚合，跳过消息也并入返回，或如上由 execute 拼接——二选一保持一致；推荐 `updatePlatforms` 只管「更新/跳过平台」消息，execute 拼接 skipped-skill 消息）：

```ts
async function updatePlatforms(
  platformTargetList: IPlatformTarget[],
  selectedRowList: ISkillComparisonRow[],
  selectedSkillEntryList: ISkillManifestEntry[],
  loadedSkillFilesByName: Map<string, IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
): Promise<string[]> {
  return platformTargetList.reduce(async (previousStep, platformTarget) => {
    const messageList = await previousStep

    if (!platformTarget.hasSkillsDirectory) {
      return [...messageList, `已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`]
    }

    const matchedRowList = selectedRowList.filter(
      selectedRow => selectedRow.platformName === platformTarget.platformName,
    )
    const platformMessageList = await updateSkillsOnPlatform(
      platformTarget,
      matchedRowList,
      selectedSkillEntryList,
      loadedSkillFilesByName,
      skillInstaller,
    )
    return [...messageList, ...platformMessageList]
  }, Promise.resolve<string[]>([]))
}
```

更新两个 helper 的 TSDoc：删掉 `@param summaryMessageList ...（原地追加）`，加 `@returns 安装/更新过程产生的中文汇总消息列表`。

- [ ] **Step 3: 验证**

Run: `bun run check`
Expected: EXIT 0

- [ ] **Step 4: Commit（跳过）**

---

## Task 5: CSV 拆分去重收口

**Files:**
- Modify: `src/tools/parse-csv-option-values.ts`
- Modify: `src/features/platform/platform-resolver.ts`
- Modify: `src/features/skill/parsers/skill-name.ts`

**Interfaces:**
- Consumes: 无
- Produces: `parseCsvOptionValues(csvOptionValue: string | undefined): string[]` 改为「只拆分去重、不抛业务错误」——移除硬编码的 `PLATFORM_OPTION_EMPTY`，空结果返回 `[]`，由调用方判空抛各自错误码

- [ ] **Step 1: `tools/parse-csv-option-values.ts` 去业务错误码，纯化**

当前它硬编码 `PLATFORM_OPTION_EMPTY`，导致 platform/skill 无法复用而各自抄了一份。改为纯拆分工具（不依赖 `@/errors`、不抛业务错误）：

```ts
import { csvOptionValueSchema } from "@/schemas"

/**
 * 拆分逗号分隔的选项值为去重后的非空字符串列表。
 *
 * @param csvOptionValue - 逗号分隔的选项字符串；undefined 视为无输入。
 * @returns 去重后的字符串列表；无输入或全空时返回空列表。
 *
 * @example
 * parseCsvOptionValues("codex,claude") => ["codex", "claude"]
 * parseCsvOptionValues(undefined) => []
 */
function parseCsvOptionValues(csvOptionValue: string | undefined): string[] {
  if (csvOptionValue === undefined) {
    return []
  }

  const parsedResult = csvOptionValueSchema.safeParse(csvOptionValue)

  if (!parsedResult.success) {
    return []
  }

  return Array.from(new Set(parsedResult.data
    .split(",")
    .map(optionValue => optionValue.trim())
    .filter(optionValue => optionValue.length > 0)))
}

export { parseCsvOptionValues }
```
> 落点：CSV 拆分被 platform 与 skill 两个模块共用 → 属服务多模块的工具，留在全局 `tools/` 正确（它是纯处理、无外部访问，不进访问层）。保留 `tools/index.ts:3` 的桶导出。

- [ ] **Step 2: `platform-resolver.ts` 删本地副本，复用 tools 版**

删除文件内私有 `parseCsvOptionValues`（约 65-86 行）。`parsePlatforms` 改为 import 并复用，空判由 `parsePlatforms` 自己做：

```ts
import { parseCsvOptionValues } from "@/tools"
```
`parsePlatforms` 内：

```ts
function parsePlatforms(platformOptionValue: string | undefined): SupportedPlatform[] {
  const parsedPlatformNameList = parseCsvOptionValues(platformOptionValue)

  if (parsedPlatformNameList.length === 0) {
    // 原逻辑：空选项不抛错时返回空列表交由命令层处理；保持与改前对外行为一致
    return []
  }

  return parsedPlatformNameList.map((platformName) => {
    ...
  })
}
```
> **关键校验**：改前 `parseCsvOptionValues` 在空时抛 `PLATFORM_OPTION_EMPTY`。需确认 `parsePlatforms` 的调用方（命令层）对「空平台」的预期：当前命令层在 `selectedPlatformNameList.length === 0` 时走交互 prompt 或抛 `*_PLATFORM_REQUIRED`。因此 `parsePlatforms` 返回 `[]` 而非抛错，与命令层现有分支兼容。实施时先 grep `PLATFORM_OPTION_EMPTY` 确认无其它依赖该抛错路径的地方；若有，保留在 `parsePlatforms` 内判空抛出。

- [ ] **Step 3: `skill-name.ts` 复用 tools 版拆分**

`parseSkillNames` 内联的 split/trim/filter/Set 去重（约 18-31 行）改为复用 `parseCsvOptionValues`，空判抛 `SKILL_OPTION_EMPTY`、逐项校验仍抛 `SKILL_OPTION_INVALID`：

```ts
import { parseCsvOptionValues } from "@/tools"

function parseSkillNames(skillOptionValue: string | undefined): string[] {
  const parsedSkillNameList = parseCsvOptionValues(skillOptionValue)

  if (skillOptionValue !== undefined && parsedSkillNameList.length === 0) {
    throw new AppError(AppErrorCode.SKILL_OPTION_EMPTY)
  }

  return parsedSkillNameList.map((skillName) => {
    const parsedSkillNameResult = skillNameSchema.safeParse(skillName)

    if (parsedSkillNameResult.success) {
      return parsedSkillNameResult.data
    }

    throw new AppError(AppErrorCode.SKILL_OPTION_INVALID)
  })
}
```
> 注意保持改前行为：`skillOptionValue === undefined` 时返回 `[]`（不抛）；有值但拆分后为空才抛 `SKILL_OPTION_EMPTY`。`csvOptionValueSchema` 不再在 skill-name 直接用，移除其 import（保留 `skillNameSchema`）。

- [ ] **Step 4: 验证 + 行为核对**

Run: `bun run check`
Expected: EXIT 0
额外核对：grep `PLATFORM_OPTION_EMPTY`、`SKILL_OPTION_EMPTY` 确认错误码仍被正确抛出路径覆盖（没有变成永不触发的死错误码）。

- [ ] **Step 5: Commit（跳过）**

---

## Task 6: 外部访问能力集中 + service 改名（结构调整，连锁放最后）

**Files:**
- Rename(dir): `src/service/` → `src/external-access/`
- Move: `src/tools/load-package-json-info.ts` → `src/external-access/package-json/load-package-json-info.ts` + 新建 `src/external-access/package-json/index.ts`
- Move: `src/tools/platform-skill-prompt.ts` → `src/external-access/prompt/platform-skill-prompt.ts` + 新建 `src/external-access/prompt/index.ts`
- Modify: `src/external-access/index.ts`（聚合 apis/request/package-json/prompt）
- Modify: `src/tools/index.ts`（移除迁出项）
- Modify: 所有引用 `@/service`、以及从 `@/tools` 引 `loadPackageJsonInfo`/prompt 符号的文件

**Interfaces:**
- Consumes: 前 5 个 task 已完成
- Produces: `@/external-access` 作为统一外部访问层入口；`@/service` 路径消失

- [ ] **Step 1: 目录改名 `service`→`external-access`**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills/cli" && mv src/service src/external-access
```
（用 `mv` 不用 `git mv`，本会话不提交。）

- [ ] **Step 2: 更新内部相对/别名引用**

`external-access/apis/github/github-api.ts` 内 `import { HttpRequestClient } from "@/service/request"` → `from "@/external-access/request"`。
grep `@/service` 全仓，逐个改为 `@/external-access`。已知点：`features/source/github-skill-source.ts:11`（`@/service/apis/github`→`@/external-access/apis/github`）、`github-api.ts:4`。

- [ ] **Step 3: 迁移 fs 访问能力（load-package-json-info）**

```bash
mkdir -p src/external-access/package-json
mv src/tools/load-package-json-info.ts src/external-access/package-json/load-package-json-info.ts
```
新建 `src/external-access/package-json/index.ts`：

```ts
export { loadPackageJsonInfo } from "./load-package-json-info"
```
（`load-package-json-info.ts` 内的 `@/errors`、`@/schemas` 别名导入不受目录移动影响，无需改。）

- [ ] **Step 4: 迁移终端交互能力（platform-skill-prompt）**

```bash
mkdir -p src/external-access/prompt
mv src/tools/platform-skill-prompt.ts src/external-access/prompt/platform-skill-prompt.ts
```
新建 `src/external-access/prompt/index.ts`：

```ts
export { getInteractiveTerminal, promptPlatformList, promptSkillList, promptSkillListToUpdate } from "./platform-skill-prompt"
```
（其内 `@/errors`、`@/types/*` 别名导入不受影响。）

- [ ] **Step 5: 更新 `external-access/index.ts` 聚合桶导出**

```ts
export * from "./apis"
export * from "./package-json"
export * from "./prompt"
export * from "./request"
```
> 注：`apis/index.ts` 与 `request/index.ts` 的门面瘦身（只暴露 `githubApi`/`HttpRequestClient`）属 Debatable 项，本轮不做。

- [ ] **Step 6: 更新 `tools/index.ts`（移除迁出项）**

```ts
export { renderComparisonTableDisplay, renderSummaryDisplay } from "./display"
export { parseCsvOptionValues } from "./parse-csv-option-values"
```
（删掉 `load-package-json-info` 与 `platform-skill-prompt` 两行。）

- [ ] **Step 7: 更新消费方导入**

- `src/main.ts`：`import { loadPackageJsonInfo } from "@/tools"` → `from "@/external-access"`。
- `src/commands/install/command.ts`：prompt 相关符号（`getInteractiveTerminal`/`promptPlatformList`/`promptSkillList`）从 `@/tools` 改 `@/external-access`；`renderSummaryDisplay` 仍 `@/tools`。
- `src/commands/list/command.ts`：`getInteractiveTerminal`/`promptPlatformList` 改 `@/external-access`；`renderComparisonTableDisplay` 仍 `@/tools`。
- `src/commands/update/command.ts`：`getInteractiveTerminal`/`promptPlatformList`/`promptSkillListToUpdate` 改 `@/external-access`；`renderSummaryDisplay` 仍 `@/tools`。
grep 复核：`from "@/tools"` 的所有行不再含 `loadPackageJsonInfo`/`getInteractiveTerminal`/`promptPlatformList`/`promptSkillList`/`promptSkillListToUpdate`。

- [ ] **Step 8: features 内散落 fs 访问的处理（说明）**

`skill-comparator.ts`（`existsSync`/`readFileSync`）与 `skill-installer.ts`（`mkdir`/`rename`/`rm`/`writeFile`）的 fs 访问与业务编排（版本比较、原子安装）强耦合，抽离为统一 fs 访问能力会割裂事务逻辑、属过度抽象。**本轮不迁移这两处**，仅在此记录为已知张力（与用户「迁出 tools 集中」的范围一致——集中的是 tools 里独立的访问能力，不含与业务强耦合的 fs 操作）。不改动这两个文件。

- [ ] **Step 9: 验证**

Run: `bun run check`
Expected: EXIT 0
grep 复核：`@/service` 全仓 0 命中；`src/tools/` 下无 `load-package-json-info.ts`/`platform-skill-prompt.ts`。

- [ ] **Step 10: 构建验证**

Run: `bun run build`
Expected: EXIT 0（产物正常生成）

- [ ] **Step 11: Commit（跳过）**

---

## Self-Review

**1. Spec coverage（synthesis 明确违规 → task 映射）：**
- isRetryable 命名 ✅ T1
- github-api / http-request-client TSDoc ✅ T2
- CSV 三重复去重 ✅ T5
- validateRemoteSkillVersion 必传 ✅ T3
- 内联 {path,fileContents} interface ✅ T3
- skill-name 可选参数对齐 ✅ T1
- selected-skill-entry 元组重建 ✅ T1
- summaryMessageList 原地 push ✅ T4
- install evolving-any ✅ T1
- install platform 守卫对齐 ✅ T1
- platform-directory-names 注释 ✅ T1
- commander Record 命名 ✅ T1
- service 改名（用户裁决 yes）✅ T6
- 外部访问能力集中（用户裁决 yes）✅ T6

**2. 用户裁决「不做」的边界项**：已在 Global Constraints 明列，各 task 不触碰。

**3. Placeholder scan：** 无 TBD；每个改码步骤含完整代码或精确改法。

**4. Type consistency：**
- `isRetryable`：T1 改字段+构造+shouldRetry+读取，同文件闭环。
- `validateRemoteSkillVersion` 必传：T3 同步实现与 `ISkillSource` 接口。
- `parseCsvOptionValues` 纯化：T5 改工具 + 2 调用方，错误码语义（空判落到调用方）已核对。
- `external-access` 路径：T6 改名 + 全部 `@/service`/迁出符号引用一次性同步，放最后避免连锁断裂。

**5. 顺序**：T1-5 不动目录结构（叶子→签名→出参→去重），T6 一次性做改名+迁移连锁，符合「改名连锁放最后」。每 task 以 `bun run check` 为关。

**6. 并发风险提示**：本项目工作树历史上被外部进程并行重构过。实施每个 task 前先确认目标文件近期无外部改动（`find src -mmin -2`），编辑前 Read 最新内容；遇 "file modified since read" 重新 Read 再改。
