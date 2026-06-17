# TypeScript 注释规则

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

### 共享内容使用 `/** */`

> 对外共享的类型、配置、常量、错误定义、校验结构和复用逻辑使用 `/** */`，函数、类、方法内部需要解释原因、顺序或影响的逻辑除外。

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
```

### 业务代码中的函数、类、方法使用 `/** */`

> 场景专属业务文件和入口文件中的函数、类、方法使用 `/** */`。

推荐写法
```typescript
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
function runCli(): void {}

class InstallCommand {
  execute(): void {}
}
```

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

### 共享函数和方法写 `@example`

> 只有会被别的文件调用的共享函数和方法写 `@example`。场景专属流程函数、入口函数和当前模块内部私有函数不写 `@example`。每行写一个“调用 => 输出”示例。

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
