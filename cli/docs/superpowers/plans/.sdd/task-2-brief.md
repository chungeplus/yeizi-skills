### Task 2: 鎶?Commander 閫傞厤鍜岄敊璇睍绀烘敹鍙ｅ埌 `src/errors/*`

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

- [ ] **Step 1: 鍏堝啓澶辫触娴嬭瘯锛岄攣浣?Commander 閫傞厤鍜?fatal handler 琛屼负**

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
    expect(appError.title).toBe("鍛戒护鐢ㄦ硶閿欒")
    expect(appError.message).toBe("閫夐」鈥?-skill鈥濅笉鍙楁敮鎸侊紝璇蜂娇鐢?--help 鏌ョ湅鍙敤閫夐」銆?)
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
    expect(appError.message).toBe("缂哄皯蹇呭～鍙傛暟鈥渟kill鈥濄€?)
  })

  it("marks help output as a success exit", () => {
    handleFatalError(new CommanderError(0, "commander.helpDisplayed", "(outputHelp)"))

    expect(process.exitCode).toBe(0)
  })
})
```

- [ ] **Step 2: 杩愯娴嬭瘯锛岀‘璁ゅ綋鍓嶉敊璇煙杩樻病鏈夎繖浜涗笓闂ㄨ竟鐣?*

Run: `bun test src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: FAIL锛屽洜涓?`@/errors/commander-error-adapter` 杩樹笉瀛樺湪锛宍normalizeFatalError` 涔熻繕鏈鍑恒€?
- [ ] **Step 3: 瀹炵幇 Commander adapter銆乫atal handler 缂栨帓鍜岄敊璇睍绀鸿縼绉?*

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
      `鍛戒护鈥?{extractQuotedValue(currentError.message) ?? "鏈煡鍛戒护"}鈥濅笉瀛樺湪锛岃浣跨敤 --help 鏌ョ湅鍙敤鍛戒护銆俙,
    "commander.unknownOption": currentError =>
      `閫夐」鈥?{extractQuotedValue(currentError.message) ?? "鏈煡閫夐」"}鈥濅笉鍙楁敮鎸侊紝璇蜂娇鐢?--help 鏌ョ湅鍙敤閫夐」銆俙,
    "commander.optionMissingArgument": currentError =>
      `閫夐」鈥?{extractQuotedValue(currentError.message) ?? "鏈煡閫夐」"}鈥濈己灏戝弬鏁板€笺€俙,
    "commander.missingMandatoryOptionValue": currentError =>
      `缂哄皯蹇呭～閫夐」鈥?{extractQuotedValue(currentError.message) ?? "鏈煡閫夐」"}鈥濄€俙,
    "commander.missingArgument": currentError =>
      `缂哄皯蹇呭～鍙傛暟鈥?{extractQuotedValue(currentError.message) ?? "鏈煡鍙傛暟"}鈥濄€俙,
    "commander.excessArguments": currentError => buildExcessArgumentsMessage(currentError.message),
  }

  const builder = builders[error.code]
  return builder ? builder(error) : "鍛戒护鍙傛暟涓嶆纭紝璇蜂娇鐢?--help 鏌ョ湅姝ｇ‘鐢ㄦ硶銆?
}

function buildExcessArgumentsMessage(message: string): string {
  const matchedResult = message.match(/Expected (\\d+) arguments? but got (\\d+)\\./)

  if (matchedResult === null) {
    return "鍛戒护鍙傛暟杩囧锛岃浣跨敤 --help 鏌ョ湅姝ｇ‘鐢ㄦ硶銆?
  }

  return `鍛戒护鍙傛暟杩囧锛屾湡鏈?${matchedResult[1]} 涓紝瀹為檯鏀跺埌 ${matchedResult[2]} 涓€俙
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

瀹炵幇瑕佹眰锛?
- `src/tools/error-display.ts` 鍒犻櫎鍚庯紝`fatal-error-handler.ts` 蹇呴』鏀逛负鐩稿寮曠敤 `./error-display`銆?- `ICommanderMessageBuilder` / `ICommanderMessageBuilders` 涓嶅啀鐣欏湪 `src/types/error/index.ts`锛岃涔堝唴鑱斿湪 `commander-error-adapter.ts`锛岃涔堝氨杩戞斁鍦ㄥ悓鏂囦欢椤堕儴銆?- 杩欓噷涓嶅厑璁告妸 Commander 閫傞厤鍐嶆尓鍥?`src/types/*` 鎴?`src/tools/*`銆?
- [ ] **Step 4: 杩愯娴嬭瘯锛岀‘璁ら敊璇煙杈圭晫宸茬粡鏀跺彛**

Run: `bun test src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS锛屾棫璋冪敤鐐逛粛鐒惰兘闈?Task 1 鐨勫吋瀹瑰眰閫氳繃銆?
- [ ] **Step 5: 鎻愪氦閿欒鍩熻竟鐣屾敹鍙?*

```bash
git add src/errors/commander-error-adapter.ts src/errors/error-display.ts src/errors/fatal-error-handler.ts src/errors/index.ts src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts src/types/index.ts
git rm src/tools/error-display.ts src/types/error/index.ts
git commit -m "refactor: isolate commander error handling"
```

