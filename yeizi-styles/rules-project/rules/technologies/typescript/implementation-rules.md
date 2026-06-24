# TypeScript 实现规则

## 函数实现规则

### 参数类型写实际输入

> 参数类型直接写这个函数实际会接收什么输入。参数本来必须传入时，不写成可选参数；调用方本来不该传入的值，也不为了兼容旧写法随意放宽类型。

推荐写法
```typescript
function parseValue(rawInput: string): string {
  return rawInput.trim()
}
```

不推荐写法
```typescript
function parseValue(rawInput?: string): string {
  if (rawInput === undefined) {
    return ""
  }
  return rawInput.trim()
}
```

### 参数签名不写 `readonly`，函数内不直接修改参数

> 项目内函数参数签名不写 `readonly`。同时，函数内不直接修改参数本身，也不原地修改参数承载的数据。需要变更时，先复制到局部变量或新数据再处理。

推荐写法
```typescript
function sortItemList(itemList: Item[]): Item[] {
  const nextItemList = [...itemList]

  nextItemList.sort((leftItem, rightItem) => leftItem.order - rightItem.order)

  return nextItemList
}
```

不推荐写法
```typescript
function buildItemNameList(itemList: readonly Item[]): string[] {
  return itemList.map((item) => item.name)
}

function sortItemList(itemList: Item[]): Item[] {
  itemList.sort((leftItem, rightItem) => leftItem.order - rightItem.order)

  return itemList
}
```

## class 和 function 使用规则

### 单次处理用 function

> 一次调用做完就结束的逻辑，使用 function。需要把数据、配置或依赖和多个方法放在一起时，使用 class。

推荐写法
```typescript
function renderError(title: string, message: string): void {
  console.error(`[${title}] ${message}`)
}
```

不推荐写法
```typescript
class TitlePrinter {
  public render(title: string, message: string): void {
    console.error(`[${title}] ${message}`)
  }
}
```

## 类实现规则

### 构造函数参数不直接声明属性

> 类属性单独在类中声明，不在 `constructor` 参数中通过 `public`、`private`、`protected` 直接声明。构造函数只负责接收参数和显式赋值，保持类结构清晰。

推荐写法
```typescript
class InputData {
  public value: string

  public constructor(value: string) {
    this.value = value
  }
}
```

不推荐写法
```typescript
class InputData {
  public constructor(public value: string) {}
}
```

## 错误实现规则

### 抛错只用 `Error` 或其子类实例

> 需要抛错时，只使用 `Error` 或继承 `Error` 的错误实例，不抛字符串，也不抛临时对象。

推荐写法
```typescript
throw new ParseError("输入不能为空")
```

不推荐写法
```typescript
throw "输入不能为空"
```

### `catch` 里先用类型守卫收窄

> `catch (error)` 先用 `instanceof`、自定义类型谓词或 `typeof` 把它收窄到 `Error` 或自定义错误类。不把它直接断成具体类型。

推荐写法
```typescript
} catch (error) {
  if (error instanceof ParseError) {
    return error.code
  }
  if (error instanceof Error) {
    return ErrorCode.UNKNOWN
  }
  throw error
}
```

不推荐写法
```typescript
} catch (error) {
  return (error as ParseError).code
}
```
