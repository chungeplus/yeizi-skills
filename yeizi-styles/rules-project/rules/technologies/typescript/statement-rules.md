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
const AppErrorCode = {
  PACKAGE_BIN_CONFIG_MISSING: "PACKAGE_BIN_CONFIG_MISSING",
} as const

type AppErrorCode = typeof AppErrorCode[keyof typeof AppErrorCode]

interface IUserInfo {
  id: string
  name: string
}

function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}

export { AppErrorCode, parseUserInfo }
export type { AppErrorCode, IUserInfo }
```

不推荐写法
```typescript
export const AppErrorCode = {
  PACKAGE_BIN_CONFIG_MISSING: "PACKAGE_BIN_CONFIG_MISSING",
} as const

export type AppErrorCode = typeof AppErrorCode[keyof typeof AppErrorCode]

export interface IUserInfo {
  id: string
  name: string
}

export function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}
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
if (status === UploadStatus.READY) {
  return "ready"
}

if (status === UploadStatus.UPLOADING) {
  return "uploading"
}

return "finished"
```

不推荐写法
```typescript
switch (status) {
  case UploadStatus.READY:
    return "ready"
  case UploadStatus.UPLOADING:
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
let enabledUserList = userList.filter((userInfo) => userInfo.isEnabled)

let userNameList = userList.map((userInfo) => userInfo.name)

let hasAdminUser = userList.some((userInfo) => userInfo.role === "admin")
```

不推荐写法
```typescript
for (let userInfo of userList) {
  console.log(userInfo.name)
}

for (let index = 0; index < userList.length; index += 1) {
  console.log(userList[index].name)
}
```

### 其他可遍历内容先转数组再处理

> 普通对象和其他可遍历内容先转成数组，再按数组循环方法处理。普通对象使用 `Object.keys()`、`Object.values()`、`Object.entries()` 取出数组结果。`Map`、`Set`、`String` 等其他可遍历内容使用 `Array.from()` 转成数组。

推荐写法
```typescript
let enabledUserNameList = Object.values(userInfoMap)
  .filter((userInfo) => userInfo.isEnabled)
  .map((userInfo) => userInfo.name)

let enabledRoleEntries = Object.entries(userRoleMap)
  .filter(([, roleName]) => roleName.length > 0)

let roleNameList = Array.from(roleSet)
  .map((roleName) => roleName.trim())
  .filter((roleName) => roleName.length > 0)

let letterList = Array.from(userNameText)
  .filter((letter) => letter !== " ")
```

不推荐写法
```typescript
for (let userId in userInfoMap) {
  if (userInfoMap[userId].isEnabled) {
    console.log(userInfoMap[userId].name)
  }
}

for (let roleName of roleSet) {
  console.log(roleName)
}
```

