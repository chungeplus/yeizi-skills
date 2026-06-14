# rules-project AGENTS 约束

这个文件只写 `rules-project` 内 AI 默认必须遵守的长期约束，分为两类：
- `rules/` 条目的生成与写法约束
- `rules-project` 范围内的通用默认边界

## rules/ 条目约束
### final scene-rules 的唯一内容来源是同名 prototype
> `rules/scenes/*-rules.md` 的最终内容只来自同名 `rules/scenes/prototypes/*-prototype.md`。

### 改 scene 内容只改 prototype
> 需要调整 scene-rules 的业务内容、结构语义或文案时，只修改同名 prototype，不把 `rules/scenes/*-rules.md` 当长期手改源。

### 改渲染、校验、命名、流程才改 skill
> 只有在调整渲染方式、校验逻辑、命名规则或生成流程时，才修改 `generate-scene-rules` 或相关 skill。

### generate-scene-rules 不能成为第二内容上游
> `generate-scene-rules` 负责把 prototype 渲染成 final scene-rules，不负责定义 scene 内容，不能成为第二内容上游。

### projects 与 technologies 不会自动并入 final scene-rules
> `rules/projects/*` 和 `rules/technologies/*` 是独立的人类规则文件，不会自动并入任何 final `rules/scenes/*-rules.md`。

### scene-rules 输出契约变更要同步 skill 副本
> 只有 final `rules/scenes/*-rules.md` 的输出格式、章节结构或渲染检查点发生变化时，才同步更新 `generate-scene-rules` 里的 scene-rules 输出契约副本。

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
### 当前项目 AGENTS.md 先遵守 Claude 官方最佳实践
> 修改 `rules-project/AGENTS.md` 时，优先遵守 Claude 官方关于“编写有效的 CLAUDE.md / AGENTS.md”的最佳实践：保持简短，只写每次会话都适用、且 Claude 不能从代码中直接推断出的持久上下文。

### 已确认基线优先
> 用户已确认的规则、技术和实现方案默认就是当前基线。后续整理规则和补全文档时先沿用这些内容，不擅自换路线。

### 可以建议但不改写用户风格
> 可以补充建议、替代方案和风险说明，但不能未经确认就把用户已确认内容改写成推荐方案。

### 不扩展未确认范围
> 不顺手补未确认主题，不重写当前任务以外的章节。

### scene-rules 调整回正确上游
> `rules/scenes/*-rules.md` 的内容调整回同名 prototype；输出格式、章节结构、渲染检查点、校验逻辑、命名和生成方式调整回对应 skill 与输出契约副本；不把产物文件当长期手改源。
