# TypeScript 命名规则

## 变量命名规则

### 普通变量命名使用小驼峰命名法

> 普通变量命名统一使用小驼峰命名法。

推荐写法
```typescript
let currentUserName = "Alice"
let isDialogVisible = true
```

不推荐写法
```typescript
let CurrentUserName = "Alice"
let is_dialog_visible = true
```

### 布尔变量命名使用逻辑判断词

> 布尔变量命名使用 `is`、`has`、`can` 这类逻辑判断词，让人一眼看出“是否”“有没有”“能不能”。

- `is`：表示是否处于某种状态。
- `has`：表示是否拥有或包含某个内容。
- `can`：表示是否能够执行某个动作。

推荐写法
```typescript
let isDialogVisible = true
let hasPermission = false
let canSubmit = true
```

不推荐写法
```typescript
let dialogVisible = true
let permissionStatus = false
let submitAble = true
```

## 常量命名规则

### 普通常量用大写下划线

> 不承担枚举值集合职责的固定常量统一使用大写下划线命名法。

推荐写法
```typescript
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT_MS = 30000
```

不推荐写法
```typescript
const maxRetryCount = 3
const defaultTimeoutMs = 30000
```

## 配置对象命名规则

### 固定配置对象用小驼峰

> 固定配置对象命名统一使用小驼峰命名法，不按普通常量使用大写下划线。

推荐写法
```typescript
const requestConfig = {
  baseUrl: "",
  timeoutMs: 3000,
}
```

不推荐写法
```typescript
const REQUEST_CONFIG = {
  baseUrl: "",
  timeoutMs: 3000,
}
```

## 函数命名规则

### 函数、方法名用小驼峰

> 函数名和方法名统一使用小驼峰命名法。

推荐写法
```typescript
function getUserName(): string {
  return "Alice"
}

class UserService {
  public loadUserInfo(): void {}
}
```

不推荐写法
```typescript
function GetUserName(): string {
  return "Alice"
}

class UserService {
  public LoadUserInfo(): void {}
}
```

### 函数、方法名写成动作加对象/结果

> 函数名先表达它做什么，再表达它处理的对象或得到的结果，不使用含义模糊的泛化动词。

推荐写法
```typescript
function getUserName(userInfo: IUserInfo): string {
  return userInfo.name
}

function buildRequestParams(userInfo: IUserInfo): IRequestOptions {
  return {
    timeout: 3000,
  }
}
```

不推荐写法
```typescript
function userName(userInfo: IUserInfo): string {
  return userInfo.name
}

function requestParams(userInfo: IUserInfo): IRequestOptions {
  return {
    timeout: 3000,
  }
}
```

### 流程入口使用 `run`

> 启动并串起整段流程的入口函数，使用 `runXxx` 命名。`runXxx` 只用于流程入口，不用于普通数据处理、构建、解析、加载、渲染和校验函数。已经有更准确的现成动词时，直接使用那个动词，不用 `runXxx` 代替。

推荐写法
```typescript
async function runCli(): Promise<void> {}

async function runMigration(): Promise<void> {}

function runSyncScript(): void {}
```

不推荐写法
```typescript
async function runConfigFileContent(filePath: string): Promise<string> {
  return ""
}

function runRequestParams(userInfo: IUserInfo): IRequestOptions {
  return {
    timeout: 3000,
  }
}

function runDialogFooter(): string {
  return ""
}
```

### 已有值用 `get`，外部内容用 `load`

> 读取当前已经有的值、状态或同步算出来的结果时，使用 `getXxx`。读取文件、请求接口或加载其他外部内容时，使用 `loadXxx`。

推荐写法
```typescript
function getUserName(): string {
  return currentUser.name
}

function getLoginDialogVisible(): boolean {
  return true
}

async function loadUserProfile(): Promise<IUserInfo> {
  return await requestUserProfile()
}

async function loadConfigFileContent(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}

async function loadUploadPermission(): Promise<boolean> {
  return await requestUploadPermission()
}
```

不推荐写法
```typescript
function loadUserName(): string {
  return currentUser.name
}

function isLoginDialogVisible(): boolean {
  return true
}

async function getUserProfile(): Promise<IUserInfo> {
  return await requestUserProfile()
}

async function getConfigFileContent(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}

async function getUploadPermission(): Promise<boolean> {
  return await requestUploadPermission()
}
```

### 单个值用 `set`，已有内容用 `update`

> 直接设置单个值、状态或配置时，使用 `setXxx`。修改已有对象、已有记录或已有状态时，使用 `updateXxx`。

推荐写法
```typescript
function setDialogVisible(visible: boolean): void {}

function updateUserInfo(userInfo: IUserInfo): void {}
```

不推荐写法
```typescript
function updateDialogVisible(visible: boolean): void {}

function setUserInfo(userInfo: IUserInfo): void {}
```

### 创建用 `create`，组装用 `build`

> 创建并返回新对象、新实例或新上下文时，使用 `createXxx`。根据已有输入组装结果、参数、配置或结构时，使用 `buildXxx`。

推荐写法
```typescript
function createUploadContext(): IUploadContext {
  return {
    userInfoList: [],
  }
}

function buildRequestParams(userInfo: IUserInfo): IRequestOptions {
  return {
    timeout: 3000,
  }
}
```

不推荐写法
```typescript
function buildUploadContext(): IUploadContext {
  return {
    userInfoList: [],
  }
}

function createRequestParams(userInfo: IUserInfo): IRequestOptions {
  return {
    timeout: 3000,
  }
}
```

### 解析用 `parse`，整理用 `format`

> 把原始内容变成能直接用的数据时，使用 `parseXxx`。把已有数据整理成更适合输出的样子时，使用 `formatXxx`。

推荐写法
```typescript
function parseUserInfo(content: string): IUserInfo {
  return validateUserInfo(JSON.parse(content))
}

function formatPrice(price: number): string {
  return `¥${price}`
}
```

不推荐写法
```typescript
function formatUserInfo(content: string): IUserInfo {
  return validateUserInfo(JSON.parse(content))
}

function parsePrice(price: number): string {
  return `¥${price}`
}
```

### 生成展示内容使用 render

> 生成界面内容、展示片段或可直接用于渲染的输出时，使用 `renderXxx`。

推荐写法
```typescript
function renderDialogFooter(): string {
  return "<footer>...</footer>"
}

function renderUserCard(): string {
  return "<section>...</section>"
}
```

不推荐写法
```typescript
function buildDialogFooter(): string {
  return "<footer>...</footer>"
}

function createUserCard(): string {
  return "<section>...</section>"
}
```

### 新增用 `add`，移除用 `remove`

> 向已有集合、列表、映射或关系中新增成员时，使用 `addXxx`。从已有集合、列表、映射或关系中移除成员时，使用 `removeXxx`。

推荐写法
```typescript
function addUserRole(roleName: string): void {}

function removeUserRole(roleName: string): void {}
```

不推荐写法
```typescript
function createUserRole(roleName: string): void {}

function deleteUserRole(roleName: string): void {}
```

### `clear`、`reset`、`init` 分开用

> 清空已有内容时，使用 `clearXxx`。恢复初始值、初始状态或默认配置时，使用 `resetXxx`。初始化已经存在的实例、状态或上下文时，使用 `initXxx`，不用于新建并返回实例。

推荐写法
```typescript
function clearSearchHistory(): void {}

function resetSearchForm(): void {}

function initUploadContext(uploadContext: IUploadContext): void {}
```

不推荐写法
```typescript
function resetSearchHistory(): void {}

function clearSearchForm(): void {}

function createUploadContext(uploadContext: IUploadContext): void {}
```

### 绑定用 `bind`，解绑用 `unbind`

> 用于绑定事件、注册监听或挂载交互行为时，使用 `bindXxx`。用于解绑事件、移除监听或销毁交互行为时，使用 `unbindXxx`。

推荐写法
```typescript
function bindEvents(): void {}

function bindKeyboardEvents(): void {}

function unbindEvents(): void {}
```

不推荐写法
```typescript
function handleEvents(): void {}

function initEvents(): void {}

function removeEvents(): void {}
```

### 事件处理用 handle

> 用于事件触发后执行具体处理逻辑时，统一使用 `handleXxx`。

推荐写法
```typescript
function handleItemClick(): void {}

function handleFormSubmit(): void {}

function handleDialogClose(): void {}
```

不推荐写法
```typescript
function clickItem(): void {}

function submitForm(): void {}

function dialogClose(): void {}
```

### 校验函数、方法使用 validate

> 用于按规则校验输入、数据、参数或条件时，使用 `validateXxx`。

推荐写法
```typescript
function validatePassword(password: string): boolean {
  return password.length >= 8
}

function validateFormData(formData: FormData): boolean {
  return true
}
```

不推荐写法
```typescript
function isPassword(password: string): boolean {
  return password.length >= 8
}

function checkFormData(formData: FormData): boolean {
  return true
}
```

## 类命名规则

### 类名用大驼峰

> 类名统一使用大驼峰命名法。

推荐写法
```typescript
class UserService {}
```

不推荐写法
```typescript
class userService {}
```

## 接口命名规则

### 接口名使用 `I` 开头的大驼峰命名法

> 接口名统一使用 `I` 开头，再接大驼峰名称。

推荐写法
```typescript
interface IUserInfo {
  id: string
  name: string
}

interface IRequestOptions {
  timeout: number
}

interface IUploadHandler {
  upload(): void
}
```

不推荐写法
```typescript
interface UserInfo {
  id: string
}

interface iRequestOptions {
  timeout: number
}

interface IuploadHandler {
  upload(): void
}
```

## 类型命名规则

### 类型名用大驼峰

> 类型名统一使用大驼峰命名法。

推荐写法
```typescript
type RequestMode = "sync" | "async"
```

不推荐写法
```typescript
type requestMode = "sync" | "async"
```


## 枚举命名规则

### 对象式枚举命名

> 对象式枚举主体使用大驼峰命名法。
> 枚举成员使用大写下划线命名法。
> 对象式枚举主体名称和对应联合类型名称保持一致。

推荐写法
```typescript
const AppScene = {
  TEST: 'test',
  PRODUCTION: 'production',
} as const

type AppScene = typeof AppScene[keyof typeof AppScene]
```

不推荐写法
```typescript
const APP_SCENE = {
  Test: 'test',
  Production: 'production',
} as const

type AppSceneType = typeof APP_SCENE[keyof typeof APP_SCENE]
```

