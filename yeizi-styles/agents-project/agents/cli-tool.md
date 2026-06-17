## 项目规则

### 先读现有文件
> 先读 `package.json`、`README.md`、`src/bin/cli.ts`、`src/main.ts` 和 `src/commands/index.ts`。修改单个一级命令前，再读对应命令目录。

### 包管理器使用 pnpm
> 安装和脚本执行统一使用 `pnpm`。

### 安装命令使用 pnpm install
> 安装依赖使用 `pnpm install`。

### 启动命令使用 pnpm run dev
> 开发启动命令使用 `pnpm run dev`。

### 基础校验固定三条
> 基础校验命令使用 `pnpm run typecheck`、`pnpm run lint` 和 `pnpm run build`。

### 默认不补测试流程
> 没有额外确认时，不主动补测试脚本、测试命令和测试流程说明。

### 执行入口保持三处
> CLI 执行入口使用 `src/bin/cli.ts`，程序入口使用 `src/main.ts`，一级命令统一从 `src/commands/index.ts` 注册。

### 命令目录和复用分开
> 一级命令目录只放当前命令自己的内容，跨命令复用逻辑不回写到单个命令目录里。

### 业务规则

#### 一级命令一目录
> 每个一级命令单独放在 `src/commands/<command-name>/`，不把多个一级命令实现混在同一目录里。

#### 命令层只做编排
> 一级命令文件只负责解析参数、调用复用逻辑和组织输出，不把跨命令复用逻辑直接写在命令文件里。

#### 空参数输出帮助
> 不带一级命令执行时，程序输出默认帮助信息后结束。

#### 缺少输入走交互
> 缺少平台、资源或更新目标这类选择输入时，走交互提问补齐，不静默写入默认值。

#### 多值选项先清洗
> 逗号分隔的多值选项先做去空白和去重，再进入后续校验和执行流程。

#### 查询命令输出比较表
> 需要展示多条目标状态差异的查询类命令，输出比较表。

#### 写入命令输出摘要
> 会改写本地内容的命令，输出摘要列表。

#### 写入前先验版本
> 需要从远端下载并写入本地时，先校验索引版本与资源文档版本一致，再执行写入。

#### 更新只处理可更新项
> 更新流程只对比较结果中可更新的目标继续执行。没有可更新项时，直接输出结果后结束。

#### 目录缺失跳过目标
> 本地目标根目录不存在时，跳过当前目标，不继续写入该目标目录。

### 实现边界

#### bin 文件只做调用
> `src/bin/cli.ts` 只保留 shebang 和主入口调用，不写命令注册、参数解析和错误展示。

#### 主入口只保留一套
> `src/main.ts` 负责创建命令程序、处理空参数帮助和收口致命错误，不新增第二套 CLI 主入口。

#### 命令只从一处注册
> 所有一级命令只从 `src/commands/index.ts` 注册，不在别的文件重复注册。

#### 复用逻辑不重复写
> 交互提问、差异输出、摘要输出、远端版本校验和本地目录写入这些复用逻辑，不在单个一级命令目录里重复实现。

#### 致命错误回主入口
> 命令目录和复用模块抛出的致命错误统一回到 `src/main.ts` 处理，不在普通模块里直接设置退出码。

#### 不自动创建根目录
> 目标根目录不存在时，不自动创建该目录。

#### 写入走临时替换
> 本地写入先落到临时目录，再替换目标目录。目标目录已存在时先备份，替换失败时恢复备份。

#### 写入路径不能越界
> 计算出的目标文件路径必须保持在目标根目录内。越界路径直接报错。

#### 全部目标不可写就结束
> 当前选择的目标都没有可用根目录时，直接输出结果后结束，不继续执行写入流程。

## 技术方案

### 构建使用 vite
> 构建使用 `vite`。

### lint 配置用 ts
> lint 配置文件使用 `eslint.config.ts`。

### lint 和校验分开
> lint 使用 `@antfu/eslint-config`，类型校验使用 `tsc`。

### 命令解析用 commander
> 命令注册、参数声明和帮助输出使用 `commander`。

### 交互提问用 inquirer
> 交互提问和多选输入使用 `inquirer`。

### 输入校验用 zod
> 命令选项和外部输入校验使用 `zod`。

### 提示框用 boxen
> 块级提示和结果框使用 `boxen`。

### 着色用 chalk 和 picocolors
> 终端文字着色和状态强调使用 `chalk` 和 `picocolors`。

### 加载状态用 ora
> 命令执行中的加载状态使用 `ora`。

### 请求使用 axios
> 外部 HTTP 请求使用 `axios`。

### 版本比较用 semver
> 版本号校验和版本比较使用 `semver`。

### 表情符号用 node-emoji
> 终端表情和语义化符号使用 `node-emoji`。

## 通用开发规则

### 共享项目规则

#### 先想清楚再动手

##### 先查证再分清事实和假设

> 开始处理任务前，必须先查看当前项目里和任务直接相关的代码、文档、脚本和配置，再分开说明已确认信息、当前假设和判断口径。查不到、互相冲突或没有明确来源的内容按假设表述，先确认后再继续，不自己补全路径、命令、接口、字段和行为。

##### 信息不清先确认

> 需求有歧义、信息不足或存在默认前提时，必须先说明当前理解和卡点，得到确认后再继续。

##### 方案有别先确认

> 存在两个及以上都能成立、且取舍不明显的方案时，必须先说明准备采用的方案、放弃其他方案的原因和影响，得到确认后再继续。即使准备采用更简单、更小改动或更少抽象的方案，也不能跳过说明。

#### 简单优先

##### 只做当前需求的最小修改

> 实现范围和每一处改动都必须直接对应当前需求，不额外增加功能、层级和延伸逻辑。

##### 不为未来变化提前扩展

> 只实现当前已确认的需求。单次使用逻辑不额外拆抽象层，不预留扩展点，也不新增开关、参数、配置项、策略枚举和可插拔入口，除非用户已经明确要求。

##### 只为已确认边界编写逻辑

> 只为当前项目已经确认的输入、输出、异常和使用边界编写处理逻辑。已确认不会出现的场景，不补错误处理、兼容分支和兜底代码。

##### 实现过重就重做

> 当前实现明显超过需求所需时，必须改成更小、更直接的做法，不保留为了以后可能用到而加的复杂结构。

#### 小范围修改

##### 现有结构能满足时必须复用

> 现有目录结构、依赖、脚本和工具代码能满足当前需求时，必须复用，不重复创建功能等价的新实现。

##### 先看现有实现再沿用

> 开始写代码前，必须先查看当前目录或相邻模块里已在使用的结构、命名和写法。能沿用时直接沿用，不自己发明另一套模式；修改现有代码时也不顺手换风格。

##### 不修改无关内容

> 不修改当前需求无关的代码、注释、格式和目录结构，也不重构本来没有坏掉的实现。

##### 只清理本次修改带来的问题

> 只清理本次修改直接造成的无用导入、变量、函数、文件和混乱。原本就存在的无关问题只说明，不擅自删除或连带清理。

#### 目标驱动执行

##### 开始前先写完成标准

> 动手前必须先写清这次任务做成什么算完成，至少说明要改什么、改完看什么结果、用什么方式验证。完成标准只根据用户要求和当前项目已确认信息整理，不自己新增未确认的交付项、成功条件和验证口径。

##### 多步任务先写检查点

> 多步任务必须先写清每一步要改什么、改完怎么确认，并按检查点逐步核对结果。中途有步骤未完成、未验证或被跳过时，必须明确说明，不能按整体完成交付。

##### 完成前必须验证结果

> 交付前必须使用当前项目已确认的命令、测试或检查方式验证结果。没有运行验证、验证失败，或当前环境无法验证时，必须明确说明原因、未验证范围和剩余风险，不得写成已完成或默认可用。

##### 先跑通再优化

> 先完成可以正常运行和可验证的实现，再进行当前需求确实需要的优化，不先做脱离结果的调整。

##### 只删除本次生成的临时文件

> 本次任务生成的临时文件、中间文件和调试文件，结束前必须删除，不保留在项目目录中。

## 技术与代码规则

### TypeScript 注释规则

#### 注释基本

##### 注释说明使用中文

> 注释中的说明性文字使用中文。

推荐写法
```typescript
// 当前登录用户名称。
let currentUserName = "Alice"
```

不推荐写法
```typescript
// current user name
let currentUserName = "Alice"
```

##### 注释直接写清意思

> 注释直接写清当前内容在做什么、为什么这样做，或会带来什么影响。

推荐写法
```typescript
// 当前登录用户名称。
let currentUserName = "Alice"
```

不推荐写法
```typescript
// 定义一个变量。
let currentUserName = "Alice"
```

#### 单行注释

##### 单行注释放在代码上方

> 单行注释放在需要解释的代码上方，使用独立注释行。

推荐写法
```typescript
// 最大超时时间，单位毫秒。
const MAX_TIMEOUT = 30000
```

不推荐写法
```typescript
const MAX_TIMEOUT = 30000 // 最大超时时间，单位毫秒
```

##### 含义不直观时写单行注释

> 业务模块、程序主入口和其他根目录业务文件中，变量、常量、类属性的名字和当前值还不能直接说明用途时，使用单行注释。

推荐写法
```typescript
// 当前命令最终使用的目标平台集合。
let resolvedPlatformNames = ["macos", "windows"]

class InstallCommand {
  // 当前命令已经解析出的安装目标目录。
  outputDirectory = "dist"
}
```

不推荐写法
```typescript
let resolvedPlatformNames = ["macos", "windows"]

class InstallCommand {
  outputDirectory = "dist"
}
```

##### 需要解释原因时写单行注释

> 函数、类、方法内部的代码如果需要额外说明这样做的原因、顺序或影响，使用单行注释。

推荐写法
```typescript
function resolveTargetPlatforms(platformNames: string[]): string[] {
  // 保持用户输入顺序，同时去掉重复的平台名称。
  let uniquePlatformNames = Array.from(new Set(platformNames))

  return uniquePlatformNames
}
```

不推荐写法
```typescript
function resolveTargetPlatforms(platformNames: string[]): string[] {
  let uniquePlatformNames = Array.from(new Set(platformNames))

  return uniquePlatformNames
}
```

#### 多行注释

##### 不使用单行 `/** 内容 */`

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

##### 共享目录中的内容使用 `/** */`

> `config/`、`constants/`、`errors/`、`schemas/`、`types/`、`tools/`、`features/` 中的内容使用 `/** */`，函数、类、方法内部需要解释原因、顺序或影响的逻辑除外。

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

##### 业务代码中的函数、类、方法使用 `/** */`

> 业务模块、程序主入口和其他根目录业务文件中的函数、类、方法使用 `/** */`。

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

##### 有参数时写 `@param`

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

##### 有返回值时写 `@returns`

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

##### 会抛错时写 `@throws`

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

##### 给别的文件调用时写 `@example`

> 只有 `tools/`、`features/` 中给别的文件调用的函数和方法写 `@example`。业务模块、程序主入口和其他根目录业务文件不写 `@example`。每行写一个“调用 => 输出”示例。

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

### TypeScript 目录与文件规则

#### 文件命名规则

##### 文件名使用小写中划线

> TypeScript 文件名统一使用小写中划线命名法。

推荐写法
```text
user-info.ts
request-options.ts
default-timeout.ts
```

##### 文件名写完整词

> 文件名使用完整单词，禁止使用不通用的缩写或简称。先让人看懂，再考虑名字长短。

推荐写法
```text
request-options.ts
project-settings.ts
default-timeout.ts
```

##### 文件名和内容保持一致

> 文件名和主导出或共同主题保持一致。

推荐写法
`user-info.ts`
```typescript
interface IUserInfo {
  id: string
  name: string
}
export type { IUserInfo }
```

`parse-user-info.ts`
```typescript
function parseUserInfo(content: string): IUserInfo {
  return {
    id: "u1",
    name: "Alice",
  }
}
export { parseUserInfo }
```

##### 禁止使用泛化文件名

> 不使用 `helpers.ts`、`utils.ts`、`common.ts`、`temp.ts` 这类泛化文件名。

推荐写法
```text
read-config-file.ts
parse-user-info.ts
request-options.ts
```

#### 通用目录规则

##### 项目源码放在 `src/`

> 项目源码统一放在 `src/` 目录下。程序主入口、项目共享目录和私有模块都从 `src/` 展开。

推荐写法
```text
src/
  main.ts
  tools/
  features/
  config/
  schemas/
  constants/
  errors/
  types/
  <private-module>/
```

##### 模块入口使用 `index.ts`

> 目录作为模块入口时，统一使用 `index.ts` 暴露同级内容。

推荐写法
```text
src/
  tools/
    index.ts
    parse-user-info.ts
    read-config-file.ts
```

##### `index.ts` 只做转发

> `index.ts` 只负责转发同级已经公开的内容，不在入口文件里写业务逻辑、初始化逻辑或私有实现。

推荐写法
```typescript
export * from "./parse-user-info"
export * from "./read-config-file"
```

不推荐写法
```typescript
export * from "./parse-user-info"

function initTools(): void {}

initTools()
```

##### 对应内容存在时再创建目录

> 目录只在存在对应内容时创建，不为对齐目录结构预先创建空目录。

推荐写法
```text
src/
  config/
  types/
```

##### 目录先按内容归类

> 新增文件前，先判断它是类型、校验、配置、错误、常量还是行为代码，再放进对应目录。不因为调用位置、文件来源或实现方式相近，就放进错误的目录。

推荐写法
```text
类型 -> src/types/
校验 -> src/schemas/
配置 -> src/config/
错误 -> src/errors/
共享常量 -> src/constants/
共享业务 -> src/features/
共享工具 -> src/tools/
私有内容 -> 模块内
```

#### 共享目录规则

##### 共享类型使用 `src/types/`

> 项目共享的接口、类型别名、对象式枚举和类型工具，统一放在 `src/types/`。

推荐写法
```text
src/
  types/
    app-scene.ts
    request-options.ts
    user-info.ts
```

##### 配置使用 `src/config/`

> 项目配置，以及会随着项目设定、模块设定或环境设定调整的内容，统一放在 `src/config/`。

推荐写法
```text
src/
  config/
    app.ts
    project.ts
    repository-config.ts
```

##### 共享运行时校验使用 `src/schemas/`

> 项目共享的运行时校验结构、校验规则和 `zod` schema，统一放在 `src/schemas/`。

推荐写法
```text
src/
  schemas/
    request-options.ts
    project-settings.ts
```

##### 跨模块共享常量使用 `src/constants/`

> 被 2 个以上模块共享的常量，统一放在 `src/constants/`。对象式枚举属于类型内容，仍放在 `src/types/`。

推荐写法
```text
src/
  constants/
    exit-code.ts
    default-timeout.ts
```

##### 单文件私有常量留在当前文件

> 只在当前文件使用的固定常量，直接留在当前文件，不单独提取到 `constants/`。

推荐写法
```text
src/
  install-skill.ts
```

##### 错误内容使用 `src/errors/`

> 错误类、错误码、错误标题、错误映射和错误处理相关内容，统一放在 `src/errors/`。

推荐写法
```text
src/
  errors/
    app-error.ts
    error-code.ts
    error-title.ts
```

##### 共享业务使用 `src/features/`

> 被 2 个以上私有模块共享，或服务项目入口和整个项目流程，而且离开当前项目就说不通的行为代码，统一放在 `src/features/`。

推荐写法
```text
src/
  features/
    install/
    project/
    skill-install.ts
```

##### 共享工具使用 `src/tools/`

> 被 2 个以上私有模块共享，或服务项目入口和整个项目流程，而且离开当前项目也成立的行为代码，统一放在 `src/tools/`。

推荐写法
```text
src/
  tools/
    fs/
    path/
    output-formatter.ts
```

#### 私有目录规则

##### 私有目录按业务名称组织

> 私有模块目录名称按当前项目里的业务名称确定，不在通用规则里写死具体目录名。

推荐写法
```text
src/
  <private-module>/
```

##### 私有模块只拆固定子目录

> 私有模块需要继续拆子目录时，只拆 `types/`、`schemas/`、`constants/`。不在私有模块内再创建 `config/`、`features/`、`tools/`、`errors/` 同名子目录。

推荐写法
```text
src/
  <private-module>/
    constants/
    schemas/
    types/
```

##### 不跨模块直接引入私有目录

> 一个模块的私有目录和私有文件只服务当前模块内部。其他模块需要使用对应能力时，只通过对方公开入口读取，不直接引入别的模块私有目录。

推荐写法
```typescript
import { parseInstallOptions } from "../install"
```

不推荐写法
```typescript
import { parseInstallOptions } from "../install/schemas/parse-install-options"
```

##### 私有类型使用 `types/`

> 只服务单个私有模块的接口、类型别名、对象式枚举和类型工具，统一放在该模块目录下的 `types/`。

推荐写法
```text
src/
  <private-module>/
    types/
      request-options.ts
```

##### 私有运行时校验使用 `schemas/`

> 只服务单个私有模块的运行时校验结构、校验规则和 `zod` schema，统一放在该模块目录下的 `schemas/`。

推荐写法
```text
src/
  <private-module>/
    schemas/
      install-options.ts
```

##### 同模块共享常量使用 `constants/`

> 被 2 个以上同模块文件共享的默认值、路径片段、目录名和数值限制，统一放在该模块目录下的 `constants/`。

推荐写法
```text
src/
  <private-module>/
    constants/
      default-timeout.ts
```

##### 私有模块行为代码放模块内

> 只服务单个私有模块的业务函数、工具函数、类和流程文件，统一放在该模块目录里，或按模块里的实际用途继续拆分。

推荐写法
```text
src/
  <private-module>/
    install-skill.ts
    build-request-options.ts
```

### TypeScript 实现规则

#### 函数实现规则

##### 共享内容先声明再导出

> `src/types/`、`src/config/`、`src/constants/`、`src/errors/` 中的共享内容，先写定义，再在文件底部统一导出。不在声明时直接写 `export`。

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

##### 共享模块使用具名导出

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

##### 参数类型写实际输入

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

##### 外部输入先用 zod 确认类型

> TypeScript 负责写清业务类型，`zod` 负责确认外部输入真的符合这个类型。没校验过的输入，不直接交给业务代码。

推荐写法
```typescript
interface IUserInfo {
  id: string
  name: string
}

const userInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
})

function parseUserInfo(content: string): IUserInfo {
  return userInfoSchema.parse(JSON.parse(content))
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

##### 校验通过后再进入业务代码

> 文件内容、命令行参数、环境变量、网络返回、`JSON.parse` 结果等外部输入，必须先在边界层使用 `zod` 完成运行时校验。只有校验通过后的结果，才能传给业务函数、业务类和业务流程。不把原始输入直接传入业务代码，也不把未校验输入直接用 `as` 断成业务类型。

推荐写法
```typescript
const installOptionsSchema = z.object({
  outputDirectory: z.string().min(1),
})

type IInstallOptions = z.infer<typeof installOptionsSchema>

function parseInstallOptions(rawOptions: Record<string, string>): IInstallOptions {
  return installOptionsSchema.parse(rawOptions)
}

function runInstall(installOptions: IInstallOptions): void {
  console.log(installOptions.outputDirectory)
}

let installOptions = parseInstallOptions(rawOptions)
runInstall(installOptions)
```

不推荐写法
```typescript
function runInstall(installOptions: IInstallOptions): void {
  console.log(installOptions.outputDirectory)
}

let installOptions = rawOptions as IInstallOptions
runInstall(installOptions)
```

##### 常见空结果直接返回

> 返回值类型已经能表达结果时，像空数组、空字符串、未命中这类常见结果直接返回，不用兜底报错代替返回。只有输入违反函数约定或出现真正异常时，才抛出错误。

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
function parseCsvOptionValues(csvOptionValue: string): string[] {
  let parsedOptionValues = Array.from(new Set(
    csvOptionValue
      .split(",")
      .map((optionItem) => optionItem.trim())
      .filter((optionItem) => optionItem.length > 0),
  ))

  if (parsedOptionValues.length === 0) {
    throw new Error("请至少为这个选项提供一个值。")
  }

  return parsedOptionValues
}
```

##### 前面先 `return` 或 `throw`

> 函数在进入主要逻辑前，先处理无效输入、缺失数据或不满足执行条件的情况。前面先 `return` 或 `throw`，不把主流程包进多层 `if`。

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

#### class 和 function 使用规则

##### 单次处理用 function

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

#### 类实现规则

##### 构造函数参数不直接声明属性

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

#### 错误实现规则

##### `catch` 只留在统一出口

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

##### 抛错只用 `Error` 实例

> 需要抛错时，只使用 `Error` 或继承 `Error` 的错误实例，不抛字符串，也不抛临时对象。

推荐写法
```typescript
throw new Error("平台选项不能为空。")
```

不推荐写法
```typescript
throw "平台选项不能为空。"
```

##### 业务错误继承 `Error`

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

##### 错误类带上 `code`、`title`、`message`

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

##### 错误码和错误标题独立维护

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

### TypeScript 命名规则

#### 命名一致性规则

##### 同一含义统一命名

> 同一个概念在不同文件和不同上下文中，保持同一套命名词汇。

推荐写法
```typescript
let userList = []
let archivedUserList = []

function getUserList(): IUserInfo[] {
  return []
}
```

不推荐写法
```typescript
let userList = []
let archivedUsers = []

function getUserCollection(): IUserInfo[] {
  return []
}
```

##### 同一个词在不同位置不要变形

> 已经使用某个词时，在变量、函数、类型、参数等不同位置，不要再改成它的另一种形态。只有含义真的变了，才换词。

推荐写法
```typescript
function getLoginDialogVisible(): boolean {
  return true
}

let isLoginDialogVisible = getLoginDialogVisible()

interface ILoginDialogState {
  isLoginDialogVisible: boolean
}
```

不推荐写法
```typescript
function getLoginDialogVisibility(): boolean {
  return true
}

let isLoginDialogVisible = getLoginDialogVisibility()

interface ILoginDialogState {
  isLoginDialogDisplay: boolean
}
```

##### 命名不要随意缩写单词

> 在不影响阅读长度时，命名不要随意缩写单词。`id`、`url` 等通用缩写可以保留，不使用只在局部团队内约定的缩写。

推荐写法
```typescript
let currentUserList = []
let maxRetryCount = 3
```

不推荐写法
```typescript
let curUserList = []
let maxRetryCnt = 3
```

#### 变量命名规则

##### 普通变量命名使用小驼峰命名法

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

##### 布尔变量命名使用逻辑判断词

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

#### 常量命名规则

##### 普通常量用大写下划线

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

#### 配置对象命名规则

##### 固定配置对象用小驼峰

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

#### 函数命名规则

##### 函数、方法名用小驼峰

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

##### 函数、方法名写成动作加对象/结果

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

##### 流程入口使用 `run`

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

##### 已有值用 `get`，外部内容用 `load`

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

##### 单个值用 `set`，已有内容用 `update`

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

##### 创建用 `create`，组装用 `build`

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

##### 解析用 `parse`，整理用 `format`

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

##### 生成展示内容使用 render

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

##### 新增用 `add`，移除用 `remove`

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

##### `clear`、`reset`、`init` 分开用

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

##### 绑定用 `bind`，解绑用 `unbind`

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

##### 事件处理用 handle

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

##### 校验函数、方法使用 validate

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

#### 类命名规则

##### 类名用大驼峰

> 类名统一使用大驼峰命名法。

推荐写法
```typescript
class UserService {}
```

不推荐写法
```typescript
class userService {}
```

#### 接口命名规则

##### 接口名使用 `I` 开头的大驼峰命名法

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

#### 类型命名规则

##### 类型名用大驼峰

> 类型名统一使用大驼峰命名法。

推荐写法
```typescript
type RequestMode = "sync" | "async"
```

不推荐写法
```typescript
type requestMode = "sync" | "async"
```


#### 枚举命名规则

##### 对象式枚举命名

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

### TypeScript 语句规则

#### 声明与赋值语句规则

##### 变量定义用 `let`

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

##### 固定常量、对象式枚举、固定配置对象用 `const`

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

#### 条件语句规则

##### 判断不写 `=== true/false`

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

##### 判断不写多余 `!!`

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

##### 单分支直接返回

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

##### 禁止使用三目运算符

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

##### 禁用 `switch`

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

##### 五个以上分支拆成对应关系

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

#### 循环语句规则

##### 禁用 `for...in`

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

##### 对象遍历使用 `Object.keys()`、`Object.values()`、`Object.entries()`

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

##### 同步循环用数组方法

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

##### 串行或中断循环用 `for...of`

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

##### 次数不定用 `while`

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

##### 并行异步用 `Promise.all`

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

##### 遍历时禁止修改原集合

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

### TypeScript 类型规则

#### 枚举类型规则

##### 枚举值用 `const` 对象和联合类型

> 对象键用于代码里的成员名，对象值用于真实取值，不使用 `enum`。

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
enum AppScene {
  TEST = 'test',
  PRODUCTION = 'production',
}
```

#### 类型定义规则

##### 对象类型使用 `interface`

> 表示对象有哪些字段，或这组字段后面还会继续扩展时，使用 `interface`。

推荐写法
```typescript
interface IUserInfo {
  id: string
  name: string
}

interface IRequestOptions {
  timeout: number
}
```

不推荐写法
```typescript
type UserInfo = {
  id: string
  name: string
}

type RequestOptions = {
  timeout: number
}
```

##### 组合和派生类型使用 `type`

> 表达联合类型、字面量类型、元组、函数类型、映射类型、条件类型和已有类型组合后的结果时，使用 `type`。

推荐写法
```typescript
type AppScene = "test" | "production"

type RequestHandler = (requestUrl: string) => Promise<string>

type UserSummary = Pick<IUserInfo, "id" | "name">
```

不推荐写法
```typescript
interface AppScene {
  value: "test" | "production"
}

interface RequestHandler {
  (requestUrl: string): Promise<string>
}
```

#### 类型使用规则

##### 禁止使用 `any` 和 `unknown`

> 参数、返回值、字段和类型断言写清类型。局部变量可以交给 TypeScript 自己推出来。不使用 `any` 和 `unknown` 兜底。

推荐写法
```typescript
function getUserName(userInfo: IUserInfo): string {
  return userInfo.name
}

let retryCount = 0
```

不推荐写法
```typescript
function getUserName(userInfo: any): string {
  return userInfo.name
}

let retryCount: unknown = 0
```

##### `as` 只补明确类型

> `as SomeType` 只在你已经明确知道值是什么类型、只是 TypeScript 这里没推出来时使用。不把未校验输入直接断成业务类型。

推荐写法
```typescript
function focusSubmitButton(): void {
  let submitButton = document.getElementById("submit-button") as HTMLButtonElement | null

  if (!submitButton) {
    return
  }

  submitButton.focus()
}
```

不推荐写法
```typescript
function parseUserInfo(content: string): IUserInfo {
  return JSON.parse(content) as IUserInfo
}
```

## 目录参考

### CLI 场景骨架
```text
src/
  bin/
    cli.ts
  main.ts
  commands/
    index.ts
    <command-name>/
```
