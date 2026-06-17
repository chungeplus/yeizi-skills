# agents-project

这个子项目维护最终给 AI 使用的场景 AGENTS 产物。
以下路径默认相对当前 `agents-project/` 目录。

## 目录

```text
agents-project/
  README.md
  AGENTS.md
  .agents/
    skills/
      generate-scene-agents/
        SKILL.md
  agents/
```

## 目录说明

- `agents/`：最终场景 AGENTS 产物
- `.agents/skills/generate-scene-agents/`：根据完整规则源生成最终产物的 skill

## 上游输入

- 当前子项目读取已经确认完成的 `../rules-project/rules/scenes/*-rules.md` 作为输入。
- 这里不负责补规则源本身；需要调整规则源时，回到 `rules-project/` 处理。

## 使用方式

1. 先读取已经确认完成的场景规则源。
2. 再用 `generate-scene-agents` 生成 `agents/*.md`。
3. 生成结果直接作为同类项目的最终 `AGENTS.md` 使用。

## 修改边界

- `agents/*.md` 视为 skill 产物，默认不直接手改。
- 需要调整产物内容时，先修改上游规则源，再重新生成对应 `agents/*.md`。
