# TypeScript 规则文件示例简化设计

## 目标

把 5 个 TypeScript 规则文件里所有"推荐写法 / 不推荐写法"代码示例,统一改造为**最小抽象示例**:无业务场景、无 JSDoc 注释、只用占位符(`foo` / `bar` / `Xxx` / `IXxx` / `T` 等)展示规则的对错点。

## 适用范围

5 个文件全部覆盖:

- `comment-rules.md`
- `implementation-rules.md`
- `naming-rules.md`
- `statement-rules.md`
- `type-rules.md`

## 不动的内容

- 规则的标题、章节结构
- 规则的规则正文(以 `>` 开头的引用块)
- 规则正文里对 `@example` 等 TSDoc 标签的描述方式

## 预期收益

- 5 个文件总行数下降 30%-50%
- 阅读规则时,代码不再分散注意力
- 风格统一,未来新增或修改规则有可参照的模板

## 占位符约定

| 类型 | 命名 | 示例 |
|------|------|------|
| 函数 / 方法 | `foo` / `bar` / `baz` | `function foo(): void {}` |
| 类 | `Xxx` | `class Xxx {}` |
| 接口 | `IXxx` | `interface IXxx {}` |
| 类型 | `T` / `TKey` | `type T = string` |
| 泛型 | `T` / `TKey` | `<TKey extends keyof T>` |
| 变量 | `foo` / `bar` | `const foo = 1` |
| 常量(单值) | `XXX` | `const MAX_XXX = 1` |
| 对象式枚举主体 | `Xxx` | `const Xxx = { FOO: "foo" }` |
| 字段 | `foo` / `bar` | `foo: string` |
| 异常 | `XxxError` | `throw new XxxError()` |
| 字符串字面量 | `"foo"` / `"bar"` | `if (status === "foo")` |
| 数字字面量 | `1` / `0` | `count = 1` |

## 代码块结构

- 仍然保留"推荐写法"和"不推荐写法"两个独立 `typescript` 代码块
- 当一条规则包含多个对比点时,在同一个代码块内连续写多个示例,不再分多组
- 每个代码块总行数不超过 8 行,大多数应在 3-5 行

## 禁止出现在示例中

- 真实业务词汇(`UserInfo`、`UploadTask`、`portOptionValue` 等)
- JSDoc / TSDoc 注释(任何形式的 `/** */` 和 `//`)
- 多行函数体(只保留能体现规则点的最小逻辑)
- import / export 语句(规则就是讲 export 的情况除外)
- 异步、Promise 等与规则点无关的语法糖

## 边界情况处理

### `comment-rules.md` 规则示例

`comment-rules.md` 的规则本身就是讲 TSDoc 写法,示例里也彻底不写注释,只保留最小函数:

```typescript
function foo(x: string): string { return x }
```

部分规则的对比信息(如"单行 `/** 内容 */` 与多行 `/** */` 的对比、"同一块内容是否写空行"的对比)在示例里会损失,这些规则的对比完全靠规则正文承载。

### "function vs class" 系列规则

该系列已被另一智能体拆为 4 条子规则("单次执行用 function"、"共享对象能力用 class"、"轻实例也用 class"、"不用工厂函数和闭包模拟对象")。本次只对每条子规则的示例做最小化,不调整子规则本身的拆分。

### `@example` 标签内容

写在示例代码块里的 `@example` 标签内容(与 TSDoc 注释一样)算示例的一部分,本次改造统一删除。

### `import` / `export` 语句

- 规则与 import / export 无关时,示例中所有 import / export 一律删除
- 规则就是讲 export(如 `statement-rules.md` 里的"模块导出统一写在文件底部")时,保留一个最简 `export { foo }` 占位

## 每个文件的具体改动概览

### `type-rules.md`

- 改动最小
- 现有 4 条规则的 8 个示例都已较简洁,主体改动是把真实命名(`AppScene`、`IUserInfo`、`AppError`)替换为占位符(`Xxx`、`IXxx`、`XxxError`)
- 预计减少 5-10 行

### `statement-rules.md`

- 改动较小
- 现有 9 条规则的示例大体简洁
- 去掉 `User`、`userInfo` 等业务词,改用 `foo` / `bar` 列表
- 把 `UploadStatus` 替换为字符串字面量 `"foo"`
- 预计减少 15-25 行

### `naming-rules.md`

- 改动中等
- 大部分规则已经是单行 / 两行示例
- 主要改动:去掉 `UserInfo`、`RequestOptions` 改为 `IXxx` / `T`;把堆叠的 4-6 个函数示例保留
- 预计减少 40-60 行

### `comment-rules.md`

- 改动较大
- 改造策略:示例代码块只保留纯语法结构,函数体保持最小
- 规则正文(以 `>` 开头的引用块)承载所有对比信息
- 预计减少 60-100 行

### `implementation-rules.md`

- 改动最大
- 多处重型示例要重写:
  - "参数类型写实际输入":`parseCsvOptionValues` 简化为 `function foo(x: string): string[]`
  - "单次执行用 function":`renderErrorDisplay` 简化为 `function foo(x: string, y: string): void {}`
  - "共享对象能力用 class":`UploadTask` 简化为最小 class 骨架
  - "轻实例也用 class":`RemoteContentClient` 简化为最小 class 骨架
  - "不用工厂函数和闭包模拟对象":`DialogController` / `createDialogController` 简化为最小骨架
  - "构造函数参数不直接声明属性":`UserProfile` 简化为最小 class 骨架
  - "catch 用 instanceof":保留 catch 块结构,`ValidationError`、`AppError` 替换为 `XxxError`
- 预计减少 100-150 行

## 代表性规则改写示例

### `implementation-rules.md` · 参数类型写实际输入

改写前(47 行):

```typescript
function parseCsvOptionValues(csvOptionValue: string): string[] {
  return Array.from(new Set(
    csvOptionValue
      .split(",")
      .map((optionItem) => optionItem.trim())
      .filter((optionItem) => optionItem.length > 0),
  ))
}
```

改写后(1 行):

```typescript
function foo(x: string): string[] { return x.split(",") }
```

### `implementation-rules.md` · 共享对象能力用 class

改写前(76 行,完整 TSDoc + 4 个方法,以下为压缩示意):

```typescript
class UploadTask {
  private filePath: string
  public constructor(filePath: string) { this.filePath = filePath }
  public start(): void {}
  public updateFilePath(nextFilePath: string): void { this.filePath = nextFilePath }
  public getFilePath(): string { return this.filePath }
}
```

改写后(5 行,最小 class):

```typescript
class Xxx {
  private foo: string
  public constructor(foo: string) { this.foo = foo }
  public bar(): string { return this.foo }
}
```

### `comment-rules.md` · 有参数时写 @param

改写前(7 行,带完整 TSDoc):

```typescript
/**
 * 根据用户资料生成用于界面展示的名称。
 *
 * @param userInfo 用户信息。
 */
function getUserDisplayName(userInfo: IUserInfo): string {
  return userInfo.name
}
```

改写后(1 行,无注释,看函数体是否保留即可):

```typescript
function foo(x: T): T { return x }
```

### `naming-rules.md` · 变量默认使用小驼峰

改写前(10 行,3 个真实业务变量):

```typescript
const currentUserName = "Alice"
const isDialogVisible = true

const requestConfig = {
  timeoutMs: 3000,
}
```

改写后(2 行,占位符):

```typescript
const foo = 1
const isFoo = true
```

## 执行顺序

按文件改动量从大到小,便于优先处理最复杂的:

1. `implementation-rules.md` — 改动最大,先动
2. `comment-rules.md` — 次之
3. `naming-rules.md` — 中等
4. `statement-rules.md` — 较小
5. `type-rules.md` — 最小

## 改造步骤(每个文件)

1. 列出当前文件所有"推荐写法 / 不推荐写法"代码块
2. 对每个代码块,按占位符表把业务名替换为 `foo` / `bar` / `Xxx` 等
3. 删掉代码块内所有 JSDoc / TSDoc / 单行注释
4. 合并多组示例(同规则内)为单个推荐 + 单个不推荐
5. 控制每块 ≤ 8 行,大多数 3-5 行
6. 保留规则标题、章节结构、规则正文(`>` 引用块)不动

## 验收标准

- 5 个文件总行数下降 30%-50%
- 所有"推荐写法"和"不推荐写法"代码块无 JSDoc 注释
- 命名统一为 `foo` / `bar` / `Xxx` / `IXxx` / `T` 占位符
- 每条规则标题、规则正文与改写后的示例传达的含义一致
- 文件顶部章节结构、引用块完全不变

## 复检机制

- 改造后用 `git diff` 比对,逐条规则人工 review
- 对照原始 commit 验证没有丢规则、没有改错规则正文
- 不依赖任何自动化测试(纯文档改造)
