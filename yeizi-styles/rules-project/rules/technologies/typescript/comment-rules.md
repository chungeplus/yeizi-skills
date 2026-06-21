# TypeScript 注释规则

## TSDoc 注释

### 注释使用 TSDoc 规范

> TypeScript 注释统一使用 TSDoc 规范。文档注释结构和 `@param`、`@returns`、`@throws`、`@example` 等标签写法遵守 TSDoc，再按本文件补充项目约束。

### 有参数时写 `@param`

> 函数和方法有参数时写 `@param`。

推荐写法
```typescript
/**
 * 获取用户的显示名称。
 *
 * @param userInfo 用户信息。
 */
function getUserDisplayName(userInfo: IUserInfo): string {
  return userInfo.name
}
```

不推荐写法
```typescript
/**
 * 获取用户的显示名称。
 */
function getUserDisplayName(userInfo: IUserInfo): string {
  return userInfo.name
}
```

### 有返回值时写 `@returns`

> 函数和方法有返回值时写 `@returns`。

推荐写法
```typescript
/**
 * 获取用户的显示名称。
 *
 * @param userInfo 用户信息。
 * @returns 用户的显示名称。
 */
function getUserDisplayName(userInfo: IUserInfo): string {
  return userInfo.name
}
```

不推荐写法
```typescript
/**
 * 获取用户的显示名称。
 *
 * @param userInfo 用户信息。
 */
function getUserDisplayName(userInfo: IUserInfo): string {
  return userInfo.name
}
```

### 会抛错时写 `@throws`

> 函数和方法会主动抛出错误时，写 `@throws`。调用方需要提前知道这里会抛错时，也写 `@throws`。

推荐写法
```typescript
/**
 * 读取配置文件内容。
 *
 * @param filePath 配置文件路径。
 * @returns 配置文件内容。
 * @throws 配置文件不存在时抛出错误。
 */
function loadConfigFileContent(filePath: string): string {
  throw new Error("配置文件不存在。")
}
```

不推荐写法
```typescript
/**
 * 读取配置文件内容。
 *
 * @param filePath 配置文件路径。
 * @returns 配置文件内容。
 */
function loadConfigFileContent(filePath: string): string {
  throw new Error("配置文件不存在。")
}
```

### 可复用函数和方法写 `@example`

> 不是所有函数和方法都写 `@example`。只有可复用函数和方法写 `@example`，并且至少写一个。业务复杂、参数多样性大或需要覆盖不同调用结果时，写多个 `@example`。入口流程函数、只服务当前文件的函数，以及没有参数也没有返回值的流程函数不写 `@example`。

推荐写法
```typescript
/**
 * 解析用户信息文本。
 *
 * @param content 用户信息文本。
 * @returns 解析后的用户信息。
 *
 * @example
 * parseUserInfo("{\"id\":\"u1\",\"name\":\"Alice\"}") => { id: "u1", name: "Alice" }
 * parseUserInfo("{\"id\":\"u2\",\"name\":\"Bob\"}") => { id: "u2", name: "Bob" }
 */
function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}

/**
 * 运行 CLI 主流程。
 */
function runCli(): void {}
```

不推荐写法
```typescript
/**
 * 解析用户信息文本。
 *
 * @param content 用户信息文本。
 * @returns 解析后的用户信息。
 */
function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}

/**
 * 运行 CLI 主流程。
 *
 * @example
 * runCli() => 启动 CLI 主流程
 */
function runCli(): void {}
```

## 多行注释

### 不使用单行 `/** 内容 */`

> 多行注释写成独立的 `/** */` 结构。

推荐写法
```typescript
/**
 * 获取用户的显示名称。
 */
function getUserDisplayName(): string {
  return "Alice"
}
```

不推荐写法
```typescript
/** 获取用户的显示名称。 */
function getUserDisplayName(): string {
  return "Alice"
}
```

### 类型、常量、配置、函数、类、方法使用 `/** */`

> 类型、常量、配置、函数、类、方法统一使用 `/** */`。接口字段、对象成员和类字段需要说明语义时，也使用 `/** */`。

推荐写法
```typescript
/**
 * 应用错误码定义。
 */
const AppErrorCode = {
  /**
   * package.json 中缺少 bin 配置。
   */
  PACKAGE_BIN_CONFIG_MISSING: "PACKAGE_BIN_CONFIG_MISSING",
} as const

type AppErrorCode = typeof AppErrorCode[keyof typeof AppErrorCode]

export { AppErrorCode }
export type { AppErrorCode }

/**
 * 用户信息。
 */
interface IUserInfo {
  /**
   * 用户唯一标识。
   */
  id: string
  /**
   * 用户显示名称。
   */
  name: string
}

export type { IUserInfo }

/**
 * 运行 CLI 主流程。
 */
function runCli(): void {}

/**
 * 安装命令。
 */
class InstallCommand {
  /**
   * 执行安装流程。
   */
  execute(): void {}
}
```

不推荐写法
```typescript
const AppErrorCode = {
  // package.json 中缺少 bin 配置。
  PACKAGE_BIN_CONFIG_MISSING: "PACKAGE_BIN_CONFIG_MISSING",
} as const

type AppErrorCode = typeof AppErrorCode[keyof typeof AppErrorCode]

export { AppErrorCode }
export type { AppErrorCode }

interface IUserInfo {
  // 用户唯一标识。
  id: string
  // 用户显示名称。
  name: string
}

export type { IUserInfo }
function runCli(): void {}

class InstallCommand {
  execute(): void {}
}
```

## 单行注释

### 函数体和方法体内部说明使用单行注释

> 函数体、方法体和流程片段内部，需要补充原因、顺序、前提或影响时，使用单行注释。

推荐写法
```typescript
function syncUserInfo(userInfoList: IUserInfo[]): void {
  // 保留原始顺序，避免输出结果和平台目录顺序不一致。
  for (let userInfo of userInfoList) {
    console.log(userInfo.name)
  }
}
```

不推荐写法
```typescript
function syncUserInfo(userInfoList: IUserInfo[]): void {
  /**
   * 保留原始顺序，避免输出结果和平台目录顺序不一致。
   */
  for (let userInfo of userInfoList) {
    console.log(userInfo.name)
  }
}
```
