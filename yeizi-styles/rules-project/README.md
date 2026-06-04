# rules-project

这个子项目维护给人看的规则源。

## 目录

```text
rules-project/
  README.md
  AGENTS.md
  .agents/
    skills/
      generate-scene-rules/
        SKILL.md
  rules/
    projects/
      shared-rules.md
    technologies/
      typescript/
    scenes/
      cli-tool-rules.md
```

## 目录说明

- `rules/projects/shared-rules.md`：所有场景共用的项目规则
- `rules/technologies/typescript/`：当前已整理的 TypeScript 技术规则
- `rules/scenes/cli-tool-rules.md`：当前已确认的 CLI 工具场景规则源
- `.agents/skills/generate-scene-rules/`：生成和补全场景规则源的 skill

## 项目流程

1. 参考其他项目并结合自己的开发经验，整理共享项目规则，写入 `rules/projects/`。
2. 按自己的编码习惯整理通用技术规则，写入 `rules/technologies/`。
3. 用 `generate-scene-rules` 生成对应业务的场景规则源，写入 `rules/scenes/`。

这三类规则先给人类阅读、确认和修改，完成后再进入后续的 AI 产出阶段。

## 使用方式

1. 先补齐共享规则、技术规则和场景基线。
2. 场景基线至少先确认包管理器、安装命令、启动命令、基础校验命令、测试口径、入口关系和目录边界这些项目运行与边界事实。
3. 再用 `generate-scene-rules` 生成或重写 `rules/scenes/*-rules.md` 的完整草案。
4. 场景规则源先给人确认，确认后再写入文件。
5. 人类确认过的规则源，再交给 `agents-project` 生成最终产物。

