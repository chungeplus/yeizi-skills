# yeizi-skills v2.1 batch-2 Implementation Plan: domain refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 features/ 与 tools/ 之间的几个通用工具与流程函数，把 A4/A5/A6/F1 落地（spec §3 27 项修复里的 4 项）。

**Architecture:** (A4) install summary builder 改 `Record<SkillInstallStatus, ...>` 形式；(A5) 把 list 命令里内联的 `truncateDescription` 提到 `tools/string/truncate-text.ts` 作为通用工具；(A6) install 命令里的 `batchInstallSkillEntryListToPlatformList` 私有方法名堆词、用 `Promise.all` + `flatMap` 内联到 `execute` 内；(F1) 删除 `types/skill/index.ts` 桶导出中无消费的 `SkillComparisonStatusValue` / `SkillInstallStatusValue` 类型别名。

**Tech Stack:** TypeScript 5 / Bun

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md` §10.4 / §9.5

**Parent commit:** batch-1 ends. This batch expects to start on the post-batch-1 main HEAD.

## Global Constraints

- 项目无单元测试。验证 gate = `cd cli && bun run typecheck && bun run lint`（必须全过）。
- 严格遵守 cli/CLAUDE.md 全部规则：命名（动作+对象函数名、`List`/`Map` 后缀）；TypeScript（对象式枚举、禁 `any`/`unknown`/`as`、`as const` 例外）；语句（禁三目、禁 `switch`、禁关键字循环）；目录（只有最小目录做桶导出、桶具名再导出）。
- 严禁 `git add -A` 或 `git add <dir>/`；每次精确文件路径。
- 类型镜像 (`SkillEntry` 全项目单一名词) 在 batch-1 已固化；不在本批再变名字。
- A4 Record 分发表里**保持行为不变**——只是控制流从 if-return 链改为 Record lookup + single return。
- A5 `truncateText` 是**通用文本截断**工具、**不耦合 description 概念**——参数名是 `text: string` 不是 `description: string`。
- A6 inline batch 后、原本的 `(platform × skill)` 笛卡尔乘积行为不变；只是从"抽出私有方法 + for 嵌套循环"变成"在 execute 函数体内 flatMap + Promise.all"。

---

## File Structure（batch-2 涉及）

**Modify:**
- `cli/src/commands/install/command.ts`（A4 + A6）
- `cli/src/commands/list/command.ts`（A5：私有方法 → 改成工具调用）
- `cli/src/tools/string/truncate-text.ts`（A5：新文件，但需要 `git add` — 务必注意"新文件未跟踪"状态）

**Create:**
- `cli/src/tools/string/truncate-text.ts`（A5 新文件；TSDoc 完整、export `truncateText`）

**Modify (桶):**
- `cli/src/tools/string/index.ts`（A5：加 `truncateText` 桶导出）
- `cli/src/types/skill/index.ts`（F1：删 `SkillComparisonStatusValue` / `SkillInstallStatusValue` 桶导出）

---

### Task 2.1: A5 — 把 `truncateDescription` 提到 `tools/string/truncate-text.ts`

**Files:**
- Create: `cli/src/tools/string/truncate-text.ts`
- Modify: `cli/src/commands/list/command.ts`（删私有 method，改用工具调用）
- Modify: `cli/src/tools/string/index.ts`（桶加 export）

**Interfaces:**
- Consumes: 无（leaf 工具）
- Produces:
  ```typescript
  function truncateText(text: string, truncateLimit: number): string
  // 返回：长度 ≤ truncateLimit 时原样；超出时取前 truncateLimit 字符 + 省略号
  ```

**Why:** 通用能力不应内联在业务 class 里。`truncateDescription` 名字本身耦合 description 概念，应改为 `truncateText`。ListCommand 仍私有 `descriptionTruncateLimit = 60`，调用时传 60。

- [ ] **Step 1: Read `cli/src/commands/list/command.ts` 全文**，定位现有 `truncateDescription` 方法 + `descriptionTruncateLimit` 字段

- [ ] **Step 2: 新建 `cli/src/tools/string/truncate-text.ts`**

```typescript
/**
 * 把文本按 {@link truncateLimit} 字符数截断，超出部分尾部追加省略号。
 *
 * @param text - 原始文本。
 * @param truncateLimit - 最大字符数。文本长度超过该值时会被截断。
 * @returns 截断后的展示文本；未超过时原样返回。
 *
 * @example
 * ```typescript
 * truncateText("简短", 60) // "简短"
 * ```
 *
 * @example
 * ```typescript
 * truncateText("非常长".repeat(100), 5) // "非常长非…"
 * ```
 */
function truncateText(text: string, truncateLimit: number): string {
  if (text.length <= truncateLimit) {
    return text
  }

  return `${text.slice(0, truncateLimit)}…`
}

export { truncateText }
```

- [ ] **Step 3: 修改 `cli/src/tools/string/index.ts` 加桶 export**

```typescript
export { splitCsvString } from "./split-csv"
export { truncateText } from "./truncate-text"
```

- [ ] **Step 4: 修改 `cli/src/commands/list/command.ts`**

- 删私有 `truncateDescription` 方法（含方法体）
- 保留 `descriptionTruncateLimit = 60` 字段
- 在 `renderComparisonTable` 的 `bodyRowList.map(...)` 中把 `this.truncateDescription(comparisonRowItem.description)` 改成 `truncateText(comparisonRowItem.description, this.descriptionTruncateLimit)`
- 文件顶部加 `import { truncateText } from "@/tools/string"`
- `renderComparisonTable` 函数体内调用点改完即可

新相关代码段：
```typescript
import { truncateText } from "@/tools/string"

// ... 在 renderComparisonTable 内
const bodyRowList = comparisonRowList.map(comparisonRowItem => [
  comparisonRowItem.platformName,
  comparisonRowItem.skillName,
  comparisonRowItem.statusMessage,
  truncateText(comparisonRowItem.description, this.descriptionTruncateLimit),
])
```

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -10
```

Expected: 本任务文件 0 错（可能保留 batch-1 遗留的下游错）。

- [ ] **Step 6: lint**

```bash
cd cli && bun run lint src/commands/list/ src/tools/string/
```

Expected: 0 error。

- [ ] **Step 7: Commit**

```bash
git add cli/src/tools/string/truncate-text.ts cli/src/tools/string/index.ts cli/src/commands/list/command.ts
git commit -m "refactor(tools/string): extract truncateText from list command

把 'truncateDescription' 提到 tools/string/ 作为通用 'truncateText' 工具。
通用工具不耦合 description 概念，参数 'text'/'truncateLimit' 与业务解耦。
ListCommand.renderComparisonTable 改为调用工具。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2.2: A4 + A6 — install summary Record 分发表 + batchInstall inline

**Files:**
- Modify: `cli/src/commands/install/command.ts`

**Interfaces:**
- Consumes: `SkillInstallResult`、`SkillInstallStatus` from `@/types/skill`
- Produces:
  - `const installStatusMessageBuilderByStatus: Record<SkillInstallStatus, (resultItem: SkillInstallResult) => string>` 模块级私有 const（在 file 底部 export 处之前）
  - `private buildInstallSummaryMessageList(resultList: SkillInstallResult[]): string[]`（保留私有方法、内部分发改为 `installStatusMessageBuilderByStatus[item.status](item)`）
  - 私有方法 `batchInstallSkillEntryListToPlatformList` 删除
  - `execute` 内对应那行改为 `await Promise.all(...)` flatMap 版

**Why:**
- A4：3 个 if-return 段对单一 status 判断 → Record 分发表（CLAUDE.md 精神 + 行为不变）
- A6：私有方法名堆词 "batchInstallSkillEntryListToPlatformList"、内含 for 嵌套循环 + await，inline 后结构清晰

- [ ] **Step 1: Read `cli/src/commands/install/command.ts` 全文**，定位：
  - `buildInstallSummaryMessageList` 当前 3 个 if-return 段
  - `batchInstallSkillEntryListToPlatformList` 当前实现 + 它的调用点
  - 顶部 imports
  - 文件底部 exports

- [ ] **Step 2: 修改顶部 imports**

确认以下 imports 已在文件顶部；如有缺失，按需加：
```typescript
import type { SkillEntry, SkillInstallResult } from "@/types/skill"
import { SkillInstallStatus } from "@/types/skill"
```

- [ ] **Step 3: 删除 `batchInstallSkillEntryListToPlatformList` 私有方法**

整段删除（含方法签名、TSDoc、函数体 8-15 行）。

- [ ] **Step 4: 修改 `buildInstallSummaryMessageList` 用 Record 分发表**

**注意**：当前文件可能已有 `Record<...>` 版本（如果 implementer 在批 1/2 已看到），需要核对。如当前已分发表则跳过本步。

新内容（保留私有方法签名、改内部实现）：

```typescript
/**
 * 把批量安装结果转换成展示用的中文汇总消息列表。
 *
 * @param resultList - 批量安装结果列表。
 * @returns 中文汇总消息列表，顺序与 `resultList` 一致。
 */
private buildInstallSummaryMessageList(resultList: SkillInstallResult[]): string[] {
  return resultList.map((resultItem) =>
    installStatusMessageBuilderByStatus[resultItem.status](resultItem),
  )
}
```

- [ ] **Step 5: 添加 `installStatusMessageBuilderByStatus` 模块级 const**

在 `buildInstallSummaryMessageList` 私有方法**之前**（按文件位置：先 helper、后调用方法）添加：

```typescript
/**
 * 按 SkillInstallStatus 分发的安装结果消息构造函数。
 */
const installStatusMessageBuilderByStatus: Record<
  SkillInstallStatus,
  (resultItem: SkillInstallResult) => string
> = {
  success: (resultItem) =>
    `已为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"。`,
  "no-change": (resultItem) =>
    `平台"${resultItem.platformName}"上的技能"${resultItem.skillName}"无变化、已跳过。`,
  failed: (resultItem) =>
    `为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"失败：${resultItem.error.message}`,
}
```

**位置建议**：放在 class 定义之前、文件顶部 imports 之后，作为模块级 const。

- [ ] **Step 6: 修改 `execute` 内调用点**

原 call：
```typescript
const installResultList = await this.batchInstallSkillEntryListToPlatformList(
  selectedSkillEntryList,
  selectedPlatformList,
  repositoryDirectoryPath,
)
```

替换为（CLAUDE.md 三目禁 + 关键字循环禁 + 并发异步）：
```typescript
const installResultList = await Promise.all(
  selectedSkillEntryList.flatMap(skillEntryItem =>
    selectedPlatformList.map(platformItem =>
      copySkillEntryToPlatformItem(
        skillEntryItem,
        platformItem,
        repositoryDirectoryPath,
      ),
    ),
  ),
)
```

- [ ] **Step 7: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -10
```

Expected: 本任务文件 0 错。

- [ ] **Step 8: lint**

```bash
cd cli && bun run lint src/commands/install/
```

Expected: 0 error。

- [ ] **Step 9: Commit**

```bash
git add cli/src/commands/install/command.ts
git commit -m "refactor(commands/install): use Record dispatch + inline batch install

- A4: buildInstallSummaryMessageList 改用模块级
  installStatusMessageBuilderByStatus Record 分发表替原 if-return 链。
  各 status 的 builder 函数签名声明具体 params 类型、
  入参由 (resultItem) 自然收窄、无任何 as 断言。
- A6: 删 batchInstallSkillEntryListToPlatformList 私有方法名堆词；
  execute 内改用 Promise.all + flatMap (技能 × 平台) 笛卡尔。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2.3: F1 — 清理桶导出无消费的 *Value 类型

**Files:**
- Modify: `cli/src/types/skill/index.ts`（删 2 行桶导出）

**Why:** `SkillComparisonStatusValue` / `SkillInstallStatusValue` 是 batch-1 用来让类型名区分用 `as` 引入的别名。batch-1 后已不需要——值直接走 `SkillComparisonStatus`（从 `@/constants/skill`），类型按 spec §10.4 改叫 `SkillComparisonStatusType`（在 `@/types/error/types.ts` 那个语义层面用）。此处桶里的 *Value 是 batch-1 旧实现残留。

- [ ] **Step 1: Read `cli/src/types/skill/index.ts` 全文**，确认当前导出形态

- [ ] **Step 2: grep 确认无外部使用方**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -rn "SkillComparisonStatusValue\|SkillInstallStatusValue" cli/src/
```

Expected: 仅 `cli/src/types/skill/index.ts` 这一处出现。

- [ ] **Step 3: 删除 2 行桶导出**

找到形如：
```typescript
export { SkillComparisonStatus as SkillComparisonStatusValue } from "./comparison"
export { SkillInstallStatus as SkillInstallStatusValue } from "./install-result"
```

如存在，**整段删除**（含上行 + 下行，以及任何相关的 `import` 行）。

如类型文件旧版里还有类似 `export { SkillComparisonStatusType } from "./comparison"`，也一并删除。

- [ ] **Step 4: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -10
```

Expected: 0 error（本任务文件相关）。

- [ ] **Step 5: Commit**

```bash
git add cli/src/types/skill/index.ts
git commit -m "chore(types/skill): remove unused *Value aliases from barrel

batch-1 重构后、所有调用方直接用 SkillComparisonStatus / SkillInstallStatus（值常量名），
或用 AppErrorCodeType / SkillEntry[name] 等更精确类型。这两个 *Value 别名无消费。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-2）

- ✅ Task 2.1-2.3 全过
- ✅ `cd cli && bun run check` 全过（可能下游 batch-1 引用方还要适配，但本批内部必过）
- ✅ 全部 commit 落到 `main` 分支
- ✅ `bun run lint src/commands/install/ src/commands/list/ src/tools/string/ src/types/skill/` 0 error