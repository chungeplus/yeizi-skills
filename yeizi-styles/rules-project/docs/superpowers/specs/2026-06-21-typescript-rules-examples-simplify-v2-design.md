# TypeScript 规则文件示例简化设计 v2

## 目标

把 5 个 TypeScript 规则文件里所有"推荐写法 / 不推荐写法"代码示例,改造为**遵循项目自身规则的、格式良好的通用名词占位符示例**——既不像 v1 那样用 `foo`/`Xxx` 这种违反命名规则的占位符,也不像最初那样堆 `parseCsvOptionValues`/`UploadTask` 这种业务场景内容。

## v1 vs v2 关键区别

| 维度 | v1(已合并到 main) | v2(本次) |
|---|---|---|
| 占位符 | `foo` / `Xxx` / `bar` | `Parser` / `parseValue` / `InputParser` 等通用名词 |
| 是否遵守命名规则 | 否(单字母/单词) | 是(完全遵守) |
| 格式 | 一行压缩 | 多行、antfu 风格 |
| 是否真的"看起来像好代码" | 否 | 是 |

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

## 占位符命名约定

### 通用名词词库

| 类型 | 占位符 | 用途示例 |
|---|---|---|
| 类 | `Parser` / `Formatter` / `Validator` / `Loader` / `Container` / `Handler` | 类声明 |
| 接口 | `IRequestOptions` / `IConfig` / `IRule` | 接口声明 |
| 类型 | `Value` / `Name` / `Status` / `Mode` | 类型别名 |
| 函数 | `parseValue` / `formatName` / `validateInput` / `loadConfig` / `buildRequest` / `handleEvent` | 函数声明 |
| 方法 | 同函数名,加 `public` / `private` 修饰 | 类内方法 |
| 变量 | `inputValue` / `outputName` / `rawInput` / `currentItem` / `items` | 局部或字段 |
| 常量 | `MAX_LENGTH` / `DEFAULT_TIMEOUT_MS` / `MIN_COUNT` | 固定单值常量 |
| 错误 | `ParseError` / `ValidationError` / `AppError` | 自定义错误类 |
| 枚举主体 | `ItemStatus` / `LogLevel` / `AppMode` | `as const` 对象 |
| 字符串字面量 | `"foo"` / `"bar"` / `"a"` / `"b"` | 状态/类型值 |
| 数字字面量 | `1` / `0` / `100` | 计数/默认值 |
| 泛型参数 | `T` / `TKey` / `TValue` | 类型参数 |

### 命名合法性自检

占位符在示例里出现时,必须同时满足:

- 类名:大驼峰(`naming-rules.md` "类名用大驼峰")
- 接口名:`I` + 大驼峰("接口名使用 `I` 开头的大驼峰命名法")
- 函数 / 方法名:小驼峰("函数、方法名用小驼峰")
- 变量名:小驼峰("变量默认使用小驼峰命名法")
- 常量:大写下划线("固定单值常量用大写下划线")
- 类型名:大驼峰("类型名用大驼峰")
- 错误类:`XxxError`("抛错只用 `Error` 或其子类实例")

## 格式规范(antfu 风格)

参考项目 `cli/eslint.config.ts`(`@antfu/eslint-config` + `quotes: "double"`):

- **缩进**:2 空格
- **引号**:双引号(`"`)
- **分号**:不写(`semi: false`)
- **尾逗号**:多行时保留(对象、数组、函数参数)
- **访问修饰符**:类成员显式标注 `public` / `private`
- **多行结构**:`class` / `interface` / 多语句函数体一律多行,无单行压缩

### antfu 风格示例

```typescript
function parseValue(rawInput: string): string {
  return rawInput.trim()
}

const InputParser = {
  parse: (rawInput: string) => rawInput.trim(),
} as const

class Formatter {
  private format: string

  public constructor(format: string) {
    this.format = format
  }

  public apply(): string {
    return this.format.trim()
  }
}
```

## 禁止出现在示例里

- 单行压缩代码块(`function foo() { return x }`)
- 业务场景命名(`UploadTask`、`parseCsvOptionValues`、`UserProfile`、`platformAliasMap`)
- 命名规则违反(单字母 `x` / `T` 作为变量名等)
- 未保留格式的项目原始大块代码

## 边界情况

### `comment-rules.md`(JSDoc 规则)

规则示例里可以保留 `/** */` 结构(否则没法表达"写不写 JSDoc"的对比)。但:

- JSDoc 正文用最简短的一句话(`描述 Xxx。`)
- 函数体严格遵守 antfu 格式
- 不再用 `getUserDisplayName` / `IRequestOptions` 等业务名,统一替换为通用名

### 演示 `/** */` 写法的规则

下列规则必须保留 `/** */` 示例以表达对比:

- 同一块内容不写空行
- `@example` 内容写在 `@example` 标签下一行
- 不使用单行 `/** 内容 */`
- 字段统一使用 `/** */`
- 字段注释直接写用途和约束
- 函数体内部说明使用单行注释

### `import` / `export`

- 规则与 import / export 无关时,示例不出现
- 规则就是讲 export(只有 `statement-rules.md` 里的"模块导出统一写在文件底部"),保留最简 `export { parseValue }` 占位

## 每个文件的具体改动

### `implementation-rules.md`(10 条规则)

function/class 示例按 antfu 格式完整重写;每条规则独立展示。改动量最大。

### `comment-rules.md`(14 条规则)

JSDoc / TSDoc 风格按 antfu 格式;正文最简短;函数名换通用词。

### `naming-rules.md`(25 条规则)

大多数规则已是 2-3 行;按 antfu 格式补全结构,占位符换通用名词。

### `statement-rules.md`(7 条规则)

简单,改动小。按 antfu 格式整理现有示例。

### `type-rules.md`(7 条规则)

简单,改动小。按 antfu 格式整理现有示例。

## 执行方式

### 第一步:Revert 之前的 5 个 commit

```bash
git revert -n 965d833 59ae400 d9e6908 09cac6c 38a9f3a --no-edit
git commit -m "revert: undo v1 example simplification (to redo with proper conventions)"
```

### 第二步:多智能体重做

- 派 5 个 implementer 子代理,每个负责一个文件
- 每个子代理严格按本规范生成完整 antfu 风格示例
- 每个文件 1 个 commit,共 5 个新 commit
- 每个 implementer 完成后派 reviewer 验证

### 第三步:最终全分支 review

确认所有 5 个文件示例都符合本规范。

## 验收标准

- 5 个文件中所有"推荐写法"和"不推荐写法"代码块都符合 antfu 格式
- 所有占位符都遵循项目自身的命名规则(无单字母/单词变量、无违反类名大驼峰等)
- 没有业务场景命名(`UploadTask`/`UserProfile`/`parseCsvOptionValues` 等)
- 每个文件 1 个 commit,共 5 个新 commit
- 规则的标题、章节结构、规则正文(`>` 引用块)全部不变

## 已知保留项

- v1 规范文档 (`2026-06-21-typescript-rules-examples-simplify-design.md`) 和 v1 计划文档 (`2026-06-21-typescript-rules-examples-simplify.md`) 保留在 git 历史中,记录 v1 尝试的来龙去脉
- 本规范以 v2 后缀命名,与 v1 明确区分