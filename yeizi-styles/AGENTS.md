# yeizi styles 工作区规则

这个文件只约束工作区级边界，不承载 `rules-project` 和 `agents-project` 的正文写法规则。

## 工作区边界
### 根 AGENTS.md 先遵守 Claude 官方最佳实践
> 修改工作区根 `AGENTS.md` 时，优先遵守 Claude 官方关于“编写有效的 CLAUDE.md / AGENTS.md”的最佳实践：保持简短，只写每次会话都适用、且 Claude 不能从代码中直接推断出的持久上下文。

### 这是两个并列子项目
> 当前工作区包含 `rules-project` 和 `agents-project` 两个并列子项目。前者维护规则源，后者维护最终 AI 产物。

### 修改哪个子项目就遵守哪个 AGENTS
> 修改 `rules-project` 时，遵守 `rules-project/AGENTS.md`。修改 `agents-project` 时，遵守 `agents-project/AGENTS.md`。

### 根目录只管导航和边界
> 根目录 `README.md` 和 `AGENTS.md` 只负责工作区导航、结构说明和修改边界，不承载子项目正文规则。

### 不跨子项目顺手改文风
> 不把 `rules-project` 的人类可读写法顺手带进 `agents-project`，也不把 `agents-project` 的 AI-facing 写法反向带进 `rules-project`。

### 不跨子项目顺手改 skill
> 修改某个子项目的 skill 时，只处理该子项目自己的 skill，不顺手改另一个子项目的 skill 结构和文风。

### skill 产物默认不直接手改
> `rules-project/rules/scenes/*-rules.md` 和 `agents-project/agents/*.md` 都视为 skill 产物。默认不直接修改这些文件；需要调整内容时，先修改对应 skill、共享规则、技术规则或已确认基线，再重新生成。

### 长期约束写回对应子项目
> 适合长期沉淀为规则源写法的要求写回 `rules-project/AGENTS.md`，适合长期沉淀为最终 AGENTS 写法的要求写回 `agents-project/AGENTS.md`。

### 只问子项目就只答子项目
> 用户只询问 `rules-project` 或 `agents-project` 某一侧内容时，只回答该子项目自己的职责、流程和边界。只有用户明确询问工作区整体流程、上下游衔接或两个子项目关系时，才同时展开另一侧内容。
