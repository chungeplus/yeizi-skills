# TypeScript 实现规则

## 函数实现规则

### 参数类型写实际输入

> 参数类型直接写这个函数实际会接收什么输入。参数本来必须传入时，不写成可选参数；调用方本来不该传入的值，也不为了兼容旧写法随意放宽类型。

推荐写法
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

不推荐写法
```typescript
function parseCsvOptionValues(csvOptionValue?: string): string[] {
  if (csvOptionValue === undefined) {
    return []
  }

  return Array.from(new Set(
    csvOptionValue
      .split(",")
      .map((optionItem) => optionItem.trim())
      .filter((optionItem) => optionItem.length > 0),
  ))
}
```

## class 和 function 使用规则

### 单次处理用 function

> 一次调用做完就结束的逻辑，使用 function。需要把数据、配置或依赖和多个方法放在一起时，使用 class。

推荐写法
```typescript
function parseCsvOptionValues(csvOptionValue: string): string[] {
  return csvOptionValue
    .split(",")
    .map((optionItem) => optionItem.trim())
    .filter((optionItem) => optionItem.length > 0)
}

class UploadTask {
  public filePath: string

  public constructor(filePath: string) {
    this.filePath = filePath
  }

  public start(): void {}

  public cancel(): void {}
}
```

不推荐写法
```typescript
function createUploadTask(filePath: string) {
  let currentFilePath = filePath

  function start(): void {}

  function cancel(): void {}

  return {
    currentFilePath,
    start,
    cancel,
  }
}
```

## 类实现规则

### 构造函数参数不直接声明属性

> 类属性单独在类中声明，不在 `constructor` 参数中通过 `public`、`private`、`protected` 直接声明。构造函数只负责接收参数和显式赋值，保持类结构清晰。

推荐写法
```typescript
export class UserProfile {
  public name: string

  public constructor(
    name: string,
  ) {
    this.name = name
  }
}
```

不推荐写法
```typescript
export class UserProfile {
  public constructor(
    public name: string,
  ) {
  }
}
```

## 错误实现规则

### 抛错只用 `Error` 或其子类实例

> 需要抛错时，只使用 `Error` 或继承 `Error` 的错误实例，不抛字符串，也不抛临时对象。

推荐写法
```typescript
throw new Error("平台选项不能为空。")
```

不推荐写法
```typescript
throw "平台选项不能为空。"
```

### `catch` 里用类型守卫、`as` 只补明确类型

> `catch (error)` 收到的 `error` 默认是 `unknown`。先用 `instanceof`、自定义类型谓词或 `typeof` 把它收窄到 `Error` 或业务错误类；只有在已经做过运行时检查、TypeScript 还推不出目标业务类型时，才补一道 `as`。不把 `unknown` 直接断成业务类型。

推荐写法
```typescript
} catch (error) {
  if (error instanceof AppError) {
    return error.code
  }
  throw error
}

function hasAppErrorShape(error: Error): error is Error & { name: "AppError"; code: string } {
  return error.name === "AppError" && "code" in error && typeof error.code === "string"
}

} catch (error) {
  if (error instanceof Error && hasAppErrorShape(error)) {
    const appError = error as AppError
    return appError.code
  }
  throw error
}
```

不推荐写法
```typescript
} catch (error) {
  return (error as AppError).code
}
```
