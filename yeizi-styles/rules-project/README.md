# rules-project

这个子项目维护给人阅读的规则源，以及支撑这些规则生成和修订的项目内 skills。

## 这个子项目维护什么

- 项目级通用规则
- 技术级通用规则
- `scene` prototype
- 由 prototype 生成的 final `scene-rules`
- 当前项目内部使用的相关 skills

## README / AGENTS 分工

- `README.md`：给人看的导航、目录职责和任务分流
- `AGENTS.md`：给 AI 看的默认长期约束；让 AI 动手前先读它

## 放哪儿

- 目录定位、文件职责、任务分流：写 `README.md`
- AI 默认必须长期遵守的边界：写 `AGENTS.md`
- prototype 的结构、字段和修订约束：写对应 prototype 契约和相关 skill

## 一句总规则

- 改内容：回 `prototype` 或对应人类规则文件
- 改生成链路：回 skill
- `rules/scenes/*-rules.md` 默认只读，不直接手改

## 目录概览

> 下面是结构示意，重点是文件角色和命名模式，不要求与当前文件列表逐项一致。

```text
rules-project/
  README.md
  AGENTS.md
  .agents/
    skills/
      generate-scene-prototype/
        SKILL.md
      revise-scene-prototype/
        SKILL.md
      generate-scene-rules/
        SKILL.md
  rules/
    projects/
      *.md
    technologies/
      <technology>/
        *.md
    scenes/
      prototypes/
        <scene>-prototype.md
      <scene>-rules.md
```

## 目录说明

- `rules/projects/*`：项目级通用规则，给人类阅读和维护；其中 `shared-rules.md` 承接项目级协作、执行、修改和验证边界，`code-rules.md` 承接项目级跨语言代码规则
- `rules/technologies/*`：技术级通用规则，给人类阅读和维护
- `rules/scenes/prototypes/*-prototype.md`：`scene` 的内容原型，是 final `scene-rules` 的内容上游
- `rules/scenes/*-rules.md`：`scene` 的最终完整规则，默认视为产物和阅读入口，不直接手改
- `.agents/skills/*`：当前项目内部使用的 skills，负责 prototype 生成、prototype 修订和 `scene-rules` 生成等链路，不承载具体 `scene` 业务内容

## 内容来源

`rules/scenes/prototypes/*-prototype.md -> rules/scenes/*-rules.md`

这条链路描述同一 `scene` 的内容来源关系，不表示可以直接手改 final `scene-rules`。

## 命名契约

- scene 原型文件：`<scene>-prototype.md`
- scene 最终规则文件：`<scene>-rules.md`
- `scene id` 由 prototype 文件名去掉 `-prototype.md` 得到

## 当前实例

- 当前 prototype：`rules/scenes/prototypes/multi-platform-ai-skill-sync-management-prototype.md`
- 当前 final rules：`rules/scenes/multi-platform-ai-skill-sync-management-rules.md`

## 常见任务

- 改 `scene` 业务内容或文案：先定位同名 `prototype`；如果该 scene 已有 prototype，默认按修订链路处理
- 修已有 `prototype` 的内容边界、补充或收紧：看 `revise-scene-prototype`
- 首次为某个 `scene` 建 prototype：看 `generate-scene-prototype`
- 调整 final `scene-rules` 的渲染、校验、命名或生成逻辑：改 `generate-scene-rules`，再通过对应链路更新目标 `scene-rules`
- 改项目级通用规则：先判断是项目级跨语言代码规则还是项目级协作、执行边界；前者改 `rules/projects/code-rules.md`，后者改 `rules/projects/shared-rules.md`
- 改技术级通用规则：改 `rules/technologies/*`

## 协作顺序

- 人先看 `README.md` 定位要改哪一层
- 让 AI 动手前先读 `AGENTS.md`
- 涉及 prototype 的结构、字段和修订约束时，再进入对应 skill 和 prototype 契约

## 何时看 skill

- 已有 scene 的内容修订：先定位同名 prototype，再看 `revise-scene-prototype/SKILL.md`
- 首次生成 prototype 时，再看 `generate-scene-prototype/SKILL.md`
- prototype 的结构和字段约束，以 `generate-scene-prototype/references/prototype-contract.md` 或 `revise-scene-prototype/references/prototype-contract.md` 为准
