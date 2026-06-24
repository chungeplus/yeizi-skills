# TypeScript 语句规则

## 声明与赋值语句规则

### 变量定义按是否重赋值区分 `const` 和 `let`

> 不使用 `var`。不会被重新赋值的绑定使用 `const`，会被重新赋值的变量使用 `let`。

推荐写法
```typescript
const userName = "Alice"

let retryCount = 0
retryCount += 1
```

不推荐写法
```typescript
let userName = "Alice"

var retryCount = 0
```

## 模块规则

### 模块导出统一写在文件底部

> 模块里需要对外导出的类型、常量、配置、函数、类和错误定义，先写声明或定义，再在文件底部统一导出。不在声明时直接写 `export`。

推荐写法
```typescript
const ErrorCode = {
  CONFIG_MISSING: "CONFIG_MISSING",
  UNKNOWN: "UNKNOWN",
} as const

type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

interface Config {
  value: string
}

function parseConfig(content: string): Config {
  return { value: content }
}

export { ErrorCode, parseConfig }
export type { ErrorCode, Config }
```

不推荐写法
```typescript
export const ErrorCode = {
  CONFIG_MISSING: "CONFIG_MISSING",
  UNKNOWN: "UNKNOWN",
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

export interface Config {
  value: string
}

export function parseConfig(content: string): Config {
  return { value: content }
}
```

### 目录门面文件职责

> 目录的门面文件严格限定为"桶导出"角色：仅允许 `export *` / `export { ... }` / `export type { ... }` 语句。

推荐写法
```typescript
export * from "./parser"
```

不推荐写法
```typescript
import type { Config } from "./types"
import { Parser } from "./parser"
import { Formatter } from "./formatter"
import { Validator } from "./validator"

function registerFeatures(config: Config): void {
  new Parser().register(config)
  new Formatter().register(config)
  new Validator().register(config)
}

export { registerFeatures }
```

## 条件语句规则

### 判断不写 `=== true/false`

> 条件判断直接使用已有的布尔值，不重复写成 `=== true` 或 `=== false`。

推荐写法
```typescript
if (isReady) {
  startTask()
}

if (!isEnabled) {
  return
}
```

不推荐写法
```typescript
if (isReady === true) {
  startTask()
}

if (isEnabled === false) {
  return
}
```

### 禁止使用三目运算符

> 条件分支统一使用 `if` 处理，避免三目运算符带来的长行、嵌套和可读性下降问题。

推荐写法
```typescript
if (isEnabled) {
  return "enabled"
}

return "disabled"
```

不推荐写法
```typescript
return isEnabled ? "enabled" : "disabled"
```

### 禁用 `switch`

> 多分支判断统一不使用 `switch`。

推荐写法
```typescript
if (status === "ready") {
  return "ready"
}

if (status === "uploading") {
  return "uploading"
}

return "finished"
```

不推荐写法
```typescript
switch (status) {
  case "ready":
    return "ready"
  case "uploading":
    return "uploading"
  default:
    return "finished"
}
```

## 循环语句规则

### 禁用关键字循环

> 项目中的循环统一不使用 `for...in`、`for...of`、`for`、`while`、`do...while`。遍历、筛选、查找、转换和聚合统一使用数组循环方法。这是项目代码风格约束，不因局部场景顺手改回关键字循环。

推荐写法
```typescript
const enabledItemList = itemList.filter((item) => item.isEnabled)

const itemNameList = itemList.map((item) => item.name)

const hasAdminItem = itemList.some((item) => item.role === "admin")
```

不推荐写法
```typescript
for (const item of itemList) {
  console.log(item.name)
}

for (let index = 0; index < itemList.length; index += 1) {
  console.log(itemList[index].name)
}
```

### 其他可遍历内容先转数组再处理

> 普通对象和其他可遍历内容先转成数组，再按数组循环方法处理。普通对象使用 `Object.keys()`、`Object.values()`、`Object.entries()` 取出数组结果。`Map`、`Set`、`String` 等其他可遍历内容使用 `Array.from()` 转成数组。

推荐写法
```typescript
const enabledNameList = Object.values(itemMap)
  .filter((item) => item.isEnabled)
  .map((item) => item.name)

const enabledRoleEntryList = Object.entries(roleMap)
  .filter(([, roleName]) => roleName.length > 0)

const roleNameList = Array.from(roleSet)
  .map((roleName) => roleName.trim())
  .filter((roleName) => roleName.length > 0)

const letterList = Array.from(nameText)
  .filter((letter) => letter !== " ")
```

不推荐写法
```typescript
for (const itemId in itemMap) {
  if (itemMap[itemId].isEnabled) {
    console.log(itemMap[itemId].name)
  }
}

for (const roleName of roleSet) {
  console.log(roleName)
}
```

