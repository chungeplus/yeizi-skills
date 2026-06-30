### Task 3: 杩佺Щ鎵€鏈夎皟鐢ㄧ偣骞跺垹闄ゆ棫鏋勯€犵鍚?
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
  - 瀹屾暣鐨?`Record<AppErrorCodeName, IAppErrorDefinition<...>>`
  - 浠呬繚鐣?`new AppError(code)` / `new AppError(code, { params, cause })`
  - 鎵€鏈変粨搴撳唴 `AppError` 璋冪敤鐐归兘浣跨敤鏂扮鍚?
- [ ] **Step 1: 鎵╁睍澶辫触娴嬭瘯锛岄攣浣忓墿浣欏弬鏁板寲娑堟伅鍜屾渶缁堜弗鏍肩鍚?*

```ts
// src/errors/app-error.test.ts
it("builds command-specific non-interactive guidance", () => {
  const error = new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
    params: {
      optionName: "--platform",
      actionName: "瀹夎",
      targetName: "骞冲彴",
    },
  })

  expect(error.message).toBe("褰撳墠鐜涓嶆敮鎸佷氦浜掓彁绀猴紝璇蜂娇鐢?--platform 鏄惧紡鎸囧畾瑕佸畨瑁呯殑骞冲彴銆?)
})

it("builds the package-config not-found variant", () => {
  const error = new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
    params: { kind: "not-found" },
  })

  expect(error.message).toBe("鏈壘鍒?package.json銆?)
})

it("builds a multi-skill not-found message", () => {
  const error = new AppError(AppErrorCode.SKILL_NOT_FOUND, {
    params: {
      skillNames: ["yeizi-react", "yeizi-vue"],
    },
  })

  expect(error.message).toBe("浠ヤ笅鎶€鑳戒笉瀛樺湪锛歽eizi-react銆亂eizi-vue銆?)
})
```

- [ ] **Step 2: 鍏堣窇娴嬭瘯鍜岀被鍨嬫鏌ワ紝纭杩樺墿瀹氫箟琛ㄤ笌璋冪敤鐐规病鏈夎縼瀹?*

Run: `bun test src/errors/app-error.test.ts`  
Expected: FAIL锛屽洜涓?`NON_INTERACTIVE_OPTION_REQUIRED`銆乣PACKAGE_CONFIG_INVALID` 绛夊畾涔夊皻鏈帴鍏?`APP_ERROR_DEFINITIONS`銆?
Run: `bun run typecheck`  
Expected: PASS锛屾鏃舵棫璋冪敤鐐硅繕鑳戒緷璧栧吋瀹瑰眰锛涜繖涓€姝ュ彧鏄褰曞綋鍓嶅熀绾裤€?
- [ ] **Step 3: 鎵╁畬鏁村畾涔夎〃銆佽縼绉绘墍鏈夎皟鐢ㄧ偣锛屽苟鍒犳帀鍏煎灞?*

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
  // 鎸夌収鏈鍒?鈥淔inal Definition Mapping鈥?灏忚妭瀹屾暣濉弧鎵€鏈?code
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

鎶婁笅闈㈣繖浜涜皟鐢ㄧ偣閫愪釜鏇挎崲鎴愭柊绛惧悕锛?
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
    actionName: "鏌ョ湅",
    targetName: "骞冲彴",
  },
})

// src/commands/install/command.ts
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--platform",
    actionName: "瀹夎",
    targetName: "骞冲彴",
  },
})
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--skill",
    actionName: "瀹夎",
    targetName: "鎶€鑳?,
  },
})
throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
  params: { skillName: skillIndexEntry.name },
})

// src/commands/update/command.ts
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--platform",
    actionName: "鏇存柊",
    targetName: "骞冲彴",
  },
})
throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
  params: {
    optionName: "--skill",
    actionName: "鏇存柊",
    targetName: "鎶€鑳?,
  },
})
throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillNames: [matchedRow.skillName] },
})
throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
  params: { skillName: matchedSkillEntry.name },
})
```

鏀跺熬瑕佹眰锛?
- 鍒犻櫎 `AppError` 鐨勬棫绛惧悕鍏煎鍒嗘敮銆?- 鍒犳帀鎵€鏈?`title` / `message` 鐩存帴浠庤皟鐢ㄧ偣浼犲叆鐨勫啓娉曘€?- `selected-skill-entry-builder.ts` 閲屽鏋滀笉鎯充繚鐣?`as [string, ...string[]]`锛屽氨鍏堟妸 `missingSkillNames.length > 0` 鐨勫垎鏀媶鍑烘垚涓€涓眬閮ㄥ彉閲忥紝璁╃被鍨嬭嚜鐒舵敹绐勬垚闈炵┖鍏冪粍銆?
- [ ] **Step 4: 璺戝畬鏁撮獙璇侊紝纭鍏ㄤ粨搴撳凡缁忓彧鍓╂柊鎺ュ彛**

Run: `bun test src/errors/app-error.test.ts src/errors/commander-error-adapter.test.ts src/errors/fatal-error-handler.test.ts`  
Expected: PASS

Run: `bun run typecheck`  
Expected: PASS锛屾墍鏈?`new AppError(...)` 璋冪敤鐐归兘涓嶅啀渚濊禆鏃х鍚嶃€?
Run: `bun run check`  
Expected: PASS

- [ ] **Step 5: 鎻愪氦鏈€缁堣縼绉?*

```bash
git add src/errors/error-code.ts src/errors/app-error.ts src/main.ts src/tools/load-package-json-info.ts src/tools/prompt-service.ts src/features/platform/platform-resolver.ts src/features/source/fetch-github-client.ts src/features/source/github-skill-source.ts src/features/skill/selected-skill-entry-builder.ts src/features/skill/skill-document-parser.ts src/features/skill/skill-index-parser.ts src/features/skill/skill-installer.ts src/features/skill/skill-name-parser.ts src/commands/list/command.ts src/commands/install/command.ts src/commands/update/command.ts src/errors/app-error.test.ts
git commit -m "refactor: migrate app errors to code and params"
```

