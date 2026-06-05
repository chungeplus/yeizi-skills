# generate-scene-rules 扫描边界设计

## 背景

`generate-scene-rules` 当前已经具备这些能力：
- 读取 `rules-project` 自身说明
- 读取共享项目规则
- 读取已有 scene rule source
- 在有参考项目时抽取业务、基线、技术和目录线索
- 在技术方案确认后读取相关技术规则

但按当前工作区结构来看，这个 skill 还有两个扫描缺口：

1. 它没有先读取工作区根 `README.md` 和根 `AGENTS.md`
2. 它没有先扫描 `rules-project/rules/technologies/*` 当前到底有哪些技术规则目录

这两个缺口会带来两个具体问题：
- 在当前线程同时出现 `rules-project` 和 `agents-project` 信息时，skill 更容易串场回答另一侧内容
- 后续技术规则目录变多后，skill 可能漏掉当前工作区里真实存在的技术规则桶

## 目标

- 让 `generate-scene-rules` 在进入 `rules-project` 细节前，先读取工作区级边界
- 让 `generate-scene-rules` 默认只展开 `rules-project` 自己的职责、流程和边界
- 让 `generate-scene-rules` 在确认技术方案前，先扫描当前工作区里已有的技术规则目录
- 保持现有 scene rule source 生成逻辑不变，只补扫描顺序和读取边界

## 不做的事

- 不重写现有 scene rule source 的五段输出结构
- 不修改 `generate-scene-agents`
- 不调整已有业务规则、实现边界、目录参考的判断口径
- 不把这次设计扩展成 skill 全量重构

## 问题定位

### 工作区边界没有先读

当前 `Read First` 只读取：
- `rules-project/README.md`
- `rules-project/AGENTS.md`
- `rules-project/rules/projects/shared-rules.md`
- 已存在的 scene rule source

这样会漏掉工作区根层已经写明的边界：
- 这是两个并列子项目
- 只问子项目就只答子项目
- 只有明确询问整体流程或衔接关系时，才展开另一侧内容

### 技术规则候选范围没有先扫

当前流程里只有“确认 tech scheme 后读取相关 `rules-project/rules/technologies/*`”，但没有先扫描：
- 当前工作区到底有哪些 technology rule directories
- 哪些目录是这次 scene 可以选用的候选范围

当技术目录从单一 `typescript/` 扩展成多个目录后，这种写法容易造成漏扫或误扫。

## 设计

### Read First 增加工作区级文档

把工作区根文档加入 `Read First`，顺序放在 `rules-project` 自身文档之前。

新的 `Read First` 固定包含：
- workspace `README.md`
- workspace `AGENTS.md`
- `rules-project/README.md`
- `rules-project/AGENTS.md`
- `rules-project/rules/projects/shared-rules.md`
- existing `rules-project/rules/scenes/<scene>-rules.md` when that file already exists

这样 skill 先知道：
- 当前任务属于哪个子项目
- 当前回答默认应该停在哪个子项目边界内
- 什么情况下才允许展开 sibling project 的上下游关系

### Workflow 前段增加工作区边界扫描

在读取 `rules-project` 细节前，新增一步工作区级扫描：

1. 先读取工作区级 guidance
2. 确认当前任务属于 `rules-project`
3. 默认把本轮讨论、草案和输出限制在 `rules-project`
4. 只有用户明确询问跨项目衔接或整体流程时，才允许展开 `agents-project`

这一步不是让 skill 去读取 `agents-project` 细节，而是先知道什么时候不该展开另一侧。

### Workflow 前段增加技术目录扫描

在读取参考项目和确认 tech scheme 之间，新增一步：

- 扫描 `rules-project/rules/technologies/*` 当前存在的技术规则目录
- 把这次扫描结果当作当前工作区的完整候选技术规则范围
- 如果某个技术目录当前不存在，就不能默认假设它可用

之后再沿用现有逻辑：
- 确认 tech scheme
- 从已经扫描到的目录里选择相关技术规则
- 继续读取具体技术规则文件

### 技术规则读取继续分层

保留当前这层规则不变：
- `rules/technologies/*/directory-rules.md` 只定义通用目录分类
- `rules/scenes/<scene>-rules.md` 只定义场景目录骨架

这次设计只补“先扫有哪些技术目录”，不改变后续“怎么分层读取”的判断逻辑。

### Guardrails 增加两条禁止项

新增两条 guardrails：

- 默认不展开 `agents-project` workflow、output structure 或 generation details，除非用户明确问跨项目衔接或整个工作区流程
- 在决定技术规则范围前，不得跳过对 `rules-project/rules/technologies/*` 的现存目录扫描

这样可以把“默认不串场”和“默认不漏扫技术规则桶”写死成显式约束。

## 一致性要求

修改后，下面几件事必须同时成立：

- `generate-scene-rules` 默认只在 `rules-project` 范围内回答和起草
- 用户只问 `rules-project` 时，skill 不默认展开 `agents-project` 的细节
- skill 在决定技术规则范围前，先知道当前工作区有哪些技术目录
- 当前工作区新增技术规则目录后，skill 能把这些目录纳入候选扫描范围
- 现有 scene rule source 生成流程、五段结构和写法约束不被改坏

## 完成标准

- `Read First` 已加入工作区根 `README.md` 和根 `AGENTS.md`
- `Workflow` 已加入工作区边界扫描步骤
- `Workflow` 已加入 `rules-project/rules/technologies/*` 目录扫描步骤
- `Workflow` 明确“只从当前扫描到的技术目录中选择相关规则”
- `Guardrails` 已明确禁止默认展开 `agents-project` 细节
- `Guardrails` 已明确禁止跳过技术目录扫描
- 这次改动不改变现有 scene rule source 的输出结构和 section 口径
