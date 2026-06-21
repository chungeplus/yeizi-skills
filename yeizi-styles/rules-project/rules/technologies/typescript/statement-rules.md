# TypeScript 语句规则

## 声明与赋值语句规则

### 变量定义按是否重赋值区分 `const` 和 `let`

> 不使用 `var`。不会被重新赋值的绑定使用 `const`，会被重新赋值的变量使用 `let`。

推荐写法
```typescript
const foo = 1
let bar = 0
bar += 1
```

不推荐写法
```typescript
let foo = 1
var bar = 0
```

## 模块规则

### 模块导出统一写在文件底部

> 模块里需要对外导出的类型、常量、配置、函数、类和错误定义，先写声明或定义，再在文件底部统一导出。不在声明时直接写 `export`。

推荐写法
```typescript
const Xxx = { FOO: "foo" } as const
type Xxx = typeof Xxx[keyof typeof Xxx]
interface IXxx { foo: string }
function bar(x: string): IXxx { return { foo: x } }

export { Xxx, bar }
export type { Xxx, IXxx }
```

不推荐写法
```typescript
export const Xxx = { FOO: "foo" } as const
export type Xxx = typeof Xxx[keyof typeof Xxx]
export interface IXxx { foo: string }
export function bar(x: string): IXxx { return { foo: x } }
```

## 条件语句规则

### 判断不写 `=== true/false`

> 条件判断直接使用已有的布尔值，不重复写成 `=== true` 或 `=== false`。

推荐写法
```typescript
if (isFoo) { bar() }
if (!isFoo) { return }
```

不推荐写法
```typescript
if (isFoo === true) { bar() }
if (isFoo === false) { return }
```

### 禁止使用三目运算符

> 条件分支统一使用 `if` 处理，避免三目运算符带来的长行、嵌套和可读性下降问题。

推荐写法
```typescript
if (isFoo) { return "a" }
return "b"
```

不推荐写法
```typescript
return isFoo ? "a" : "b"
```

### 禁用 `switch`

> 多分支判断统一不使用 `switch`。

推荐写法
```typescript
if (status === "a") { return 1 }
if (status === "b") { return 2 }
return 0
```

不推荐写法
```typescript
switch (status) {
  case "a": return 1
  case "b": return 2
  default: return 0
}
```

## 循环语句规则

### 禁用关键字循环

> 项目中的循环统一不使用 `for...in`、`for...of`、`for`、`while`、`do...while`。遍历、筛选、查找、转换和聚合统一使用数组循环方法。这是项目代码风格约束，不因局部场景顺手改回关键字循环。

推荐写法
```typescript
const foo = list.filter((x) => x.isFoo)
const bar = list.map((x) => x.foo)
const baz = list.some((x) => x.isFoo)
```

不推荐写法
```typescript
for (const x of list) { console.log(x.foo) }
for (let i = 0; i < list.length; i += 1) { console.log(list[i].foo) }
```

### 其他可遍历内容先转数组再处理

> 普通对象和其他可遍历内容先转成数组，再按数组循环方法处理。普通对象使用 `Object.keys()`、`Object.values()`、`Object.entries()` 取出数组结果。`Map`、`Set`、`String` 等其他可遍历内容使用 `Array.from()` 转成数组。

推荐写法
```typescript
const foo = Object.values(map)
  .filter((x) => x.isFoo)
  .map((x) => x.foo)
const bar = Array.from(set).map((x) => x.foo)
```

不推荐写法
```typescript
for (const k in map) {
  if (map[k].isFoo) { console.log(map[k].foo) }
}
for (const x of set) { console.log(x) }
```

