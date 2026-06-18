# yeizi-skills

`yeizi-skills` 是一个命令行工具，用于把远端 `yeizi-skills` 仓库中的技能同步到本地 AI 工具的技能目录。

## 支持平台

- `codex`
- `claude`
- `trae`

## 使用前提

- Node.js `>= 20`
- 需要可访问 GitHub 的网络环境，因为 CLI 会拉取远端元数据和内容
- 目标平台的 `skills` 目录已经存在

默认技能目录如下：

- `~/.codex/skills`
- `~/.claude/skills`
- `~/.trae/skills`

如果所选平台还没有 `skills` 目录，CLI 会跳过该平台，不会自动创建目录。

## 用户使用方式

不带子命令执行时，会显示默认帮助信息：

```bash
npx yeizi-skills
```

如果省略 `--platform` 或 `--skill` 选择，并且当前终端支持交互，CLI 会通过交互提示补齐所需输入。

如果当前环境不支持交互提示，例如脚本、CI 或被管道调用的场景，则必须显式传入所需参数：

- `list` 必须传 `--platform`
- `install` 必须传 `--platform` 和 `--skill`
- `update` 必须传 `--platform` 和 `--skill`

查看支持平台上的技能列表：

```bash
npx yeizi-skills list --platform codex,claude,trae
```

为指定平台安装技能：

```bash
npx yeizi-skills install --platform codex,claude --skill yeizi-auto-self-review
```

更新已安装技能：

```bash
npx yeizi-skills update --platform codex --skill yeizi-auto-self-review
```

## 维护者开发流程

维护者统一使用 Bun 管理依赖、校验和构建：

```bash
bun install
bun run typecheck
bun run lint
bun run build
```

## 发布流程

发布前先执行完整检查，再发布到 npm：

```bash
bun run check
bun publish
```
