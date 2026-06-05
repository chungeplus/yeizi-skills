# generate-scene-agents 确认流程设计

## 背景

当前 `generate-scene-agents` 更接近“已知 scene 后直接生成”的技能说明，但这还不够稳。

按当前工作区的使用方式，项目管理者更常见的输入不是已经确认好的完整规则读取范围，而是类似：

- `/generate-scene-agents 生成 cli-tool 场景项目的 AGENTS.md`

这类输入只给出了业务场景线索，没有完成：

- scene rule source 最终确认
- technology rules 最终确认
- 规则缺失时的停止与补全出口

如果 skill 在这些信息还没确认时就直接生成，最终 `agents/*.md` 更容易读错规则范围、混入不该读的技术规则，或者在规则源不完整时硬生成产物。

## 目标

- 让 `generate-scene-agents` 本身承担完整的推荐、确认、停止和生成流程
- 让项目管理者可以从一句场景描述启动流程，而不是先手工整理完整读取范围
- 让 scene 选择和 technology 选择都变成“先推荐，再确认”
- 让规则源不完整时可以中止当前 skill，先补 `rules-project`
- 保持最终 `agents/*.md` 继续高约束、强限制、固定场景化，不因为追求简短而删掉能减少 AI 幻觉的规则

## 不做的事

- 不让 `generate-scene-agents` 顺手补写 `rules-project/rules/scenes/*-rules.md`
- 不让 `generate-scene-agents` 顺手补写 `rules-project/rules/technologies/*`
- 不把推荐过程、确认过程、来源说明写进最终 `agents/*.md`
- 不把 `vite`、`axios`、`commander` 这类工具或库直接当成 technology rules 的候选技术类别
- 不因为对齐文档最佳实践而缩减已确认的强约束规则

## 设计原则

### skill 负责流程，产物只保留持久规则

推荐、匹配、确认、停止这些一次性工作流留在 `generate-scene-agents`。

最终 `agents/*.md` 只保留 AI 长期需要的执行合同，不写：

- 推荐过程
- 匹配分数
- 人工确认过程
- 维护说明
- 生成说明

### 没确认就不生成

scene 没确认、technology rules 没确认，或项目管理者明确要求先补规则源时，skill 直接停止，不继续生成。

### 只从当前确认场景提取技术类别

技术规则候选范围只从当前已确认的 `rules-project/rules/scenes/<scene>-rules.md` 的 `技术方案` 提取，不横向扫描其他 scene 的技术使用情况。

### 技术类别和工具选型分开

这里的技术类别只指语言、框架和代码技术，例如：

- `TypeScript`
- `Vue`
- `React`
- `CSS`
- `HTML`

不把 `vite`、`eslint`、`axios`、`commander`、`zod` 这类项目选型、工具或库直接映射成 `rules/technologies/*` 候选。

### 规则完整性优先于文件大小

最终 `agents/*.md` 的目标是减少固定场景开发中的 AI 自由发挥和幻觉，不用为了省 token 删掉已确认且有约束价值的规则。

## 流程设计

### 1. 启动阶段

用户输入类似：

- `/generate-scene-agents 生成 cli-tool 场景项目的 AGENTS.md`

skill 先做两件事：

1. 提取用户输入里的业务场景描述
2. 扫描 `rules-project/rules/scenes/*-rules.md` 当前存在的 scene rule source

这一步不直接假设用户输入的词就是最终 scene id。

### 2. scene 候选匹配

skill 对 `rules-project/rules/scenes/*-rules.md` 里的所有 scene rule source 做候选匹配，并按匹配度降序排列。

每个候选必须同时展示：

- scene 文件路径
- 默认候选与否
- 匹配理由

匹配理由必须可解释，至少允许来自这些信号：

- scene 文件名命中
- 文档标题命中
- 业务关键词命中
- 目录骨架命中
- 命令词命中

如果用户输入能够精确命中某个 scene，例如 `cli-tool` 命中 `rules-project/rules/scenes/cli-tool-rules.md`，这个候选设为默认项，但仍然必须展示并等待项目管理者确认。

### 3. scene 确认

项目管理者面对 scene 候选时必须有这几种选择：

- 确认默认候选
- 改选其他候选
- 明确表示当前没有合适场景

如果项目管理者选择“没有合适场景”，skill 立即停止，并明确提示应先去补：

- `rules-project/rules/scenes/*-rules.md`

在 scene 未被显式确认前，不进入技术规则选择阶段。

### 4. 从当前 scene 提取技术类别

scene 确认后，skill 只读取当前已确认的：

- `rules-project/rules/scenes/<scene>-rules.md`

然后只从这个文件的 `技术方案` 提取已确认技术类别。

提取目标必须限制在语言、框架和代码技术层，不把工具、库和项目选型直接混入 technology rules 候选。

### 5. technology 候选匹配

对每一个已提取的技术类别，skill 都要去：

- `rules-project/rules/technologies/*`

中寻找最合适的 technology rule directory，并按匹配度降序排列。

每个技术类别的候选展示必须包含：

- 技术类别名称
- 候选技术规则目录
- 默认候选与否
- 匹配理由

匹配理由也必须可解释，例如：

- 技术类别名称和目录名一致
- 技术类别名称和规则标题一致
- 当前目录确实覆盖该语言或框架

如果某个技术类别没有合适 technology rules，不能自动降级成别的技术规则，也不能假装已经覆盖。

### 6. technology 逐项确认

项目管理者对每个技术类别都需要逐项确认。每一项都允许：

- 接受默认候选
- 改选其他候选
- 明确表示当前没有合适技术规则

如果项目管理者表示没有合适技术规则，skill 立即停止，并明确提示应先去补：

- `rules-project/rules/technologies/*`

### 7. technology 总确认

所有技术类别逐项处理完后，skill 再给一次总确认视图，统一展示：

- 已确认的 scene
- 每个技术类别最终选中的 technology rule directory
- 本次将固定读取的共享项目规则

只有项目管理者对这份总览再次明确确认后，skill 才进入最终读取和生成阶段。

### 8. 最终读取与生成

在 scene 和 technology 都完成确认后，skill 固定读取三层规则：

- 当前已确认的 `rules-project/rules/scenes/<scene>-rules.md`
- 项目管理者确认后的 `rules-project/rules/technologies/*`
- `rules-project/rules/projects/shared-rules.md`

然后按现有 `generate-scene-agents` 的职责分层合并：

- scene `项目规则`、`业务规则`、`实现边界` 落到最终 `项目规则`
- scene `技术方案` 落到最终 `技术方案`
- shared rules 落到最终 `通用开发规则`
- selected technology rules 落到最终 `技术与代码规则`
- scene `目录参考` 落到最终 `目录参考`

## 停止条件

出现下面任一情况时，skill 直接停止，不生成 `agents/*.md`：

- 没有 scene 候选被项目管理者确认
- 项目管理者明确表示当前没有合适 scene
- 当前 scene 的技术方案无法提取出清晰的技术类别
- 某个技术类别在 `rules-project/rules/technologies/*` 中没有合适候选
- 项目管理者明确表示当前没有合适技术规则
- technology 总确认没有通过

停止时必须明确说明：

- 当前卡在哪一层
- 需要补哪类规则源
- 应该回到 `rules-project/rules/scenes/*` 还是 `rules-project/rules/technologies/*`

## 产物约束

流程虽然变成交互式确认工作流，但最终 `agents/*.md` 的约束继续保持不变：

- 仍然是 AI 执行合同，不是人类说明文档
- 仍然保持固定五段结构
- 仍然优先保留高约束、强限制和低歧义规则
- 不写推荐过程、确认过程、来源说明、维护说明
- 不因为“文档简洁”去删掉已确认的硬规则

## 一致性要求

修改后，下面几件事必须同时成立：

- 用户可以只给业务场景描述启动 `generate-scene-agents`
- skill 会先扫描全部 scene rule source，再做候选推荐
- 精确命中的 scene 只是默认候选，不是自动通过
- technology 候选只从当前已确认 scene 的 `技术方案` 提取
- technology 候选只映射语言、框架和代码技术，不混入工具和库
- 每个技术类别都先逐项确认，再做一次总确认
- 规则源不完整时，skill 能明确停止并指向需要补全的目录
- 最终 `agents/*.md` 继续保持强约束，不因流程升级而被削弱

## 完成标准

- `generate-scene-agents` 的流程说明已经覆盖 scene 推荐、scene 确认、technology 推荐、technology 逐项确认、technology 总确认、最终生成
- scene 候选和 technology 候选都要求按匹配度降序展示
- scene 候选和 technology 候选都要求展示匹配理由
- 精确命中的 scene 会被设为默认候选，但仍需确认
- scene 不匹配时，skill 会停止并提示补 `rules-project/rules/scenes/*`
- technology 不匹配时，skill 会停止并提示补 `rules-project/rules/technologies/*`
- technology rules 的选择范围只来自当前确认 scene 的 `技术方案`
- 最终产物不写流程说明，但继续保留完整强约束规则
