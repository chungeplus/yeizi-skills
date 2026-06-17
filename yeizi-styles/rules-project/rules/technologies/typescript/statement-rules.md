# TypeScript 语句规则

## 声明与赋值语句规则

### 变量定义用 `let`

> 只要不是固定常量，变量统一使用 `let` 定义。局部变量即使只赋值一次，也不使用 `const`。不使用 `var`。

推荐写法
```typescript
let retryCount = 0

retryCount += 1
```

不推荐写法
```typescript
const retryCount = 0

var currentIndex = 0
```

### 固定常量、对象式枚举、固定配置对象用 `const`

> 固定常量、对象式枚举和固定配置对象统一使用 `const` 定义，不使用 `let` 或 `var`。

推荐写法
```typescript
const REQUEST_TIMEOUT_MS = 3000

const AppScene = {
  TEST: "test",
  PRODUCTION: "production",
} as const

type AppScene = typeof AppScene[keyof typeof AppScene]

const requestConfig = {
  baseUrl: "",
  timeoutMs: 3000,
}
```

不推荐写法
```typescript
let requestTimeout = 3000

var statusTextMap = {
  ready: "ready",
  finished: "finished",
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

### 判断不写多余 `!!`

> 条件判断直接使用已有的值或表达式，不使用多余的 `!!` 再包一层。

推荐写法
```typescript
if (!userInfo) {
  return
}

if (userList.length === 0) {
  return
}
```

不推荐写法
```typescript
if (!!userInfo === false) {
  return
}

if (!!userList.length === false) {
  return
}
```

### 单分支直接返回

> 单个分支满足条件后可以直接结束时，不再额外包一层 `else`，也不继续增加嵌套。

推荐写法
```typescript
function getUserName(userInfo?: IUserInfo): string {
  if (!userInfo) {
    return ""
  }

  return userInfo.name
}
```

不推荐写法
```typescript
function getUserName(userInfo?: IUserInfo): string {
  if (userInfo) {
    return userInfo.name
  } else {
    return ""
  }
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

> 多分支判断统一不使用 `switch`。同一个判断项的分支在 4 个及以下时，直接使用 `if` 平铺处理。

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

### 五个以上分支拆成对应关系

> 当同一个判断项的分支达到 5 个及以上时，不使用连续 `if / else if` 平铺判断，改成按条件取对应的处理函数或处理结果。

推荐写法
```typescript
const UPLOAD_STATUS_HANDLER_MAP = {
  [UploadStatus.READY]: handleReady,
  [UploadStatus.UPLOADING]: handleUploading,
  [UploadStatus.PAUSED]: handlePaused,
  [UploadStatus.FAILED]: handleFailed,
  [UploadStatus.FINISHED]: handleFinished,
}

return UPLOAD_STATUS_HANDLER_MAP[status]()
```

不推荐写法
```typescript
if (status === UploadStatus.READY) {
  return handleReady()
}

if (status === UploadStatus.UPLOADING) {
  return handleUploading()
}

if (status === UploadStatus.PAUSED) {
  return handlePaused()
}

if (status === UploadStatus.FAILED) {
  return handleFailed()
}

if (status === UploadStatus.FINISHED) {
  return handleFinished()
}
```

## 循环语句规则

### 禁用 `for...in`

> 项目中的循环统一不使用 `for...in`，避免把对象键遍历写法带入数组或其他可循环目标。

推荐写法
```typescript
for (let userInfo of userList) {
  console.log(userInfo.name)
}
```

不推荐写法
```typescript
for (let index in userList) {
  console.log(userList[index].name)
}
```

### 对象遍历使用 `Object.keys()`、`Object.values()`、`Object.entries()`

> 遍历普通对象时，先使用 `Object.keys()`、`Object.values()` 或 `Object.entries()` 取出结果，再按后面的循环规则处理。

推荐写法
```typescript
let enabledUserNameList = Object.values(userInfoMap)
  .filter((userInfo) => userInfo.isEnabled)
  .map((userInfo) => userInfo.name)

let enabledRoleEntries = Object.entries(userRoleMap)
  .filter(([, roleName]) => roleName.length > 0)
```

不推荐写法
```typescript
for (let userId in userInfoMap) {
  if (userInfoMap[userId].isEnabled) {
    console.log(userInfoMap[userId].name)
  }
}
```

### 同步循环用数组方法

> 已经明确循环目标，且循环过程不需要 `break`、`continue` 或串行 `await` 时，统一使用数组循环方法。

推荐写法
```typescript
let enabledUserList = userList.filter((userInfo) => userInfo.isEnabled)

let userNameList = userList.map((userInfo) => userInfo.name)

let hasAdminUser = userList.some((userInfo) => userInfo.role === "admin")
```

不推荐写法
```typescript
let enabledUserList: IUserInfo[] = []

for (let userInfo of userList) {
  if (userInfo.isEnabled) {
    enabledUserList.push(userInfo)
  }
}
```

### 串行或中断循环用 `for...of`

> 循环中只要出现 `break`、`continue` 或串行 `await`，就不再使用数组循环方法。

推荐写法
```typescript
for (let userInfo of userList) {
  if (!userInfo.isEnabled) {
    continue
  }

  if (userInfo.id === targetUserId) {
    break
  }
}

for (let userInfo of userList) {
  await updateUserInfo(userInfo)
}
```

不推荐写法
```typescript
userList.forEach((userInfo) => {
  if (!userInfo.isEnabled) {
    return
  }
})

userList.map(async (userInfo) => {
  await updateUserInfo(userInfo)
})
```

### 次数不定用 `while`

> 循环次数依赖运行时状态、外部返回结果或结束条件变化时，统一使用 `while`。

推荐写法
```typescript
while (taskQueue.length > 0) {
  let currentTask = taskQueue.shift()

  if (!currentTask) {
    break
  }

  runTask(currentTask)
}
```

不推荐写法
```typescript
for (let currentTask of taskQueue) {
  runTask(currentTask)

  if (taskQueue.length === 0) {
    break
  }
}
```

### 并行异步用 `Promise.all`

> 需要并行执行多个异步任务时，统一通过 `map` 构造任务列表，再交给 `Promise.all` 一次性执行。

推荐写法
```typescript
await Promise.all(
  userList.map((userInfo) => updateUserInfo(userInfo)),
)
```

不推荐写法
```typescript
for (let userInfo of userList) {
  await updateUserInfo(userInfo)
}
```

### 遍历时禁止修改原集合

> 循环过程中不直接修改当前正在遍历的同一数组或集合，避免出现跳项、重复处理或索引错乱。

推荐写法
```typescript
let enabledUserList = userList.filter((userInfo) => userInfo.isEnabled)
```

不推荐写法
```typescript
userList.forEach((userInfo, index) => {
  if (!userInfo.isEnabled) {
    userList.splice(index, 1)
  }
})
```

