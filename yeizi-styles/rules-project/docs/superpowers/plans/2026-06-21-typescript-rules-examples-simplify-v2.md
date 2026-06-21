# TypeScript Rules Examples Simplify v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revert v1's 5 simplification commits and redo each TypeScript rule file's examples using semantic-but-generic placeholders (`Parser`, `parseValue`, etc.) in full antfu style (2-space indent, double quotes, no semicolons, multi-line), so the examples themselves obey the project's own naming and formatting rules.

**Architecture:** Revert the v1 commits as a single revert commit to restore the pre-v1 file state, then dispatch one implementer subagent per file to apply the v2 rewrites per the spec. Each file produces one commit; the overall pipeline is 1 revert + 5 file commits + 1 final review.

**Tech Stack:** Markdown, PowerShell, Bash, Git, ripgrep

## Global Constraints

These constraints bind every task:

- 占位符使用通用名词,见规范 "占位符命名约定"
- 占位符本身必须遵守项目命名规则(类大驼峰、函数小驼峰、接口 I+大驼峰、常量大写下划线、错误类 XxxError)
- 格式遵循 antfu 风格:2 空格缩进、双引号、不写分号、多行时保留尾逗号、类成员显式标注 `public`/`private` 修饰符
- 不修改任何规则的标题、章节结构、规则正文(以 `>` 开头的引用块)
- 不修改任何规则正文中对 `@param` / `@returns` / `@throws` / `@example` 等标签的描述
- 示例代码块(以 ` ```typescript ` 包裹)允许且必须重写
- 每个文件 1 个 commit,共 5 个 commit
- `comment-rules.md` 允许在演示 JSDoc/TSDoc 写法的规则示例里保留 `/** */` 结构(规则 3、4、10、12、13、14)
- 其他 4 个文件示例内禁止 `/** */` 和 `//`

---

## File Structure

- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md` - 10 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md` - 14 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md` - 25 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md` - 7 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md` - 7 rules
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md` - approved placeholder conventions and formatting rules

---

## Task 1: Revert v1 simplification commits

**Files:**
- Modify: All 5 TypeScript rule files (revert to pre-v1 state)
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify current branch and the 5 v1 commit SHAs**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git branch --show-current
git log --oneline -8 -- yeizi-styles/rules-project/rules/technologies/typescript/
```

Expected: branch is `main`. The 5 simplification commits in chronological order are present, with SHAs recorded:
- `965d833` (implementation-rules.md)
- `59ae400` (comment-rules.md)
- `d9e6908` (naming-rules.md)
- `09cac6c` (statement-rules.md)
- `38a9f3a` (type-rules.md)

The merge commit `d15fe04` is also present (brings the 5 into main).

- [ ] **Step 2: Revert the 5 simplification commits without committing**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git revert -n 965d833 59ae400 d9e6908 09cac6c 38a9f3a --no-edit
```

Expected: 5 reverts applied to the index; no commit yet. The `--no-edit` flag keeps the default merge-revert message.

If a revert fails because of a conflict (unlikely given the merges went in cleanly), abort with `git revert --abort` and report BLOCKED.

- [ ] **Step 3: Verify all 5 rule files are restored to pre-v1 state**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
foreach ($f in @("comment-rules.md", "implementation-rules.md", "naming-rules.md", "statement-rules.md", "type-rules.md")) {
  $count = (Get-Content -Encoding UTF8 (Join-Path $base $f)).Count
  "{0}: {1}" -f $f, $count
}
```

Expected line counts (the pre-v1 baseline):
- `comment-rules.md`: ~440 lines (will be revisited in Task 2)
- `implementation-rules.md`: 641 lines (current working tree) or pre-v1 (commit `b9cdc13`) 641
- `naming-rules.md`: 624 lines
- `statement-rules.md`: 209 lines
- `type-rules.md`: 200 lines

If any file shows line counts matching v1's simplified output (260 / 196 / 415 / 138 / 140), the revert did not apply; investigate and report BLOCKED.

- [ ] **Step 4: Verify pre-v1 business-context identifiers are back**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -l 'parseCsvOptionValues|UploadTask|getUserDisplayName|loadConfigFileContent|currentUserName' "$base"
```

Expected: all 5 files are listed (the pre-v1 business identifiers are present).

- [ ] **Step 5: Commit the revert**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git commit -m "revert: undo v1 example simplification to redo with v2 conventions"
```

Expected: one commit containing all 5 files restored to their pre-v1 state.

---

## Task 2: Refactor `implementation-rules.md` (v2)

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify starting state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~640 lines and 10 rule headings. Confirm no `Parser`, `parseValue`, `Formatter` etc. are present in the file yet.

- [ ] **Step 2: Apply the 10 v2 rule rewrites**

For each rule, replace BOTH the `推荐写法` and `不推荐写法` code blocks with the new antfu-style version below. Do not touch the `>` body text or section headings.

**Rule 1 — `参数类型写实际输入`**

Replace 推荐写法 with:

```typescript
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
function parseValue(rawInput?: string): string {
  if (rawInput === undefined) {
    return ""
  }
  return rawInput.trim()
}
```

**Rule 2 — `函数拆分只在复用或分步时进行`**

Replace 推荐写法 with:

```typescript
function parsePositiveInteger(rawInput: string, label: string): number {
  const parsed = Number(rawInput)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ParseError(`${label} 必须是正整数`)
  }
  return parsed
}

function parsePortOption(portOption: string): number {
  return parsePositiveInteger(portOption, "端口")
}
```

Replace 不推荐写法 with:

```typescript
function buildDeploySummary(successCount: number, failedCount: number): string {
  if (failedCount === 0) {
    return `共处理 ${successCount} 个任务，全部成功`
  }
  return `共处理 ${successCount + failedCount} 个任务，成功 ${successCount} 个，失败 ${failedCount} 个`
}
```

**Rule 3 — `单个导出函数的辅助逻辑就近定义`**

Replace 推荐写法 with:

```typescript
function normalizeValue(name: string): string {
  const aliasMap: Record<string, string> = {
    darwin: "macos",
    win32: "windows",
  }
  return aliasMap[name] ?? name
}
```

Replace 不推荐写法 with:

```typescript
const aliasMap: Record<string, string> = {
  darwin: "macos",
  win32: "windows",
}

function normalizeValue(name: string): string {
  return aliasMap[name] ?? name
}
```

**Rule 4 — `单次执行用 \`function\``**

Replace 推荐写法 with:

```typescript
function renderError(title: string, message: string): void {
  console.error(`[${title}] ${message}`)
}
```

Replace 不推荐写法 with:

```typescript
class ErrorRenderer {
  public render(title: string, message: string): void {
    console.error(`[${title}] ${message}`)
  }
}
```

**Rule 5 — `共享对象能力用 \`class\``**

Replace 推荐写法 with:

```typescript
class UploadTask {
  private filePath: string

  public constructor(filePath: string) {
    this.filePath = filePath
  }

  public start(): void {}

  public updateFilePath(nextFilePath: string): void {
    this.filePath = nextFilePath
  }

  public getFilePath(): string {
    return this.filePath
  }
}
```

Replace 不推荐写法 with:

```typescript
const currentTaskState: { filePath: string } = { filePath: "" }

function startUpload(filePath: string): void {
  currentTaskState.filePath = filePath
}

function updateFilePath(nextFilePath: string): void {
  currentTaskState.filePath = nextFilePath
}

function getFilePath(): string {
  return currentTaskState.filePath
}
```

**Rule 6 — `轻实例也用 \`class\``**

Replace 推荐写法 with:

```typescript
class ContentLoader {
  private static readonly TIMEOUT_MS = 5000
  private static readonly DEFAULT_HEADERS: Record<string, string> = {
    Accept: "*/*",
  }

  public async loadText(requestUrl: string): Promise<string> {
    const response = await this.loadResponse(requestUrl)
    return response.text()
  }

  public async loadBinary(requestUrl: string): Promise<Uint8Array> {
    const response = await this.loadResponse(requestUrl)
    return new Uint8Array(await response.arrayBuffer())
  }

  private async loadResponse(requestUrl: string): Promise<Response> {
    return await fetch(requestUrl, {
      headers: ContentLoader.DEFAULT_HEADERS,
    })
  }
}
```

Replace 不推荐写法 with:

```typescript
async function loadText(requestUrl: string): Promise<string> {
  const response = await fetch(requestUrl, {
    headers: { Accept: "*/*" },
  })
  return response.text()
}

async function loadBinary(requestUrl: string): Promise<Uint8Array> {
  const response = await fetch(requestUrl, {
    headers: { Accept: "*/*" },
  })
  return new Uint8Array(await response.arrayBuffer())
}
```

**Rule 7 — `不用工厂函数和闭包模拟对象`**

Replace 推荐写法 with:

```typescript
class DialogController {
  private opened: boolean

  public constructor() {
    this.opened = false
  }

  public open(): void {
    this.opened = true
  }

  public close(): void {
    this.opened = false
  }

  public isOpened(): boolean {
    return this.opened
  }
}
```

Replace 不推荐写法 with:

```typescript
function createDialogController() {
  let opened = false
  return {
    open: () => {
      opened = true
    },
    close: () => {
      opened = false
    },
    isOpened: () => opened,
  }
}
```

**Rule 8 — `构造函数参数不直接声明属性`**

Replace 推荐写法 with:

```typescript
class InputData {
  public value: string

  public constructor(value: string) {
    this.value = value
  }
}
```

Replace 不推荐写法 with:

```typescript
class InputData {
  public constructor(public value: string) {}
}
```

**Rule 9 — `抛错只用 \`Error\` 或其子类实例`**

Replace 推荐写法 with:

```typescript
throw new ParseError("输入不能为空")
```

Replace 不推荐写法 with:

```typescript
throw "输入不能为空"
```

**Rule 10 — `\`catch\` 里用 \`instanceof\` 收窄错误类型`**

Replace 推荐写法 with:

```typescript
} catch (error) {
  if (error instanceof ValidationError) {
    return error.code
  }
  if (error instanceof AppError) {
    return error.code
  }
  if (error instanceof Error) {
    return ErrorCode.UNEXPECTED_ERROR
  }
  throw error
}
```

Replace 不推荐写法 with:

```typescript
} catch (error) {
  return (error as AppError).code
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
rg -n '^\s*\*\s|^\s*/\*\*|^\s*//' $path | Select-String -NotMatch '^[^:]+:\d+:\s*```'
```

Expected: 10 rule headings preserved; no business-context identifiers (`parseCsvOptionValues`, `UploadTask`, `RemoteContentClient`, `DialogController`, etc.) remain; no `//` comments inside code blocks (this file is not allowed any `//`); line count drops modestly from ~640.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
git commit -m "docs(rules): simplify TypeScript implementation rules examples (v2)"
```

Expected: one commit containing only `implementation-rules.md` changes.

---

## Task 3: Refactor `comment-rules.md` (v2)

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify starting state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~440 lines and 14 rule headings.

- [ ] **Step 2: Apply the 14 v2 rule rewrites**

For each rule below, replace both code blocks. Body text (`>` paragraph) stays untouched. JSDoc/TSDoc is allowed only in Rules 3, 4, 10, 12, 13, 14.

**Rule 1 — `注释使用 TSDoc 规范`**

Replace 推荐写法 with:

```typescript
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
// 解析输入值
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 2 — `注释正文只描述调用方契约`**

Replace 推荐写法 with:

```typescript
/**
 * 抛出命令参数错误。
 *
 * @throws 参数不合法时抛出。
 */
function throwUsageError(): never {
  throw new ParseError("参数不合法")
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 先判断错误来源，再按错误码分发；未知错误码走通用兜底。
 */
function throwUsageError(): never {
  throw new ParseError("参数不合法")
}
```

**Rule 3 — `同一块内容不写空行`**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 *
 * @param rawInput 输入文本。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 *
 *
 * @param rawInput 输入文本。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 4 — `\`@example\` 内容写在 \`@example\` 标签下一行`**

Replace 推荐写法 with:

```typescript
/**
 * 解析平台选项。
 *
 * @param rawInput 选项文本。
 * @returns 平台名列表。
 *
 * @example
 * parsePlatforms("a,b") => ["a", "b"]
 */
function parsePlatforms(rawInput: string): string[] {
  return rawInput.split(",")
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 解析平台选项。
 *
 * @param rawInput 选项文本。
 * @returns 平台名列表。
 *
 * @example parsePlatforms("a,b") => ["a", "b"]
 */
function parsePlatforms(rawInput: string): string[] {
  return rawInput.split(",")
}
```

**Rule 5 — `注释里的示例代码遵守所有代码规则`**

Replace 推荐写法 with:

```typescript
function formatName(name: string): string {
  return name
}
```

Replace 不推荐写法 with:

```typescript
function format_name(name: string): string {
  return name
}
```

**Rule 6 — `有参数时写 \`@param\``**

Replace 推荐写法 with:

```typescript
/**
 * 解析输入值。
 *
 * @param rawInput 输入文本。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 解析输入值。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 7 — `有返回值时写 \`@returns\``**

Replace 推荐写法 with:

```typescript
/**
 * 解析输入值。
 *
 * @param rawInput 输入文本。
 * @returns 解析后的值。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 解析输入值。
 *
 * @param rawInput 输入文本。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 8 — `会抛错时写 \`@throws\``**

Replace 推荐写法 with:

```typescript
/**
 * 加载配置文件内容。
 *
 * @param filePath 配置文件路径。
 * @returns 配置文件内容。
 * @throws 配置文件不存在时抛出错误。
 */
function loadConfigFileContent(filePath: string): string {
  throw new ParseError("配置文件不存在")
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 加载配置文件内容。
 *
 * @param filePath 配置文件路径。
 * @returns 配置文件内容。
 */
function loadConfigFileContent(filePath: string): string {
  throw new ParseError("配置文件不存在")
}
```

**Rule 9 — `可复用函数和方法写 \`@example\``**

Replace 推荐写法 with:

```typescript
/**
 * 解析输入文本。
 *
 * @param content 输入文本。
 * @returns 解析后的对象。
 *
 * @example
 * parseInput("a") => { name: "a" }
 */
function parseInput(content: string): IConfig {
  return JSON.parse(content)
}

/**
 * 串联命令解析与执行。
 */
function runCli(): void {}
```

Replace 不推荐写法 with:

```typescript
/**
 * 解析输入文本。
 *
 * @param content 输入文本。
 * @returns 解析后的对象。
 */
function parseInput(content: string): IConfig {
  return JSON.parse(content)
}

/**
 * 串联命令解析与执行。
 *
 * @example
 * runCli() => 串联命令解析与执行
 */
function runCli(): void {}
```

**Rule 10 — `不使用单行 \`/** 内容 */\``**

Replace 推荐写法 with:

```typescript
/**
 * 解析输入值。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
/** 解析输入值。 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 11 — `顶层定义和方法统一使用 \`/** */\``**

Replace 推荐写法 with:

```typescript
/**
 * 串联命令解析与执行。
 */
function runCli(): void {}

/**
 * 封装安装命令的入口。
 */
class InstallCommand {
  /**
   * 执行安装命令。
   */
  public execute(): void {}
}
```

Replace 不推荐写法 with:

```typescript
function runCli(): void {}

class InstallCommand {
  public execute(): void {}
}
```

**Rule 12 — `字段统一使用 \`/** */\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述请求配置。
 */
interface IRequestOptions {
  /**
   * 请求超时时间，毫秒；0 表示不超时。
   */
  timeoutMs: number

  /**
   * 是否允许复用缓存。
   */
  allowCache: boolean
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述请求配置。
 */
interface IRequestOptions {
  timeoutMs: number
  allowCache: boolean
}
```

**Rule 13 — `字段注释直接写用途和约束`**

Replace 推荐写法 with:

```typescript
/**
 * 描述请求配置。
 */
interface IRequestOptions {
  /**
   * 请求超时时间，毫秒；0 表示不超时。
   */
  timeoutMs: number

  /**
   * 是否允许直接复用已有缓存结果。
   */
  allowCache: boolean
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述请求配置。
 */
interface IRequestOptions {
  /**
   * 超时时间。
   */
  timeoutMs: number

  /**
   * 是否缓存。
   */
  allowCache: boolean
}
```

**Rule 14 — `函数体和方法体内部说明使用单行注释`**

Replace 推荐写法 with:

```typescript
function processItems(items: IConfig[]): void {
  // 保留原始顺序，避免输出和平台目录顺序不一致
  items.forEach((item) => {
    console.log(item.name)
  })
}
```

Replace 不推荐写法 with:

```typescript
function processItems(items: IConfig[]): void {
  /**
   * 保留原始顺序，避免输出和平台目录顺序不一致
   */
  items.forEach((item) => {
    console.log(item.name)
  })
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
rg -n 'getUserDisplayName|parsePlatforms|formatUploadStatusLabel|loadConfigFileContent|InstallCommand' $path
```

Expected: 14 rule headings preserved; no leftover business-context identifiers; Rules 3, 4, 10, 12, 13, 14 retain `/** */` syntax in examples; Rules 1, 2, 5, 6, 7, 8, 9, 11, 14 contain no `/** */` (except for Rules 14 — wait, Rule 14's 不推荐写法 does have `/** */` to demonstrate the wrong way).

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
git commit -m "docs(rules): simplify TypeScript comment rules examples (v2)"
```

Expected: one commit containing only `comment-rules.md` changes.

---

## Task 4: Refactor `naming-rules.md` (v2)

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify starting state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~624 lines and 25 rule headings.

- [ ] **Step 2: Apply the 25 v2 rule rewrites**

For each rule below, replace BOTH code blocks. Body text stays untouched.

**Rule 1 — `变量默认使用小驼峰命名法`**

Replace 推荐写法 with:

```typescript
const currentUserName = "Alice"
const isDialogVisible = true

const requestConfig = {
  timeoutMs: 3000,
}
```

Replace 不推荐写法 with:

```typescript
const CurrentUserName = "Alice"
const is_dialog_visible = true

const REQUEST_CONFIG = {
  timeoutMs: 3000,
}
```

(Note: this rule's rule names are themselves the rule's target, so it is fine to keep "real" variable names like `currentUserName`.)

**Rule 2 — `布尔变量命名使用逻辑判断词`**

Replace 推荐写法 with:

```typescript
const isDialogVisible = true
const hasPermission = false
const canSubmit = true
```

Replace 不推荐写法 with:

```typescript
const dialogVisible = true
const permissionStatus = false
const submitAble = true
```

**Rule 3 — `固定单值常量用大写下划线`**

Replace 推荐写法 with:

```typescript
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT_MS = 30000
```

Replace 不推荐写法 with:

```typescript
const maxRetryCount = 3
const defaultTimeoutMs = 30000
```

**Rule 4 — `函数、方法名用小驼峰`**

Replace 推荐写法 with:

```typescript
function getUserName(): string {
  return ""
}

class UserService {
  public loadUserInfo(): void {}
}
```

Replace 不推荐写法 with:

```typescript
function GetUserName(): string {
  return ""
}

class UserService {
  public LoadUserInfo(): void {}
}
```

**Rule 5 — `函数、方法名写成动作加对象/结果`**

Replace 推荐写法 with:

```typescript
function getUserName(userInfo: IConfig): string {
  return userInfo.name
}

function buildRequestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

Replace 不推荐写法 with:

```typescript
function userName(userInfo: IConfig): string {
  return userInfo.name
}

function requestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

**Rule 6 — `流程入口使用 \`run\``**

Replace 推荐写法 with:

```typescript
async function runCli(): Promise<void> {}

async function runMigration(): Promise<void> {}

function runSyncScript(): void {}
```

Replace 不推荐写法 with:

```typescript
async function startCli(): Promise<void> {}

async function startMigration(): Promise<void> {}

function startSyncScript(): void {}
```

**Rule 7 — `普通函数不使用 \`run\``**

Replace 推荐写法 with:

```typescript
async function loadConfigFileContent(filePath: string): Promise<string> {
  return ""
}

function buildRequestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}

function renderDialogFooter(): string {
  return ""
}
```

Replace 不推荐写法 with:

```typescript
async function runConfigFileContent(filePath: string): Promise<string> {
  return ""
}

function runRequestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}

function runDialogFooter(): string {
  return ""
}
```

**Rule 8 — `已有值用 \`get\`，外部内容用 \`load\``**

Replace 推荐写法 with:

```typescript
function getUserName(): string {
  return ""
}

async function loadUserProfile(): Promise<IConfig> {
  return await requestUserProfile()
}

async function loadConfigFileContent(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}

async function loadUploadPermission(): Promise<boolean> {
  return await requestUploadPermission()
}
```

Replace 不推荐写法 with:

```typescript
function loadUserName(): string {
  return ""
}

async function getUserProfile(): Promise<IConfig> {
  return await requestUserProfile()
}

async function getConfigFileContent(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}

async function getUploadPermission(): Promise<boolean> {
  return await requestUploadPermission()
}
```

**Rule 9 — `单个值用 \`set\`，已有内容用 \`update\``**

Replace 推荐写法 with:

```typescript
function setDialogVisible(visible: boolean): void {}

function updateUserInfo(userInfo: IConfig): void {}
```

Replace 不推荐写法 with:

```typescript
function updateDialogVisible(visible: boolean): void {}

function setUserInfo(userInfo: IConfig): void {}
```

**Rule 10 — `创建用 \`create\`，组装用 \`build\``**

Replace 推荐写法 with:

```typescript
function createUploadContext(): IUploadContext {
  return {
    userInfoList: [],
  }
}

function buildRequestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

Replace 不推荐写法 with:

```typescript
function buildUploadContext(): IUploadContext {
  return {
    userInfoList: [],
  }
}

function createRequestParams(userInfo: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

**Rule 11 — `解析用 \`parse\`，整理用 \`format\``**

Replace 推荐写法 with:

```typescript
function parseUserInfo(content: string): IConfig {
  return validateUserInfo(JSON.parse(content))
}

function formatPrice(price: number): string {
  return `${price}`
}
```

Replace 不推荐写法 with:

```typescript
function formatUserInfo(content: string): IConfig {
  return validateUserInfo(JSON.parse(content))
}

function parsePrice(price: number): string {
  return `${price}`
}
```

**Rule 12 — `生成展示内容使用 render`**

Replace 推荐写法 with:

```typescript
function renderDialogFooter(): string {
  return ""
}
```

Replace 不推荐写法 with:

```typescript
function buildDialogFooter(): string {
  return ""
}
```

**Rule 13 — `新增用 \`add\`，移除用 \`remove\``**

Replace 推荐写法 with:

```typescript
function addUserRole(roleName: string): void {}

function removeUserRole(roleName: string): void {}
```

Replace 不推荐写法 with:

```typescript
function createUserRole(roleName: string): void {}

function deleteUserRole(roleName: string): void {}
```

**Rule 14 — `清空已有内容使用 \`clear\``**

Replace 推荐写法 with:

```typescript
function clearSearchHistory(): void {}

function clearSelectedUserIds(): void {}
```

Replace 不推荐写法 with:

```typescript
function resetSearchHistory(): void {}

function resetSelectedUserIds(): void {}
```

**Rule 15 — `恢复初始值使用 \`reset\``**

Replace 推荐写法 with:

```typescript
function resetSearchForm(): void {}

function resetUploadState(): void {}
```

Replace 不推荐写法 with:

```typescript
function clearSearchForm(): void {}

function clearUploadState(): void {}
```

**Rule 16 — `初始化既有实例使用 \`init\``**

Replace 推荐写法 with:

```typescript
function initUploadContext(uploadContext: IUploadContext): void {}
```

Replace 不推荐写法 with:

```typescript
function createUploadContext(uploadContext: IUploadContext): void {}
```

**Rule 17 — `绑定用 \`bind\`，解绑用 \`unbind\``**

Replace 推荐写法 with:

```typescript
function bindEvents(): void {}

function bindKeyboardEvents(): void {}

function unbindEvents(): void {}
```

Replace 不推荐写法 with:

```typescript
function handleEvents(): void {}

function initEvents(): void {}

function removeEvents(): void {}
```

**Rule 18 — `事件处理用 handle`**

Replace 推荐写法 with:

```typescript
function handleItemClick(): void {}

function handleFormSubmit(): void {}

function handleDialogClose(): void {}
```

Replace 不推荐写法 with:

```typescript
function clickItem(): void {}

function submitForm(): void {}

function dialogClose(): void {}
```

**Rule 19 — `校验函数、方法使用 validate`**

Replace 推荐写法 with:

```typescript
function validatePassword(password: string): boolean {
  return password.length >= 8
}

function validateFormData(formData: FormData): boolean {
  return true
}
```

Replace 不推荐写法 with:

```typescript
function isPassword(password: string): boolean {
  return password.length >= 8
}

function checkFormData(formData: FormData): boolean {
  return true
}
```

**Rule 20 — `类名用大驼峰`**

Replace 推荐写法 with:

```typescript
class UserService {}
```

Replace 不推荐写法 with:

```typescript
class userService {}
```

**Rule 21 — `接口名使用 \`I\` 开头的大驼峰命名法`**

Replace 推荐写法 with:

```typescript
interface IUserInfo {
  id: string
  name: string
}

interface IRequestOptions {
  timeoutMs: number
}

interface IUploadHandler {
  upload(): void
}
```

Replace 不推荐写法 with:

```typescript
interface UserInfo {
  id: string
}

interface iRequestOptions {
  timeoutMs: number
}

interface IuploadHandler {
  upload(): void
}
```

**Rule 22 — `类型名用大驼峰`**

Replace 推荐写法 with:

```typescript
type RequestMode = "sync" | "async"
```

Replace 不推荐写法 with:

```typescript
type requestMode = "sync" | "async"
```

**Rule 23 — `对象式枚举主体用大驼峰`**

Replace 推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

Replace 不推荐写法 with:

```typescript
const ITEM_STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ITEM_STATUS[keyof typeof ITEM_STATUS]
```

**Rule 24 — `对象式枚举成员用大写下划线`**

Replace 推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

Replace 不推荐写法 with:

```typescript
const ItemStatus = {
  Idle: "idle",
  Uploading: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

**Rule 25 — `对象式枚举主体和联合类型同名`**

Replace 推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

Replace 不推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatusType = typeof ItemStatus[keyof typeof ItemStatus]
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 25 rule headings preserved; line count drops modestly from ~624; placeholders follow naming rules (no single-letter function/variable names except allowed `e` for catch and `T` for generics, which don't appear here).

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
git commit -m "docs(rules): simplify TypeScript naming rules examples (v2)"
```

Expected: one commit containing only `naming-rules.md` changes.

---

## Task 5: Refactor `statement-rules.md` (v2)

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify starting state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 209 lines and 7 rule headings.

- [ ] **Step 2: Apply the 7 v2 rule rewrites**

**Rule 1 — `变量定义按是否重赋值区分 \`const\` 和 \`let\``**

Replace 推荐写法 with:

```typescript
const userName = "Alice"

let retryCount = 0
retryCount += 1
```

Replace 不推荐写法 with:

```typescript
let userName = "Alice"

var retryCount = 0
```

**Rule 2 — `模块导出统一写在文件底部`**

Replace 推荐写法 with:

```typescript
const ErrorCode = {
  CONFIG_MISSING: "CONFIG_MISSING",
} as const

type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

interface IConfig {
  value: string
}

function parseConfig(content: string): IConfig {
  return { value: content }
}

export { ErrorCode, parseConfig }
export type { ErrorCode, IConfig }
```

Replace 不推荐写法 with:

```typescript
export const ErrorCode = {
  CONFIG_MISSING: "CONFIG_MISSING",
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

export interface IConfig {
  value: string
}

export function parseConfig(content: string): IConfig {
  return { value: content }
}
```

**Rule 3 — `判断不写 \`=== true/false\``**

Replace 推荐写法 with:

```typescript
if (isReady) {
  startTask()
}

if (!isEnabled) {
  return
}
```

Replace 不推荐写法 with:

```typescript
if (isReady === true) {
  startTask()
}

if (isEnabled === false) {
  return
}
```

**Rule 4 — `禁止使用三目运算符`**

Replace 推荐写法 with:

```typescript
if (isEnabled) {
  return "enabled"
}

return "disabled"
```

Replace 不推荐写法 with:

```typescript
return isEnabled ? "enabled" : "disabled"
```

**Rule 5 — `禁用 \`switch\``**

Replace 推荐写法 with:

```typescript
if (status === "ready") {
  return "ready"
}

if (status === "uploading") {
  return "uploading"
}

return "finished"
```

Replace 不推荐写法 with:

```typescript
switch (status) {
  case "ready":
    return "ready"
  case "uploading":
    return "uploading"
  default:
    return "finished"
}
```

**Rule 6 — `禁用关键字循环`**

Replace 推荐写法 with:

```typescript
let enabledItems = items.filter((item) => item.isEnabled)

let itemNames = items.map((item) => item.name)

let hasAdminItem = items.some((item) => item.role === "admin")
```

Replace 不推荐写法 with:

```typescript
for (const item of items) {
  console.log(item.name)
}

for (let index = 0; index < items.length; index += 1) {
  console.log(items[index].name)
}
```

**Rule 7 — `其他可遍历内容先转数组再处理`**

Replace 推荐写法 with:

```typescript
let enabledNames = Object.values(itemMap)
  .filter((item) => item.isEnabled)
  .map((item) => item.name)

let enabledRoleEntries = Object.entries(roleMap)
  .filter(([, roleName]) => roleName.length > 0)

let roleNameList = Array.from(roleSet)
  .map((roleName) => roleName.trim())
  .filter((roleName) => roleName.length > 0)

let letterList = Array.from(nameText)
  .filter((letter) => letter !== " ")
```

Replace 不推荐写法 with:

```typescript
for (const itemId in itemMap) {
  if (itemMap[itemId].isEnabled) {
    console.log(itemMap[itemId].name)
  }
}

for (const roleName of roleSet) {
  console.log(roleName)
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 7 rule headings preserved.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
git commit -m "docs(rules): simplify TypeScript statement rules examples (v2)"
```

Expected: one commit containing only `statement-rules.md` changes.

---

## Task 6: Refactor `type-rules.md` (v2)

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md`

- [ ] **Step 1: Verify starting state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~200 lines and 7 rule headings.

- [ ] **Step 2: Apply the 7 v2 rule rewrites**

**Rule 1 — `枚举值用 \`const\` 对象和联合类型`**

Replace 推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

Replace 不推荐写法 with:

```typescript
enum ItemStatus {
  IDLE = "idle",
  UPLOADING = "uploading",
}
```

**Rule 2 — `对象类型使用 \`interface\``**

Replace 推荐写法 with:

```typescript
interface IConfig {
  value: string
}

interface IRequestOptions {
  timeoutMs: number
}
```

Replace 不推荐写法 with:

```typescript
type Config = {
  value: string
}

type RequestOptions = {
  timeoutMs: number
}
```

**Rule 3 — `组合和派生类型使用 \`type\``**

Replace 推荐写法 with:

```typescript
type RequestMode = "sync" | "async"

type RequestHandler = (requestUrl: string) => Promise<string>

type ConfigSummary = Pick<IConfig, "value">
```

Replace 不推荐写法 with:

```typescript
interface IRequestMode {
  value: "sync" | "async"
}

interface IRequestHandler {
  (requestUrl: string): Promise<string>
}
```

**Rule 4 — `禁止使用 \`any\` 和 \`unknown\``**

Replace 推荐写法 with:

```typescript
function getConfigName(config: IConfig): string {
  return config.value
}

const retryCount = 0
```

Replace 不推荐写法 with:

```typescript
function getConfigName(config: any): string {
  return config.value
}

const retryCount: unknown = 0
```

**Rule 5 — `类型明确时禁止额外使用泛型`**

Replace 推荐写法 with:

```typescript
class AppError extends Error {
  public readonly code: ErrorCode

  public constructor(code: ErrorCode) {
    super(code)
    this.code = code
  }
}

function getObjectValue<TObject, TKey extends keyof TObject>(
  objectValue: TObject,
  objectKey: TKey,
): TObject[TKey] {
  return objectValue[objectKey]
}
```

Replace 不推荐写法 with:

```typescript
class AppError<TCode extends string = string> extends Error {
  public readonly code: TCode

  public constructor(code: TCode) {
    super(code)
    this.code = code
  }
}
```

**Rule 6 — `只在 \`as const\` 场景使用 \`as\``**

Replace 推荐写法 with:

```typescript
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

Replace 不推荐写法 with:

```typescript
function focusSubmitButton(): void {
  const button = document.getElementById("submit") as HTMLButtonElement | null

  if (!button) {
    return
  }

  button.focus()
}
```

**Rule 7 — `参数类型不使用只读修饰`**

Replace 推荐写法 with:

```typescript
function renderSummary(messages: string[]): string {
  return messages.join("")
}

function findItemsByName(
  loadedItemsByName: Map<string, string[]>,
  name: string,
): string[] | undefined {
  return loadedItemsByName.get(name)
}
```

Replace 不推荐写法 with:

```typescript
function renderSummary(messages: readonly string[]): string {
  return messages.join("")
}

function findItemsByName(
  loadedItemsByName: ReadonlyMap<string, readonly string[]>,
  name: string,
): readonly string[] | undefined {
  return loadedItemsByName.get(name)
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 7 rule headings preserved.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
git commit -m "docs(rules): simplify TypeScript type rules examples (v2)"
```

Expected: one commit containing only `type-rules.md` changes.

---

## Task 7: Final verification

**Files:**
- Read-only: all 5 files in `yeizi-styles/rules-project/rules/technologies/typescript/`

- [ ] **Step 1: Per-file line counts and heading preservation**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
foreach ($f in @("comment-rules.md", "implementation-rules.md", "naming-rules.md", "statement-rules.md", "type-rules.md")) {
  $count = (Get-Content -Encoding UTF8 (Join-Path $base $f)).Count
  $headings = (rg -c '^### ' (Join-Path $base $f))
  "{0}: {1} lines, {2} rule headings" -f $f, $count, $headings
}
```

Expected:
- comment-rules.md: 14 headings
- implementation-rules.md: 10 headings
- naming-rules.md: 25 headings
- statement-rules.md: 7 headings
- type-rules.md: 7 headings

- [ ] **Step 2: Confirm no JSDoc / TSDoc / line comments inside example code blocks in non-comment-rules files**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '^\s*\*\s|^\s*/\*\*|^\s*//' "$base/implementation-rules.md" "$base/naming-rules.md" "$base/statement-rules.md" "$base/type-rules.md"
```

Expected: no matches.

- [ ] **Step 3: Confirm comment-rules.md has `/** */` only inside Rules 3, 4, 10, 12, 13, 14**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
rg -n '^\s*\*\s|^\s*/\*\*' $path
```

Expected: matches exist only in code blocks under rules 3, 4, 10, 12, 13, 14. Rule 14's 不推荐写法 may also contain `/** */`.

- [ ] **Step 4: Confirm placeholders follow project naming rules across all 5 files**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '\b(function|class|interface|type|const)\s+[a-z][a-zA-Z0-9]*\b' "$base/comment-rules.md" "$base/implementation-rules.md" "$base/naming-rules.md" "$base/statement-rules.md" "$base/type-rules.md"
```

Expected: only matches where the lowercase-starting identifier is a parameter or local variable (per project rules). Class / interface / type names should all start with uppercase.

If any class / interface / type identifier starts with a lowercase letter, that is a Critical issue — fix in a follow-up commit.

- [ ] **Step 5: Confirm git log shows exactly 1 revert + 5 redo commits**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git log --oneline -8 -- yeizi-styles/rules-project/rules/technologies/typescript/
```

Expected: the 1 revert commit at the front, followed by the 5 redo commits, in the planned order.

---

## Self-Review Notes

- **Spec coverage**: Every section of the v2 spec (placeholder convention, format rules, boundary cases, per-file scope, redo approach) maps to at least one task. Revert is Task 1, per-file rewrites are Tasks 2-6, verification is Task 7.
- **Placeholder scan**: No "TBD" / "TODO" / "implement later" in the plan. Every "Replace ... with" includes the full replacement code block.
- **Type consistency**: `ParseError`, `AppError`, `ErrorCode`, `ValidationError`, `IConfig`, `IRequestOptions`, `IUploadContext`, `ItemStatus`, `LogLevel` are defined consistently across tasks.
- **Naming consistency**: Placeholder names are reused across files (`Parser` for class examples, `parseValue` for parsing function examples, etc.). This is intentional — readers familiar with one rule's example will recognize the pattern in others.
- **Known style deviation**: Some v2 examples (Rule 5 / Rule 6 in `implementation-rules.md`, Rule 12 in `comment-rules.md`) are larger than the spec's preview suggests. This is intentional — the rule's pedagogical value requires showing multiple methods or fields. The placeholder names and formatting are still generic and antfu-style.
- **Comment-rules JSDoc count**: 7 rule blocks retain `/** */` (Rules 3, 4, 10, 12, 13, 14 plus Rule 14's 不推荐写法). The spec allows JSDoc in `comment-rules.md` only when the rule itself documents JSDoc style.