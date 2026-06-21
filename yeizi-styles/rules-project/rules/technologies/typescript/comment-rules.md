# TypeScript 注释规则

## 多行注释

### 注释使用 TSDoc 规范

> TypeScript 注释统一使用 TSDoc 规范。文档注释结构和 `@param`、`@returns`、`@throws`、`@example` 等标签写法遵守 TSDoc，再按本文件补充项目约束。

推荐写法
```typescript
function foo(): void {}
```

不推荐写法
```typescript
function foo(): void {}
```

### 注释正文只描述调用方契约

> 注释正文只写调用方看得见的契约。先写用途；需要补充时，只写调用方可依赖的结果、输入约束、抛错条件和错误码。
>
> 不写分支、回退、特例处理、`cause` 挂载方式和状态转移等实现细节。只有实现方式本身属于对外契约时，才写结果本身，例如“会原地修改入参数组”。
>
> `@param`、`@returns`、`@throws`、`@example` 等 TSDoc 标签内容按 TSDoc 惯例保留技术表达。

推荐写法
```typescript
function foo(): never { throw new XxxError("foo") }
```

不推荐写法
```typescript
function foo(): never { throw new XxxError("foo") }
```

### 同一块内容不写空行

> 同一块内容内部不写空行。描述句之间不写空行，连续 `@param`、连续 `@returns`、同一个 `@example` 里的连续示例之间也不写空行。按 TSDoc 规范切换到新的块内容时，在块与块之间保留一行空行。

推荐写法
```typescript
/**
 * foo
 * bar
 */
function foo(): void {}
```

不推荐写法
```typescript
/**
 * foo
 *
 * bar
 */
function foo(): void {}
```

### `@example` 内容写在 `@example` 标签下一行

> `@example` 的代码示例写在 `@example` 标签下一行，不写在同一行尾。

推荐写法
```typescript
/**
 * @example
 * foo()
 */
function foo(): void {}
```

不推荐写法
```typescript
/**
 * @example foo()
 */
function foo(): void {}
```

### 注释里的示例代码遵守所有代码规则

> `@example`、`@throws` 等注释里的代码示例，同样遵守当前项目和 TypeScript 的所有代码规则，不因为它们只出现在注释里就放宽。

推荐写法
```typescript
function foo(): void {}
```

不推荐写法
```typescript
function foo (): void {}
```

### 有参数时写 `@param`

> 函数和方法有参数时写 `@param`。

推荐写法
```typescript
function foo(x: T): T { return x }
```

不推荐写法
```typescript
function foo(x: T): T { return x }
```

### 有返回值时写 `@returns`

> 函数和方法有返回值时写 `@returns`。

推荐写法
```typescript
function foo(): T { return 1 }
```

不推荐写法
```typescript
function foo(): T { return 1 }
```

### 会抛错时写 `@throws`

> 函数和方法会主动抛出错误时，写 `@throws`。调用方需要提前知道这里会抛错时，也写 `@throws`。

推荐写法
```typescript
function foo(): void { throw new XxxError("foo") }
```

不推荐写法
```typescript
function foo(): void { throw new XxxError("foo") }
```

### 可复用函数和方法写 `@example`

> 不是所有函数和方法都写 `@example`。只有可复用函数和方法写 `@example`，并且至少写一个。业务复杂、参数多样性大或需要覆盖不同调用结果时，写多个 `@example`。入口流程函数、只服务当前文件的函数，以及没有参数也没有返回值的流程函数不写 `@example`。

推荐写法
```typescript
function foo(x: string): T { return JSON.parse(x) }
function bar(): void {}
```

不推荐写法
```typescript
function foo(x: string): T { return JSON.parse(x) }
function bar(): void {}
```

### 不使用单行 `/** 内容 */`

> 多行注释写成独立的 `/** */` 结构。

推荐写法
```typescript
/**
 * foo
 */
function foo(): string { return "foo" }
```

不推荐写法
```typescript
/** foo */
function foo(): string { return "foo" }
```

### 顶层定义和方法统一使用 `/** */`

> 顶层的类型、常量、配置、函数、类，以及类中的方法统一使用 `/** */`。

推荐写法
```typescript
function foo(): void {}

class Xxx {
  public bar(): void {}
}
```

不推荐写法
```typescript
function foo(): void {}

class Xxx {
  public bar(): void {}
}
```

### 字段统一使用 `/** */`

> 接口字段、类型字面量字段和类字段统一使用 `/** */`。

推荐写法
```typescript
interface IXxx {
  /**
   * foo
   */
  foo: string
}
```

不推荐写法
```typescript
interface IXxx {
  foo: string
}
```

### 字段注释直接写用途和约束

> 字段注释直接写用途、约束、取值语义或调用方需要知道的影响，不写只把字段名或类型名换个说法的空注释。

推荐写法
```typescript
interface IXxx {
  /**
   * 超时时间，毫秒；0 表示不超时。
   */
  foo: number
}
```

不推荐写法
```typescript
interface IXxx {
  /**
   * foo
   */
  foo: number
}
```

## 单行注释

### 函数体和方法体内部说明使用单行注释

> 函数体、方法体和流程片段内部，需要补充原因、顺序、前提或影响时，使用单行注释。

推荐写法
```typescript
function foo(list: T[]): void {
  // 保留顺序
  list.forEach((x) => x)
}
```

不推荐写法
```typescript
function foo(list: T[]): void {
  /**
   * 保留顺序
   */
  list.forEach((x) => x)
}
```
