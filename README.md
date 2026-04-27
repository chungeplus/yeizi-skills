# yeizi-skills

`yeizi-skills` 是一个 skills 包，当前主要收录面向软件开发全流程的 skills。

用户可以直接下载这个仓库，把需要的 skill 文件夹复制到自己的 `skills` 目录中使用。

## 使用方式

1. 下载或克隆本仓库
2. 选择需要的 skill 文件夹
3. 复制到自己的 `skills` 目录
4. 在 AI 工具中调用对应 skill

## Quick Start

目录示例：

```text
your-skills/
└── dev-refine-and-self-review/
    └── SKILL.md
```

调用示例：

`使用 dev-refine-and-self-review 继续完善当前模块`

## 当前 Skills

### `dev-refine-and-self-review`

作用：

- 处理软件开发全流程里“优化、补充、修复、继续完善、重构、重做、换风格、合并、联调、提测、交付整理”这类请求

功能：

- 先完成当前任务
- 首版创建任务也默认触发自审
- 再检查结果是否还有明显缺口
- 需要时补充下一步建议
- 如果用户接受建议，会继续执行该建议并基于最新结果再次自审
- 如果上一轮建议是一组相关验证步骤，可成组执行后再继续自审
- 大产出时可采用抽样自审，并说明检查范围
- 会按当前交付物切换产品、设计、研发、测试、交付等视角做自审
- 如果同时改了多个交付物，会额外检查它们之间是否同步

适用场景：

- PRD / 流程 / 验收标准补充
- 首版 PRD / 原型 / 页面 / 接口创建
- UI / 页面 / 组件改版与完善
- 前后端功能实现、重构、联调
- 测试验证、提测、发布前检查
- 方案、架构、交付内容整理

## 目录结构

```text
yeizi-skills/
├── CHANGELOG.md
├── README.md
├── LICENSE
└── dev-refine-and-self-review/
    └── SKILL.md
```

## License

MIT License，详见 [LICENSE](./LICENSE)。

## 更新记录

详见 [CHANGELOG.md](./CHANGELOG.md)。
当前 changelog 按“仓库级”和“skill 级”分别记录，便于后续继续收录新的 skills。
