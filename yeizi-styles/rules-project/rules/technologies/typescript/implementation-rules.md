# TypeScript 实现规则

## 函数实现规则

### 参数类型写实际输入

> 参数类型直接写这个函数实际会接收什么输入。参数本来必须传入时，不写成可选参数；调用方本来不该传入的值，也不为了兼容旧写法随意放宽类型。
>
> 参数类型已经明确接受某类输入时，调用方直接按该类型传入，不在外层重复补同类判断、默认值或兜底分支。

推荐写法
```typescript
function foo(x: string): string[] { return x.split(",") }
```

不推荐写法
```typescript
function foo(x?: string): string[] { return x ? x.split(",") : [] }
```

### 函数拆分只在复用或分步时进行

> 拆分函数只为两个目的服务：复用，或让主线按步骤展开。
>
> 满足以下任一情况时拆分：
> - 同一段逻辑被多个调用点复用。
> - 当前函数已经同时处理多个独立步骤，拆开后主线能按步骤顺着读完。
>
> 以下情况不拆分：
> - 这段逻辑只在当前函数里使用一次，直接写在主线上更清楚。
> - 提取后只是把一两步短逻辑换个名字包起来，没有形成独立步骤。
> - 拆出来只是为了预留未来复用、为了可测试，或把每一步都拆成碎片函数。

推荐写法
```typescript
function foo(x: string, y: number): number { return bar(x) + y }
function bar(x: string): number { return Number(x) }
```

不推荐写法
```typescript
function foo(x: string, y: number): number {
  const z = Number(x)
  return z + y
}
```

### 单个导出函数的辅助逻辑就近定义

> 只服务单个导出函数的辅助逻辑、辅助常量、分发表和策略对象，优先定义在该函数内部。只有被多个导出函数复用，或者初始化成本明显较高时，才提升为模块级私有定义，更不对外导出。

推荐写法
```typescript
function foo(x: string): string {
  const m: Record<string, string> = { a: "1" }
  return m[x] ?? x
}
```

不推荐写法
```typescript
const m: Record<string, string> = { a: "1" }
function foo(x: string): string { return m[x] ?? x }
```

## class 和 function 使用规则

### 单次执行用 `function`

> 一次调用完成、按输入直接得到结果或产生预期副作用的逻辑，使用 `function`。为了让主线按步骤展开而在函数体内定义局部辅助函数，不因此改成 `class`。

推荐写法
```typescript
function foo(x: string, y: string): void {}
```

不推荐写法
```typescript
class Xxx {
  public foo(x: string, y: string): void {}
}
```

### 共享对象能力用 `class`

> 对外需要围绕同一职责暴露多个方法，或多个方法需要依赖同一份实例持有的数据、配置或依赖时，使用 `class`。

推荐写法
```typescript
class Xxx {
  private foo: string
  public constructor(foo: string) { this.foo = foo }
  public bar(): string { return this.foo }
}
```

不推荐写法
```typescript
const foo = { bar: 1 }
function baz(): number { return foo.bar }
```

### 轻实例也用 `class`

> 即使构造时没有业务数据，只要同一个类统一封装超时、缓存、客户端、重试策略或鉴权配置，并被多个方法共同使用，仍然使用 `class`。

推荐写法
```typescript
class Xxx {
  private static readonly FOO = 1
  public bar(): number { return Xxx.FOO }
}
```

不推荐写法
```typescript
const FOO = 1
function bar(): number { return FOO }
```

### 不用工厂函数和闭包模拟对象

> 不使用工厂函数和闭包模拟对象方法、共享成员或私有状态；如需返回带方法的对象，改用 `class`。

推荐写法
```typescript
class Xxx {
  private foo: boolean
  public constructor() { this.foo = false }
  public bar(): boolean { return this.foo }
}
```

不推荐写法
```typescript
function createXxx() {
  let foo = false
  return { bar: () => foo }
}
```

## 类实现规则

### 构造函数参数不直接声明属性

> 类属性单独在类中声明，不在 `constructor` 参数中通过 `public`、`private`、`protected` 直接声明。构造函数只负责接收参数和显式赋值，保持类结构清晰。

推荐写法
```typescript
class Xxx {
  public foo: string
  public constructor(foo: string) { this.foo = foo }
}
```

不推荐写法
```typescript
class Xxx {
  public constructor(public foo: string) {}
}
```

## 错误实现规则

### 抛错只用 `Error` 或其子类实例

> 需要抛错时，只使用 `Error` 或继承 `Error` 的错误实例，不抛字符串，也不抛临时对象。

推荐写法
```typescript
throw new XxxError("foo")
```

不推荐写法
```typescript
throw "foo"
```

### `catch` 里用 `instanceof` 收窄错误类型

> `catch (error)` 收到的 `error` 默认是 `unknown`。判断错误类型时统一使用 `instanceof`，并按从具体错误类型到通用 `Error` 的顺序判断。不把 `unknown` 直接断成业务错误类型，也不额外封装只做名称比较的错误类型守卫。

推荐写法
```typescript
} catch (e) {
  if (e instanceof XxxError) { return e.code }
  if (e instanceof Error) { return 1 }
}
```

不推荐写法
```typescript
} catch (e) {
  return (e as XxxError).code
}
```
