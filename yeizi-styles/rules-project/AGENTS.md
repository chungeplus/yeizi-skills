# rules-project AGENTS 约束

这个文件只写 `rules-project` 内 AI 默认必须遵守的长期约束，分为两类：
- `rules/` 条目的生成与写法约束
- `rules-project` 范围内的通用默认边界

## rules/ 条目约束
### 适用范围
> 本文件约束 `rules/projects/*`、`rules/technologies/*` 和 `rules/scenes/*-rules.md` 这类给人阅读的规则条目。

### rules 正文写法不反向约束 skill
> 这里的写法标准只约束给人阅读的规则正文，不直接套到 `.agents/skills/*` 的 skill 正文。

### prototype 不受本文件正文格式控制
> `rules/scenes/prototypes/*-prototype.md` 不受本文件的 rules 正文格式约束；涉及 prototype 的结构、字段和修订边界时，优先遵守对应 prototype 契约。

### 规则先给人看
> 规则文件默认面向人类阅读和修改，文字直接易懂，不写成只方便生成的压缩表达。

### 标题短且语义化
> 标题直接写约束本身，保持简短，不反复堆来源提示。

### 正文直接且可判对错
> 正文先写要做什么、保持什么、禁止什么；一条规则只写一个主题，使用可以直接判断对错的表达。

### 说明只保留必要信息
> 只在影响理解时补来源、说明或示例，不写成长段，不把规则文档写成来源说明或写作教程。

### 人类可见说明默认通俗语义化
> 涉及管理员或其他人类可见说明时，默认使用通俗、直接、语义化表达，不使用只有 AI 或流程内部才看得懂的术语。

## rules-project 通用边界
### 已确认基线优先
> 用户已确认的规则、技术和实现方案默认就是当前基线。后续整理规则和补全文档时先沿用这些内容，不擅自换路线。

### 可以建议但不改写用户风格
> 可以补充建议、替代方案和风险说明，但不能未经确认就把用户已确认内容改写成推荐方案。

### 不扩展未确认范围
> 不顺手补未确认主题，不重写当前任务以外的章节。

### 补写通用规则先沿用现有基线
> 生成或补写 `rules/projects/*`、`rules/technologies/*` 时，先沿用已确认基线与现有同类文件的结构，不凭空扩章节或发明新层级。

### 没有同类基线时先停下来确认
> 补写 `rules/projects/*`、`rules/technologies/*` 时，如果当前没有可沿用的同类基线或现有同类文件，先停下来确认，不自行发明章节结构。

### 补写项目级规则时按既有文件分工落位
> 补写 `rules/projects/*` 时，项目级跨语言代码规则写入 `rules/projects/code-rules.md`，项目级协作、执行、修改和验证边界写入 `rules/projects/shared-rules.md`；先沿用对应文件现有结构，不跨文件混写。

### final scene-rules 的唯一内容来源是同名 prototype
> `rules/scenes/*-rules.md` 的最终内容只来自同名 `rules/scenes/prototypes/*-prototype.md`。

### 改 scene 内容只改 prototype
> 收到对 `rules/scenes/*-rules.md` 业务内容、结构语义或文案的修改请求时，默认不直接编辑产物文件；先改同名 prototype，再通过对应生成链路更新 final scene-rules。

### 修已有 prototype 优先走对应修订链路
> 需要补充、收紧或修订已有 prototype 时，优先遵守对应 prototype 契约与 `revise-scene-prototype`，不把 `generate-scene-prototype` 当默认修订入口。

### 已有 scene 的内容修改默认视为 prototype 修订
> 收到对已有 scene 内容的修改请求时，默认视为同名 prototype 的修订，不把它当成 prototype 首次生成任务。

### skill 只负责处理链路
> `.agents/skills/*` 只负责流程、渲染、校验、命名和生成方式，不承载具体 scene 业务内容；需要改内容时，回 prototype 或对应人类规则文件。

### 不默认新增 skill
> 只有在现有 skill 无法承接明确的长期链路需求时，才新增或拆分 skill；不要把一次性任务或单次内容修订沉淀成新 skill。

### 改渲染、校验、命名、生成方式才改 skill
> 只有在调整渲染方式、校验逻辑、命名规则或生成方式时，才修改对应 skill，不把 skill 当 scene 内容上游。

### final scene-rules 的格式和生成改回 skill
> `rules/scenes/*-rules.md` 的输出格式、章节结构、渲染检查点、校验逻辑、命名和生成方式调整回对应 skill 与输出契约副本。
