# AppError Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 CLI 的错误体系重构为严格的 `code + params + cause` 模型，保留 Commander 适配和 CLI 展示都在 `src/errors/*` 内，同时迁移所有现有 `AppError` 调用点。

**Architecture:** 先在 `src/errors/*` 内建立新的错误定义表和支持参数化消息的 `AppError` 核心，并短暂保留旧构造签名兼容层，让仓库在中途仍能通过类型检查。随后把 Commander 适配、fatal handler 和错误展示收口到 `src/errors/*`，最后迁移所有调用点并删掉旧签名。

**Tech Stack:** TypeScript, Bun, Commander, Node.js 20+, ESLint, `bun test`

## Global Constraints

- The project does not allow `unknown` or `any`.
- Commander-specific handling stays inside `src/errors/*`.
- CLI rendering may stay inside `src/errors/*`.
- Error-only shared types should stay inside the error domain.
- `src/errors/types/*` is not needed at the current project size.

---

## File Structure

- `package.json`
  - 新增 `test` script，统一用 `bun test` 跑错误域回归测试。
- `src/errors/error-code.ts`
  - 继续维护 `AppErrorCode` / `AppErrorCodeName`，新增参数类型和中心化 `APP_ERROR_DEFINITIONS`。
- `src/errors/app-error.ts`
  - 承载新的 `AppError` 构造逻辑；任务 1 保留兼容层，任务 3 删除旧签名。
- `src/errors/app-error.test.ts`
  - 校验 `AppError` 的 title、message、params 和 cause 行为。
- `src/errors/commander-error-adapter.ts`
  - 收口 Commander 到 `AppError` 的映射逻辑，包括 `isCommanderNonFailure()` 和 `buildCommanderAppError()`。
- `src/errors/commander-error-adapter.test.ts`
  - 覆盖 Commander 错误码映射和消息构建。
- `src/errors/error-display.ts`
  - 从 `src/tools/error-display.ts` 迁入，作为错误域内的 CLI 展示实现。
- `src/errors/fatal-error-handler.ts`
  - 只做编排：判定非失败退出、归一化错误、展示错误、设置 `process.exitCode`。
- `src/errors/fatal-error-handler.test.ts`
  - 覆盖 `handleFatalError()` 的退出码和归一化行为。
- `src/errors/index.ts`
  - 继续对外导出错误域公共 API。
- `src/tools/error-display.ts`
  - 删除，避免错误展示继续留在 `tools/*`。
- `src/types/error/index.ts`
  - 删除，Commander 专用类型回收到错误域，不再从全局 `types/*` 暴露。
- `src/types/index.ts`
  - 移除 `./error` barrel export。
- 需要迁移构造签名的调用点：
  - `src/main.ts`
  - `src/tools/load-package-json-info.ts`
  - `src/tools/prompt-service.ts`
  - `src/features/platform/platform-resolver.ts`
  - `src/features/source/fetch-github-client.ts`
  - `src/features/source/github-skill-source.ts`
  - `src/features/skill/selected-skill-entry-builder.ts`
  - `src/features/skill/skill-document-parser.ts`
  - `src/features/skill/skill-index-parser.ts`
  - `src/features/skill/skill-installer.ts`
  - `src/features/skill/skill-name-parser.ts`
  - `src/commands/list/command.ts`
  - `src/commands/install/command.ts`
  - `src/commands/update/command.ts`

### Planned Error Param Shapes

```ts
type TPackageConfigInvalidParams
  = { kind: "invalid-format" }
  | { kind: "not-found" }

type TNonInteractiveOptionRequiredParams = {
  optionName: "--platform" | "--skill"
  actionName: "查看" | "安装" | "更新"
  targetName: "平台" | "技能"
}

type TSkillNotFoundParams = {
  skillNames: readonly [string, ...string[]]
}

type TGitHubRequestFailedParams
  = { kind: "status-code"; statusCode: number }
  | { kind: "network-retry" }
  | { kind: "generic" }

type TGitHubRequestTimeoutParams = {
  timeoutSeconds: number
}
```

这些参数形状是后续各任务之间共享的接口约定，所有实现和测试都必须使用同样的属性名。

### Final Definition Mapping

```ts
const APP_ERROR_DEFINITIONS = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  [AppErrorCode.CLI_USAGE_INVALID]: {
    title: "命令用法错误",
    buildMessage: (params: { detailMessage: string }) => params.detailMessage,
  },
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: {
    title: "程序配置错误",
    buildMessage: () => "package.json 中缺少 bin 配置。",
  },
  [AppErrorCode.PACKAGE_CONFIG_INVALID]: {
    title: "程序配置错误",
    buildMessage: (params: TPackageConfigInvalidParams) =>
      params.kind === "invalid-format"
        ? "package.json 配置格式不正确。"
        : "未找到 package.json。",
  },
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个平台。",
  },
  [AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]: {
    title: "参数缺失",
    buildMessage: (params: TNonInteractiveOptionRequiredParams) =>
      `当前环境不支持交互提示，请使用 ${params.optionName} 显式指定要${params.actionName}的${params.targetName}。`,
  },
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: {
    title: "平台不受支持",
    buildMessage: (params: { platformName: string }) => `平台“${params.platformName}”不受支持。`,
  },
  [AppErrorCode.SKILL_OPTION_EMPTY]: {
    title: "参数错误",
    buildMessage: () => "请至少提供一个技能。",
  },
  [AppErrorCode.SKILL_OPTION_INVALID]: {
    title: "参数错误",
    buildMessage: () => "技能名称必须以 yeizi- 开头。",
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "技能不存在",
    buildMessage: (params: TSkillNotFoundParams) =>
      params.skillNames.length === 1
        ? `技能“${params.skillNames[0]}”不存在。`
        : `以下技能不存在：${params.skillNames.join("、")}。`,
  },
  [AppErrorCode.PROMPT_UNAVAILABLE]: {
    title: "交互不可用",
    buildMessage: () => "当前环境不支持交互提示，请显式传入命令所需参数后重试。",
  },
  [AppErrorCode.PROMPT_CANCELLED]: {
    title: "已取消操作",
    buildMessage: () => "已取消本次操作。",
  },
  [AppErrorCode.SKILL_DOCUMENT_MISSING]: {
    title: "技能文档缺失",
    buildMessage: (params: { skillName: string }) => `远端技能“${params.skillName}”缺少 SKILL.md 文件。`,
  },
  [AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]: {
    title: "技能版本异常",
    buildMessage: (params: { skillName: string }) => `远端技能“${params.skillName}”的 SKILL.md 版本与索引不一致。`,
  },
  [AppErrorCode.SKILL_FILES_NOT_LOADED]: {
    title: "技能文件异常",
    buildMessage: (params: { skillName: string }) => `技能“${params.skillName}”的文件尚未加载完成。`,
  },
  [AppErrorCode.SKILL_INSTALL_PATH_INVALID]: {
    title: "技能路径异常",
    buildMessage: (params: { relativeFilePath: string }) => `下载文件路径“${params.relativeFilePath}”超出了技能根目录。`,
  },
  [AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]: {
    title: "技能安装异常",
    buildMessage: (params: { skillName: string }) => `技能“${params.skillName}”安装失败后，原始技能目录无法自动恢复，请手动检查本地 skills 目录。`,
  },
  [AppErrorCode.REMOTE_SKILL_INDEX_INVALID]: {
    title: "远端数据异常",
    buildMessage: () => "远端技能索引格式不正确。",
  },
  [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: {
    title: "远端数据异常",
    buildMessage: () => "技能文档 frontmatter 格式不正确。",
  },
  [AppErrorCode.GITHUB_CONTENTS_INVALID]: {
    title: "远端数据异常",
    buildMessage: () => "GitHub 内容响应格式不正确。",
  },
  [AppErrorCode.GITHUB_REQUEST_FAILED]: {
    title: "远端请求失败",
    buildMessage: (params: TGitHubRequestFailedParams) => {
      if (params.kind === "status-code") {
        return `GitHub 请求失败，状态码为 ${params.statusCode}。`
      }

      if (params.kind === "network-retry") {
        return "GitHub 请求失败，请检查网络后重试。"
      }

      return "GitHub 请求失败。"
    },
  },
  [AppErrorCode.GITHUB_REQUEST_TIMEOUT]: {
    title: "远端请求超时",
    buildMessage: (params: TGitHubRequestTimeoutParams) => `GitHub 请求超时，请检查网络后重试（${params.timeoutSeconds} 秒）。`,
  },
  [AppErrorCode.GITHUB_CONTENT_PATH_INVALID]: {
    title: "远端路径异常",
    buildMessage: (params: { contentPath: string }) => `GitHub 内容条目的路径“${params.contentPath}”超出了技能根目录。`,
  },
  [AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]: {
    title: "远端文件异常",
    buildMessage: (params: { contentPath: string }) => `GitHub 内容条目“${params.contentPath}”缺少下载地址。`,
  },
} as const
```

## Tasks

### Task 1: 建立新的 AppError 核心并加上过渡测试

**Files:**
- Modify: `package.json`
- Modify: `src/errors/error-code.ts`
- Modify: `src/errors/app-error.ts`
- Test: `src/errors/app-error.test.ts`

**Interfaces:**
- Consumes: `AppErrorCode`, `AppErrorCodeName`
- Produces:
  - `APP_ERROR_DEFINITIONS`
  - `AppErrorParamsMap`
  - `AppErrorOptions<TCode extends AppErrorCodeName>`
  - `new AppError(code)`
  - `new AppError(code, { params, cause })`
  - temporary legacy compatibility for `new AppError(code, title, message, options?)`

- [ ] **Step 1: 先写失败测试，锁住新 API 的目标行为**

```ts
// src/errors/app-error.test.ts
import { describe, expect, it } from "bun:test"

import { AppError, AppErrorCode } from "@/errors"

describe("AppError", () => {
  it("uses the definition title and default message for code-only errors", () => {
    const error = new AppError(AppErrorCode.UNEXPECTED_ERROR)

    expect(error.title).toBe("程序异常")
    expect(error.message).toBe("程序执行失败，请稍后重试。")
  })

  it("builds a single-skill not-found message from typed params", () => {
    const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNames: ["yeizi-react"] },
    })

    expect(error.title).toBe("技能不存在")
    expect(error.message).toBe("技能“yeizi-react”不存在。")
  })

  it("preserves cause while building a status-code GitHub failure message", () => {
    const cause = new Error("network")
    const error = new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
      params: { kind: "status-code", statusCode: 404 },
      cause,
    })

    expect(error.cause).toBe(cause)
    expect(error.message).toBe("GitHub 请求失败，状态码为 404。")
  })
})
```

- [ ] **Step 2: 运行测试，确认当前实现确实不满足新接口**

Run: `bun test src/errors/app-error.test.ts`  
Expected: FAIL，因为当前 `AppError` 仍要求 `title` / `message`，`error.title` 会是 `undefined`，参数化消息也不会生成。

- [ ] **Step 3: 实现新的定义表和过渡版构造函数**

```ts
// package.json
{
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "check": "bun run typecheck && bun run lint",
    "build": "bun run check && bun run ./scripts/build.ts"
  }
}
```

```ts
// src/errors/error-code.ts
interface IAppErrorDefinition<TParams> {
  title: string
  buildMessage: (params: TParams) => string
}

type TSkillNotFoundParams = {
  skillNames: readonly [string, ...string[]]
}

type TGitHubRequestFailedParams
  = { kind: "status-code"; statusCode: number }
  | { kind: "network-retry" }
  | { kind: "generic" }

export interface AppErrorParamsMap {
  [AppErrorCode.UNEXPECTED_ERROR]: undefined
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PROMPT_CANCELLED]: undefined
  [AppErrorCode.SKILL_NOT_FOUND]: TSkillNotFoundParams
  [AppErrorCode.GITHUB_REQUEST_FAILED]: TGitHubRequestFailedParams
}

export type AppErrorOptions<TCode extends keyof AppErrorParamsMap>
  = AppErrorParamsMap[TCode] extends undefined
    ? { cause?: Error; params?: undefined }
    : { cause?: Error; params: AppErrorParamsMap[TCode] }

export function getAppErrorDefinition<TCode extends keyof AppErrorParamsMap>(
  code: TCode,
): IAppErrorDefinition<AppErrorParamsMap[TCode]> {
  const definition = APP_ERROR_DEFINITIONS[code]

  if (definition === undefined) {
    throw new Error(`Missing AppError definition for code: ${code}`)
  }

  return definition
}

export const APP_ERROR_DEFINITIONS: Partial<{
  [TCode in keyof AppErrorParamsMap]: IAppErrorDefinition<AppErrorParamsMap[TCode]>
}> = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  [AppErrorCode.CLI_USAGE_INVALID]: {
    title: "命令用法错误",
    buildMessage: params => params.detailMessage,
  },
  [AppErrorCode.PROMPT_CANCELLED]: {
    title: "已取消操作",
    buildMessage: () => "已取消本次操作。",
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "技能不存在",
    buildMessage: params =>
      params.skillNames.length === 1
        ? `技能“${params.skillNames[0]}”不存在。`
        : `以下技能不存在：${params.skillNames.join("、")}。`,
  },
  [AppErrorCode.GITHUB_REQUEST_FAILED]: {
    title: "远端请求失败",
    buildMessage: (params) => {
      if (params.kind === "status-code") {
        return `GitHub 请求失败，状态码为 ${params.statusCode}。`
      }

      if (params.kind === "network-retry") {
        return "GitHub 请求失败，请检查网络后重试。"
      }

      return "GitHub 请求失败。"
    },
  },
}
```

```ts
// src/errors/app-error.ts
import type { AppErrorCodeName, AppErrorOptions } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

interface ILegacyAppErrorOptions {
  cause?: Error
}

type TAppErrorNewOptions = {
  cause?: Error
  params?: AppErrorOptions<AppErrorCodeName>["params"]
}

class AppError extends Error {
  public readonly code: AppErrorCodeName
  public readonly title: string

  public constructor<TCode extends AppErrorCodeName>(code: TCode, options?: AppErrorOptions<TCode>)
  public constructor(code: AppErrorCodeName, title: string, message: string, options?: ILegacyAppErrorOptions)
  public constructor(
    code: AppErrorCodeName,
    titleOrOptions?: string | TAppErrorNewOptions,
    message?: string,
    legacyOptions?: ILegacyAppErrorOptions,
  ) {
    if (typeof titleOrOptions === "string") {
      super(message, { cause: legacyOptions?.cause })
      this.name = new.target.name
      this.code = code
      this.title = titleOrOptions
      return
    }

    const definition = getAppErrorDefinition(code)

    super(definition.buildMessage(titleOrOptions?.params), {
      cause: titleOrOptions?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}
```

说明：Task 1 的目标是先把新 API 立住，同时保留旧签名兼容层，让后续调用点迁移可以小步推进。Task 3 完成后，旧签名兼容层必须彻底删除。

- [ ] **Step 4: 重新跑测试和类型检查，确认过渡核心可用**

Run: `bun test src/errors/app-error.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS，现有旧调用点继续通过，因为旧签名兼容层仍在。

- [ ] **Step 5: 提交过渡核心**

```bash
git add package.json src/errors/error-code.ts src/errors/app-error.ts src/errors/app-error.test.ts
git commit -m "refactor: add code-driven app error core"
```

### Task 2: 把 Commander 适配和错误展示收口到 `src/errors/*`

**Files:**
- Create: `src/errors/commander-error-adapter.ts`
- Create: `src/errors/error-display.ts`
- Modify: `src/errors/fatal-error-handler.ts`
- Modify: `src/errors/index.ts`
- Delete: `src/tools/error-display.ts`
- Delete: `src/types/error/index.ts`
- Modify: `src/types/index.ts`
- Test: `src/errors/commander-error-adapter.test.ts`
- Test: `src/errors/fatal-error-handler.test.ts`

**Interfaces:**
- Consumes:
  - `AppError`
  - `AppErrorCode`
  - `AppErrorOptions`
- Produces:
  - `isCommanderNonFailure(error: Error): error is CommanderError`
  - `buildCommanderAppError(error: CommanderError): AppError`
  - `buildCommanderErrorMessage(error: CommanderError): string`
  - `normalizeFatalError(error: Error): AppError`
  - `handleFatalError(error: Error): void`

- [ ] **Step 1: 先写失败测试，锁住 Commander 适配和 fatal handler 行为**

```ts
// src/errors/commander-error-adapter.test.ts
import { describe, expect, it } from "bun:test"
import { CommanderError } from "commander"

import { AppErrorCode } from "@/errors"
import { buildCommanderAppError, isCommanderNonFailure } from "@/errors/commander-error-adapter"

describe("Commander error adapter", () => {
  it("maps unknown options into CLI usage errors", () => {
    const commanderError = new CommanderError(1, "commander.unknownOption", "error: unknown option '--skill'")
    const appError = buildCommanderAppError(commanderError)

    expect(appError.code).toBe(AppErrorCode.CLI_USAGE_INVALID)
    expect(appError.title).toBe("命令用法错误")
    expect(appError.message).toBe("选项“--skill”不受支持，请使用 --help 查看可用选项。")
  })

  it("treats helpDisplayed as a non-failure exit", () => {
    const commanderError = new CommanderError(0, "commander.helpDisplayed", "(outputHelp)")

    expect(isCommanderNonFailure(commanderError)).toBe(true)
  })
})
```

```ts
// src/errors/fatal-error-handler.test.ts
import { beforeEach, describe, expect, it } from "bun:test"
import { CommanderError } from "commander"

import { AppErrorCode, handleFatalError } from "@/errors"
import { normalizeFatalError } from "@/errors/fatal-error-handler"

describe("fatal error handler", () => {
  beforeEach(() => {
    process.exitCode = undefined
  })

  it("normalizes commander errors through the adapter", () => {
    const commanderError = new CommanderError(1, "commander.missingArgument", "error: missing required argument 'skill'")
    const appError = normalizeFatalError(commanderError)

    expect(appError.code).toBe(AppErrorCode.CLI_USAGE_INVALID)
    expect(appError.message).toBe("缺少必填参数“skill”。")
  })

  it("marks help output as a success exit", () => {
    handleFatalError(new CommanderError(0, "commander.helpDisplayed", "(outputHelp)"))

    expect(process.exitCode).toBe(0)
  })
})
```

- [ ] **Step 2: 运行测试，确认当前错误域还没有这些专门边界**

Run: `bun test src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: FAIL，因为 `@/errors/commander-error-adapter` 还不存在，`normalizeFatalError` 也还未导出。

- [ ] **Step 3: 实现 Commander adapter、fatal handler 编排和错误展示迁移**

```ts
// src/errors/commander-error-adapter.ts
import { CommanderError } from "commander"

import { AppError, AppErrorCode } from "@/errors"

type ICommanderMessageBuilder = (error: CommanderError) => string
type ICommanderMessageBuilders = Record<string, ICommanderMessageBuilder>

export function isCommanderNonFailure(error: Error): error is CommanderError {
  return error instanceof CommanderError && error.exitCode === 0
}

export function buildCommanderAppError(error: CommanderError): AppError {
  return new AppError(AppErrorCode.CLI_USAGE_INVALID, {
    params: {
      detailMessage: buildCommanderErrorMessage(error),
    },
    cause: error,
  })
}

export function buildCommanderErrorMessage(error: CommanderError): string {
  const builders: ICommanderMessageBuilders = {
    "commander.unknownCommand": currentError =>
      `命令“${extractQuotedValue(currentError.message) ?? "未知命令"}”不存在，请使用 --help 查看可用命令。`,
    "commander.unknownOption": currentError =>
      `选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”不受支持，请使用 --help 查看可用选项。`,
    "commander.optionMissingArgument": currentError =>
      `选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”缺少参数值。`,
    "commander.missingMandatoryOptionValue": currentError =>
      `缺少必填选项“${extractQuotedValue(currentError.message) ?? "未知选项"}”。`,
    "commander.missingArgument": currentError =>
      `缺少必填参数“${extractQuotedValue(currentError.message) ?? "未知参数"}”。`,
    "commander.excessArguments": currentError => buildExcessArgumentsMessage(currentError.message),
  }

  const builder = builders[error.code]
  return builder ? builder(error) : "命令参数不正确，请使用 --help 查看正确用法。"
}

function buildExcessArgumentsMessage(message: string): string {
  const matchedResult = message.match(/Expected (\\d+) arguments? but got (\\d+)\\./)

  if (matchedResult === null) {
    return "命令参数过多，请使用 --help 查看正确用法。"
  }

  return `命令参数过多，期望 ${matchedResult[1]} 个，实际收到 ${matchedResult[2]} 个。`
}

function extractQuotedValue(message: string): string | null {
  const matchedResult = message.match(/'([^']+)'/)
  return matchedResult?.[1] ?? null
}
```

```ts
// src/errors/error-display.ts
import boxen from "boxen"
import chalk from "chalk"

export function renderErrorDisplay(title: string, message: string): void {
  console.error(boxen(
    chalk.yellow(message),
    {
      title: chalk.bold.red(title),
      titleAlignment: "center",
      padding: { top: 1, bottom: 1, left: 5, right: 5 },
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      textAlignment: "center",
    },
  ))
}
```

```ts
// src/errors/fatal-error-handler.ts
import { CommanderError } from "commander"

import process from "node:process"

import { AppError, AppErrorCode } from "@/errors"

import { buildCommanderAppError, isCommanderNonFailure } from "./commander-error-adapter"
import { renderErrorDisplay } from "./error-display"

export function handleFatalError(error: Error): void {
  if (isCommanderNonFailure(error)) {
    process.exitCode = error.exitCode
    return
  }

  const fatalError = normalizeFatalError(error)
  renderErrorDisplay(fatalError.title, fatalError.message)
  process.exitCode = 1
}

export function normalizeFatalError(error: Error): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof CommanderError) {
    return buildCommanderAppError(error)
  }

  if (error.name === "ExitPromptError") {
    return new AppError(AppErrorCode.PROMPT_CANCELLED, { cause: error })
  }

  return new AppError(AppErrorCode.UNEXPECTED_ERROR, { cause: error })
}
```

```ts
// src/errors/index.ts
export * from "./app-error"
export * from "./error-code"
export * from "./fatal-error-handler"
```

```ts
// src/types/index.ts
export * from "./command"
export * from "./package-json"
export * from "./platform"
export * from "./skill"
export * from "./source"
```

实现要求：

- `src/tools/error-display.ts` 删除后，`fatal-error-handler.ts` 必须改为相对引用 `./error-display`。
- `ICommanderMessageBuilder` / `ICommanderMessageBuilders` 不再留在 `src/types/error/index.ts`，要么内联在 `commander-error-adapter.ts`，要么就近放在同文件顶部。
- 这里不允许把 Commander 适配再挪回 `src/types/*` 或 `src/tools/*`。

- [ ] **Step 4: 运行测试，确认错误域边界已经收口**

Run: `bun test src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS，旧调用点仍然能靠 Task 1 的兼容层通过。

- [ ] **Step 5: 提交错误域边界收口**

```bash
git add src/errors/commander-error-adapter.ts src/errors/error-display.ts src/errors/fatal-error-handler.ts src/errors/index.ts src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts src/types/index.ts
git rm src/tools/error-display.ts src/types/error/index.ts
git commit -m "refactor: isolate commander error handling"
```

### Task 3: 迁移所有调用点并删除旧构造签名

**Files:**
- Modify: `src/errors/error-code.ts`
- Modify: `src/errors/app-error.ts`
- Modify: `src/main.ts`
- Modify: `src/tools/load-package-json-info.ts`
- Modify: `src/tools/prompt-service.ts`
- Modify: `src/features/platform/platform-resolver.ts`
- Modify: `src/features/source/fetch-github-client.ts`
- Modify: `src/features/source/github-skill-source.ts`
- Modify: `src/features/skill/selected-skill-entry-builder.ts`
- Modify: `src/features/skill/skill-document-parser.ts`
- Modify: `src/features/skill/skill-index-parser.ts`
- Modify: `src/features/skill/skill-installer.ts`
- Modify: `src/features/skill/skill-name-parser.ts`
- Modify: `src/commands/list/command.ts`
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/update/command.ts`
- Test: `src/errors/app-error.test.ts`

**Interfaces:**
- Consumes:
  - `APP_ERROR_DEFINITIONS`
  - `AppErrorParamsMap`
  - `AppErrorOptions<TCode>`
  - `buildCommanderAppError(error: CommanderError): AppError`
- Produces:
  - 完整的 `Record<AppErrorCodeName, IAppErrorDefinition<...>>`
  - 仅保留 `new AppError(code)` / `new AppError(code, { params, cause })`
  - 所有仓库内 `AppError` 调用点都使用新签名

- [ ] **Step 1: 扩展失败测试，锁住剩余参数化消息和最终严格签名**

```ts
// src/errors/app-error.test.ts
it("builds command-specific non-interactive guidance", () => {
  const error = new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
    params: {
      optionName: "--platform",
      actionName: "安装",
      targetName: "平台",
    },
  })

  expect(error.message).toBe("当前环境不支持交互提示，请使用 --platform 显式指定要安装的平台。")
})

it("builds the package-config not-found variant", () => {
  const error = new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
    params: { kind: "not-found" },
  })

  expect(error.message).toBe("未找到 package.json。")
})

it("builds a multi-skill not-found message", () => {
  const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
    params: {
      skillNames: ["yeizi-react", "yeizi-vue"],
    },
  })

  expect(error.message).toBe("以下技能不存在：yeizi-react、yeizi-vue。")
})
```

- [ ] **Step 2: 先跑测试和类型检查，确认还剩定义表与调用点没有迁完**

Run: `bun test src/errors/app-error.test.ts`  
Expected: FAIL，因为 `NON_INTERACTIVE_OPTION_REQUIRED`、`PACKAGE_CONFIG_INVALID` 等定义尚未接入 `APP_ERROR_DEFINITIONS`。

Run: `bun run typecheck`  
Expected: PASS，此时旧调用点还能依赖兼容层；这一步只是记录当前基线。

- [ ] **Step 3: 扩完整定义表、迁移所有调用点，并删掉兼容层**

```ts
// src/errors/error-code.ts
export interface AppErrorParamsMap {
  [AppErrorCode.UNEXPECTED_ERROR]: undefined
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: undefined
  [AppErrorCode.PACKAGE_CONFIG_INVALID]: TPackageConfigInvalidParams
  [AppErrorCode.PLATFORM_OPTION_EMPTY]: undefined
  [AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED]: TNonInteractiveOptionRequiredParams
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: { platformName: string }
  [AppErrorCode.SKILL_OPTION_EMPTY]: undefined
  [AppErrorCode.SKILL_OPTION_INVALID]: undefined
  [AppErrorCode.SKILL_NOT_FOUND]: TSkillNotFoundParams
  [AppErrorCode.PROMPT_UNAVAILABLE]: undefined
  [AppErrorCode.PROMPT_CANCELLED]: undefined
  [AppErrorCode.SKILL_DOCUMENT_MISSING]: { skillName: string }
  [AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH]: { skillName: string }
  [AppErrorCode.SKILL_FILES_NOT_LOADED]: { skillName: string }
  [AppErrorCode.SKILL_INSTALL_PATH_INVALID]: { relativeFilePath: string }
  [AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED]: { skillName: string }
  [AppErrorCode.REMOTE_SKILL_INDEX_INVALID]: undefined
  [AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID]: undefined
  [AppErrorCode.GITHUB_CONTENTS_INVALID]: undefined
  [AppErrorCode.GITHUB_REQUEST_FAILED]: TGitHubRequestFailedParams
  [AppErrorCode.GITHUB_REQUEST_TIMEOUT]: TGitHubRequestTimeoutParams
  [AppErrorCode.GITHUB_CONTENT_PATH_INVALID]: { contentPath: string }
  [AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING]: { contentPath: string }
}

export function getAppErrorDefinition<TCode extends AppErrorCodeName>(
  code: TCode,
): IAppErrorDefinition<AppErrorParamsMap[TCode]> {
  return APP_ERROR_DEFINITIONS[code]
}

export const APP_ERROR_DEFINITIONS: {
  [TCode in AppErrorCodeName]: IAppErrorDefinition<AppErrorParamsMap[TCode]>
} = {
  // 按照本计划 “Final Definition Mapping” 小节完整填满所有 code
}
```

```ts
// src/errors/app-error.ts
import type { AppErrorCodeName, AppErrorOptions } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

class AppError<TCode extends AppErrorCodeName = AppErrorCodeName> extends Error {
  public readonly code: TCode
  public readonly title: string

  public constructor(code: TCode, options?: AppErrorOptions<TCode>) {
    const definition = getAppErrorDefinition(code)

    super(definition.buildMessage(options?.params), {
      cause: options?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}
```

把下面这些调用点逐个替换成新签名：

```ts
// src/main.ts
throw new AppError(AppErrorCode.PACKAGE_BIN_CONFIG_MISSING)

// src/tools/load-package-json-info.ts
throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
  params: { kind: "invalid-format" },
  cause: error,
})

throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
  params: { kind: "not-found" },
})

// src/tools/prompt-service.ts
throw new AppError(AppErrorCode.PROMPT_UNAVAILABLE)
throw new AppError(AppErrorCode.PROMPT_CANCELLED, { cause: error })

// src/features/platform/platform-resolver.ts
throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
  params: { platformName },
})

throw new AppError(AppErrorCode.PLATFORM_OPTION_EMPTY)

// src/features/source/fetch-github-client.ts
throw new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
  params: { kind: "status-code", statusCode: httpResponse.status },
})

throw new AppError(AppErrorCode.GITHUB_REQUEST_TIMEOUT, {
  params: { timeoutSeconds: GITHUB_REQUEST_TIMEOUT_MS / 1000 },
  cause: error,
})

throw new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
  params: { kind: "network-retry" },
  cause: error,
})

throw new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
  params: { kind: "generic" },
})

// src/features/source/github-skill-source.ts
throw new AppError(AppErrorCode.GITHUB_CONTENTS_INVALID, { cause: error })
throw new AppError(AppErrorCode.GITHUB_CONTENT_PATH_INVALID, {
  params: { contentPath: loadedGitHubFile.path },
})
throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
  params: { skillName: skillIndexEntry.name },
})
throw new AppError(AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH, {
  params: { skillName: skillIndexEntry.name },
})
throw new AppError(AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING, {
  params: { contentPath: githubContentEntry.path },
})

// src/features/skill/selected-skill-entry-builder.ts
throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillNames: missingSkillNames as [string, ...string[]] },
})
throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillNames: [skillName] },
})

// src/features/skill/skill-document-parser.ts
throw new AppError(AppErrorCode.REMOTE_SKILL_DOCUMENT_INVALID, { cause: error })

// src/features/skill/skill-index-parser.ts
throw new AppError(AppErrorCode.REMOTE_SKILL_INDEX_INVALID, { cause: error })

// src/features/skill/skill-installer.ts
throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
  params: { skillName: skillIndexEntry.name },
})
throw new AppError(AppErrorCode.SKILL_DOCUMENT_VERSION_MISMATCH, {
  params: { skillName: skillIndexEntry.name },
})
throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
  params: { relativeFilePath: downloadedSkillFile.relativeFilePath },
})
throw new AppError(AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED, {
  params: { skillName: skillIndexEntry.name },
  cause: restoreError,
})

// src/features/skill/skill-name-parser.ts
throw new AppError(AppErrorCode.SKILL_OPTION_EMPTY)
throw new AppError(AppErrorCode.SKILL_OPTION_INVALID)

// src/commands/list/command.ts
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--platform",
    actionName: "查看",
    targetName: "平台",
  },
})

// src/commands/install/command.ts
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--platform",
    actionName: "安装",
    targetName: "平台",
  },
})
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--skill",
    actionName: "安装",
    targetName: "技能",
  },
})
throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
  params: { skillName: skillIndexEntry.name },
})

// src/commands/update/command.ts
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--platform",
    actionName: "更新",
    targetName: "平台",
  },
})
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--skill",
    actionName: "更新",
    targetName: "技能",
  },
})
throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillNames: [matchedRow.skillName] },
})
throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
  params: { skillName: matchedSkillEntry.name },
})
```

收尾要求：

- 删除 `AppError` 的旧签名兼容分支。
- 删掉所有 `title` / `message` 直接从调用点传入的写法。
- `selected-skill-entry-builder.ts` 里如果不想保留 `as [string, ...string[]]`，就先把 `missingSkillNames.length > 0` 的分支拆出成一个局部变量，让类型自然收窄成非空元组。

- [ ] **Step 4: 跑完整验证，确认全仓库已经只剩新接口**

Run: `bun test src/errors/app-error.test.ts src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS，所有 `new AppError(...)` 调用点都不再依赖旧签名。

Run: `bun run check`  
Expected: PASS

- [ ] **Step 5: 提交最终迁移**

```bash
git add src/errors/error-code.ts src/errors/app-error.ts src/main.ts src/tools/load-package-json-info.ts src/tools/prompt-service.ts src/features/platform/platform-resolver.ts src/features/source/fetch-github-client.ts src/features/source/github-skill-source.ts src/features/skill/selected-skill-entry-builder.ts src/features/skill/skill-document-parser.ts src/features/skill/skill-index-parser.ts src/features/skill/skill-installer.ts src/features/skill/skill-name-parser.ts src/commands/list/command.ts src/commands/install/command.ts src/commands/update/command.ts src/errors/app-error.test.ts
git commit -m "refactor: migrate app errors to code and params"
```

## Self-Review

### Spec Coverage

- `code` 成为单一真相源：Task 1 和 Task 3 完成。
- 只允许 `code + params + cause`：Task 1 引入新 API，Task 3 删除兼容层。
- Commander 适配保留在 `src/errors/*`：Task 2 完成。
- CLI 展示保留在 `src/errors/*`：Task 2 完成。
- 不引入 `unknown` / `any`：三项任务都明确限制。
- 不创建 `src/errors/types/*`：整个计划都未引入该目录。
- 错误域测试：Task 1、Task 2、Task 3 都有明确回归测试和命令。

### Placeholder Scan

- 没有 `TBD` / `TODO` / “类似 Task N” 之类占位描述。
- 每个测试步骤都给了具体文件和断言。
- 每个实现步骤都给了要新增或替换的代码形状。
- 每个验证步骤都有明确命令和预期结果。

### Type Consistency

- `AppErrorParamsMap`
- `AppErrorOptions<TCode>`
- `buildCommanderAppError(error: CommanderError): AppError`
- `isCommanderNonFailure(error: Error): error is CommanderError`
- `normalizeFatalError(error: Error): AppError`

这些名字在三个任务里保持一致，没有前后改名。
