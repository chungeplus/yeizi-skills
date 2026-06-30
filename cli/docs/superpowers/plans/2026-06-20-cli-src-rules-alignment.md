# CLI src Rules Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 只重构 `src/**/*`，让现有 CLI 代码与项目规则、TypeScript 规则和注释规则对齐，同时保持现有行为不变。

**Architecture:** 先收口基础层，再收口依赖它们的上层模块。按“错误与类型命名 -> 无状态工具函数化 -> 底层流程语句重构 -> 命令层流程语句重构 -> 注释与 TSDoc 收口”的顺序推进，每个任务都用固定审计命令和 `bun run check` 验证。

**Tech Stack:** TypeScript, Bun, Commander, Inquirer, Zod, semver, Node.js

## Global Constraints

- 以 `rules/technologies/typescript/*` 和 `rules/projects/*` 为唯一规则来源。
- 不修改当前需求无关内容。
- 不为未来变化提前扩展。
- 保持现有 CLI 行为不变。
- 只清理本次重构直接带来的问题。
- 交付前必须运行当前项目已有检查命令验证结果。
- 本次重构只覆盖：`src/**/*`
- 本次不覆盖：`package.json`
- 本次不覆盖：`tsconfig*`
- 本次不覆盖：`eslint` 配置
- 本次不覆盖：`根目录脚本`
- 本次不覆盖：`docs/**/*`
- 本次不覆盖：`rules-project/**/*`

---

## File Map

- `src/errors/app-error.ts`
  - `AppError` 构造器和错误实例字段。
- `src/errors/error-code.ts`
  - 错误码、错误参数映射、错误定义查找。
- `src/tools/prompt-service.ts`
  - 交互式提示相关流程。
- `src/features/platform/platform-resolver.ts`
  - 平台解析和平台目标路径组装。
- `src/features/skill/skill-comparator.ts`
  - 技能比较结果、更新结果和筛选结果。
- `src/features/source/fetch-github-client.ts`
  - 远端文本和 JSON 响应加载。
- `src/features/source/github-skill-source.ts`
  - 技能索引、技能文件、远端版本校验。
- `src/features/skill/skill-installer.ts`
  - 本地技能目录更新和回滚。
- `src/tools/load-package-json-info.ts`
  - `package.json` 路径定位与加载。
- `src/commands/install/command.ts`
  - `install` 命令流程。
- `src/commands/list/command.ts`
  - `list` 命令流程。
- `src/commands/update/command.ts`
  - `update` 命令流程。
- `src/types/package-json.ts`
  - `package.json` 结构。
- `src/types/command/index.ts`
  - 命令公共接口。
- `src/types/source/index.ts`
  - 远端来源公共接口。
- `src/types/skill/index.ts`
  - 技能索引、frontmatter、比较结果。
- `src/types/platform/index.ts`
  - 平台名称和平台目标结构。
- `src/commands/install/types/index.ts`
  - `install` 命令选项类型。
- `src/commands/list/types/index.ts`
  - `list` 命令选项类型。
- `src/commands/update/types/index.ts`
  - `update` 命令选项类型。
- `src/tools/index.ts`
  - 工具函数 barrel。
- `src/features/platform/index.ts`
  - 平台函数 barrel。
- `src/features/skill/index.ts`
  - 技能函数 barrel。

### Task 1: Align Error Core Naming

**Files:**
- Modify: `src/errors/app-error.ts`
- Modify: `src/errors/error-code.ts`
- Test: `src/errors/app-error.ts`
- Test: `src/errors/error-code.ts`

**Interfaces:**
- Consumes: `AppErrorCodeName`
- Produces: `IAppErrorOptions`
- Produces: `IAppErrorDefinition`
- Produces: `IAppErrorParamsMap`
- Produces: `getAppErrorDefinition(code: AppErrorCodeName): IAppErrorDefinition`
- Produces: `class AppError extends Error`

- [ ] **Step 1: Write the failing audit**

```powershell
rg -n "^interface\s+(AppErrorOptions|AppErrorDefinition|AppErrorParamsMap)" src/errors
```

- [ ] **Step 2: Run audit to verify it fails**

Run:

```powershell
rg -n "^interface\s+(AppErrorOptions|AppErrorDefinition|AppErrorParamsMap)" src/errors
```

Expected:

```text
src/errors/app-error.ts:interface AppErrorOptions
src/errors/error-code.ts:interface AppErrorDefinition
src/errors/error-code.ts:interface AppErrorParamsMap
```

- [ ] **Step 3: Write minimal implementation**

```typescript
interface IAppErrorOptions {
  cause?: Error
  params?: IAppErrorParamsMap[AppErrorCodeName]
}

interface IAppErrorDefinition {
  title: string
  buildMessage: (params: IAppErrorParamsMap[AppErrorCodeName]) => string
}

interface IAppErrorParamsMap {
  [AppErrorCode.UNEXPECTED_ERROR]: undefined
  [AppErrorCode.CLI_USAGE_INVALID]: { detailMessage: string }
  [AppErrorCode.PACKAGE_BIN_CONFIG_MISSING]: undefined
}

class AppError extends Error {
  public constructor(code: AppErrorCodeName, options?: IAppErrorOptions) {
    const definition = getAppErrorDefinition(code)
    const params = options?.params

    super(definition.buildMessage(params), {
      cause: options?.cause,
    })
  }
}

function getAppErrorDefinition(code: AppErrorCodeName): IAppErrorDefinition {
  return ({
    [AppErrorCode.UNEXPECTED_ERROR]: {
      title: "程序异常",
      buildMessage: () => "程序执行失败，请稍后重试。",
    },
  } satisfies Record<AppErrorCodeName, IAppErrorDefinition>)[code]
}
```

- [ ] **Step 4: Run verification**

Run:

```powershell
rg -n "^interface\s+(AppErrorOptions|AppErrorDefinition|AppErrorParamsMap)" src/errors
bun run check
```

Expected:

```text
第一条命令无输出
$ bun run typecheck && bun run lint
$ tsc --noEmit
$ eslint .
```

- [ ] **Step 5: Commit**

```bash
git add src/errors/app-error.ts src/errors/error-code.ts
git commit -m "refactor: align error core naming"
```

### Task 2: Replace Stateless Helper Classes With Functions

**Files:**
- Modify: `src/tools/prompt-service.ts`
- Modify: `src/features/platform/platform-resolver.ts`
- Modify: `src/features/skill/skill-comparator.ts`
- Modify: `src/tools/index.ts`
- Modify: `src/features/platform/index.ts`
- Modify: `src/features/skill/index.ts`
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/list/command.ts`
- Modify: `src/commands/update/command.ts`
- Test: `src/tools/prompt-service.ts`
- Test: `src/features/platform/platform-resolver.ts`
- Test: `src/features/skill/skill-comparator.ts`

**Interfaces:**
- Consumes: `SupportedPlatformName`
- Consumes: `ISkillIndexEntry`
- Consumes: `ISkillComparisonRow`
- Produces: `isInteractiveTerminal(): boolean`
- Produces: `selectPlatforms(platformNames: readonly SupportedPlatformName[]): Promise<SupportedPlatformName[]>`
- Produces: `selectSkills(skillIndexEntries: readonly ISkillIndexEntry[]): Promise<string[]>`
- Produces: `selectSkillsToUpdate(skillNames: readonly string[]): Promise<string[]>`
- Produces: `parsePlatforms(platformOptionValue: string | undefined): SupportedPlatformName[]`
- Produces: `buildPlatformTargets(homeDirectoryPath: string, selectedPlatformNames: readonly SupportedPlatformName[]): IPlatformTarget[]`
- Produces: `buildComparisonRows(skillIndexEntries: readonly ISkillIndexEntry[], platformTargets: readonly IPlatformTarget[]): ISkillComparisonRow[]`
- Produces: `buildUpdateRows(comparisonRows: readonly ISkillComparisonRow[]): ISkillComparisonRow[]`
- Produces: `buildUpdateSkillNames(comparisonRows: readonly ISkillComparisonRow[]): string[]`
- Produces: `buildSelectedRows(comparisonRows: readonly ISkillComparisonRow[], selectedSkillNames: readonly string[]): ISkillComparisonRow[]`

- [ ] **Step 1: Write the failing audit**

```powershell
rg -n "^class (PromptService|PlatformResolver|SkillComparator)" src
```

- [ ] **Step 2: Run audit to verify it fails**

Run:

```powershell
rg -n "^class (PromptService|PlatformResolver|SkillComparator)" src
```

Expected:

```text
src/tools/prompt-service.ts:class PromptService
src/features/platform/platform-resolver.ts:class PlatformResolver
src/features/skill/skill-comparator.ts:class SkillComparator
```

- [ ] **Step 3: Write minimal implementation**

```typescript
function isInteractiveTerminal(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true
}

async function selectPlatforms(
  platformNames: readonly SupportedPlatformName[],
): Promise<SupportedPlatformName[]> {
  const answers = await runPrompt(async () => inquirer.prompt<{ platformNames: SupportedPlatformName[] }>([
    {
      type: "checkbox",
      name: "platformNames",
      message: "请选择平台。",
      choices: [...platformNames],
    },
  ]))

  return answers.platformNames
}

function parsePlatforms(platformOptionValue: string | undefined): SupportedPlatformName[] {
  const parsedPlatformNames = parseCsvOptionValues(platformOptionValue)

  return parsedPlatformNames.map((platformName) => {
    const parsedPlatformNameResult = supportedPlatformNameSchema.safeParse(platformName)

    if (parsedPlatformNameResult.success) {
      return parsedPlatformNameResult.data
    }

    throw new AppError(AppErrorCode.PLATFORM_NOT_SUPPORTED, {
      params: { platformName },
    })
  })
}

function buildUpdateRows(
  comparisonRows: readonly ISkillComparisonRow[],
): ISkillComparisonRow[] {
  return comparisonRows.filter(
    comparisonRow =>
      comparisonRow.statusMessage === SkillComparisonStatus.UPDATE_AVAILABLE
      || comparisonRow.statusMessage === SkillComparisonStatus.LOCAL_SKILL_INVALID,
  )
}

const isInteractive = isInteractiveTerminal()
const selectedPlatformNames = parsePlatforms(commandOptions.platform)
const comparisonRows = buildComparisonRows(skillIndex.skills, platformTargets)
```

- [ ] **Step 4: Run verification**

Run:

```powershell
rg -n "^class (PromptService|PlatformResolver|SkillComparator)" src
bun run check
```

Expected:

```text
第一条命令无输出
$ bun run typecheck && bun run lint
$ tsc --noEmit
$ eslint .
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/prompt-service.ts src/features/platform/platform-resolver.ts src/features/skill/skill-comparator.ts src/tools/index.ts src/features/platform/index.ts src/features/skill/index.ts src/commands/install/command.ts src/commands/list/command.ts src/commands/update/command.ts
git commit -m "refactor: replace stateless helper classes"
```

### Task 3: Remove Keyword Loops From Lower Layers

**Files:**
- Modify: `src/tools/load-package-json-info.ts`
- Modify: `src/features/source/github-skill-source.ts`
- Modify: `src/features/skill/skill-installer.ts`
- Test: `src/tools/load-package-json-info.ts`
- Test: `src/features/source/github-skill-source.ts`
- Test: `src/features/skill/skill-installer.ts`

**Interfaces:**
- Consumes: `loadPackageJsonInfo(): ReturnType<typeof packageJsonInfoSchema.parse>`
- Consumes: `loadGitHubFileEntries(githubContentPath: string): Promise<Array<{ path: string, fileContents: string }>>`
- Consumes: `updateSkillDirectory(skillsDirectoryPath: string, skillIndexEntry: ISkillIndexEntry, downloadedSkillFiles: readonly IDownloadedSkillFile[]): Promise<void>`
- Produces: `findPackageJsonPath(currentDirectoryPath: string): string`
- Produces: `loadGitHubFileEntries(githubContentPath: string): Promise<Array<{ path: string, fileContents: string }>>`
- Produces: `updateSkillDirectory(skillsDirectoryPath: string, skillIndexEntry: ISkillIndexEntry, downloadedSkillFiles: readonly IDownloadedSkillFile[]): Promise<void>`

- [ ] **Step 1: Write the failing audit**

```powershell
rg -n "\bwhile\b|for \(" src/tools/load-package-json-info.ts src/features/source/github-skill-source.ts src/features/skill/skill-installer.ts
```

- [ ] **Step 2: Run audit to verify it fails**

Run:

```powershell
rg -n "\bwhile\b|for \(" src/tools/load-package-json-info.ts src/features/source/github-skill-source.ts src/features/skill/skill-installer.ts
```

Expected:

```text
src/tools/load-package-json-info.ts:while (true)
src/features/source/github-skill-source.ts:for (const githubContentEntry of githubContentEntries)
src/features/skill/skill-installer.ts:for (const downloadedSkillFile of downloadedSkillFiles)
```

- [ ] **Step 3: Write minimal implementation**

```typescript
function findPackageJsonPath(currentDirectoryPath: string): string {
  const candidatePath = resolve(currentDirectoryPath, "package.json")

  if (existsSync(candidatePath)) {
    return candidatePath
  }

  const parentDirectoryPath = dirname(currentDirectoryPath)

  if (parentDirectoryPath === currentDirectoryPath) {
    throw new AppError(AppErrorCode.PACKAGE_CONFIG_INVALID, {
      params: { kind: "not-found" },
    })
  }

  return findPackageJsonPath(parentDirectoryPath)
}

async function loadGitHubFileEntries(
  githubContentPath: string,
): Promise<Array<{ path: string, fileContents: string }>> {
  const githubContentEntries = await loadGitHubContentsDirectory(githubContentPath)
  const loadedFileEntryGroups = await Promise.all(githubContentEntries.map(async (githubContentEntry) => {
    if (githubContentEntry.type === "dir") {
      return loadGitHubFileEntries(githubContentEntry.path)
    }

    if (githubContentEntry.type !== "file") {
      return []
    }

    if (githubContentEntry.downloadUrl === null) {
      throw new AppError(AppErrorCode.GITHUB_DOWNLOAD_URL_MISSING, {
        params: { contentPath: githubContentEntry.path },
      })
    }

    return [{
      path: githubContentEntry.path,
      fileContents: await gitHubClient.loadText(githubContentEntry.downloadUrl),
    }]
  }))

  return loadedFileEntryGroups.flat()
}

await Promise.all(downloadedSkillFiles.map(async (downloadedSkillFile) => {
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
}))
```

- [ ] **Step 4: Run verification**

Run:

```powershell
rg -n "\bwhile\b|for \(" src/tools/load-package-json-info.ts src/features/source/github-skill-source.ts src/features/skill/skill-installer.ts
bun run check
```

Expected:

```text
第一条命令无输出
$ bun run typecheck && bun run lint
$ tsc --noEmit
$ eslint .
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/load-package-json-info.ts src/features/source/github-skill-source.ts src/features/skill/skill-installer.ts
git commit -m "refactor: remove lower-layer keyword loops"
```

### Task 4: Remove Keyword Loops From Command Flows

**Files:**
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/update/command.ts`
- Modify: `src/commands/list/command.ts`
- Test: `src/commands/install/command.ts`
- Test: `src/commands/update/command.ts`

**Interfaces:**
- Consumes: `buildPlatformTargets(homeDirectoryPath: string, selectedPlatformNames: readonly SupportedPlatformName[]): IPlatformTarget[]`
- Consumes: `buildComparisonRows(skillIndexEntries: readonly ISkillIndexEntry[], platformTargets: readonly IPlatformTarget[]): ISkillComparisonRow[]`
- Consumes: `buildUpdateRows(comparisonRows: readonly ISkillComparisonRow[]): ISkillComparisonRow[]`
- Consumes: `buildUpdateSkillNames(comparisonRows: readonly ISkillComparisonRow[]): string[]`
- Produces: `execute(commandOptions: IInstallCommandOptions): Promise<void>`
- Produces: `execute(commandOptions: IUpdateCommandOptions): Promise<void>`
- Produces: `execute(commandOptions: IListCommandOptions): Promise<void>`

- [ ] **Step 1: Write the failing audit**

```powershell
rg -n "for \(" src/commands/install/command.ts src/commands/update/command.ts
```

- [ ] **Step 2: Run audit to verify it fails**

Run:

```powershell
rg -n "for \(" src/commands/install/command.ts src/commands/update/command.ts
```

Expected:

```text
src/commands/install/command.ts:for (const platformTarget of platformTargets)
src/commands/install/command.ts:for (const skillIndexEntry of selectedSkillEntries)
src/commands/update/command.ts:for (const platformTarget of platformTargets)
src/commands/update/command.ts:for (const matchedRow of matchedRows)
```

- [ ] **Step 3: Write minimal implementation**

```typescript
const skippedPlatformSummaryMessages = platformTargets
  .filter(platformTarget => !platformTarget.hasSkillsDirectory)
  .map(platformTarget => `已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`)

const installSummaryMessages = await Promise.all(
  platformTargets
    .filter(platformTarget => platformTarget.hasSkillsDirectory)
    .flatMap(platformTarget =>
      selectedSkillEntries.map(async (skillIndexEntry) => {
        const loadedSkillFiles = loadedSkillFilesByName.get(skillIndexEntry.name)

        if (loadedSkillFiles === undefined) {
          throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
            params: { skillName: skillIndexEntry.name },
          })
        }

        await skillInstaller.updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          skillIndexEntry,
          loadedSkillFiles,
        )

        return `已为平台“${platformTarget.platformName}”安装技能“${skillIndexEntry.name}”。`
      }),
    ),
)

const matchedRows = selectedRows.filter(
  selectedRow => selectedRow.platformName === platformTarget.platformName,
)

const updateSummaryMessages = await Promise.all(
  platformTargets
    .filter(platformTarget => platformTarget.hasSkillsDirectory)
    .flatMap(platformTarget =>
      selectedRows
        .filter(selectedRow => selectedRow.platformName === platformTarget.platformName)
        .map(async (selectedRow) => {
          const matchedSkillEntry = selectedSkillEntries.find(
            skillIndexEntry => skillIndexEntry.name === selectedRow.skillName,
          )

          if (matchedSkillEntry === undefined) {
            throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
              params: { skillNames: [selectedRow.skillName] },
            })
          }

          const loadedSkillFiles = loadedSkillFilesByName.get(matchedSkillEntry.name)

          if (loadedSkillFiles === undefined) {
            throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
              params: { skillName: matchedSkillEntry.name },
            })
          }

          await skillInstaller.updateSkillDirectory(
            platformTarget.skillsDirectoryPath,
            matchedSkillEntry,
            loadedSkillFiles,
          )

          return `已为平台“${platformTarget.platformName}”更新技能“${matchedSkillEntry.name}”。`
        }),
    ),
)
```

- [ ] **Step 4: Run verification**

Run:

```powershell
rg -n "for \(" src/commands/install/command.ts src/commands/update/command.ts
bun run check
```

Expected:

```text
第一条命令无输出
$ bun run typecheck && bun run lint
$ tsc --noEmit
$ eslint .
```

- [ ] **Step 5: Commit**

```bash
git add src/commands/install/command.ts src/commands/update/command.ts src/commands/list/command.ts
git commit -m "refactor: align command flow statements"
```

### Task 5: Sweep TSDoc And Inline Comments

**Files:**
- Modify: `src/types/package-json.ts`
- Modify: `src/types/command/index.ts`
- Modify: `src/types/source/index.ts`
- Modify: `src/types/skill/index.ts`
- Modify: `src/types/platform/index.ts`
- Modify: `src/commands/install/types/index.ts`
- Modify: `src/commands/list/types/index.ts`
- Modify: `src/commands/update/types/index.ts`
- Modify: `src/errors/app-error.ts`
- Modify: `src/errors/error-code.ts`
- Modify: `src/tools/load-package-json-info.ts`
- Modify: `src/features/source/github-skill-source.ts`
- Modify: `src/features/skill/skill-installer.ts`
- Modify: `src/commands/install/command.ts`
- Modify: `src/commands/list/command.ts`
- Modify: `src/commands/update/command.ts`
- Test: `src/**/*`

**Interfaces:**
- Consumes: `IAppErrorParamsMap`
- Consumes: `ISkillIndex`
- Consumes: `ISkillIndexEntry`
- Consumes: `ISkillComparisonRow`
- Produces: 现有所有对外类型、函数、类、方法的最终 TSDoc 和字段注释

- [ ] **Step 1: Write the failing audit**

```powershell
rg -n "^\s*// " src
```

- [ ] **Step 2: Run audit to verify it fails**

Run:

```powershell
rg -n "^\s*// " src
```

Expected:

```text
src/types/package-json.ts
src/types/command/index.ts
src/types/source/index.ts
src/types/skill/index.ts
src/types/platform/index.ts
src/commands/install/types/index.ts
src/commands/list/types/index.ts
src/commands/update/types/index.ts
```

- [ ] **Step 3: Write minimal implementation**

```typescript
interface IPackageJsonInfo {
  /**
   * 命令行入口映射。
   */
  bin: Record<string, string>

  /**
   * 程序说明。
   */
  description: string

  /**
   * 程序版本。
   */
  version: string
}

/**
 * 加载并校验 package.json 中会用到的程序信息。
 *
 * @returns 通过 schema 校验后的 package.json 信息。
 * @throws package.json 不存在或格式不正确时抛出错误。
 */
function loadPackageJsonInfo(): ReturnType<typeof packageJsonInfoSchema.parse> {
  // 逐级向上查找 package.json，避免依赖固定打包输出层级。
  return packageJsonInfoSchema.parse(packageJsonPayload)
}

/**
 * 更新本地技能目录。
 *
 * @param skillsDirectoryPath - 平台 skills 根目录路径。
 * @param skillIndexEntry - 目标技能索引条目。
 * @param downloadedSkillFiles - 已下载的技能文件列表。
 * @returns 安装完成后的 Promise。
 * @throws 技能文档缺失、版本不一致、路径非法或目录恢复失败时抛出错误。
 *
 * @example
 * updateSkillDirectory("/tmp/skills", { name: "yeizi-demo", version: "1.0.0" }, [{ relativeFilePath: "SKILL.md", fileContents: "---\\nname: yeizi-demo\\nversion: 1.0.0\\n---" }]) => Promise<void>
 */
async function updateSkillDirectory(
  skillsDirectoryPath: string,
  skillIndexEntry: ISkillIndexEntry,
  downloadedSkillFiles: readonly IDownloadedSkillFile[],
): Promise<void> {}
```

- [ ] **Step 4: Run verification**

Run:

```powershell
rg -n "^\s*// " src
bun run check
```

Expected:

```text
第一条命令无输出
$ bun run typecheck && bun run lint
$ tsc --noEmit
$ eslint .
```

- [ ] **Step 5: Commit**

```bash
git add src/types/package-json.ts src/types/command/index.ts src/types/source/index.ts src/types/skill/index.ts src/types/platform/index.ts src/commands/install/types/index.ts src/commands/list/types/index.ts src/commands/update/types/index.ts src/errors/app-error.ts src/errors/error-code.ts src/tools/load-package-json-info.ts src/features/source/github-skill-source.ts src/features/skill/skill-installer.ts src/commands/install/command.ts src/commands/list/command.ts src/commands/update/command.ts
git commit -m "docs: align src comments and tsdoc"
```

## Self-Review

### Spec coverage

- `结构与命名`：Task 1, Task 2
- `类型与实现`：Task 1, Task 2, Task 3
- `语句与注释`：Task 3, Task 4, Task 5
- `只覆盖 src`：全部任务的文件列表都限定在 `src/**/*`
- `最终验证 bun run check`：每个任务和最终任务都包含

没有发现遗漏到 `src` 之外的需求。

### Placeholder scan

- 已检查：没有 `TBD`、`TODO`、`implement later`、`similar to task n`。
- 已检查：每个任务都给了具体文件、命令、期望结果和代码片段。

### Type consistency

- `IAppErrorOptions`、`IAppErrorDefinition`、`IAppErrorParamsMap` 在 Task 1 定义，后续任务统一沿用。
- `parsePlatforms`、`buildPlatformTargets`、`isInteractiveTerminal`、`selectPlatforms`、`buildComparisonRows` 等函数签名在 Task 2 定义，Task 4 直接按这些名字消费。

没有发现前后命名冲突。
