# TypeScript 类型规则

## 枚举类型规则

### 枚举值用 `const` 对象和联合类型

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

## 类型定义规则

### 对象类型使用 `interface`

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

### 组合和派生类型使用 `type`

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

## 类型使用规则

### 禁止使用 `any` 和 `unknown`

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

### 类型明确时禁止额外使用泛型

> 当字段、类、函数参数或返回值已经可以直接写成明确类型时，禁止为了形式统一、预留扩展或书写习惯额外引入泛型。泛型只在需要表达多个位置之间的类型关联、根据输入推导输出类型，或复用同一套类型约束时使用。

推荐写法
```typescript
class AppError extends Error {
  public readonly code: AppErrorCodeName

  public constructor(code: AppErrorCodeName) {
    super(code)
    this.code = code
  }
}

function getObjectValue<TObject, TKey extends keyof TObject>(
  objectValue: TObject,
  objectKey: TKey,
): TObject[TKey] {
  return objectValue[objectKey]
}
```

不推荐写法
```typescript
class AppError<TCode extends AppErrorCodeName = AppErrorCodeName> extends Error {
  public readonly code: TCode

  public constructor(code: TCode) {
    super(code)
    this.code = code
  }
}
```

### `as` 只补明确类型

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
