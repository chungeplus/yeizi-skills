# CLI 项目全量自审设计

## Status

已完成设计讨论，等待文档审阅后再进入正式自审。

## 背景

`yeizi-skills` CLI 项目本身已经过几轮专项重构（错误模型、API 层、src 规则对齐），当前工作区里同时存在两类遗留：

- `src/**/*` 范围内还有未提交改动，其中一部分仍然不符合 7 类规则。
- `src` 之外（`scripts/`、`package.json`、`tsconfig.*`、`eslint.config.ts`、`README.md`、`docs/superpowers/**`、root 配置）此前从未按同一口径做过自审，命名、注释、结构和规则源之间的不一致没有收口。

之前 `2026-06-20-cli-src-rules-alignment` 计划把范围限制在 `src/**/*`，本次需要把范围扩大到整个 CLI 项目本体，对齐所有现存代码与配置，但**保持行为可改、可验证**的口径。

## 范围

本次自审覆盖：

- `src/**/*`
- `scripts/**/*`
- `bin/**/*`（如有）
- 根目录配置：`package.json`（仅脚本与配置结构，不审依赖选型）、`tsconfig.json`、`tsconfig.*.json`、`eslint.config.ts`
- 根目录文档：`README.md`
- 项目过程文档：`docs/superpowers/specs/**`、`docs/superpowers/plans/**`、`docs/superpowers/handoff/**`

本次不覆盖：

- `yeizi-styles/**`（上游规则源）
- `dist/`、`node_modules/`（构建产物）
- `bun.lock`（二进制锁文件）
- `CLAUDE.md`、`AGENTS.md`（规则源本身）
- `package.json` 内的 `dependencies` / `devDependencies` 字段（依赖选型不在本次自审范围）

## 约束

- 以 `rules/technologies/typescript/*` 和 `rules/projects/*` 为唯一规则来源。
- 不为未来变化提前扩展。
- 只清理本次自审直接造成的无用导入、变量、函数、文件。原本就存在的无关问题只说明，不擅自删除或连带清理。
- 行为可改（用户已确认），但每处行为改动必须能在验证步骤里看出差异。
- 不删除本次未确认要删的文件（包括当前空的 `src/types/error/` 目录）。
- 交付前必须使用当前项目已确认的检查命令验证结果。

## 目标

- 让 CLI 项目本体里所有可审计的文件与 7 类规则的主要硬约束对齐。
- 收口模块边界、导出方式、命名方式、局部实现位置和注释密度。
- 收口类型定义、参数约束、错误模型、配置结构、TSDoc 结构。
- 收口语句写法、循环方式、分支方式和错误处理风格。

## 非目标

- 不引入新的功能、命令或脚本。
- 不调整 `yeizi-styles/**` 下的上游规则源。
- 不重启测试基础设施（项目当前无任何 `*.test.ts`，不在本次范围）。
- 不调整依赖选型（`package.json` 的 `dependencies` / `devDependencies` 字段）。
- 不为“可能以后会用到”新增抽象层、配置项或扩展点。

## 备选方案

### 方案一：按规则类别全扫（已选）

按 `shared-rules -> code-rules -> comment-rules -> implementation-rules -> naming-rules -> statement-rules -> type-rules` 七类逐类扫描整个范围。每扫完一类运行 `bun run check` 验证。

优点：

- 与既有 `2026-06-20-cli-src-rules-alignment` 的层次划分经验一致。
- 单类 diff 集中，便于定位回归。
- 注释类规则放最后处理，避免放大其它类别的 diff。

缺点：

- 同一文件可能跨多类被多次修改，结尾要再做一次最终一致性自检。

### 方案二：按文件全扫

以单个文件为单位，每个文件过全部 7 类后再修下一个文件。

优点：

- 单文件上下文不切换。

缺点：

- 上下文受限，单文件 diff 频繁。
- 与既有计划的经验不一致。

### 方案三：按风险集群全扫

以高风险集群（`errors/`、`commands/`、`types/`、`features/skill/`）为单位，每集群内部过全部 7 类。

优点：

- 集群内一致性最好。

缺点：

- 同类规则在不同集群反复切换，全局一致性更难在中途检查。

## 设计决定

采用方案一：按规则类别全扫整个 CLI 项目本体。

原因：

- 当前规则本身分成 7 个维度，按维度推进最符合本次目标。
- 工作区已经有未提交改动，分轮更容易控制风险和定位回归。
- 与既有 `2026-06-20-cli-src-rules-alignment` 经验一致。

## 自审设计

### 第一类：shared-rules

只扫以下要点（本类不调整规则本身）：

- 不重复造目录、命名、风格沿用现有。
- 不引入未确认需求；不为未来变化提前扩展。
- 不修当前需求无关的内容。
- 现有结构能满足时必须复用。
- 修改现有代码时不顺手换风格。
- 完成前必须验证结果。

### 第二类：code-rules

- 注释只写代码本身看不出的事实，且单行注释放在代码上方。
- 参数类型写实际输入，不为兜底放宽成可选。
- 外部输入先检查后处理。
- 前置条件不满足时先结束，不把正常步骤包进一层又一层判断。
- 同一判断项 5 个及以上互斥分支改成分发表（仅在确实存在这种分支时执行）。
- 遍历时不直接修改当前数据。
- 文件名：小写中划线、表意、无空泛词（不因为“杂项”取泛名）。
- 日志和错误信息使用中文；命令名、路径、字段名、错误码、协议名保留原文。

### 第三类：comment-rules

- TSDoc 注释统一使用 TSDoc 规范。
- 有参数时写 `@param`，有返回值写 `@returns`，会抛错写 `@throws`，可复用函数写 `@example`。
- 同一块内容内部不写空行；块与块之间保留一行空行。
- `@example` 内容写在 `@example` 标签下一行。
- 多行注释写成独立的 `/** */` 结构。
- 类型、常量、配置、函数、类、方法、接口字段、对象成员、类字段统一使用 `/** */`。
- 函数体、方法体、流程片段内部说明使用单行 `//`。

### 第四类：implementation-rules

- 参数类型直接写实际会接收的输入。
- 一次调用做完就结束的逻辑使用 `function`；需要把数据、配置或依赖和多个方法放在一起时使用 `class`。
- 类属性单独在类中声明，不在 `constructor` 参数中通过 `public`、`private`、`protected` 直接声明。
- 抛错只使用 `Error` 或继承 `Error` 的错误实例。
- `catch (error)` 先用 `instanceof`、自定义类型谓词或 `typeof` 收窄到 `Error` 或业务错误类，再使用。

### 第五类：naming-rules

- 普通变量小驼峰；布尔变量用 `is`、`has`、`can` 开头。
- 不承担枚举值集合职责的固定常量用大写下划线；对象式枚举主体用大驼峰、成员用大写下划线、对应联合类型同名。
- 固定配置对象用小驼峰。
- 函数、方法用小驼峰；流程入口用 `runXxx`；`get/load`、`set/update`、`create/build`、`parse/format`、`render`、`add/remove`、`clear/reset/init`、`bind/unbind`、`handle`、`validate` 各司其职。
- 类名用大驼峰；接口名用 `I` 开头的大驼峰；类型名用大驼峰。

### 第六类：statement-rules

- 变量按是否重赋值区分 `const` 与 `let`，不使用 `var`。
- 模块导出统一写在文件底部。
- 判断不写 `=== true/false`；禁止三目运算符；禁用 `switch`。
- 禁用关键字循环（`for...in`、`for...of`、`for`、`while`、`do...while`），统一使用数组循环方法。
- 普通对象和其他可遍历内容先转成数组（`Object.keys()`、`Object.values()`、`Object.entries()`、`Array.from()`）。

### 第七类：type-rules

- 枚举值用 `const` 对象和联合类型，不使用 `enum`。
- 对象类型使用 `interface`；组合和派生类型使用 `type`。
- 禁止使用 `any` 和 `unknown`；类型明确时禁止额外使用泛型。
- `as` 只在你已经明确知道值是什么类型、只是 TypeScript 这里没推出来时使用，不把未校验输入直接断成业务类型。

## 执行顺序

1. shared-rules：扫描全范围，确认不存在“顺手换风格 / 提前扩展 / 不沿用现有”情况。
2. code-rules：扫描全范围，处理注释位置、输入校验、早返回、分发表、遍历变更、文件命名、中文文案。
3. comment-rules：扫描全范围，TSDoc 补全。
4. implementation-rules：扫描全范围，函数/类边界、`public` 私有、抛错、`catch` 收窄。
5. naming-rules：扫描全范围，命名收口。
6. statement-rules：扫描全范围，导出位置、循环方式、判断写法。
7. type-rules：扫描全范围，枚举、`interface/type`、`any/unknown`、泛型、`as`。

每类完成后运行 `bun run check`（shared-rules 这一类只查不改，跳过这一步）。全部完成后运行 `bun run check && bun test && bun run build`，并对 CLI 入口做最小 smoke（见验证方式）。

## 检查点

### 检查点一：shared-rules + code-rules

完成标准：

- 注释位置与内容收口（事实型、上方、不复述）。
- 参数类型收紧到实际输入。
- 输入校验前置；早返回生效。
- 文件命名一致；日志/错误文案中文。

### 检查点二：comment-rules

完成标准：

- 全部类型、常量、配置、函数、类、方法、字段均使用 `/** */` 或按规则使用 `//`。
- 可复用函数补齐 `@param` / `@returns` / `@throws` / `@example`。
- 同一块内无空行；块间留空行。

### 检查点三：implementation-rules

完成标准：

- 函数 vs 类的使用符合规则。
- 构造函数不再直接声明 `public`/`private`/`protected` 属性。
- 抛错统一为 `Error` 或子类。
- 所有 `catch` 都有类型守卫收窄。

### 检查点四：naming-rules

完成标准：

- 变量、函数、类、接口、类型、枚举命名全部按规则收口。
- 没有把 `runXxx` / `getXxx` / `loadXxx` / `setXxx` / `updateXxx` / `createXxx` / `buildXxx` / `parseXxx` / `formatXxx` / `renderXxx` / `addXxx` / `removeXxx` / `clearXxx` / `resetXxx` / `initXxx` / `bindXxx` / `unbindXxx` / `handleXxx` / `validateXxx` 互相混用。

### 检查点五：statement-rules

完成标准：

- `const`/`let` 按重赋值区分；无 `var`。
- 模块导出全部位于文件底部。
- 无 `=== true/false`、三目、`switch`、关键字循环。

### 检查点六：type-rules

完成标准：

- 枚举为 `const` 对象 + 联合类型；无 `enum`。
- 对象类型用 `interface`；组合/派生用 `type`。
- 无 `any`/`unknown`；无多余泛型；`as` 仅用于已知类型补全。

## 验证方式

每类完成后：

```powershell
bun run check
```

全部完成后：

```powershell
bun run check
bun test
bun run build
```

Smoke 验证（构建产物可启动）：

```powershell
node dist/index.js --help
node dist/index.js install --help
node dist/index.js list --help
node dist/index.js update --help
```

预期：

- `bun run check` 绿。
- `bun test` 报告 0 个测试通过（项目当前无 `*.test.ts`，预期行为）。
- `bun run build` 成功产出 `dist/index.js`。
- 4 个 `--help` 全部能正常输出帮助文本且无运行时异常。

## 风险与控制

### 风险一：注释规则放大 diff

控制方式：

- 把 comment-rules 放到第三类专门处理。
- 前两类不因注释问题反复改同一文件。

### 风险二：当前工作区已有未提交改动

控制方式：

- 不清理无关 diff。
- 每次修改前先读文件上下文，不覆盖已有用户改动。
- 遵循“只清理本次修改带来的问题”原则。

### 风险三：规则之间互相影响

控制方式：

- 每类结束后按“冲突、重复表达、职责混层”做一次自检。
- 一旦发现规则冲突，本类一起收口，不把冲突留到后面。

### 风险四：行为改动造成回归

控制方式：

- 行为可改，但每处改动需在最终验证里能看出差异（`bun run check` + smoke）。
- 不删除本次未确认要删的文件。

## 最终建议

按 7 类规则顺序（shared -> code -> comment -> implementation -> naming -> statement -> type）逐类扫描整个 CLI 项目本体（`src/`、`scripts/`、`bin/`、根目录配置与文档、`docs/superpowers/**`），每类完成后用 `bun run check` 验证，全部完成后跑 `bun run check && bun test && bun run build` 并对 4 个 CLI 入口做最小 smoke。