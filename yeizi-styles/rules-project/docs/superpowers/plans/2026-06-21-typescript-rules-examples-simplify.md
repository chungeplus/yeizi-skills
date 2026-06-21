# TypeScript Rules Examples Simplify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite every "推荐写法 / 不推荐写法" code block across the 5 TypeScript rule files into minimal abstract examples (no business context, no JSDoc/TSDoc comments, `foo`/`bar`/`Xxx`/`IXxx`/`T` placeholders), keeping rule titles, sections, and the `>` quoted body text unchanged.

**Architecture:** 5 sequential file rewrites ordered by impact (largest first). Each task is a single-file Markdown refactor: the engineer verifies the file's starting state, applies a per-rule rewrite table, verifies the ending state, and commits. There is no automated test suite — verification is text-based via `rg`/`Get-Content`.

**Tech Stack:** Markdown, PowerShell, Bash, Git, ripgrep

## Global Constraints

- 不修改任何规则的标题、章节结构、规则正文(以 `>` 开头的引用块)
- 不修改任何规则正文中对 `@param` / `@returns` / `@throws` / `@example` 等标签的描述
- 示例代码块(以 ` ```typescript ` 包裹)允许且必须重写
- 实施顺序固定:`implementation-rules.md` → `comment-rules.md` → `naming-rules.md` → `statement-rules.md` → `type-rules.md`
- 占位符约定(类型表)来自 `docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md` 的"占位符约定"段
- 每个文件提交一次,共 5 个 commit
- 5 个文件总行数下降 30%-50%

---

## File Structure

- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md` - 10 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md` - 14 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md` - 25 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md` - 7 rules
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md` - 7 rules
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md` - approved placeholder conventions and edge-case handling

---

## Task 1: Refactor `implementation-rules.md`

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md` (entire example block content)
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md`

**Interfaces:**
- Consumes: 10 rules with their `>` body text and section structure
- Produces: same 10 rules with example code blocks replaced per the table below

- [ ] **Step 1: Verify starting state of `implementation-rules.md`**

Run:

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 468 lines and the 10 rule headings listed in order: `参数类型写实际输入`, `函数拆分只在复用或分步时进行`, `单个导出函数的辅助逻辑就近定义`, `单次执行用 \`function\``, `共享对象能力用 \`class\``, `轻实例也用 \`class\``, `不用工厂函数和闭包模拟对象`, `构造函数参数不直接声明属性`, `抛错只用 \`Error\` 或其子类实例`, `\`catch\` 里用 \`instanceof\` 收窄错误类型`.

- [ ] **Step 2: Apply the 10 rule rewrites in this file**

For each rule, replace its `推荐写法` code block and `不推荐写法` code block with the new minimal version below. Do not touch the `>` body text or section headings.

**Rule 1 — `参数类型写实际输入`**

Replace 推荐写法 code block with:

```typescript
function foo(x: string): string[] { return x.split(",") }
```

Replace 不推荐写法 code block with:

```typescript
function foo(x?: string): string[] { return x ? x.split(",") : [] }
```

**Rule 2 — `函数拆分只在复用或分步时进行`**

Replace 推荐写法 code block with:

```typescript
function foo(x: string, y: number): number { return bar(x) + y }
function bar(x: string): number { return Number(x) }
```

Replace 不推荐写法 code block with:

```typescript
function foo(x: string, y: number): number {
  const z = Number(x)
  return z + y
}
```

**Rule 3 — `单个导出函数的辅助逻辑就近定义`**

Replace 推荐写法 code block with:

```typescript
function foo(x: string): string {
  const m: Record<string, string> = { a: "1" }
  return m[x] ?? x
}
```

Replace 不推荐写法 code block with:

```typescript
const m: Record<string, string> = { a: "1" }
function foo(x: string): string { return m[x] ?? x }
```

**Rule 4 — `单次执行用 \`function\``**

Replace 推荐写法 code block with:

```typescript
function foo(x: string, y: string): void {}
```

Replace 不推荐写法 code block with:

```typescript
class Xxx {
  public foo(x: string, y: string): void {}
}
```

**Rule 5 — `共享对象能力用 \`class\``**

Replace 推荐写法 code block with:

```typescript
class Xxx {
  private foo: string
  public constructor(foo: string) { this.foo = foo }
  public bar(): string { return this.foo }
}
```

Replace 不推荐写法 code block with:

```typescript
const foo = { bar: 1 }
function baz(): number { return foo.bar }
```

**Rule 6 — `轻实例也用 \`class\``**

Replace 推荐写法 code block with:

```typescript
class Xxx {
  private static readonly FOO = 1
  public bar(): number { return Xxx.FOO }
}
```

Replace 不推荐写法 code block with:

```typescript
const FOO = 1
function bar(): number { return FOO }
```

**Rule 7 — `不用工厂函数和闭包模拟对象`**

Replace 推荐写法 code block with:

```typescript
class Xxx {
  private foo: boolean
  public constructor() { this.foo = false }
  public bar(): boolean { return this.foo }
}
```

Replace 不推荐写法 code block with:

```typescript
function createXxx() {
  let foo = false
  return { bar: () => foo }
}
```

**Rule 8 — `构造函数参数不直接声明属性`**

Replace 推荐写法 code block with:

```typescript
class Xxx {
  public foo: string
  public constructor(foo: string) { this.foo = foo }
}
```

Replace 不推荐写法 code block with:

```typescript
class Xxx {
  public constructor(public foo: string) {}
}
```

**Rule 9 — `抛错只用 \`Error\` 或其子类实例`**

Replace 推荐写法 code block with:

```typescript
throw new XxxError("foo")
```

Replace 不推荐写法 code block with:

```typescript
throw "foo"
```

**Rule 10 — `\`catch\` 里用 \`instanceof\` 收窄错误类型`**

Replace 推荐写法 code block with:

```typescript
} catch (e) {
  if (e instanceof XxxError) { return e.code }
  if (e instanceof Error) { return 1 }
}
```

Replace 不推荐写法 code block with:

```typescript
} catch (e) {
  return (e as XxxError).code
}
```

- [ ] **Step 3: Verify ending state of `implementation-rules.md`**

Run:

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
rg -n '^\s*\*\s|^\s*/\*\*' $path
```

Expected: line count drops to roughly 230-330 (from 468). The 10 rule headings remain. No matches for `* ` (TSDoc bullet) or `/**` inside code blocks (search returns only code-fence-like lines or nothing).

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" add -- "yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md"
git -C "C:/Users/yeizi/Desktop/yeizi-skills" commit -m "docs(rules): simplify TypeScript implementation rules examples"
```

Expected: one commit containing only `implementation-rules.md` changes.

---

## Task 2: Refactor `comment-rules.md`

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md` (entire example block content)
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md`

- [ ] **Step 1: Verify starting state of `comment-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~440 lines (file has been modified since the 397 baseline) and 14 rule headings.

- [ ] **Step 2: Apply the 14 rule rewrites in this file**

For every rule below, replace BOTH code blocks. The body text (the `>` paragraph) stays untouched. All example code blocks contain no `/** */` comments.

**Rule 1 — `注释使用 TSDoc 规范`**

Both code blocks become the same minimal function. Replace 推荐写法 with:

```typescript
function foo(): void {}
```

Replace 不推荐写法 with:

```typescript
function foo(): void {}
```

(These two blocks become identical, conveying "the prose explains the difference".)

**Rule 2 — `注释正文只描述调用方契约`**

Both blocks again convey that the function body is identical; the difference (if any) is in the prose. Replace 推荐写法 with:

```typescript
function foo(): never { throw new XxxError("foo") }
```

Replace 不推荐写法 with:

```typescript
function foo(): never { throw new XxxError("foo") }
```

**Rule 3 — `同一块内容不写空行`**

Replace 推荐写法 with:

```typescript
/**
 * foo
 * bar
 */
function foo(): void {}
```

Replace 不推荐写法 with:

```typescript
/**
 * foo
 *
 * bar
 */
function foo(): void {}
```

**Rule 4 — `\`@example\` 内容写在 \`@example\` 标签下一行`**

Replace 推荐写法 with:

```typescript
/**
 * @example
 * foo()
 */
function foo(): void {}
```

Replace 不推荐写法 with:

```typescript
/**
 * @example foo()
 */
function foo(): void {}
```

**Rule 5 — `注释里的示例代码遵守所有代码规则`**

Replace 推荐写法 with:

```typescript
function foo(): void {}
```

Replace 不推荐写法 with:

```typescript
function foo (): void {}
```

(Note: the contrast is whether there is exactly one space before `()` on the function name.)

**Rule 6 — `有参数时写 \`@param\``**

Replace 推荐写法 with:

```typescript
function foo(x: T): T { return x }
```

Replace 不推荐写法 with:

```typescript
function foo(x: T): T { return x }
```

**Rule 7 — `有返回值时写 \`@returns\``**

Replace 推荐写法 with:

```typescript
function foo(): T { return 1 }
```

Replace 不推荐写法 with:

```typescript
function foo(): T { return 1 }
```

**Rule 8 — `会抛错时写 \`@throws\``**

Replace 推荐写法 with:

```typescript
function foo(): void { throw new XxxError("foo") }
```

Replace 不推荐写法 with:

```typescript
function foo(): void { throw new XxxError("foo") }
```

**Rule 9 — `可复用函数和方法写 \`@example\``**

Replace 推荐写法 with:

```typescript
function foo(x: string): T { return JSON.parse(x) }
function bar(): void {}
```

Replace 不推荐写法 with:

```typescript
function foo(x: string): T { return JSON.parse(x) }
function bar(): void {}
```

**Rule 10 — `不使用单行 \`/** 内容 */\``**

Replace 推荐写法 with:

```typescript
/**
 * foo
 */
function foo(): string { return "foo" }
```

Replace 不推荐写法 with:

```typescript
/** foo */
function foo(): string { return "foo" }
```

**Rule 11 — `顶层定义和方法统一使用 \`/** */\``**

Replace 推荐写法 with:

```typescript
function foo(): void {}

class Xxx {
  public bar(): void {}
}
```

Replace 不推荐写法 with:

```typescript
function foo(): void {}

class Xxx {
  public bar(): void {}
}
```

**Rule 12 — `字段统一使用 \`/** */\``**

Replace 推荐写法 with:

```typescript
interface IXxx {
  /**
   * foo
   */
  foo: string
}
```

Replace 不推荐写法 with:

```typescript
interface IXxx {
  foo: string
}
```

**Rule 13 — `字段注释直接写用途和约束`**

Replace 推荐写法 with:

```typescript
interface IXxx {
  /**
   * 超时时间，毫秒；0 表示不超时。
   */
  foo: number
}
```

Replace 不推荐写法 with:

```typescript
interface IXxx {
  /**
   * foo
   */
  foo: number
}
```

**Rule 14 — `函数体和方法体内部说明使用单行注释`**

Replace 推荐写法 with:

```typescript
function foo(list: T[]): void {
  // 保留顺序
  list.forEach((x) => x)
}
```

Replace 不推荐写法 with:

```typescript
function foo(list: T[]): void {
  /**
   * 保留顺序
   */
  list.forEach((x) => x)
}
```

- [ ] **Step 3: Verify ending state of `comment-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: line count drops to roughly 250-330 (from ~440). 14 rule headings remain. The prose (`>`) blocks are unchanged.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" add -- "yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md"
git -C "C:/Users/yeizi/Desktop/yeizi-skills" commit -m "docs(rules): simplify TypeScript comment rules examples"
```

Expected: one commit containing only `comment-rules.md` changes.

---

## Task 3: Refactor `naming-rules.md`

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md`

- [ ] **Step 1: Verify starting state of `naming-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~622 lines and 25 rule headings.

- [ ] **Step 2: Apply the 25 rule rewrites in this file**

For every rule below, replace BOTH code blocks. Body text stays untouched. No JSDoc in any example.

**Rule 1 — `变量默认使用小驼峰命名法`**

Replace 推荐写法 with:

```typescript
const foo = 1
const isFoo = true
```

Replace 不推荐写法 with:

```typescript
const Foo = 1
const is_foo = true
```

**Rule 2 — `布尔变量命名使用逻辑判断词`**

Replace 推荐写法 with:

```typescript
const isFoo = true
const hasBar = false
const canBaz = true
```

Replace 不推荐写法 with:

```typescript
const foo = true
const barStatus = false
const bazAble = true
```

**Rule 3 — `固定单值常量用大写下划线`**

Replace 推荐写法 with:

```typescript
const MAX_FOO = 3
const DEFAULT_BAR = 1
```

Replace 不推荐写法 with:

```typescript
const maxFoo = 3
const defaultBar = 1
```

**Rule 4 — `函数、方法名用小驼峰`**

Replace 推荐写法 with:

```typescript
function foo(): string { return "" }

class Xxx {
  public bar(): void {}
}
```

Replace 不推荐写法 with:

```typescript
function Foo(): string { return "" }

class Xxx {
  public Bar(): void {}
}
```

**Rule 5 — `函数、方法名写成动作加对象/结果`**

Replace 推荐写法 with:

```typescript
function getFoo(): string { return "" }
function buildBar(): T { return 1 as T }
```

Replace 不推荐写法 with:

```typescript
function foo(): string { return "" }
function bar(): T { return 1 as T }
```

**Rule 6 — `流程入口使用 \`run\``**

Replace 推荐写法 with:

```typescript
async function runFoo(): Promise<void> {}
function runBar(): void {}
```

Replace 不推荐写法 with:

```typescript
async function startFoo(): Promise<void> {}
function startBar(): void {}
```

**Rule 7 — `普通函数不使用 \`run\``**

Replace 推荐写法 with:

```typescript
async function loadFoo(): Promise<string> { return "" }
function buildBar(): T { return 1 as T }
```

Replace 不推荐写法 with:

```typescript
async function runFoo(): Promise<string> { return "" }
function runBar(): T { return 1 as T }
```

**Rule 8 — `已有值用 \`get\`，外部内容用 \`load\``**

Replace 推荐写法 with:

```typescript
function getFoo(): string { return "" }
async function loadBar(): Promise<T> { return 1 as T }
```

Replace 不推荐写法 with:

```typescript
function loadFoo(): string { return "" }
async function getBar(): Promise<T> { return 1 as T }
```

**Rule 9 — `单个值用 \`set\`，已有内容用 \`update\``**

Replace 推荐写法 with:

```typescript
function setFoo(x: T): void {}
function updateBar(x: T): void {}
```

Replace 不推荐写法 with:

```typescript
function updateFoo(x: T): void {}
function setBar(x: T): void {}
```

**Rule 10 — `创建用 \`create\`，组装用 \`build\``**

Replace 推荐写法 with:

```typescript
function createFoo(): T { return {} as T }
function buildBar(x: T): T { return x }
```

Replace 不推荐写法 with:

```typescript
function buildFoo(): T { return {} as T }
function createBar(x: T): T { return x }
```

**Rule 11 — `解析用 \`parse\`，整理用 \`format\``**

Replace 推荐写法 with:

```typescript
function parseFoo(x: string): T { return JSON.parse(x) }
function formatBar(x: number): string { return `${x}` }
```

Replace 不推荐写法 with:

```typescript
function formatFoo(x: string): T { return JSON.parse(x) }
function parseBar(x: number): string { return `${x}` }
```

**Rule 12 — `生成展示内容使用 render`**

Replace 推荐写法 with:

```typescript
function renderFoo(): string { return "" }
```

Replace 不推荐写法 with:

```typescript
function buildFoo(): string { return "" }
```

**Rule 13 — `新增用 \`add\`，移除用 \`remove\``**

Replace 推荐写法 with:

```typescript
function addFoo(x: T): void {}
function removeBar(x: T): void {}
```

Replace 不推荐写法 with:

```typescript
function createFoo(x: T): void {}
function deleteBar(x: T): void {}
```

**Rule 14 — `清空已有内容使用 \`clear\``**

Replace 推荐写法 with:

```typescript
function clearFoo(): void {}
```

Replace 不推荐写法 with:

```typescript
function resetFoo(): void {}
```

**Rule 15 — `恢复初始值使用 \`reset\``**

Replace 推荐写法 with:

```typescript
function resetFoo(): void {}
```

Replace 不推荐写法 with:

```typescript
function clearFoo(): void {}
```

**Rule 16 — `初始化既有实例使用 \`init\``**

Replace 推荐写法 with:

```typescript
function initFoo(x: T): void {}
```

Replace 不推荐写法 with:

```typescript
function createFoo(x: T): void {}
```

**Rule 17 — `绑定用 \`bind\`，解绑用 \`unbind\``**

Replace 推荐写法 with:

```typescript
function bindFoo(): void {}
function unbindBar(): void {}
```

Replace 不推荐写法 with:

```typescript
function handleFoo(): void {}
function removeBar(): void {}
```

**Rule 18 — `事件处理用 handle`**

Replace 推荐写法 with:

```typescript
function handleFoo(): void {}
```

Replace 不推荐写法 with:

```typescript
function foo(): void {}
```

**Rule 19 — `校验函数、方法使用 validate`**

Replace 推荐写法 with:

```typescript
function validateFoo(x: T): boolean { return true }
```

Replace 不推荐写法 with:

```typescript
function isFoo(x: T): boolean { return true }
```

**Rule 20 — `类名用大驼峰`**

Replace 推荐写法 with:

```typescript
class Xxx {}
```

Replace 不推荐写法 with:

```typescript
class xxx {}
```

**Rule 21 — `接口名使用 \`I\` 开头的大驼峰命名法`**

Replace 推荐写法 with:

```typescript
interface IXxx {
  foo: string
}
```

Replace 不推荐写法 with:

```typescript
interface Xxx {
  foo: string
}
```

**Rule 22 — `类型名用大驼峰`**

Replace 推荐写法 with:

```typescript
type Foo = "a" | "b"
```

Replace 不推荐写法 with:

```typescript
type foo = "a" | "b"
```

**Rule 23 — `对象式枚举主体用大驼峰`**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

Replace 不推荐写法 with:

```typescript
const XXX_FOO = { FOO: "foo" } as const
type Xxx = typeof XXX_FOO[keyof typeof XXX_FOO]
```

**Rule 24 — `对象式枚举成员用大写下划线`**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO_BAR: "foo_bar" } as const
```

Replace 不推荐写法 with:

```typescript
const Xxx = { FooBar: "foo_bar" } as const
```

**Rule 25 — `对象式枚举主体和联合类型同名`**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

Replace 不推荐写法 with:

```typescript
const Xxx = { FOO: "foo" } as const
type XxxType = typeof Xxx[keyof typeof Xxx]
```

(Note: the existing file shows 3 rules under "枚举命名规则" — `对象式枚举主体用大驼峰` (Rule 23), `对象式枚举成员用大写下划线` (Rule 24), and `对象式枚举主体和联合类型同名` (Rule 25). Apply each of them.)

- [ ] **Step 3: Verify ending state of `naming-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: line count drops to roughly 300-400. All 25 rule headings remain (note: the actual count is 25 visible rule headings; the spec's "27" was an overestimate — confirm count and that all rule titles match the file's original list).

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" add -- "yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md"
git -C "C:/Users/yeizi/Desktop/yeizi-skills" commit -m "docs(rules): simplify TypeScript naming rules examples"
```

Expected: one commit containing only `naming-rules.md` changes.

---

## Task 4: Refactor `statement-rules.md`

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md`

- [ ] **Step 1: Verify starting state of `statement-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: 209 lines and 7 rule headings.

- [ ] **Step 2: Apply the 7 rule rewrites in this file**

**Rule 1 — `变量定义按是否重赋值区分 \`const\` 和 \`let\``**

Replace 推荐写法 with:

```typescript
const foo = 1
let bar = 0
bar += 1
```

Replace 不推荐写法 with:

```typescript
let foo = 1
var bar = 0
```

**Rule 2 — `模块导出统一写在文件底部`**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
interface IXxx { foo: string }
function bar(x: string): IXxx { return { foo: x } }

export { Xxx, bar }
export type { Xxx, IXxx }
```

Replace 不推荐写法 with:

```typescript
export const Xxx = { FOO: "foo" } as const
export type Xxx = typeof Xxx[keyof typeof Xxx]
export interface IXxx { foo: string }
export function bar(x: string): IXxx { return { foo: x } }
```

**Rule 3 — `判断不写 \`=== true/false\``**

Replace 推荐写法 with:

```typescript
if (isFoo) { bar() }
if (!isFoo) { return }
```

Replace 不推荐写法 with:

```typescript
if (isFoo === true) { bar() }
if (isFoo === false) { return }
```

**Rule 4 — `禁止使用三目运算符`**

Replace 推荐写法 with:

```typescript
if (isFoo) { return "a" }
return "b"
```

Replace 不推荐写法 with:

```typescript
return isFoo ? "a" : "b"
```

**Rule 5 — `禁用 \`switch\``**

Replace 推荐写法 with:

```typescript
if (status === "a") { return 1 }
if (status === "b") { return 2 }
return 0
```

Replace 不推荐写法 with:

```typescript
switch (status) {
  case "a": return 1
  case "b": return 2
  default: return 0
}
```

**Rule 6 — `禁用关键字循环`**

Replace 推荐写法 with:

```typescript
const foo = list.filter((x) => x.isFoo)
const bar = list.map((x) => x.foo)
const baz = list.some((x) => x.isFoo)
```

Replace 不推荐写法 with:

```typescript
for (const x of list) { console.log(x.foo) }
for (let i = 0; i < list.length; i += 1) { console.log(list[i].foo) }
```

**Rule 7 — `其他可遍历内容先转数组再处理`**

Replace 推荐写法 with:

```typescript
const foo = Object.values(map)
  .filter((x) => x.isFoo)
  .map((x) => x.foo)
const bar = Array.from(set).map((x) => x.foo)
```

Replace 不推荐写法 with:

```typescript
for (const k in map) {
  if (map[k].isFoo) { console.log(map[k].foo) }
}
for (const x of set) { console.log(x) }
```

- [ ] **Step 3: Verify ending state of `statement-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: line count drops to roughly 130-170. 7 rule headings remain.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" add -- "yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md"
git -C "C:/Users/yeizi/Desktop/yeizi-skills" commit -m "docs(rules): simplify TypeScript statement rules examples"
```

Expected: one commit containing only `statement-rules.md` changes.

---

## Task 5: Refactor `type-rules.md`

**Files:**
- Modify: `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md`
- Reference: `yeizi-styles/rules-project/docs/superpowers/specs/2026-06-21-typescript-rules-examples-simplify-design.md`

- [ ] **Step 1: Verify starting state of `type-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: ~201 lines and 7 rule headings (file has been extended beyond the original 166).

- [ ] **Step 2: Apply the 7 rule rewrites in this file**

**Rule 1 — `枚举值用 \`const\` 对象和联合类型`**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO: "foo", BAR: "bar" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

Replace 不推荐写法 with:

```typescript
enum Xxx { FOO = "foo", BAR = "bar" }
```

**Rule 2 — `对象类型使用 \`interface\``**

Replace 推荐写法 with:

```typescript
interface IXxx {
  foo: string
}

interface IBar {
  baz: number
}
```

Replace 不推荐写法 with:

```typescript
type Xxx = {
  foo: string
}

type Bar = {
  baz: number
}
```

**Rule 3 — `组合和派生类型使用 \`type\``**

Replace 推荐写法 with:

```typescript
type Xxx = "a" | "b"
type Bar = (x: string) => Promise<string>
type Baz = Pick<IXxx, "foo">
```

Replace 不推荐写法 with:

```typescript
interface IXxx { value: "a" | "b" }
interface IBar { (x: string): Promise<string> }
```

**Rule 4 — `禁止使用 \`any\` 和 \`unknown\``**

Replace 推荐写法 with:

```typescript
function foo(x: IXxx): string { return x.foo }
const bar = 0
```

Replace 不推荐写法 with:

```typescript
function foo(x: any): string { return x.foo }
const bar: unknown = 0
```

**Rule 5 — `类型明确时禁止额外使用泛型`**

Replace 推荐写法 with:

```typescript
class XxxError extends Error {
  public readonly foo: string
  public constructor(foo: string) { super(foo); this.foo = foo }
}

function bar<T extends object, K extends keyof T>(x: T, y: K): T[K] { return x[y] }
```

Replace 不推荐写法 with:

```typescript
class XxxError<TFoo extends string = string> extends Error {
  public readonly foo: TFoo
  public constructor(foo: TFoo) { super(foo); this.foo = foo }
}
```

**Rule 6 — `只在 \`as const\` 场景使用 \`as\``**

Replace 推荐写法 with:

```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

Replace 不推荐写法 with:

```typescript
function foo(): void {
  const x = bar() as Xxx | null
  if (!x) { return }
  x.baz()
}
```

**Rule 7 — `参数类型不使用只读修饰`**

Replace 推荐写法 with:

```typescript
function foo(list: string[]): string { return list.join("") }
function bar(m: Map<string, string[]>, k: string): string[] | undefined { return m.get(k) }
```

Replace 不推荐写法 with:

```typescript
function foo(list: readonly string[]): string { return list.join("") }
function bar(m: ReadonlyMap<string, readonly string[]>, k: string): readonly string[] | undefined { return m.get(k) }
```

- [ ] **Step 3: Verify ending state of `type-rules.md`**

```powershell
$path = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
$lines = Get-Content -Encoding UTF8 $path
"{0} lines total" -f $lines.Count
rg -n '^### ' $path
```

Expected: line count drops to roughly 100-130. 7 rule headings remain.

- [ ] **Step 4: Commit**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" add -- "yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md"
git -C "C:/Users/yeizi/Desktop/yeizi-skills" commit -m "docs(rules): simplify TypeScript type rules examples"
```

Expected: one commit containing only `type-rules.md` changes.

---

## Task 6: Final cross-file verification

**Files:**
- Read-only: all 5 files in `yeizi-styles/rules-project/rules/technologies/typescript/`

- [ ] **Step 1: Total line count check**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
$total = 0
foreach ($f in @("comment-rules.md", "implementation-rules.md", "naming-rules.md", "statement-rules.md", "type-rules.md")) {
  $count = (Get-Content -Encoding UTF8 (Join-Path $base $f)).Count
  "{0}: {1}" -f $f, $count
  $total += $count
}
"Total: $total"
```

Expected: Total drops from 1862 to roughly 1000-1300 lines (a 30%-50% reduction).

- [ ] **Step 2: Confirm no JSDoc / TSDoc inside non-comment-rules example code blocks**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '^\s*\*\s' "$base/implementation-rules.md" "$base/naming-rules.md" "$base/statement-rules.md" "$base/type-rules.md"
```

Expected: no matches across these 4 files. JSDoc / TSDoc bullets (`* ` indented) are only allowed inside `comment-rules.md`, where Rules 3, 4, 10, 12, 13, 14 intentionally show `/** */` syntax in their example blocks. If any match is found, the engineer must inspect the file and either correct the rewrite or update the rule list above.

- [ ] **Step 3: Confirm all section headings and rule titles are preserved**

```powershell
$base = "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules/technologies/typescript"
rg -n '^## |^### ' $base
```

Expected: same set of `## section` and `### rule` headings as the originals (with one extra `###` rule per file for the `function vs class` split already merged into the implementation rules; otherwise no missing or extra headings).

- [ ] **Step 4: Confirm git log shows exactly 5 new commits**

```bash
git -C "C:/Users/yeizi/Desktop/yeizi-skills" log --oneline -5 -- "yeizi-styles/rules-project/rules/technologies/typescript/"
```

Expected: the 5 commits from Tasks 1-5, plus possibly the existing "function vs class" commit from the other agent, are visible.

---

## Self-Review Notes

- **Spec coverage:** Each of the 5 files has at least one task. The spec's edge cases (comment-rules no-comment policy, no `@example` content in examples, import/export minimal handling) are reflected in the per-rule rewrites in Tasks 1-2 and 4-5.
- **Placeholder scan:** No TBD/TODO/placeholder strings in any task. Every "Replace ... with" includes the actual replacement code.
- **Type consistency:** `T` is used consistently for generic type parameters; `IXxx` for interfaces; `Xxx` for classes; `XxxError` for error subclasses — matches the spec's placeholder table.
- **Naming consistency:** The spec uses `foo` / `bar` / `baz` for functions and variables, `Xxx` for classes/types, `IXxx` for interfaces. Every code block in Tasks 1-5 follows this convention.
- **Project style:** The project's existing code does not use semicolons at the end of statements. Some of the rewrites in this plan (e.g. `super(foo); this.foo = foo` in Task 5 Rule 5) include semicolons for clarity in this single-line compressed form; the engineer may strip them when applying the rewrites if strict project style adherence is required.
- **Known scope risk:** `naming-rules.md` rule count is reported as 25 in Task 3 (Step 3) rather than the originally quoted 27, because the file's actual rule count from the grep baseline is 25 visible rule headings. The plan applies rewrites for every rule that exists in the file; if the count differs at execution time, the engineer must reconcile against the file's actual heading list.
