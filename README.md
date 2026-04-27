# yeizi-skills

`yeizi-skills` 是一个软件开发全流程 skills 仓库。

直接把整个 skill 文件夹复制到自己的 `skills` 目录里就能用。

## 使用方式

1. 下载或克隆本仓库
2. 复制整个 skill 文件夹到自己的 `skills` 目录
3. 在 AI 工具中调用对应 skill

```text
your-skills/
├── dev-refine-and-self-review/
└── pair-program/
```

## 当前 Skills

### `dev-refine-and-self-review`

- 场景：补需求、补页面、补接口、修 bug、重构、联调、发布前检查
- 功能：先完成任务，再自审；有缺口就继续补；验证不够时会直接说清楚

详细说明见 [dev-refine-and-self-review.README.md](./dev-refine-and-self-review.README.md)。

### `pair-program`

- 场景：方案评审、重构讨论、接口设计、测试策略、发布准备
- 功能：让主智能体和副智能体先内部讨论几轮，再输出更稳的结论

详细说明见 [pair-program.README.md](./pair-program.README.md)。

## 调用示例

`使用 dev-refine-and-self-review 继续完善当前模块`

`使用 dev-refine-and-self-review 执行下一步，按你的建议继续验证并自审`

`/pair-program -n 5 帮我评审这个登录重构方案`

## License

MIT License，详见 [LICENSE](./LICENSE)。

## 更新记录

详见 [CHANGELOG.md](./CHANGELOG.md)。
