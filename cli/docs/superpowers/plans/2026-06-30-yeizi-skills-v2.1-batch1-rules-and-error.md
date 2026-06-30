# yeizi-skills v2.1 batch-1 Implementation Plan: rules & error cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 v2 重构遗留的 5 项规则违反与 1 项死代码错误码（spec §3 的 A1, A2, A3, A7, C1）。

**Architecture:** 重写 `tools/package-json/load-info.ts:25` 去掉 `unknown` 兜底中间变量；`error/commander-adapter.ts:100` 用 `if (null) return defaultMessage` 替非空断言；`error/definitions.ts` 与 `types/error/` 重新组织去掉 `as AppErrorCodeValues`、让 `AppErrorCodeType` 与 `AppErrorCode` 各走其名；三处同步删除 `REMOTE_SKILL_DOCUMENT_INVALID` 错误码。

**Tech Stack:** TypeScript 5 / Bun / zod

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`

**Parent commit:** `814abede` (spec commit; this batch only touches types/errors/tools)

## Global Constraints

- 项目无单元测试基础设施。验证 gate = `cd cli && bun run typecheck && bun run lint`（必须全过）。
- 严格遵守 cli/CLAUDE.md 全部规则：命名（小写中划线文件名、`List`/`Map`/`Set` 后缀、`Item` 单项、`selected` 前缀、`is`/`has`/`can` 布尔前缀、动作+对象函数名）；TypeScript（`const` 对象式枚举、`interface` 对象类型、禁 `any`/`unknown`/`as`、`as const` 例外）；语句（禁三目、禁 `switch`、禁关键字循环，串行异步用 `for...of` + `await`）；目录（types/ 镜像、schemas/ 镜像、features/ 业务、tools/ 通用、只有最小目录做桶导出）。
- 桶导出类型与值同时导出，`import type` 与 `import` 分开。
- 严禁使用 `git add -A` 或 `git add <dir>/`；每次 `git add` 用精确文件路径。
- 跨任务 commit 边界保持原子性、相同任务可多个 commit。
- 类型镜像：`AppErrorParamsMap[AppErrorCode.PLATFORM_NOT_SUPPORTED]` 字段名仍是 `platformName: string`（B1 任务在 batch-3 改）；本批不动。
- `types/error/index.ts` 桶同时导出值与类型；桶里值与类型用不同名：`AppErrorCode`（值）+ `AppErrorCodeType`（类型）。
- `AppErrorParamsMap[K]` 入参收窄**通过函数签名上的类型注解、不用 `as`**。具体写法：每个 `buildMessage` 直接 `buildMessage: (params: AppErrorParamsMap[typeof AppErrorCode.X]) => string`。

---

## File Structure（batch-1 涉及）

**Modify:**
- `cli/src/tools/package-json/load-info.ts`（A1）
- `cli/src/error/commander-adapter.ts`（A2）
- `cli/src/error/definitions.ts`（A3 + A7 + C1）
- `cli/src/error/code.ts`（C1）
- `cli/src/types/error/types.ts`（A3 + C1：暴露 `AppErrorCodeType`、调整 record 形式为 `[K in AppErrorCode]`）
- `cli/src/types/error/index.ts`（A3：桶更新）

**Consume (下传):**
- 所有引用 `AppErrorCode` 的代码——只把 `as AppErrorCodeValues` 重命名去掉

---

### Task 1.1: A1 — 去掉 `unknown` 兜底中间变量

**Files:**
- Modify: `cli/src/tools/package-json/load-info.ts:14-28`

**Interfaces:**
- Consumes: `packageJsonInfoSchema` from `@/schemas/tools/package-json-info` (existing)
- Produces: `async function loadPackageJsonInfo(): Promise<ReturnType<typeof packageJsonInfoSchema.parse>>` (signature unchanged)

**Why:** 当前代码 `const packageJsonPayload: unknown = JSON.parse(packageJsonContent)` 显式标注 `unknown`，违反 CLAUDE.md "不使用 `any` 和 `unknown` 兜底"。`JSON.parse` 标准返回 `any`，但紧接 `packageJsonInfoSchema.parse(...)` 会用 Zod schema 收窄，中间变量多余。

- [ ] **Step 1: Read `cli/src/tools/package-json/load-info.ts` 全文确认当前结构**

- [ ] **Step 2: 修改 `loadPackageJsonInfo` 函数体**，将包了 `unknown` 标注的中间变量去掉、inlining 到 `parse` 调用

新完整内容：

```typescript
import { access, readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { AppError, AppErrorCode } from "@/error"
import { packageJsonInfoSchema } from "@/schemas/tools/package-json-info"

/**
 * 加载并校验 package.json 中会用到的程序信息。
 *
 * @returns 通过 schema 校验后的 package.json 信息。
 * @throws package.json 不存在或格式不正确时抛出错误。
 *
 * @example
 * ```typescript
 * loadPackageJsonInfo()
 * // { name: "yeizi-skills", version: "0.1.0", bin: { "yeizi-skills": "dist/index.js" }, description: "..." }
 * ```
 */
async function loadPackageJsonInfo(): Promise<ReturnType<typeof packageJsonInfoSchema.parse>> {
  const packageJsonPath = await findPackageJsonPath(dirname(fileURLToPath(import.meta.url)))

  try {
    const packageJsonContent = await readFile(packageJsonPath, "utf8")

    return packageJsonInfoSchema.parse(JSON.parse(packageJsonContent))
  }
  catch (error) {
    if (error instanceof Error) {
      throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT, {
        cause: error,
      })
    }
    throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT)
  }
}

/**
 * 逐级向上查找 package.json 所在路径。
 *
 * @param currentDirectoryPath - 当前起始目录。
 * @returns 找到的 package.json 绝对路径。
 * @throws 到达文件系统根目录仍未找到时抛出错误。
 */
async function findPackageJsonPath(currentDirectoryPath: string): Promise<string> {
  const candidatePath = resolve(currentDirectoryPath, "package.json")

  try {
    await access(candidatePath)
    return candidatePath
  }
  catch {
    const parentDirectoryPath = dirname(currentDirectoryPath)

    if (parentDirectoryPath === currentDirectoryPath) {
      throw new AppError(AppErrorCode.PACKAGE_CONFIG_NOT_FOUND)
    }

    return findPackageJsonPath(parentDirectoryPath)
  }
}

export { loadPackageJsonInfo }
```

- [ ] **Step 3: 跑 typecheck 验证**

```bash
cd cli && bun run typecheck
```

Expected: 无 `tools/package-json/load-info.ts`相关报错。

- [ ] **Step 4: 跑 lint 验证本任务文件**

```bash
cd cli && bun run lint src/tools/package-json/load-info.ts
```

Expected: 0 error。

- [ ] **Step 5: Commit**

```bash
git add cli/src/tools/package-json/load-info.ts
git commit -m "refactor(tools/package-json): inline JSON.parse without unknown workaround

去掉显式标注的 `const packageJsonPayload: unknown = JSON.parse(...)` 中间变量；
把 JSON.parse 直接链入 zod schema.parse 调用。CLAUDE.md type-rules
「不使用 any 和 unknown 兜底」。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

---

### Task 1.2: A2 — 删除 `matchedResult![1]` 非空断言

**Files:**
- Modify: `cli/src/error/commander-adapter.ts`（grep `matchedResult!\[\d\]` 定位）

**Interfaces:**
- Consumes: `AppError` 等 from `@/error` (existing)
- Produces: 内部 helper 签名调整

**Why:** `return matchedResult![1]` 用非空断言绕过 nullable；按 CLAUDE.md "不为兜底提前放宽" 应让函数前置 null 分支返回默认消息。

- [ ] **Step 1: Read `cli/src/error/commander-adapter.ts` 全文**

- [ ] **Step 2: 找到 `extractQuotedValue` 类似函数、改返回 `string | null`**

```typescript
/**
 * 从 commander 错误消息中匹配单引号包围的整段引文。
 *
 * @param errorMessageText - commander 提供的错误消息原文。
 * @returns 命中单引号包围时的内容；未命中返回 null。
 */
function extractQuotedValue(errorMessageText: string): string | null {
  const matchedResult = errorMessageText.match(/'([^']+)'/)

  return matchedResult === null ? null : matchedResult[1]
}
```

- [ ] **Step 3: 调用方改成 null 分支返回默认消息**

修改 `buildCommanderErrorMessage`（或当前名字相近）中所有 `extractQuotedValue` 调用：

```typescript
// 原来：return extractQuotedValue(errorMessageText)
// 改成：
const quotedValue = extractQuotedValue(errorMessageText)

if (quotedValue === null) {
  return defaultMessage
}

return quotedValue
```

`defaultMessage` 字符串按当前实现保留（如 `"未知命令错误。"`）；具体值由 implementer 看现场。

- [ ] **Step 4: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 0 error（本任务文件相关）。

- [ ] **Step 5: Commit**

```bash
git add cli/src/error/commander-adapter.ts
git commit -m "refactor(error): remove non-null assertion in commander-adapter

extractQuotedValue 改返 string | null，调用方对 null 显式分支返回默认消息。
替代原来的 matchedResult![1] 强行非空断言，CLAUDE.md 「不为兜底提前放宽」。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 1.3: A3 + A7 — 清理 error 命名、消除 6 处 `as` 类型断言

**Files:**
- Modify: `cli/src/types/error/types.ts`（暴露 `AppErrorCodeType` + 调整 record 形式）
- Modify: `cli/src/types/error/index.ts`（桶导出更新）
- Modify: `cli/src/error/definitions.ts`（去 `as AppErrorCodeValues` + 改 `as` 收窄形式）

**Interfaces:**
- Consumes: `AppErrorCode` from `@/error/code` (existing)
- Produces: 公开类型别名 `AppErrorCodeType`；record 形式的 `errorDefinitionMap` 类型收窄

**Why:** `error/definitions.ts` 当前 `import { AppErrorCode as AppErrorCodeValues }` 是为绕开与 `import type { AppErrorCode } from "@/types/error"` 同名。每条 `buildMessage` 函数体内的 `params as AppErrorParamsMap[...]` 进一步掩盖类型问题。

按设计：types/error/ 暴露 `AppErrorCodeType`（类型），error/code/ 持有 `AppErrorCode`（值常量名），definitions 端两者分开 import + 每个 buildMessage 函数签名上指定具体 K。

- [ ] **Step 1: Read 当前 `cli/src/types/error/types.ts` 与 `cli/src/error/definitions.ts`**

- [ ] **Step 2: 修改 `cli/src/types/error/types.ts`**

`AppErrorCodeType` 公开类型别名。把 `AppErrorDefinition` 接口改成带 code 泛型、record 用 `[K in AppErrorCode]`：

```typescript
import type { AppErrorCode } from "@/error/code"

/**
 * 项目统一错误码类型。
 */
type AppErrorCodeType = (typeof AppErrorCode)[keyof typeof AppErrorCode]

/**
 * 错误定义结构。
 */
interface AppErrorDefinition<K extends AppErrorCodeType = AppErrorCodeType> {
  /**
   * 面向用户展示的错误标题。
   */
  title: string

  /**
   * 根据参数构建错误消息。
   */
  buildMessage: (params: AppErrorParamsMap[K]) => string
}

/**
 * 错误代码与参数结构映射。
 */
interface AppErrorParamsMap {
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: { platformName: string }
  [AppErrorCode.PLATFORM_NOT_FOUND]: { platformNameList: string[] }
  [AppErrorCode.SKILL_NOT_FOUND]: {
    skillNameList: string[]
  }
  [AppErrorCode.FILE_COPY_FAILED]: { sourcePath: string, targetPath: string }
  [AppErrorCode.DIRECTORY_REMOVE_FAILED]: { directoryPath: string }
  // ... 其它现有项（UNEXPECTED_ERROR / *_CONFIG_* / PLATFORM_OPTION_EMPTY 等）保持 undefined
  // REMOTE_SKILL_DOCUMENT_INVALID 一项由 Task 1.4 删除
}

export type { AppErrorCodeType, AppErrorDefinition, AppErrorParamsMap }
```

- [ ] **Step 3: 修改 `cli/src/types/error/index.ts` 桶导出**

```typescript
export type {
  AppErrorCodeType,
  AppErrorDefinition,
  AppErrorParamsMap,
} from "./types"
```

- [ ] **Step 4: 修改 `cli/src/error/definitions.ts`**

- 删 `import { AppErrorCode as AppErrorCodeValues } from "./code"`，改用 `import { AppErrorCode }`（值名直接用）
- 改 `import type { AppErrorCodeType } from "@/types/error"`
- 删 6 处 `params as AppErrorParamsMap[...]` 断言
- 改成 record 形式（手动写每条 entry）。完整代码：

```typescript
import { AppErrorCode } from "./code"
import type { AppErrorCodeType, AppErrorParamsMap } from "@/types/error"

const errorDefinitionMap: {
  [K in AppErrorCodeType]: AppErrorDefinition<K>
} = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  [AppErrorCode.CLI_USAGE_INVALID]: {
    title: "命令用法错误",
    buildMessage: (params) => params.detailMessage,
  },
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: {
    title: "程序配置错误",
    buildMessage: () => "package.json 中缺少 bin 配置。",
  },
  [AppErrorCode.PACKAGE_CONFIG_INVALID_FORMAT]: {
    title: "程序配置错误",
    buildMessage: () => "package.json 配置格式不正确。",
  },
  [AppErrorCode.PACKAGE_CONFIG_NOT_FOUND]: {
    title: "程序配置错误",
    buildMessage: () => "未找到 package.json。",
  },
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个平台。",
  },
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: {
    title: "平台不受支持",
    buildMessage: (params) => `平台"${params.platformName}"不受支持。`,
  },
  [AppErrorCode.PLATFORM_NOT_FOUND]: {
    title: "平台不存在",
    buildMessage: (params) => `以下平台不存在：${params.platformNameList.join("、")}。`,
  },
  [AppErrorCode.SKILL_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个技能。",
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "技能不存在",
    buildMessage: (params) => {
      if (params.skillNameList.length === 1) {
        return `技能"${params.skillNameList[0]}"不存在。`
      }

      return `以下技能不存在：${params.skillNameList.join("、")}。`
    },
  },
  [AppErrorCode.PROMPT_UNAVAILABLE]: {
    title: "交互不可用",
    buildMessage: () => "当前环境不支持交互提示，请显式传入命令所需参数后重试。",
  },
  [AppErrorCode.PROMPT_CANCELLED]: {
    title: "已取消操作",
    buildMessage: () => "已取消本次操作。",
  },
  [AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
    title: "远端仓库异常",
    buildMessage: () => "远端仓库未发现任何技能，请检查仓库内容。",
  },
  [AppErrorCode.FILE_COPY_FAILED]: {
    title: "文件复制失败",
    buildMessage: (params) => `从"${params.sourcePath}"复制到"${params.targetPath}"失败。`,
  },
  [AppErrorCode.DIRECTORY_REMOVE_FAILED]: {
    title: "删除目录失败",
    buildMessage: (params) => `删除临时目录"${params.directoryPath}"失败。`,
  },
} satisfies Record<AppErrorCodeType, AppErrorDefinition<AppErrorCodeType>>

function getAppErrorDefinition<K extends AppErrorCodeType>(
  code: K,
): AppErrorDefinition<K> {
  return errorDefinitionMap[code]
}

export { errorDefinitionMap, getAppErrorDefinition }
```

**注意**：保留 `REMOTE_REPOSITORY_EMPTY` 占位；其精确文案（带 owner/repo/branch）由 batch-4 B6 任务补全。

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -20
```

Expected: 仍有下游文件报错（旧 `parsePlatformNameList` / `getAppErrorDefinition` 调用未变化）。本任务文件内部 0 错。

- [ ] **Step 6: lint**

```bash
cd cli && bun run lint src/error/ src/types/error/
```

Expected: 本任务文件 0 error。

- [ ] **Step 7: Commit**

```bash
git add cli/src/types/error/types.ts cli/src/types/error/index.ts cli/src/error/definitions.ts
git commit -m "refactor(error): unify AppErrorCodeType naming, eliminate as in definitions

- types/error/types.ts: 暴露 AppErrorCodeType 别名
- error/definitions.ts: 去掉 import { AppErrorCode as AppErrorCodeValues } 重命名
- error/definitions.ts: 把内部 record 改成 [K in AppErrorCodeType]: AppErrorDefinition<K> 形式，
  buildMessage 入参由函数签名自然收窄（无 as）
- types/error/index.ts 桶同步 export AppErrorCodeType

CLAUDE.md 「不为兜底提前放宽」「同概念固定使用同一个词」。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 1.4: C1 — 删除 `REMOTE_SKILL_DOCUMENT_INVALID` 错误码

**Files:**
- Modify: `cli/src/error/code.ts`（删字段 + 注释）
- Modify: `cli/src/error/definitions.ts`（删对应 record entry）
- Modify: `cli/src/types/error/types.ts`（删对应 `AppErrorParamsMap` 项）

**Why:** v2 改 per-skill 容错后该错误码零抛点。grep 已确认全 codebase 无任何 `throw new AppError(AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID, ...)`。

- [ ] **Step 1: grep 确认无调用点**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -rn "REMOTE_SKILL_DOCUMENT_INVALID" cli/src/
```

Expected: 仅三处出现：`code.ts`（定义）、`definitions.ts`（record entry）、`types/error/types.ts`（AppErrorParamsMap 项）。

- [ ] **Step 2: 删 `cli/src/error/code.ts` 中的字段 + TSDoc 注释**

找到形如：
```typescript
/**
 * 远端 Skill 文档格式不正确。
 */
REMOTE_SKILL_DOCUMENT_INVALID: "remote-skill-document-invalid",
```

整段删除（含上方 2 行注释 + 字段行）。

- [ ] **Step 3: 删 `cli/src/error/definitions.ts` 中的对应 record entry**

找到 `[AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: { ... },` 整段删除。

- [ ] **Step 4: 删 `cli/src/types/error/types.ts` 中的对应项**

找到 `[AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: undefined` 删。

- [ ] **Step 5: typecheck**

```bash
cd cli && bun run typecheck 2>&1 | tail -5
```

Expected: 0 error（本任务相关）。

- [ ] **Step 6: lint**

```bash
cd cli && bun run lint src/error/ src/types/error/
```

Expected: 0 error。

- [ ] **Step 7: Commit**

```bash
git add cli/src/error/code.ts cli/src/error/definitions.ts cli/src/types/error/types.ts
git commit -m "chore(error): remove unused REMOTE_SKILL_DOCUMENT_INVALID

v2 改 per-skill 容错后此错误码零抛点。code.ts + definitions.ts + AppErrorParamsMap 三处同步删除。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-1）

- ✅ Task 1.1-1.4 全过
- ✅ `cd cli && bun run check` 仍 0 error（task 1.4 后）；可能因 Task 1.3 引入 record 形式，下游使用方需后批修复（batch-2 起）
- ✅ 全部 commit 落到 `main` 分支
- ✅ 任何 task 内 typecheck/lint 必须 0 error
