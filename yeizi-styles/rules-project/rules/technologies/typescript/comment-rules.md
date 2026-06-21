# TypeScript 注释规则

## TSDoc 注释

### 注释使用 TSDoc 规范

> TypeScript 注释统一使用 TSDoc 规范。文档注释结构和 `@param`、`@returns`、`@throws`、`@example` 等标签写法遵守 TSDoc，再按本文件补充项目约束。

推荐写法
```typescript
/**
 * 描述 Xxx。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

不推荐写法
```typescript
// 描述 Xxx
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

### 有参数时写 `@param`

> 函数和方法有参数时写 `@param`。

推荐写法
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

不推荐写法
```typescript
/**
 * 描述 Xxx。
 */
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

### 有返回值时写 `@returns`

> 函数和方法有返回值时写 `@returns`。

推荐写法
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

不推荐写法
```typescript
/**
 * 描述 Xxx。
 */
function getValue(): string {
  return ""
}
```

### 会抛错时写 `@throws`

> 函数和方法会主动抛出错误时，写 `@throws`。调用方需要提前知道这里会抛错时，也写 `@throws`。

推荐写法
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

不推荐写法
```typescript
/**
 * 描述 Xxx。
 */
function loadValue(): string {
  throw new ParseError("输入为空")
}
```

### 可复用函数和方法写 `@example`

> 不是所有函数和方法都写 `@example`。只有可复用函数和方法写 `@example`，并且至少写一个。业务复杂、参数多样性大或需要覆盖不同调用结果时，写多个 `@example`。入口流程函数、只服务当前文件的函数，以及没有参数也没有返回值的流程函数不写 `@example`。

推荐写法
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

不推荐写法
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

### 同一块内容不写空行

> 同一块内容内部不写空行。描述句之间不写空行，连续 `@param`、连续 `@returns`、连续 `@throws`、同一个 `@example` 里的连续示例之间也不写空行。切换到新的块内容时，在块与块之间保留一行空行。

推荐写法
```typescript
/**
 * 解析平台选项值。
 *
 * @param platformOptionValue 平台选项值。
 * @returns 平台名列表。
 * @throws 平台选项值格式错误时抛出错误。
 *
 * @example
 * parsePlatforms("codex")
 * parsePlatforms("codex,claude")
 */
function parsePlatforms(platformOptionValue: string): string[] {
  return platformOptionValue.split(",")
}
```

不推荐写法
```typescript
/**
 * 解析平台选项值。
 *
 * @param platformOptionValue 平台选项值。
 *
 * @returns 平台名列表。
 * @throws 平台选项值格式错误时抛出错误。
 *
 * @example
 * parsePlatforms("codex")
 *
 * parsePlatforms("codex,claude")
 */
function parsePlatforms(platformOptionValue: string): string[] {
  return platformOptionValue.split(",")
}
```

### `@example` 内容写在 `@example` 标签下一行

> `@example` 的代码示例写在 `@example` 标签下一行，不写在同一行尾。

推荐写法
```typescript
/**
 * 解析平台选项值。
 *
 * @example
 * parsePlatforms("codex,claude") => ["codex", "claude"]
 */
function parsePlatforms(platformOptionValue: string): string[] {
  return platformOptionValue.split(",")
}
```

不推荐写法
```typescript
/**
 * 解析平台选项值。
 *
 * @example parsePlatforms("codex,claude") => ["codex", "claude"]
 */
function parsePlatforms(platformOptionValue: string): string[] {
  return platformOptionValue.split(",")
}
```

## 多行注释

### 不使用单行 `/** 内容 */`

> 多行注释写成独立的 `/** */` 结构。

推荐写法
```typescript
/**
 * 描述 Xxx。
 */
function getValue(): string {
  return ""
}
```

不推荐写法
```typescript
/** 描述 Xxx。 */
function getValue(): string {
  return ""
}
```

### 类型、常量、配置、函数、类、方法使用 `/** */`

> 类型、常量、配置、函数、类、方法统一使用 `/** */`。接口字段、对象成员和类字段需要说明语义时，也使用 `/** */`。

推荐写法
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

不推荐写法
```typescript
function runCli(): void {}

class InstallCommand {
  public execute(): void {}
}
```

## 单行注释

### 函数体和方法体内部说明使用单行注释

> 函数体、方法体和流程片段内部，需要补充原因、顺序、前提或影响时，使用单行注释。

推荐写法
```typescript
function processItems(items: IConfig[]): void {
  // 保留原始顺序
  items.forEach((item) => {
    console.log(item.name)
  })
}
```

不推荐写法
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
