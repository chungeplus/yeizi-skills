### Task 1: 寤虹珛鏂扮殑 AppError 鏍稿績骞跺姞涓婅繃娓℃祴璇?
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

- [ ] **Step 1: 鍏堝啓澶辫触娴嬭瘯锛岄攣浣忔柊 API 鐨勭洰鏍囪涓?*

```ts
// src/errors/app-error.test.ts
import { describe, expect, it } from "bun:test"

import { AppError, AppErrorCode } from "@/errors"

describe("AppError", () => {
  it("uses the definition title and default message for code-only errors", () => {
    const error = new AppError(AppErrorCode.UNEXPECTED_ERROR)

    expect(error.title).toBe("绋嬪簭寮傚父")
    expect(error.message).toBe("绋嬪簭鎵ц澶辫触锛岃绋嶅悗閲嶈瘯銆?)
  })

  it("builds a single-skill not-found message from typed params", () => {
    const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
      params: { skillNames: ["yeizi-react"] },
    })

    expect(error.title).toBe("鎶€鑳戒笉瀛樺湪")
    expect(error.message).toBe("鎶€鑳解€測eizi-react鈥濅笉瀛樺湪銆?)
  })

  it("preserves cause while building a status-code GitHub failure message", () => {
    const cause = new Error("network")
    const error = new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
      params: { kind: "status-code", statusCode: 404 },
      cause,
    })

    expect(error.cause).toBe(cause)
    expect(error.message).toBe("GitHub 璇锋眰澶辫触锛岀姸鎬佺爜涓?404銆?)
  })
})
```

- [ ] **Step 2: 杩愯娴嬭瘯锛岀‘璁ゅ綋鍓嶅疄鐜扮‘瀹炰笉婊¤冻鏂版帴鍙?*

Run: `bun test src/errors/app-error.test.ts`  
Expected: FAIL锛屽洜涓哄綋鍓?`AppError` 浠嶈姹?`title` / `message`锛宍error.title` 浼氭槸 `undefined`锛屽弬鏁板寲娑堟伅涔熶笉浼氱敓鎴愩€?
- [ ] **Step 3: 瀹炵幇鏂扮殑瀹氫箟琛ㄥ拰杩囨浮鐗堟瀯閫犲嚱鏁?*

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
    title: "绋嬪簭寮傚父",
    buildMessage: () => "绋嬪簭鎵ц澶辫触锛岃绋嶅悗閲嶈瘯銆?,
  },
  [AppErrorCode.CLI_USAGE_INVALID]: {
    title: "鍛戒护鐢ㄦ硶閿欒",
    buildMessage: params => params.detailMessage,
  },
  [AppErrorCode.PROMPT_CANCELLED]: {
    title: "宸插彇娑堟搷浣?,
    buildMessage: () => "宸插彇娑堟湰娆℃搷浣溿€?,
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "鎶€鑳戒笉瀛樺湪",
    buildMessage: params =>
      params.skillNames.length === 1
        ? `鎶€鑳解€?{params.skillNames[0]}鈥濅笉瀛樺湪銆俙
        : `浠ヤ笅鎶€鑳戒笉瀛樺湪锛?{params.skillNames.join("銆?)}銆俙,
  },
  [AppErrorCode.GITHUB_REQUEST_FAILED]: {
    title: "杩滅璇锋眰澶辫触",
    buildMessage: (params) => {
      if (params.kind === "status-code") {
        return `GitHub 璇锋眰澶辫触锛岀姸鎬佺爜涓?${params.statusCode}銆俙
      }

      if (params.kind === "network-retry") {
        return "GitHub 璇锋眰澶辫触锛岃妫€鏌ョ綉缁滃悗閲嶈瘯銆?
      }

      return "GitHub 璇锋眰澶辫触銆?
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

璇存槑锛歍ask 1 鐨勭洰鏍囨槸鍏堟妸鏂?API 绔嬩綇锛屽悓鏃朵繚鐣欐棫绛惧悕鍏煎灞傦紝璁╁悗缁皟鐢ㄧ偣杩佺Щ鍙互灏忔鎺ㄨ繘銆俆ask 3 瀹屾垚鍚庯紝鏃х鍚嶅吋瀹瑰眰蹇呴』褰诲簳鍒犻櫎銆?
- [ ] **Step 4: 閲嶆柊璺戞祴璇曞拰绫诲瀷妫€鏌ワ紝纭杩囨浮鏍稿績鍙敤**

Run: `bun test src/errors/app-error.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS锛岀幇鏈夋棫璋冪敤鐐圭户缁€氳繃锛屽洜涓烘棫绛惧悕鍏煎灞備粛鍦ㄣ€?
- [ ] **Step 5: 鎻愪氦杩囨浮鏍稿績**

```bash
git add package.json src/errors/error-code.ts src/errors/app-error.ts src/errors/app-error.test.ts
git commit -m "refactor: add code-driven app error core"
```

