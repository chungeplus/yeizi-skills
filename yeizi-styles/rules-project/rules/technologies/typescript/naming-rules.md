# TypeScript 命名规则

## 变量命名规则

### 变量默认使用小驼峰命名法

> 除固定单值常量和对象式枚举主体外，变量统一使用小驼峰命名法。

推荐写法
```typescript
const foo = 1
const isFoo = true
```

不推荐写法
```typescript
const Foo = 1
const is_foo = true
```

### 布尔变量命名使用逻辑判断词

> 布尔变量命名使用 `is`、`has`、`can` 这类逻辑判断词，让人一眼看出“是否”“有没有”“能不能”。
>
> 本规则只适用于变量名，不适用于函数名和方法名。函数和方法即使返回 `boolean`，也按函数命名规则处理；读取已有状态时使用 `getXxx`。

- `is`：表示是否处于某种状态。
- `has`：表示是否拥有或包含某个内容。
- `can`：表示是否能够执行某个动作。

推荐写法
```typescript
const isFoo = true
const hasBar = false
const canBaz = true
```

不推荐写法
```typescript
const foo = true
const barStatus = false
const bazAble = true
```

## 常量命名规则

### 固定单值常量用大写下划线

> 名称表示单个固定取值时，使用大写下划线命名法。

推荐写法
```typescript
const MAX_FOO = 3
const DEFAULT_BAR = 1
```

不推荐写法
```typescript
const maxFoo = 3
const defaultBar = 1
```

## 函数命名规则

### 函数、方法名用小驼峰

> 函数名和方法名统一使用小驼峰命名法。

推荐写法
```typescript
function foo(): string { return "" }

class Xxx {
  public bar(): void {}
}
```

不推荐写法
```typescript
function Foo(): string { return "" }

class Xxx {
  public Bar(): void {}
}
```

### 函数、方法名写成动作加对象/结果

> 函数名先表达它做什么，再表达它处理的对象或得到的结果，不使用含义模糊的泛化动词。

推荐写法
```typescript
function getFoo(): string { return "" }
function buildBar(): T { return 1 as T }
```

不推荐写法
```typescript
function foo(): string { return "" }
function bar(): T { return 1 as T }
```

### 流程入口使用 `run`

> 启动并串起整段流程的入口函数，使用 `runXxx` 命名。

推荐写法
```typescript
async function runFoo(): Promise<void> {}
function runBar(): void {}
```

不推荐写法
```typescript
async function startFoo(): Promise<void> {}
function startBar(): void {}
```

### 普通函数不使用 `run`

> 普通数据处理、构建、解析、加载、渲染和校验函数不使用 `runXxx`。已经有更准确的现成动词时，直接使用对应动词。

推荐写法
```typescript
async function loadFoo(): Promise<string> { return "" }
function buildBar(): T { return 1 as T }
```

不推荐写法
```typescript
async function runFoo(): Promise<string> { return "" }
function runBar(): T { return 1 as T }
```

### 已有值用 `get`，外部内容用 `load`

> 读取当前已经有的值、状态或同步算出来的结果时，使用 `getXxx`。读取文件、请求接口或加载其他外部内容时，使用 `loadXxx`。

推荐写法
```typescript
function getFoo(): string { return "" }
async function loadBar(): Promise<T> { return 1 as T }
```

不推荐写法
```typescript
function loadFoo(): string { return "" }
async function getBar(): Promise<T> { return 1 as T }
```

### 单个值用 `set`，已有内容用 `update`

> 直接设置单个值、状态或配置时，使用 `setXxx`。修改已有对象、已有记录或已有状态时，使用 `updateXxx`。

推荐写法
```typescript
function setFoo(x: T): void {}
function updateBar(x: T): void {}
```

不推荐写法
```typescript
function updateFoo(x: T): void {}
function setBar(x: T): void {}
```

### 创建用 `create`，组装用 `build`

> 创建并返回新对象、新实例或新上下文时，使用 `createXxx`。根据已有输入组装结果、参数、配置或结构时，使用 `buildXxx`。

推荐写法
```typescript
function createFoo(): T { return {} as T }
function buildBar(x: T): T { return x }
```

不推荐写法
```typescript
function buildFoo(): T { return {} as T }
function createBar(x: T): T { return x }
```

### 解析用 `parse`，整理用 `format`

> 把原始内容变成能直接用的数据时，使用 `parseXxx`。把已有数据整理成更适合输出的样子时，使用 `formatXxx`。

推荐写法
```typescript
function parseFoo(x: string): T { return JSON.parse(x) }
function formatBar(x: number): string { return `${x}` }
```

不推荐写法
```typescript
function formatFoo(x: string): T { return JSON.parse(x) }
function parseBar(x: number): string { return `${x}` }
```

### 生成展示内容使用 render

> 生成界面内容、展示片段或可直接用于渲染的输出时，使用 `renderXxx`。

推荐写法
```typescript
function renderFoo(): string { return "" }
```

不推荐写法
```typescript
function buildFoo(): string { return "" }
```

### 新增用 `add`，移除用 `remove`

> 向已有集合、列表、映射或关系中新增成员时，使用 `addXxx`。从已有集合、列表、映射或关系中移除成员时，使用 `removeXxx`。

推荐写法
```typescript
function addFoo(x: T): void {}
function removeBar(x: T): void {}
```

不推荐写法
```typescript
function createFoo(x: T): void {}
function deleteBar(x: T): void {}
```

### 清空已有内容使用 `clear`

> 清空已有集合、列表、状态或缓存时，使用 `clearXxx`。

推荐写法
```typescript
function clearFoo(): void {}
```

不推荐写法
```typescript
function resetFoo(): void {}
```

### 恢复初始值使用 `reset`

> 恢复初始值、初始状态或默认配置时，使用 `resetXxx`。

推荐写法
```typescript
function resetFoo(): void {}
```

不推荐写法
```typescript
function clearFoo(): void {}
```

### 初始化既有实例使用 `init`

> 初始化已经存在的实例、状态或上下文时，使用 `initXxx`，不用于新建并返回实例。

推荐写法
```typescript
function initFoo(x: T): void {}
```

不推荐写法
```typescript
function createFoo(x: T): void {}
```

### 绑定用 `bind`，解绑用 `unbind`

> 用于绑定事件、注册监听或挂载交互行为时，使用 `bindXxx`。用于解绑事件、移除监听或销毁交互行为时，使用 `unbindXxx`。

推荐写法
```typescript
function bindFoo(): void {}
function unbindBar(): void {}
```

不推荐写法
```typescript
function handleFoo(): void {}
function removeBar(): void {}
```

### 事件处理用 handle

> 用于事件触发后执行具体处理逻辑时，统一使用 `handleXxx`。

推荐写法
```typescript
function handleFoo(): void {}
```

不推荐写法
```typescript
function foo(): void {}
```

### 校验函数、方法使用 validate

> 用于按规则校验输入、数据、参数或条件时，使用 `validateXxx`。

推荐写法
```typescript
function validateFoo(x: T): boolean { return true }
```

不推荐写法
```typescript
function isFoo(x: T): boolean { return true }
```

## 类命名规则

### 类名用大驼峰

> 类名统一使用大驼峰命名法。

推荐写法
```typescript
class Xxx {}
```

不推荐写法
```typescript
class xxx {}
```

## 接口命名规则

### 接口名使用 `I` 开头的大驼峰命名法

> 接口名统一使用 `I` 开头，再接大驼峰名称。

推荐写法
```typescript
interface IXxx {
  foo: string
}
```

不推荐写法
```typescript
interface Xxx {
  foo: string
}
```

## 类型命名规则

### 类型名用大驼峰

> 类型名统一使用大驼峰命名法。

推荐写法
```typescript
type Foo = "a" | "b"
```

不推荐写法
```typescript
type foo = "a" | "b"
```


## 枚举命名规则

### 对象式枚举主体用大驼峰

> 对象式枚举主体使用大驼峰命名法。

推荐写法
```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

不推荐写法
```typescript
const XXX_FOO = { FOO: "foo" } as const
type Xxx = typeof XXX_FOO[keyof typeof XXX_FOO]
```

### 对象式枚举成员用大写下划线

> 对象式枚举成员使用大写下划线命名法。

推荐写法
```typescript
const Xxx = { FOO_BAR: "foo_bar" } as const
```

不推荐写法
```typescript
const Xxx = { FooBar: "foo_bar" } as const
```

### 对象式枚举主体和联合类型同名

> 对象式枚举主体名称和对应联合类型名称保持一致。

推荐写法
```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
```

不推荐写法
```typescript
const Xxx = { FOO: "foo" } as const
type XxxType = typeof Xxx[keyof typeof Xxx]
```

