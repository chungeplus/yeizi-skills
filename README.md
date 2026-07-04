# yeizi-skills

这是一个给软件开发配套用的 yeizi skills 集合。

## 快速上手

```bash
npx yeizi-skills install --skill <skill-name>
```

例如安装第一个 skill：

```bash
npx yeizi-skills install --skill yeizi-auto-self-review
```

## `yeizi-auto-self-review`

> 事情做完了，但你还想让 AI 自动再检查一遍有没有遗漏、风险或下一步建议时，就用这个。

**触发方式**

自动触发，无需手动命令。\
当长任务请求里带有复查、自审、校验这类关键词时触发。

**适用场景**

- 一个大任务刚做完，想知道还有没有坑
- bug 修完了、功能补完了、重构做完了，想再查一遍
- 你想拿到下一步该继续补什么的建议

## `yeizi-command-bug-workflow`

> 复杂 bug、回归问题、技术故障不能直接开改时，用它让 AI 先诊断、再收方案、再实施修复，最后给出验证结果。

**触发方式**

`/yeizi-command-bug-workflow <你需要解决的问题>`

**适用场景**

- 这个 bug 比较复杂，不是改一两个地方就能完事
- 这个问题的根因不清楚，需要先定位再修
- 这个问题可能会牵涉多个模块、调用链或状态流，直接开改风险高
- 你需要的不是一个猜测，而是一整套从诊断到验证的处理过程

## `yeizi-command-pair-program`

> 还没想清楚怎么做时，用它先让 AI 帮你整理上下文、讨论方案，再给出更稳的结论。

**触发方式**

`/yeizi-command-pair-program <你需要解决的问题>`

**适用场景**

- 这个 bug 不知道该怎么改
- 这个需求不知道该怎么实现
- 你想先拿思路和方案，不想让 AI 直接改代码
