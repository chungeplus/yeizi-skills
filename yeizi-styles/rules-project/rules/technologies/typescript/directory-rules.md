# TypeScript 目录规则

## 内容定义规则

### 类型内容包含 `interface`、`type` 和对象式枚举

> `interface`、`type` 和对象式枚举属于类型内容。

推荐示例
```typescript
interface UserInfo {
  id: string
  name: string
}

const UserStatus = {
  ENABLED: "enabled",
  DISABLED: "disabled",
} as const

type UserStatus = typeof UserStatus[keyof typeof UserStatus]
```

### 校验内容包含 Zod schema 和校验结构

> 使用 Zod 编写的 schema 和校验结构属于校验内容。

推荐示例
```typescript
const UserInfoSchema = z.object({
  name: z.string(),
})
```

### 常量内容包含固定 `const` 值

> 不会按环境、平台或运行条件调整的固定 `const` 值属于常量内容。

推荐示例
```typescript
const DEFAULT_TIMEOUT_MS = 3000
```

### 配置内容包含可调整 `const` 配置对象和配置映射

> 会按环境、平台或运行条件调整的 `const` 配置对象和配置映射属于配置内容。

推荐示例
```typescript
const requestConfig = {
  timeoutMs: 3000,
}
```

### 错误内容包含错误相关定义

> 错误相关定义属于错误内容。

推荐示例
```typescript
class AppError extends Error {
  public constructor(message: string) {
    super(message)
  }
}
```

### 共享功能代码处理项目主题内容

> 导出的函数名、输入输出语义或处理结果直接对应当前项目主题名词，并对这些主题内容做构建、转换或流程处理，且被多个业务文件复用的代码，属于共享功能代码。

推荐示例
```typescript
function buildUserCard(user: UserInfo): UserCard {
  return {
    id: user.id,
    name: user.name,
  }
}
```

### 共享工具代码处理通用技术内容

> 导出的函数名、输入输出语义和处理结果都只描述数组、对象、字符串、路径、时间或格式转换等通用技术内容，且被多个业务文件复用的代码，属于共享工具代码。

推荐示例
```typescript
function normalizePathSeparators(filePath: string): string {
  return filePath.replaceAll("\\", "/")
}
```

### 请求内容包含请求函数和请求地址分发

> 导出的函数输入输出直接对应请求入参与返回结果，且函数体只包含请求地址分发和请求客户端调用的请求函数，属于请求内容。

推荐示例
```typescript
import type {
  LoadUserDetailData,
  LoadUserDetailResponse,
} from "@/types/service/apis/user"
import { httpClient } from "@/service/request"

async function loadUserDetail(
  data: LoadUserDetailData,
): Promise<LoadUserDetailResponse> {
  return httpClient.get<LoadUserDetailResponse>({
    url: `/users/${data.userId}`,
  })
}
```

## 内容落位规则

### 内容落位先按内容类型判断

> 内容落位先判断属于哪一种内容类型，再只沿用该类型对应的落位规则继续判断，不在多个内容类型之间来回切换。

### 最小模块使用最深主题目录

> 当前目录下继续按主题拆出子目录时，不把上级目录视为最小模块；没有继续拆分的最深主题目录，才是最小模块。

推荐示例
```text
features/
  skill/
    list/
    detail/
types/
  features/
    skill/
      list/
      detail/
```

### 类型内容先镜像到最小模块目录

> 类型内容统一放到全局 `types/`，按源内容所在的最小模块建立镜像目录。

推荐示例
```text
features/
  skill/
    get-list.ts
    load-data.ts
types/
  features/
    skill/
```

### 最小模块目录内再按类型主题拆文件

> 最小模块目录承载实际类型内容，目录内再按类型主题拆成多个文件。

推荐示例
```text
types/
  features/
    skill/
      item.ts
      request.ts
      response.ts
```

### 校验内容先镜像到最小模块目录

> 校验内容统一放到全局 `schemas/`，按源内容所在的最小模块建立镜像目录。

推荐示例
```text
features/
  skill/
    get-list.ts
    load-data.ts
schemas/
  features/
    skill/
```

### 最小模块目录内再按校验主题拆文件

> 最小模块目录承载实际校验内容，目录内再按校验主题拆成多个文件。

推荐示例
```text
schemas/
  features/
    skill/
      item.ts
      request.ts
      response.ts
```

### 单文件常量留在当前文件

> 单文件使用的常量留在当前文件。

推荐示例
```text
features/
  user/
    load-list.ts
```

### 共享常量放到全局 `constants/`

> 被多个文件复用的常量提升到全局 `constants/`。

推荐示例
```text
constants/
  status/
    labels.ts
```

### 共享常量子目录使用常量主题名词

> 共享常量目录先按常量主题建立子目录，子目录名直接使用常量主题名词，不直接把文件放在 `constants/` 根下。

推荐示例
```text
constants/
  status/
  platform/
```

### 配置内容放到全局 `config/`

> 配置内容放到全局 `config/`。

推荐示例
```text
config/
  request/
    client-config.ts
```

### 共享配置子目录使用配置主题名词

> 共享配置目录先按配置主题建立子目录，子目录名直接使用配置主题名词，不直接把文件放在 `config/` 根下。

推荐示例
```text
config/
  request/
  build/
```

### 错误内容放到全局 `error/`

> 错误内容放到全局 `error/`。

推荐示例
```text
error/
  code.ts
```

### 共享功能代码放到 `features/`

> 处理当前项目主题内容，且被多个业务文件复用的代码放到 `features/`。

推荐示例
```text
features/
  user/
    build-card.ts
```

### 共享功能子目录使用业务功能名词

> 共享功能目录先按业务功能建立子目录，子目录名直接使用业务功能名词，不直接把文件放在 `features/` 根下。

推荐示例
```text
features/
  user/
  order/
```

### 共享工具代码放到 `tools/`

> 处理数组、对象、字符串、路径、时间或格式转换等通用技术内容，且被多个业务文件复用的代码放到 `tools/`。

推荐示例
```text
tools/
  path/
    normalize-separators.ts
```

### 共享工具子目录使用通用能力名词

> 共享工具目录先按通用能力建立子目录，子目录名直接使用通用能力名词，不直接把文件放在 `tools/` 根下。

推荐示例
```text
tools/
  path/
  text/
```

### 请求传输层放到 `service/request/`

> 通用请求客户端和请求传输层代码放到 `service/request/`。

推荐示例
```text
service/
  request/
    client.ts
```

### 请求资源层放到 `service/apis/`

> 按外部资源组织、且只负责请求地址分发和请求客户端调用的请求内容放到 `service/apis/`。

推荐示例
```text
service/
  apis/
    user/
      load-detail.ts
```

### 请求资源子目录使用外部资源名词

> `service/apis/` 先按外部资源建立子目录，子目录名直接使用外部资源名词，不直接把文件放在 `service/apis/` 根下。

推荐示例
```text
service/
  apis/
    user/
    order/
```

### 子目录名词使用小写中划线命名法

> 子目录名词统一使用小写中划线命名法。

推荐示例
```text
features/
  user-profile/
tools/
  file-path/
service/
  apis/
    remote-user/
```

不推荐示例
```text
features/
  UserProfile/
tools/
  file_path/
service/
  apis/
    remoteUser/
```

## 共享模块访问规则

### 共享模块最小目录使用 `index.ts` 做桶导出

> 共享目录中，只有直接承载可导入内容的最小目录使用 `index.ts` 做桶导出。继续分层的上级目录不创建 `index.ts`。

推荐示例
```text
features/
  skill/
    index.ts
tools/
  path/
    index.ts
types/
  features/
    skill/
      index.ts
schemas/
  features/
    skill/
      index.ts
service/
  apis/
    user/
      index.ts
```

不推荐示例
```text
features/
  skill/
    index.ts
    list/
      index.ts
types/
  features/
    index.ts
    skill/
      index.ts
service/
  apis/
    user/
      user-index.ts
```

### 跨目录导入共享目录内容时停在最小目录桶文件

> 跨目录导入共享目录内容时，导入路径停在承载目标内容的最小目录桶文件。

推荐示例
```typescript
import { normalizePathSeparators } from "@/tools/path"
import { buildUserCard } from "@/features/user"
import { loadUserDetail } from "@/service/apis/user"
import type { SkillItem, LoadSkillRequest } from "@/types/features/skill"
import { skillItemSchema, loadSkillRequestSchema } from "@/schemas/features/skill"
```

不推荐示例
```typescript
import { normalizePathSeparators } from "@/tools"
import { buildUserCard } from "@/features"
import { loadUserDetail } from "@/service/apis/user/user-load-detail"
import type { SkillItem } from "@/types"
import type { SkillItem } from "@/types/features/skill/item"
import { skillItemSchema } from "@/schemas"
import { skillItemSchema } from "@/schemas/features/skill/item"
```

## 文件命名规则

### 文件名延续上级目录主题

> 上级目录已经提供的主题不在文件名里重复。文件名只补当前文件新增的动作、角色或结果语义。

推荐示例
```text
tools/
  skill/
    get-list.ts
error/
  app.ts
service/
  request/
    client.ts
service/
  apis/
    user/
      load-detail.ts
types/
  features/
    skill/
      request.ts
```

不推荐示例
```text
tools/
  skill/
    skill-get-list.ts
error/
  app-error.ts
service/
  request/
    request-client.ts
service/
  apis/
    user/
      user-load-detail.ts
types/
  features/
    skill/
      skill-request.ts
```

### 文件内符号名不受目录简写影响

> 文件名可以利用上级目录语义简写，但文件内的类名、函数名、类型名等符号名必须完整，不能也受目录简写影响。

推荐写法
```text
service/
  request/
    client.ts
```
```typescript
class RequestClient {}
```

不推荐写法
```typescript
class Client {}
```
