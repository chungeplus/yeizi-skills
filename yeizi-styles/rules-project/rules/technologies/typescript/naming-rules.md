# TypeScript 命名规则

## 变量命名规则

### 普通变量命名使用小驼峰命名法

> 普通变量命名统一使用小驼峰命名法。

推荐写法
```typescript
const currentName = "Alice"
const isVisible = true
```

不推荐写法
```typescript
const CurrentName = "Alice"
const is_visible = true
```

### 布尔变量命名使用逻辑判断词

> 布尔变量命名使用 `is`、`has`、`can` 这类逻辑判断词，让人一眼看出“是否”“有没有”“能不能”。

- `is`：表示是否处于某种状态。
- `has`：表示是否拥有或包含某个内容。
- `can`：表示是否能够执行某个动作。

推荐写法
```typescript
const isVisible = true
const hasPermission = false
const canSubmit = true
```

不推荐写法
```typescript
const visible = true
const permissionStatus = false
const submitAble = true
```

## 常量命名规则

### 普通常量用大写下划线

> 不承担枚举值集合职责的固定常量统一使用大写下划线命名法。

推荐写法
```typescript
const MAX_LENGTH = 100
const DEFAULT_TIMEOUT_MS = 3000
```

不推荐写法
```typescript
const maxLength = 100
const defaultTimeoutMs = 3000
```

## 配置对象命名规则

### 固定配置对象用小驼峰

> 固定配置对象命名统一使用小驼峰命名法，不按普通常量使用大写下划线。

推荐写法
```typescript
const requestConfig = {
  timeoutMs: 3000,
}
```

不推荐写法
```typescript
const REQUEST_CONFIG = {
  timeoutMs: 3000,
}
```

## 函数命名规则

### 函数、方法名用小驼峰

> 函数名和方法名统一使用小驼峰命名法。

推荐写法
```typescript
function getName(): string {
  return ""
}

class UserService {
  public loadInfo(): void {}
}
```

不推荐写法
```typescript
function GetName(): string {
  return ""
}

class UserService {
  public LoadInfo(): void {}
}
```

### 函数、方法名写成动作加对象/结果

> 函数名先表达它做什么，再表达它处理的对象或得到的结果，不使用含义模糊的泛化动词。

推荐写法
```typescript
function getName(info: IConfig): string {
  return info.value
}

function buildRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

不推荐写法
```typescript
function name(info: IConfig): string {
  return info.value
}

function requestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

### 流程入口使用 `run`

> 启动并串起整段流程的入口函数，使用 `runXxx` 命名。`runXxx` 只用于流程入口，不用于普通数据处理、构建、解析、加载、渲染和校验函数。已经有更准确的现成动词时，直接使用那个动词，不用 `runXxx` 代替。

推荐写法
```typescript
async function runCli(): Promise<void> {}
async function runMigration(): Promise<void> {}
function runSync(): void {}
```

不推荐写法
```typescript
async function startCli(): Promise<void> {}
async function startMigration(): Promise<void> {}
function startSync(): void {}
```

### 已有值用 `get`，外部内容用 `load`

> 读取当前已经有的值、状态或同步算出来的结果时，使用 `getXxx`。读取文件、请求接口或加载其他外部内容时，使用 `loadXxx`。

推荐写法
```typescript
function getName(): string {
  return ""
}

async function loadProfile(): Promise<IConfig> {
  return await requestProfile()
}

async function loadConfig(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}
```

不推荐写法
```typescript
function loadName(): string {
  return ""
}

async function getProfile(): Promise<IConfig> {
  return await requestProfile()
}

async function getConfig(filePath: string): Promise<string> {
  return await readFile(filePath, "utf8")
}
```

### 单个值用 `set`，已有内容用 `update`

> 直接设置单个值、状态或配置时，使用 `setXxx`。修改已有对象、已有记录或已有状态时，使用 `updateXxx`。

推荐写法
```typescript
function setVisible(visible: boolean): void {}
function updateInfo(info: IConfig): void {}
```

不推荐写法
```typescript
function updateVisible(visible: boolean): void {}
function setInfo(info: IConfig): void {}
```

### 创建用 `create`，组装用 `build`

> 创建并返回新对象、新实例或新上下文时，使用 `createXxx`。根据已有输入组装结果、参数、配置或结构时，使用 `buildXxx`。

推荐写法
```typescript
function createContext(): IContext {
  return {
    items: [],
  }
}

function buildRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

不推荐写法
```typescript
function buildContext(): IContext {
  return {
    items: [],
  }
}

function createRequestParams(info: IConfig): IRequestOptions {
  return {
    timeoutMs: 3000,
  }
}
```

### 解析用 `parse`，整理用 `format`

> 把原始内容变成能直接用的数据时，使用 `parseXxx`。把已有数据整理成更适合输出的样子时，使用 `formatXxx`。

推荐写法
```typescript
function parseInfo(content: string): IConfig {
  return validateInfo(JSON.parse(content))
}

function formatPrice(price: number): string {
  return `${price}`
}
```

不推荐写法
```typescript
function formatInfo(content: string): IConfig {
  return validateInfo(JSON.parse(content))
}

function parsePrice(priceText: string): number {
  return Number(priceText)
}
```

### 生成展示内容使用 render

> 生成界面内容、展示片段或可直接用于渲染的输出时，使用 `renderXxx`。

推荐写法
```typescript
function renderFooter(): string {
  return ""
}
```

不推荐写法
```typescript
function buildFooter(): string {
  return ""
}
```

### 新增用 `add`，移除用 `remove`

> 向已有集合、列表、映射或关系中新增成员时，使用 `addXxx`。从已有集合、列表、映射或关系中移除成员时，使用 `removeXxx`。

推荐写法
```typescript
function addRole(name: string): void {}
function removeRole(name: string): void {}
```

不推荐写法
```typescript
function createRole(name: string): void {}
function deleteRole(name: string): void {}
```

### `clear`、`reset`、`init` 分开用

> 清空已有内容时，使用 `clearXxx`。恢复初始值、初始状态或默认配置时，使用 `resetXxx`。初始化已经存在的实例、状态或上下文时，使用 `initXxx`，不用于新建并返回实例。

推荐写法
```typescript
function clearHistory(): void {}
function resetForm(): void {}
function initUploadState(state: IUploadState): void {}
```

不推荐写法
```typescript
function resetHistory(): void {}
function clearForm(): void {}
function createUploadState(state: IUploadState): void {}
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
function registerEvents(): void {}
function attachEvents(): void {}
function detachEvents(): void {}
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
interface IConfig {
  value: string
}

interface IRequestOptions {
  timeoutMs: number
}

interface IUploadHandler {
  upload(): void
}
```

不推荐写法
```typescript
interface Config {
  value: string
}

interface iRequestOptions {
  timeoutMs: number
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
const ItemStatus = {
  IDLE: "idle",
  UPLOADING: "uploading",
} as const

type ItemStatus = typeof ItemStatus[keyof typeof ItemStatus]
```

不推荐写法
```typescript
enum ItemStatus {
  IDLE = "idle",
  UPLOADING = "uploading",
}
```

