# dev-refine-and-self-review

这是一个面向软件开发全流程的自审 skill。

适合用在这些场景：
- 补 PRD、原型、页面、接口、测试说明
- 修 bug、重构、联调、发布前检查
- 用户让智能体继续执行上一轮建议

它主要做这几件事：
- 先完成当前任务
- 再检查还有没有明显缺口
- 有缺口就给下一步建议
- 用户接受建议后，继续执行并再次自审
- 如果证据不够，会直接说“暂时不能下结论”

调用示例：

`使用 dev-refine-and-self-review 继续完善当前模块`

`使用 dev-refine-and-self-review 执行下一步，按你的建议继续验证并自审`

详细规则见 [dev-refine-and-self-review/SKILL.md](./dev-refine-and-self-review/SKILL.md)。
