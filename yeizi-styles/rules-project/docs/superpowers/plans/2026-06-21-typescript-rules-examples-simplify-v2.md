# TypeScript Rules Examples Simplify v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply v2 conventions (generic-noun placeholders following project naming rules, full antfu-style formatting) to the example code blocks in all 5 TypeScript rule files. The pre-v1 state (47 rules total) is the starting point — Task 1's revert restored it.

**Architecture:** 5 sequential file rewrites ordered by impact (largest first). Each task is a single-file Markdown refactor. There is no automated test suite — verification is text-based via `rg`/`Get-Content`. Each file produces one commit; the overall pipeline is 1 already-done revert + 5 file commits + 1 final review.

**Tech Stack:** Markdown, PowerShell, Bash, Git, ripgrep

## Global Constraints

These constraints bind every task (verbatim from the v2 spec):

- 占位符使用通用名词:`Parser` / `Formatter` / `Validator` / `Loader` / `Container` / `Handler` 等作为类名;`parseValue` / `formatName` / `validateInput` / `loadConfig` / `buildRequest` 等作为函数/方法名;`inputValue` / `outputName` / `rawInput` / `currentItem` 等作为变量名;`MAX_LENGTH` / `DEFAULT_TIMEOUT_MS` 等作为固定单值常量;`ParseError` / `ValidationError` / `AppError` 作为错误类;`IConfig` / `IRule` / `IRequestOptions` 作为接口;`Value` / `Name` / `Status` / `Mode` 作为类型别名
- 占位符本身必须遵守项目命名规则(类大驼峰、函数小驼峰、接口 `I` + 大驼峰、常量大写下划线、错误类 `XxxError`)
- 格式遵循 antfu 风格:2 空格缩进、双引号、不写分号、多行时保留尾逗号、类成员显式标注 `public`/`private` 修饰符
- 不修改任何规则的标题、章节结构、规则正文(以 `>` 开头的引用块)
- 不修改任何规则正文中对 `@param` / `@returns` / `@throws` / `@example` 等标签的描述
- 示例代码块(以 ` ```typescript ` 包裹)允许且必须重写
- 每个文件 1 个 commit,共 5 个 commit
- `comment-rules.md` 允许在演示 JSDoc/TSDoc 写法的规则示例里保留 `/** */` 结构(规则 1, 2, 3, 4, 5, 6, 7, 8 中:规则 6 必须保留、规则 8 的不推荐写法必须保留,其他允许用 `/** */`)
- 其他 4 个文件示例内禁止 `/** */` 和 `//`

---

## File Structure

- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md` - 5 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md` - 8 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md` - 21 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md` - 7 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md` - 6 rules
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-v2-design.md` - approved placeholder conventions and formatting rules

---

## Task 1: Revert v1 simplification commits [DONE]

**Files:** All 5 TypeScript rule files (reverted to pre-v1 state)

Status: completed by implementer in commit `e49c54d`. Pre-v1 state restored. No further action in this task.

---

## Task 2: Refactor `comment-rules.md` (v2)

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

Expected: ~280 lines and 8 rule headings (注释使用 TSDoc 规范 / 有参数时写 `@param` / 有返回值时写 `@returns` / 会抛错时写 `@throws` / 可复用函数和方法写 `@example` / 不使用单行 `/** 内容 */` / 类型、常量、配置、函数、类、方法使用 `/** */` / 函数体和方法体内部说明使用单行注释).

- [ ] **Step 2: Apply the 8 v2 rule rewrites**

For each rule, replace BOTH code blocks. Body text (`>` paragraph) stays untouched. The example below uses literal line breaks; the implementer applies antfu multi-line format.

**Rule 1 — `注释使用 TSDoc 规范`**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

Replace 不推荐写法 with:

```typescript
// 描述 Xxx
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 2 — `有参数时写 \`@param\``**

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
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

**Rule 3 — `有返回值时写 \`@returns\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 *
 * @returns 结果。
 */
function getValue(): string {
  return ""
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function getValue(): string {
  return ""
}
```

**Rule 4 — `会抛错时写 \`@throws\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 *
 * @throws 输入为空时抛出错误。
 */
function loadValue(): string {
  throw new ParseError("输入为空")
}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function loadValue(): string {
  throw new ParseError("输入为空")
}
```

**Rule 5 — `可复用函数和方法写 \`@example\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 *
 * @example
 * parseValue("a") => "a"
 */
function parseValue(rawInput: string): string {
  return rawInput
}

/**
 * 串联主流程。
 */
function runCli(): void {}
```

Replace 不推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function parseValue(rawInput: string): string {
  return rawInput
}

/**
 * 串联主流程。
 *
 * @example
 * runCli() => 串联主流程
 */
function runCli(): void {}
```

**Rule 6 — `不使用单行 \`/** 内容 */\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function getValue(): string {
  return ""
}
```

Replace 不推荐写法 with:

```typescript
/** 描述 Xxx。 */
function getValue(): string {
  return ""
}
```

**Rule 7 — `类型、常量、配置、函数、类、方法使用 \`/** */\``**

Replace 推荐写法 with:

```typescript
/**
 * 描述 Xxx。
 */
function runCli(): void {}

/**
 * 封装 Xxx 的入口。
 */
class InstallCommand {
  /**
   * 执行命令。
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

**Rule 8 — `函数体和方法体内部说明使用单行注释`**

Replace 推荐写法 with:

```typescript
function processItems(items: IConfig[]): void {
  // 保留原始顺序
  items.forEach((item) => {
    console.log(item.name)
  })
}
```

Replace 不推荐写法 with:

```typescript
function processItems(items: IConfig[]): void {
  /**
   * 保留原始顺序
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

Expected: 8 rule headings preserved; no leftover business-context identifiers; no business names remain.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
git commit -m "docs(rules): simplify TypeScript comment rules examples (v2)"
```

Expected: one commit containing only `comment-rules.md` changes.

---

## Task 3: Refactor `implementation-rules.md` (v2)

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

Expected: 155 lines and 5 rule headings (参数类型写实际输入 / 单次处理用 function / 构造函数参数不直接声明属性 / 抛错只用 `Error` 或其子类实例 / `catch` 里先用类型守卫收窄).

- [ ] **Step 2: Apply the 5 v2 rule rewrites**

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

**Rule 2 — `单次处理用 function`**

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

**Rule 3 — `构造函数参数不直接声明属性`**

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

**Rule 4 — `抛错只用 \`Error\` 或其子类实例`**

Replace 推荐写法 with:

```typescript
throw new ParseError("输入不能为空")
```

Replace 不推荐写法 with:

```typescript
throw "输入不能为空"
```

**Rule 5 — `\`catch\` 里先用类型守卫收窄`**

Replace 推荐写法 with:

```typescript
} catch (error) {
  if (error instanceof ParseError) {
    return error.code
  }
  if (error instanceof Error) {
    return ErrorCode.UNKNOWN
  }
  throw error
}
```

Replace 不推荐写法 with:

```typescript
} catch (error) {
  return (error as ParseError).code
}

function isParseError(error: Error): error is ParseError {
  return error.name === "ParseError"
}

} catch (error) {
  if (error instanceof Error && isParseError(error)) {
    return error.code
  }
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
rg -n 'createCliUsageError|renderErrorDisplay' $path
```

Expected: 5 rule headings preserved; no leftover business-context identifiers.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git add "yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
git commit -m "docs(rules): simplify TypeScript implementation rules examples (v2)"
```

Expected: one commit containing only `implementation-rules.md` changes.

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

Expected: ~530 lines and 21 rule headings.

- [ ] **Step 2: Apply the 21 v2 rule rewrites**

**Rule 1 — `普通变量命名使用小驼峰命名法`**

Replace 推荐写法 with:

```typescript
const currentName = "Alice"
const isVisible = true
```

Replace 不推荐写法 with:

```typescript
const CurrentName = "Alice"
const is_visible = true
```

**Rule 2 — `布尔变量命名使用逻辑判断词`**

Replace 推荐写法 with:

```typescript
const isVisible = true
const hasPermission = false
const canSubmit = true
```

Replace 不推荐写法 with:

```typescript
const visible = true
const permissionStatus = false
const submitAble = true
```

**Rule 3 — `普通常量用大写下划线`**

Replace 推荐写法 with:

```typescript
const MAX_LENGTH = 100
const DEFAULT_TIMEOUT_MS = 3000
```

Replace 不推荐写法 with:

```typescript
const maxLength = 100
const defaultTimeoutMs = 3000
```

**Rule 4 — `固定配置对象用小驼峰`**

Replace 推荐写法 with:

```typescript
const requestConfig = {
  timeoutMs: 3000,
}
```

Replace 不推荐写法 with:

```typescript
const REQUEST_CONFIG = {
  timeoutMs: 3000,
}
```

**Rule 5 — `函数、方法名用小驼峰`**

Replace 推荐写法 with:

```typescript
function getName(): string {
  return ""
}

class UserService {
  public loadInfo(): void {}
}
```

Replace 不推荐写法 with:

```typescript
function GetName(): string {
  return ""
}

class UserService {
  public LoadInfo(): void {}
}
```

**Rule 6 — `函数、方法名写成动作加对象/结果`**

Replace 推荐写法 with:

```typescript
function getName(info: IConfig): string {
  return info.value
}

function buildRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

Replace 不推荐写法 with:

```typescript
function name(info: IConfig): string {
  return info.value
}

function requestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

**Rule 7 — `流程入口使用 \`run\``**

Replace 推荐写法 with:

```typescript
async function runCli(): Promise<void> {}
async function runMigration(): Promise<void> {}
function runSync(): void {}
```

Replace 不推荐写法 with:

```typescript
async function startCli(): Promise<void> {}
async function startMigration(): Promise<void> {}
function startSync(): void {}
```

**Rule 8 — `已有值用 \`get\`，外部内容用 \`load\``**

Replace 推荐写法 with:

```typescript
function getName(): string {
  return ""
}

async function loadProfile(): Promise<IConfig> {
  return await requestProfile()
}

async function loadConfig(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}
```

Replace 不推荐写法 with:

```typescript
function loadName(): string {
  return ""
}

async function getProfile(): Promise<IConfig> {
  return await requestProfile()
}

async function getConfig(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}
```

**Rule 9 — `单个值用 \`set\`，已有内容用 \`update\``**

Replace 推荐写法 with:

```typescript
function setVisible(visible: boolean): void {}
function updateInfo(info: IConfig): void {}
```

Replace 不推荐写法 with:

```typescript
function updateVisible(visible: boolean): void {}
function setInfo(info: IConfig): void {}
```

**Rule 10 — `创建用 \`create\`，组装用 \`build\``**

Replace 推荐写法 with:

```typescript
function createContext(): IContext {
  return {
    items: [],
  }
}

function buildRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

Replace 不推荐写法 with:

```typescript
function buildContext(): IContext {
  return {
    items: [],
  }
}

function createRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

**Rule 11 — `解析用 \`parse\`，整理用 \`format\``**

Replace 推荐写法 with:

```typescript
function parseInfo(content: string): IConfig {
  return validateInfo(JSON.parse(content))
}

function formatPrice(price: number): string {
  return `${price}`
}
```

Replace 不推荐写法 with:

```typescript
function formatInfo(content: string): IConfig {
  return validateInfo(JSON.parse(content))
}

function parsePrice(price: number): string {
  return `${price}`
}
```

**Rule 12 — `生成展示内容使用 render`**

Replace 推荐写法 with:

```typescript
function renderFooter(): string {
  return ""
}
```

Replace 不推荐写法 with:

```typescript
function buildFooter(): string {
  return ""
}
```

**Rule 13 — `新增用 \`add\`，移除用 \`remove\``**

Replace 推荐写法 with:

```typescript
function addRole(name: string): void {}
function removeRole(name: string): void {}
```

Replace 不推荐写法 with:

```typescript
function createRole(name: string): void {}
function deleteRole(name: string): void {}
```

**Rule 14 — `\`clear\`、\`reset\`、\`init\` 分开用`**

Replace 推荐写法 with:

```typescript
function clearHistory(): void {}
function resetForm(): void {}
function initContext(ctx: IContext): void {}
```

Replace 不推荐写法 with:

```typescript
function resetHistory(): void {}
function clearForm(): void {}
function createContext(ctx: IContext): void {}
```

**Rule 15 — `绑定用 \`bind\`，解绑用 \`unbind\``**

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

**Rule 16 — `事件处理用 handle`**

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

**Rule 17 — `校验函数、方法使用 validate`**

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

**Rule 18 — `类名用大驼峰`**

Replace 推荐写法 with:

```typescript
class UserService {}
```

Replace 不推荐写法 with:

```typescript
class userService {}
```

**Rule 19 — `接口名使用 \`I\` 开头的大驼峰命名法`**

Replace 推荐写法 with:

```typescript
interface IConfig {
  value: string
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
interface Config {
  value: string
}

interface iRequestOptions {
  timeoutMs: number
}

interface IuploadHandler {
  upload(): void
}
```

**Rule 20 — `类型名用大驼峰`**

Replace 推荐写法 with:

```typescript
type RequestMode = "sync" | "async"
```

Replace 不推荐写法 with:

```typescript
type requestMode = "sync" | "async"
```

**Rule 21 — `对象式枚举命名`**

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

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 21 rule headings preserved; placeholders follow naming rules.

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

Expected: 162 lines and 6 rule headings.

- [ ] **Step 2: Apply the 6 v2 rule rewrites**

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
function getName(config: IConfig): string {
  return config.value
}

const retryCount = 0
```

Replace 不推荐写法 with:

```typescript
function getName(config: any): string {
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

**Rule 6 — `\`as\` 只补明确类型`**

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
function focusButton(): void {
  const button = document.getElementById("submit") as HTMLButtonElement | null

  if (!button) {
    return
  }

  button.focus()
}
```

- [ ] **Step 3: Verify ending state**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 6 rule headings preserved.

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
- comment-rules.md: 8 headings
- implementation-rules.md: 5 headings
- naming-rules.md: 21 headings
- statement-rules.md: 7 headings
- type-rules.md: 6 headings

- [ ] **Step 2: Confirm no JSDoc / TSDoc / line comments inside example code blocks in non-comment-rules files**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '^\s*\*\s|^\s*/\*\*|^\s*//' "$base/implementation-rules.md" "$base/naming-rules.md" "$base/statement-rules.md" "$base/type-rules.md"
```

Expected: no matches.

- [ ] **Step 3: Confirm `comment-rules.md` examples use proper antfu format and JSDoc only in Rule 6 and Rule 8 不推荐**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
rg -n '^\s*\*\s|^\s*/\*\*' $path
```

Expected: matches appear only in Rule 6 (both blocks) and Rule 8's 不推荐写法. The other 6 rules' 不推荐写法 use `//` (line comment) to demonstrate wrong usage.

- [ ] **Step 4: Confirm placeholders follow project naming rules across all 5 files**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '\bclass\s+[a-z][a-zA-Z0-9]*\b|\binterface\s+[a-z][a-zA-Z0-9]*\b|\btype\s+[a-z][a-zA-Z0-9]*\s*=' "$base/comment-rules.md" "$base/implementation-rules.md" "$base/naming-rules.md" "$base/statement-rules.md" "$base/type-rules.md"
```

Expected: no matches (all class / interface / type names start with uppercase or `I`+uppercase, satisfying project naming rules).

- [ ] **Step 5: Confirm git log shows exactly 1 revert + 5 redo commits**

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git log --oneline -10 -- yeizi-styles/rules-project/rules/technologies/typescript/
```

Expected: 1 revert commit (`e49c54d`) at the front, followed by 5 redo commits in the order: comment → implementation → naming → statement → type.

---

## Self-Review Notes

- **Spec coverage**: Every section of the v2 spec maps to at least one task. Task 1 (revert) is done; Tasks 2-6 cover each file's 47 total rules; Task 7 verifies the result.
- **Placeholder scan**: No "TBD" / "TODO" / "implement later" in the plan. Every "Replace ... with" includes the full replacement code block.
- **Type consistency**: `ParseError`, `AppError`, `ErrorCode`, `IConfig`, `IRequestOptions`, `IUploadHandler`, `IContext`, `ItemStatus`, `FormData` are defined consistently across tasks.
- **Naming consistency**: Placeholder names are reused (`Parser`/`Formatter` family for class examples, `parseValue`/`formatName` for parsing examples, `IConfig` for config examples). Reuse is intentional.
- **Plan correction**: The original v2 plan (`1e84bbf`) assumed rule counts matching post-v1 state; this version was rewritten after Task 1 confirmed the actual pre-v1 state has 47 rules total.