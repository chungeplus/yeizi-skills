# 项目级 `code-rules` 文件设计

## 目标

为跨语言、跨技术栈都成立的代码编写规则单独建立项目级规则文件，避免继续把这类内容混放在 `shared-rules.md` 或单一语言的技术规则里。

## 本次范围

本次只处理下面 2 件事：

- 在 `rules/projects/` 下新增 `code-rules.md`
- 在新文件里加入“重要判断分支需要写注释”这一条规则

本次不处理下面内容：

- 不改 `rules/technologies/typescript/comment-rules.md` 的现有结构
- 不把 `TypeScript` 的通用注释规则整批迁到项目级
- 不把“日志和错误信息使用中文”在这次一并迁入 `code-rules.md`

## 结论

项目级跨语言编码规则单独放在 `rules/projects/code-rules.md`。

`rules/projects/shared-rules.md` 继续承载协作边界、执行边界和项目通用默认约束，不继续吸收新的代码写法细则。

## 为什么不用 `comment-rules.md`

- 这次虽然先落的是“判断分支注释”规则，但后续你已经明确希望把“日志和错误信息使用中文”这类编码约束也放进同一文件
- `comment-rules.md` 更像只管理注释，后续装入日志、错误信息、其他跨语言编码要求后，文件名会越来越不贴内容
- `code-rules.md` 更适合承接“任何语言都成立的代码编写规则”

## 文件分工

### `rules/projects/shared-rules.md`

保留下面这类内容：

- 协作顺序
- 任务执行边界
- 修改范围边界
- 验证与交付边界

### `rules/projects/code-rules.md`

承接下面这类内容：

- 跨语言通用的注释原则
- 跨语言通用的日志和错误信息书写规则
- 其他不依赖单一语言语法的代码编写规则

### `rules/technologies/typescript/comment-rules.md`

继续承接下面这类内容：

- `TypeScript` 专属或强相关的注释写法
- `/** */`、`@param`、`@returns`、`@throws`、`@example` 这类依赖当前语言和当前文档风格的细则

## 本次要新增的规则

建议先在 `rules/projects/code-rules.md` 建一个最小可扩展的结构，本次只放一条：

### 重要判断分支写注释

> 重要判断分支需要写注释，直接说明当前分支在判断什么，或为什么必须这样分支处理。

## 这里的“重要判断分支”指什么

默认指下面这些不是只看代码字面就能马上懂的分支：

- 承载业务前提的判断
- 处理特殊路径或例外路径的判断
- 依赖顺序、时机、副作用或兼容约束的判断
- 如果删掉或改错就容易引发行为偏差的判断

不包括下面这些通常不需要专门加注释的情况：

- 含义已经被命名直接说清的简单空值判断
- 纯粹直白的类型判断
- 没有额外业务背景的简单长度或布尔判断

## 本次不一起迁移的原因

- 当前用户目标是先确认文件命名和第一条规则的落点
- 如果这次顺手搬迁 `TypeScript comment-rules` 里的通用内容，会把任务从“新增一条规则”扩大成“规则体系拆层重构”
- 先建立 `code-rules.md`，后续再逐条迁移通用内容，会更稳，也更容易检查冲突和重复

## 执行检查点

1. 新增 `rules/projects/code-rules.md`
2. 写入“重要判断分支写注释”规则
3. 检查 `shared-rules.md`、`code-rules.md`、`typescript/comment-rules.md` 的职责边界，没有明显冲突和重复

## 完成标准

- 项目里出现独立的 `rules/projects/code-rules.md`
- 新文件能承接跨语言编码规则，而不是只像一次性的占位文件
- “重要判断分支需要写注释”被明确写成项目级规则
- 本次没有把范围扩成 `TypeScript comment-rules` 的整体迁移
