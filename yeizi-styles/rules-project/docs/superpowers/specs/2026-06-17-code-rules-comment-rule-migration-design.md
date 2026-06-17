# `code-rules` 注释规则迁移设计

## 目标

把“注释直接写清意思”从 `TypeScript` 技术规则迁到项目级 `code-rules.md`，并同步补清 `README.md` 与 `AGENTS.md` 对 `code-rules.md` / `shared-rules.md` 分工的说明。

## 本次范围

本次只处理下面 4 件事：

- 在 `rules/projects/code-rules.md` 增加“注释直接写清意思”
- 从 `rules/technologies/typescript/comment-rules.md` 删除这整条规则及其推荐/不推荐示例
- 在 `README.md` 补清 `rules/projects/code-rules.md` 和 `rules/projects/shared-rules.md` 的职责说明
- 在 `AGENTS.md` 补一条 `rules/projects/*` 的放置边界，说明项目级跨语言代码规则与项目级协作/执行边界分别写到哪儿

本次不处理下面内容：

- 不迁移 `comment-rules.md` 的其他规则
- 不修改 `code-rules.md` 里已有的“重要判断分支写注释”
- 不把 `code-rules.md` 扩成带推荐/不推荐代码示例的技术细则文件

## 现有依据

这次改动不是重新发明结构，而是沿用当前已经存在的两种写法：

- `rules/projects/shared-rules.md` 当前是项目级规则正文风格，只写标题和规则正文，不写推荐/不推荐代码示例
- `rules/projects/code-rules.md` 当前也沿用同样风格，只写标题和规则正文
- `rules/technologies/typescript/comment-rules.md` 当前是技术细则风格，带 `TypeScript` 代码示例

所以“注释直接写清意思”迁到项目级时，应沿用 `rules/projects/*` 现有写法，而不是把 `TypeScript` 代码示例一起搬过去。

## 结论

### `rules/projects/code-rules.md`

新增下面这条规则：

### 注释直接写清意思

> 注释直接写清当前内容在做什么、为什么这样做，或会带来什么影响。

这里保持项目级规则文件现有风格，只保留标题和规则正文，不保留推荐/不推荐代码示例。

### `rules/technologies/typescript/comment-rules.md`

删除当前这整条内容：

- `### 注释直接写清意思`
- 规则正文
- 推荐写法代码块
- 不推荐写法代码块

删除后，`comment-rules.md` 继续只保留真正需要 `TypeScript` 语法或 `TypeScript` 文档风格来说明的内容。

## README 要补什么

`README.md` 目前只说明了 `rules/projects/*` 是“项目级通用规则”，还没有把 `shared-rules.md` 和 `code-rules.md` 的职责拆开说明。

这次应补清下面这层分工：

- `rules/projects/shared-rules.md`：项目级协作、执行、修改和验证边界
- `rules/projects/code-rules.md`：项目级跨语言代码规则

除了目录说明，常见任务里也应能让人快速判断：

- 改项目级跨语言代码规则：优先改 `rules/projects/code-rules.md`
- 改项目级协作或执行边界：改 `rules/projects/shared-rules.md`

## AGENTS 要补什么

`AGENTS.md` 目前约束了“补写 `rules/projects/*` 先沿用现有基线”，但还没有明确 `rules/projects/` 内部两个文件的分工。

这次应补一条长期边界，明确：

- 项目级跨语言代码规则写入 `rules/projects/code-rules.md`
- 项目级协作、执行、修改和验证边界写入 `rules/projects/shared-rules.md`

这样后续 AI 再补 `rules/projects/*` 时，不会把代码规则继续写回 `shared-rules.md`，也不会把协作边界误写进 `code-rules.md`。

## 为什么不在项目级保留示例

- 项目级 `code-rules.md` 当前不是技术教程文件，而是跨语言规则源
- 一旦保留代码块示例，就必须默认某种具体语言
- 现有 `rules/projects/*` 已经形成“不靠代码示例承载规则”的风格
- 语言级示例继续留在 `rules/technologies/*` 更稳定

## 执行检查点

1. `code-rules.md` 中出现“注释直接写清意思”，并保持项目级正文风格
2. `comment-rules.md` 中不再保留这条规则及其示例
3. `README.md` 能明确区分 `code-rules.md` 和 `shared-rules.md`
4. `AGENTS.md` 能明确区分 `code-rules.md` 和 `shared-rules.md` 的长期放置边界

## 完成标准

- “注释直接写清意思”被迁到项目级 `code-rules.md`
- `comment-rules.md` 不再重复承接这条跨语言规则
- `README.md` 和 `AGENTS.md` 都能说明 `code-rules.md` 的职责
- 这次改动有据可依，沿用的是当前 `rules/projects/*` 已有写法，不是新发明一套风格
