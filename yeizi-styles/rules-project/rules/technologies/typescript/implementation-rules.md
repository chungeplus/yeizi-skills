# TypeScript 实现规则

## 函数实现规则

### 共享内容先声明再导出

> 对外共享的类型、配置、常量和错误定义，先写定义，再在文件底部统一导出。不在声明时直接写 `export`。

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

interface IRequestOptions {
  timeout: number
}

export { AppErrorCode }
export type { AppErrorCode, IUserInfo, IRequestOptions }
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
```

### 共享模块使用具名导出

> 共享模块对外暴露默认使用具名导出。

推荐写法
```typescript
function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}

export { parseUserInfo }
```

不推荐写法
```typescript
export default function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}
```

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

### 外部输入先做运行时校验

> TypeScript 负责写清业务类型，运行时校验负责确认外部输入真的符合这个类型。没校验过的输入，不直接交给业务代码。只有校验通过后的结果，才能传给业务函数、业务类和业务流程。不把原始输入直接传入业务代码，也不把未校验输入直接用 `as` 断成业务类型。当前项目已经明确具体校验工具时，再按场景技术方案落到对应实现。

推荐写法
```typescript
interface IUserInfo {
  id: string
  name: string
}

interface IRawUserInfo {
  id?: string
  name?: string
}

function validateUserInfo(rawUserInfo: IRawUserInfo): IUserInfo {
  if (typeof rawUserInfo.id !== "string") {
    throw new Error("user id 必须是字符串。")
  }

  if (typeof rawUserInfo.name !== "string") {
    throw new Error("user name 必须是字符串。")
  }

  return {
    id: rawUserInfo.id,
    name: rawUserInfo.name,
  }
}

function parseUserInfo(rawUserInfo: IRawUserInfo): IUserInfo {
  return validateUserInfo(rawUserInfo)
}

function syncUserInfo(userInfo: IUserInfo): void {
  console.log(userInfo.name)
}
```

不推荐写法
```typescript
function syncUserInfo(userInfo: any): void {
  console.log(userInfo.name)
}

let parsedContent = JSON.parse(content)
syncUserInfo(parsedContent)
```

### 退出条件放在前面

> 函数在进入主要逻辑前，先处理无效输入、缺失数据、无需继续处理或异常路径。当前结果已经能直接表达时，优先用 `return` 提前结束；只有输入违反函数约定或出现真正异常时，才用 `throw` 抛错，不把主流程包进多层 `if`。

推荐写法
```typescript
function getEnabledUserName(userInfoList: IUserInfo[], targetUserId: string): string {
  let matchedUserInfo = userInfoList.find((userInfo) => userInfo.id === targetUserId)

  if (!matchedUserInfo) {
    return ""
  }

  if (!matchedUserInfo.isEnabled) {
    return ""
  }

  return matchedUserInfo.name
}
```

不推荐写法
```typescript
function getEnabledUserName(userInfoList: IUserInfo[], targetUserId: string): string {
  let matchedUserInfo = userInfoList.find((userInfo) => userInfo.id === targetUserId)

  if (matchedUserInfo) {
    if (matchedUserInfo.isEnabled) {
      return matchedUserInfo.name
    }
  }

  return ""
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

### `catch` 只留在统一出口

> `catch` 只放在程序入口、任务入口、文件读写、网络请求和统一错误处理这些出口位置。普通业务函数不要一边 `catch` 一边返回兜底结果。`catch` 里的捕获值不写类型注解。

推荐写法
```typescript
async function runCli(): Promise<void> {
  try {
    await executeCli()
  }
  catch (error) {
    renderFatalError(error)
    process.exit(1)
  }
}
```

不推荐写法
```typescript
function getUserName(userInfoList: IUserInfo[], targetUserId: string): string {
  try {
    return userInfoList.find((userInfo) => userInfo.id === targetUserId)?.name ?? ""
  }
  catch {
    return ""
  }
}
```

### 抛错只用 `Error` 实例

> 需要抛错时，只使用 `Error` 或继承 `Error` 的错误实例，不抛字符串，也不抛临时对象。

推荐写法
```typescript
throw new Error("平台选项不能为空。")
```

不推荐写法
```typescript
throw "平台选项不能为空。"
```

### 业务错误继承 `Error`

> 需要表达业务错误时，统一通过继承 `Error` 定义错误类，不直接使用临时对象代替错误实例。

推荐写法
```typescript
export class AppError extends Error {
  public code: ErrorCode

  public constructor(
    code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
  }

  public get title(): string {
    return ERROR_TITLES[this.code]
  }
}
```

不推荐写法
```typescript
export class AppError {
  public code: ErrorCode
  public message: string

  public constructor(
    code: ErrorCode,
    message: string,
  ) {
    this.code = code
    this.message = message
  }

  public get title(): string {
    return ERROR_TITLES[this.code]
  }
}
```

### 错误类带上 `code`、`title`、`message`

> 业务错误类至少提供 `code`、`title`、`message`。`code` 用来区分错误类型，`title` 写统一标题，`message` 写具体错误信息。`title` 可以直接写成字段，也可以写成 `get title()`。`name` 保持错误类名，不把业务标题写进 `name`。

推荐写法
```typescript
export class AppError extends Error {
  public code: ErrorCode

  public constructor(
    code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
  }

  public get title(): string {
    return ERROR_TITLES[this.code]
  }
}
```

不推荐写法
```typescript
export class AppError extends Error {
  public name = "登录失败"

  public constructor(message: string) {
    super(message)
  }
}
```

### 错误码和错误标题独立维护

> 错误码和统一错误标题集中维护，错误类只负责承载错误信息，不在错误类内部硬编码全部错误码和错误标题。同一个 `code` 始终对应同一个 `title`。

推荐写法
```typescript
const ErrorCode = {
  LOGIN_FAILED: "LOGIN_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const

type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

const ERROR_TITLES: Record<ErrorCode, string> = {
  LOGIN_FAILED: "登录失败",
  NETWORK_ERROR: "网络错误",
}

export { ErrorCode, ERROR_TITLES }
export type { ErrorCode }
```

不推荐写法
```typescript
export class AppError extends Error {
  public code: ErrorCode

  public constructor(
    code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
  }

  public get title(): string {
    if (this.code === ErrorCode.LOGIN_FAILED) {
      return "登录失败"
    }

    return "网络错误"
  }
}
```
