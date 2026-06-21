# TypeScript 类型规则

## 枚举类型规则

### 枚举值用 `const` 对象和联合类型

> 对象键用于代码里的成员名，对象值用于真实取值，不使用 `enum`。

推荐写法
```typescript
const Xxx = { FOO: "foo", BAR: "bar" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

不推荐写法
```typescript
enum Xxx { FOO = "foo", BAR = "bar" }
```

## 类型定义规则

### 对象类型使用 `interface`

> 表示对象有哪些字段，或这组字段后面还会继续扩展时，使用 `interface`。

推荐写法
```typescript
interface IXxx {
  foo: string
}

interface IBar {
  baz: number
}
```

不推荐写法
```typescript
type Xxx = {
  foo: string
}

type Bar = {
  baz: number
}
```

### 组合和派生类型使用 `type`

> 表达联合类型、字面量类型、元组、函数类型、映射类型、条件类型和已有类型组合后的结果时，使用 `type`。

推荐写法
```typescript
type Xxx = "a" | "b"
type Bar = (x: string) => Promise<string>
type Baz = Pick<IXxx, "foo">
```

不推荐写法
```typescript
interface IXxx { value: "a" | "b" }
interface IBar { (x: string): Promise<string> }
```

## 类型使用规则

### 禁止使用 `any` 和 `unknown`

> 参数、返回值、字段和类型断言写清类型。局部变量可以交给 TypeScript 自己推出来。不使用 `any` 和 `unknown` 兜底。

推荐写法
```typescript
function foo(x: IXxx): string { return x.foo }
const bar = 0
```

不推荐写法
```typescript
function foo(x: any): string { return x.foo }
const bar: unknown = 0
```

### 类型明确时禁止额外使用泛型

> 当字段、类、函数参数或返回值已经可以直接写成明确类型时，禁止为了形式统一、预留扩展或书写习惯额外引入泛型。泛型只在需要表达多个位置之间的类型关联、根据输入推导输出类型，或复用同一套类型约束时使用。

推荐写法
```typescript
class XxxError extends Error {
  public readonly foo: string
  public constructor(foo: string) { super(foo); this.foo = foo }
}

function bar<T extends object, K extends keyof T>(x: T, y: K): T[K] { return x[y] }
```

不推荐写法
```typescript
class XxxError<TFoo extends string = string> extends Error {
  public readonly foo: TFoo
  public constructor(foo: TFoo) { super(foo); this.foo = foo }
}
```

### 只在 `as const` 场景使用 `as`

> 只在需要把字面量值固定为只读常量表达时使用 `as const`。除 `as const` 外，不使用 `as SomeType` 做类型断言。

推荐写法
```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

不推荐写法
```typescript
function foo(): void {
  const x = bar() as Xxx | null
  if (!x) { return }
  x.baz()
}
```

### 参数类型不使用只读修饰

> 参数类型不使用 `readonly` 修饰符、`ReadonlyArray<T>`、`ReadonlyMap<K, V>`、`ReadonlySet<T>` 等只读类型。
>
> 不修改入参的约束靠代码规则保证，不由类型系统兜底。字段、类属性和对象常量上的只读语义不在本条范围内。

推荐写法
```typescript
function foo(list: string[]): string { return list.join("") }
function bar(m: Map<string, string[]>, k: string): string[] | undefined { return m.get(k) }
```

不推荐写法
```typescript
function foo(list: readonly string[]): string { return list.join("") }
function bar(m: ReadonlyMap<string, readonly string[]>, k: string): readonly string[] | undefined { return m.get(k) }
```
