# yeizi styles

这是一个包含两个并列子项目的工作区：
- `rules-project`：维护给人看的规则源
- `agents-project`：维护给 AI 直接使用的最终场景 AGENTS 产物

## 目录

```text
yeizi-styles/
  README.md
  AGENTS.md
  rules-project/
  agents-project/
  docs/
```

## 子项目说明

### rules-project
- 维护共享规则、技术规则和场景规则源
- 生成 `rules/scenes/*-rules.md`
- 规则文档优先服务人类确认、阅读和维护

### agents-project
- 维护最终 `agents/*.md`
- 从完整规则源生成 AI-facing 场景 AGENTS
- 最终产物优先服务 AI 稳定执行

## 使用顺序

1. 先在 `rules-project` 中补齐或重建 `rules-project/rules/scenes/*-rules.md`
2. 再在 `agents-project` 中根据完整规则源生成 `agents-project/agents/*.md`

## 修改约定

- 修改规则源时，进入 `rules-project`
- 修改最终 AI 产物生成规则时，进入 `agents-project`
- 具体写法和边界以各自子项目里的 `AGENTS.md` 为准
