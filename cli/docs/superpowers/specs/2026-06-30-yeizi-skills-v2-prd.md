# PRD：yeizi-skills CLI v2 重构

**版本**：v2.0
**日期**：2026-06-30
**作者**：chungeplus + Claude Fable 5
**对应 spec**：`cli/docs/superpowers/specs/2026-06-30-manifest-removal-refactor-design.md`

---

## 1. 一句话定义

把 yeizi-skills 从"伪 npm 式带版本号的包管理器"重定位为"git 仓库即数据源、覆盖即升级的轻量多平台 skill 分发器"。

## 2. 背景与动机

### 2.1 现状

yeizi-skills 是一个 CLI 工具，向 Claude Code / Codex / Trae / 通用 `.agents` 四个平台分发用户自定义 skill（每个 skill 是一个含 `SKILL.md` 的目录）。

当前实现包含三个命令：

- `install`：从远端 manifest.json 选技能、复制到目标平台
- `list`：展示"平台 × 技能"比较表，含远端版本号、本地版本号、状态
- `update`：按版本号比对、只升级有可用更新的技能

### 2.2 问题

| 问题 | 影响 |
|---|---|
| **同步负担**：远端 `manifest.json` 与每个 `SKILL.md` 的 `version` 字段必须手工保持一致 | 发布纪律重；漏改 → CLI 行为错乱 |
| **本地版本来源不可信**：CLI 反推本地版本号靠读 `SKILL.md` frontmatter | 用户可手改文档 → 比对失真 |
| **与 Claude Code 官方约定不一致**：官方 SKILL.md frontmatter 只定义 `name + description`，无 `version` | 用户写新 skill 时心智双轨 |
| **架构混合两种模式**：远端走 manifest（npm/pip 模式）、复制走 git 仓库（degit 模式） | 代码冗余、概念混乱 |
| **update 命令在覆盖即升级模型下退化为 install 真子集** | 命令面冗余、维护成本无意义增加 |

### 2.3 调研

调研了主流 skill/插件分发系统的版本管理与命令面：

| 系统 | 版本跟踪 | 命令面 |
|---|---|---|
| Anthropic 官方 Claude Code skills | 不跟踪 | 整体覆盖、无 update |
| Claude Code plugin marketplace | 不跟踪 | 覆盖即升级 |
| Cursor rules | 不跟踪 | 用户手动维护 |
| `gh extension` | 跟踪 | install + upgrade（包管理器风格） |
| `degit` / `giget` | 不跟踪 | 仅下载 |
| npm/pnpm/pip/Homebrew | 跟踪 | 完整版本协商 |

**结论**：面向 AI 工具的轻量 skill 分发，主流是"覆盖即升级、git 仓库即数据源、最小命令面"。yeizi-skills 应归入此档。

## 3. 目标用户与场景

### 3.1 用户

- **chungeplus 本人**：作者 + 主要用户。日常在 Claude Code / Codex / Trae 三处来回切换、希望同一份 skill 集合多平台同步可用
- **未来贡献者**：写新 skill 提 PR 到 `yeizi-skills` 仓库
- **未来使用者**：通过 `npx yeizi-skills` 在自己机器上装这套 skill

### 3.2 核心场景

| # | 场景 | 命令 |
|---|---|---|
| 1 | 首次使用、把作者推荐的 skill 装到自己常用的几个平台 | `yeizi-skills install` |
| 2 | 远端仓库更新了某个 skill 内容，把本地刷成新内容 | `yeizi-skills install`（重选已装的） |
| 3 | 想看哪个平台装了哪些 skill、远端还有哪些没装 | `yeizi-skills list` |
| 4 | 想知道某个 skill 是干嘛的 | `yeizi-skills list` 表格的 description 列 / `yeizi-skills install` 的 prompt |

## 4. 目标与非目标

### 4.1 目标

- ✅ **零同步负担**：删除 `manifest.json`，仓库目录结构就是技能集合的唯一数据源
- ✅ **对齐 Claude Code 官方约定**：SKILL.md frontmatter 只保留 `name + description`
- ✅ **最小命令面**：删除 `update`，从 3 命令缩到 2 命令（install / list）
- ✅ **覆盖即升级 + hash 优化**：install 复制前比对内容 hash，无变化时跳过、避免无意义写入
- ✅ **多平台同步管理依然可用**：codex / claude / trae / all 四个目标依然支持
- ✅ **跨用户兼容**：老用户磁盘上残留 `version` 字段的 SKILL.md 不会因新 schema 报错

### 4.2 非目标

- ❌ 本次不做"版本号 / changelog / breaking change 提示"——已知简化代价，未来可演进
- ❌ 本次不做"批量 reinstall flag"等命令面增强——用户重跑 install 自然覆盖
- ❌ 本次不做"info 子命令查看 skill 详情"——list 表格已展示 description
- ❌ 不做"installation atomicity"（Ctrl-C 中断的原子性保证）——用户重跑覆盖即可修复
- ❌ 不做"卸载命令" `uninstall`——本期没有此用户需求，rm -rf 已经够用

## 5. 用户故事

```
US-1: As 一个多平台 AI 用户,
      I want 一条命令就能把推荐的 skill 装到我常用的几个平台,
      so that 不用挨个平台手抄 SKILL.md。

US-2: As 一个已经装过 skill 的用户,
      I want 装新版本时不用记"我之前装了哪些",
      so that 只要重跑 install 选我要的就行。

US-3: As 一个想了解远端有哪些 skill 的用户,
      I want 一目了然看到"平台 × 技能 × 状态 × 介绍",
      so that 决定要装哪些、卸载哪些。

US-4: As skill 作者,
      I want 写 SKILL.md 的字段和 Claude Code 官方完全一致,
      so that 心智单一、未来切到任何工具都能用。

US-5: As 升级 yeizi-skills 的老用户,
      I want 旧版本装过的 skill 不需要先手动清理就能继续用新 CLI,
      so that 平滑升级、不被打断工作。
```

## 6. 功能需求

### 6.1 install 命令

**输入**：

- `--platform <csv>`：目标平台列表（codex / claude / trae / all），不传则交互式多选
- `--skill <csv>`：技能名列表，不传则交互式多选

**流程**：

1. 用 giget 拉远端仓库到临时目录（不开 preferOffline，每次联网校新鲜度）
2. 扫临时目录根下 `yeizi-*` 子目录，解析每个 SKILL.md frontmatter 得到 `(name, description)` 候选列表
3. inquirer prompt 展示候选（每项一行：`name` + 缩进 `description`），用户多选
4. 选完后对每个 `(平台, 技能)` 笛卡尔积：
   - 比对源/目标目录递归内容 hash
   - 相同 → 跳过、汇报"无变化"
   - 不同（含目标不存在）→ copyDirectory 覆盖、汇报"已安装"
5. 清理临时目录、输出 summary

**退出码**：

- 0：正常完成（含部分技能因 frontmatter 损坏被跳过的情况，跳过项进 warning）
- 1：远端仓库无任何 yeizi-* 子目录、文件系统 IO 错误、用户传入不支持的平台/技能名

### 6.2 list 命令

**输入**：

- `--platform <csv>`：要查看的平台列表，不传则交互式多选

**流程**：

1. 拉仓库到临时目录
2. 扫得远端 SkillEntry 列表
3. 对每个选中平台：
   - skills 目录不存在 → 全部状态"平台 skills 目录缺失"
   - 否则列举本地 `yeizi-*` 子目录、与远端合并去重
4. 渲染表格：**平台 / 技能 / 状态 / 介绍** 四列
   - 状态枚举：已安装 / 未安装 / 远端已移除 / 平台 skills 目录缺失
   - 介绍列截断到 60 字符
5. 清理临时目录

**退出码**：

- 0：正常完成
- 1：远端仓库无任何 yeizi-* 子目录、平台不支持

### 6.3 SKILL.md frontmatter 规范

```yaml
---
name: yeizi-foo            # 必填，技能名
description: ...           # 必填，单行描述（list 表格 / install prompt 展示）
---
```

**禁止字段**：`version`（不读、不报错、忽略——`.passthrough()` schema）
**未来演进**：如需 breaking change 提示，可选加 `changelogId` 字段（本期不做）

## 7. 非功能需求

| 类别 | 要求 |
|---|---|
| **性能** | install/list 端到端 < 5 秒（首次拉仓库 ~2-3 秒、本地操作 < 100ms） |
| **网络** | 不调用 GitHub Contents API，零 API 速率限制；giget 走 git 协议、走 etag 304 |
| **兼容性** | Node ≥ 18，Windows / macOS / Linux 通用；老 SKILL.md（带 `version`）不报错 |
| **错误处理** | 一律走 AppError + AppErrorCode；中文错误文案 |
| **代码规范** | 遵循 CLAUDE.md 全部规则（命名、TypeScript、目录、注释、流程） |

## 8. 成功指标

| 维度 | 指标 |
|---|---|
| **代码质量** | `bun run check`（typecheck + lint）通过；删 500-600 行代码 |
| **依赖瘦身** | dependencies 从 9 个降到 7 个（移除 `axios`、`semver`） |
| **目录瘦身** | 删除 `src/service/`、`src/commands/update/`、`src/types/command/update/`、`src/features/skill/manifest-config.ts`、`src/features/skill/document-parser.ts` |
| **命令面瘦身** | CLI 命令从 3 降到 2 |
| **frontmatter 字段** | `name + description`（与 Anthropic 官方一致） |
| **远端数据源** | 仅 GitHub 仓库目录结构本身，无 manifest |
| **手工烟测** | 在 codex / claude / trae 三个平台跑 install / list 得到预期输出 |

## 9. 风险与缓解（来自 9 个 agent 对抗审查的留存项）

| 风险 | 级别 | 缓解 |
|---|---|---|
| install Ctrl-C 留下半成品 | HIGH→接受 | 用户重跑 install 覆盖修复，不做原子性保证 |
| 老用户磁盘上带 version 的 SKILL.md | HIGH | schema 用 `.passthrough()` 容忍 |
| giget 缓存陈旧 | HIGH | 移除 `preferOffline: true`，每次联网校新鲜度 |
| 本地有、远端已下架的孤儿 skill | MEDIUM | list 显示"远端已移除"状态，用户手动 rm -rf |
| frontmatter 解析失败拖垮整个命令 | MEDIUM | per-skill 容错，单坏文件不影响其他 |
| update 命令消失带走老用户习惯 | LOW | README changelog 提示"重装请跑 install" |
| 未来想加版本通道演进成本 | LOW | spec §11 已记录最小演进路径（可选 `changelogId` 字段） |

## 10. 交付物

| # | 交付物 | 状态 |
|---|---|---|
| 1 | PRD（本文档） | ✅ 当前 |
| 2 | spec：`cli/docs/superpowers/specs/2026-06-30-manifest-removal-refactor-design.md` | ✅ 已写、已 commit |
| 3 | 实施 plan（多文件分步） | 待 writing-plans |
| 4 | 重构 PR：CLI 代码 + SKILL.md 同步 + manifest.json 删除 | 待实施 |
| 5 | README / CHANGELOG 更新（含 update 命令移除说明） | 待实施 |

## 11. 时间预估

- writing-plans + 用户复核 plan：1 个会话
- 实施（types → schemas → constants → features → tools → commands → main → error → 仓库根 → package.json）：3-5 个会话
- 手工烟测 + 修复：1 个会话

**总计**：5-7 个会话内完成

## 12. 决策记录

整个 brainstorming 过程的关键决策、各方案权衡、调研依据，已沉淀到 spec 文件。本 PRD 仅做高层抽象，详情参见 spec。

---

## 附：PRD vs spec 用途区分

| 文档 | 用途 | 受众 |
|---|---|---|
| **PRD（本文）** | 解释"为什么改、改给谁、改完什么样、怎么验" | 长期决策时回看、新协作者快速了解 |
| **spec** | 解释"具体怎么改"（文件清单、字段名、流程、退出码） | writing-plans 阶段直接消费、实施时对照 |
