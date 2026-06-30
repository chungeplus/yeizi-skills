# yeizi-skills v2.1 batch-6 Implementation Plan: structure & docs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 spec §E 文档 / §F 结构清理 6 项落地。命令面已稳定、debug flags 已加、本批聚焦结构归位与文档同步。

**Architecture:**
- E1：README.md 删 update 命令、补 `all` 平台、改"拉取远端元数据"措辞为"git 协议拉仓库快照"、加 SKILL.md frontmatter 规范小节
- E2：新建 CHANGELOG.md 顶部 v2.0.0 条目（Removed/Changed/Added 三段）
- E3：仓库根 README.md 同步 install/list 用法
- F2：合并 `types/command/{install,list}/options.ts` 到单文件 `install.ts` / `list.ts`
- F3：拆 `cli/src/config/{platform,repository}.ts` 单文件到 `config/{platform,repository}/index.ts`
- F4：`features/platform/config.ts` `PlatformConfigService` 构造时去掉 `[...platformConfig.platformList]` 深拷贝

**Tech Stack:** TypeScript 5 / Bun

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`

**Parent commit:** batch-5 ends.

## Global Constraints

- 项目无单元测试。验证 gate = `cd cli && bun run typecheck && bun run lint` 全过。
- 严格遵守 cli/CLAUDE.md：命名（小写中划线、`List`/`Map` 后缀、`Item` 单项）；TypeScript（对象式枚举、interface 对象类型、禁 any/unknown/as）；语句（禁三目、禁 switch、关键字循环）；目录（最小目录做桶导出、桶具名再导出）。
- 帮助文档英文命令名 / 中文描述混合、保持项目其它文案风格一致。
- F2 / F3 涉及目录结构变化，但要保证 import path 不变（避免大范围 import 路径修正）。

---

## File Structure（batch-6 涉及）

**Modify:**
- `cli/README.md`（E1）
- `cli/CHANGELOG.md` 新建（E2）
- `README.md`（仓库根）（E3）
- `cli/src/types/command/install/index.ts`（F2：删文件 / 改桶文件）
- `cli/src/types/command/install/options.ts`（F2：内容合并到 install.ts 单文件 / 删除该文件）
- `cli/src/types/command/list/index.ts`（F2 同样）
- `cli/src/types/command/list/options.ts`（F2 同样）
- `cli/src/types/command/index.ts`（F2：调整桶导出）
- `cli/src/config/platform.ts`（F3：删文件 / 改 content）
- `cli/src/config/repository.ts`（F3：同样）
- `cli/src/config/index.ts`（F3：调整桶导出）
- `cli/src/config/platform/index.ts`（F3 新建）
- `cli/src/config/repository/index.ts`（F3 新建）
- `cli/src/features/platform/config.ts`（F4：去掉深拷贝）

---

### Task 6.1: E1 — README.md 文档同步

**Files:**
- Modify: `cli/README.md`

**Why:** README 仍把 update 命令当作有效命令、补 `all` 平台、措辞误导。

- [ ] **Step 1: Read `cli/README.md` 全文**

- [ ] **Step 2: 删除所有 update 命令引用**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -n "update" cli/README.md
```

凡提到 "yeizi-skills update" 或 "更新" 在 install 上下文之外的行，整段（含示例行）删除。

- [ ] **Step 3: 补全支持平台列表**

找到"支持平台"列表（典型 3 项：`codex` / `claude` / `trae`），改为：

```markdown
| 平台   | 技能目录                              |
|--------|---------------------------------------|
| codex  | `~/.codex/skills`                   |
| claude | `~/.claude/skills`                  |
| trae   | `~/.trae/skills`                    |
| all    | `~/.yeizi-skills/skills`            |
```

- [ ] **Step 4: 改"拉取远端元数据"措辞**

找到形如：
```markdown
需要可访问 GitHub，因为 CLI 会拉取远端元数据和内容
```

改为：
```markdown
需要可访问 GitHub，因为 CLI 会用 git 协议拉取整个仓库快照到临时目录
```

- [ ] **Step 5: 新增 "SKILL.md frontmatter 规范" 小节**

在 README 末尾（或合适位置）新增：

```markdown
## SKILL.md frontmatter 规范

每个 skill 目录下 `SKILL.md` 必须含以下 frontmatter 字段：

\```yaml
---
name: yeizi-your-skill          # 必填、唯一
description: 一句话说明这个 skill 用来做什么  # 必填
---
\```

历史遗留的 `version` 字段已废弃（写了不读）；其它字段（如 `tags`）会被保留不报错，但仅 `name` / `description` 参与 CLI 读取。
```

注意：README.md 里的代码块以三反引号包裹，本任务伪代码用 `\\` 转义、所有 4 空格缩进；如写入时 trio-vs-quarto 反引号冲突，按本任务使用的反引号形式调整（直接 Read 后看）。

- [ ] **Step 6: typecheck（README 不参与 typecheck、跳过这步）**

- [ ] **Step 7: Commit**

```bash
git add cli/README.md
git commit -m "docs(cli/README): align with v2 reality (drop update, add all, fix wording)

- 删 update 命令引用 (PRD §4.1 v2 删除的命令)
- 支持平台表补 all
- 措辞 '拉取远端元数据' 改成 'git 协议拉仓库快照'
- 新增 SKILL.md frontmatter 规范小节（name/description 必填、version 已废弃）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6.2: E2 — 新建 CHANGELOG.md v2.0.0 条目

**Files:**
- Create: `cli/CHANGELOG.md`

**Why:** 整个 v2 重构没有迁移指南、未来用户/GH reviewer 看不到 diff 摘要。CHANGELOG + README 是 PRD §10.3 承诺的交付物。

- [ ] **Step 1: 不存在则新建 `cli/CHANGELOG.md`**

```bash
ls cli/CHANGELOG.md 2>/dev/null || echo "missing"
```

- [ ] **Step 2: 写入内容**

按 Keep a Changelog 格式 + SemVer：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.0.0] - 2026-06-30

### Removed

- `update` 命令 (安装/重装统一通过 `install`)
- 远端 `manifest.json`（仓库目录即唯一清单）
- `ManifestConfigService` 与整个 `src/service/` HTTP 客户端层
- `axios` 与 `semver` 依赖
- `SKILL.md` frontmatter 的 `version` 字段（被 `name` + `description` 取代；历史版本号经 `.passthrough()` 容忍）

### Changed

- `SKILL.md` frontmatter 字段从 `skillName` / `skillVersion` 重命名为 `name` / `description`（对齐 Anthropic Claude Code 官方约定）
- 远端目录拉取从 `httpClient.get(manifest)`（已废）改为 `giget.downloadTemplate`（git 协议）
- `install` 流程：先拉仓库 → 扫描 `yeizi-*` 子目录 → 解析 frontmatter → inquirer 含 description → 复制
- `list` 流程：扫描 → 4 列表格（平台 / 技能 / 状态 / 介绍 / 含 description 列）
- 复制前增加内容 hash 比对（Merkle 风格）；无变化时跳过写入
- 4 态 status：`INSTALLED` / `NOT_INSTALLED` / `REMOTE_REMOVED` / `MISSING_SKILLS_DIRECTORY`
- 3 态 install 状态：新加 `NO_CHANGE`（hash 比对相同）

### Added

- `SkillEntry` model（对齐 `name` + `description`）
- `runWithSkillRepository` 高阶函数（拉仓库 + 清理临时目录流程封装）
- `compareDirectoryContentHash`（工具层通用函数）

### Fixed

- 字段名不再因 `as AppErrorCodeValues` 掩盖；改用 `AppErrorCode` / `AppErrorCodeType` 各取其名
```

- [ ] **Step 3: Commit**

```bash
git add cli/CHANGELOG.md
git commit -m "docs(cli): add CHANGELOG.md with v2.0.0 entry

按 Keep a Changelog + SemVer 格式。Removed/Changed/Added 三段，
对齐 spec §10.3 承诺的 CHANGELOG 交付物。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6.3: E3 — 仓库根 README.md 同步

**Files:**
- Modify: `README.md`（仓库根）

- [ ] **Step 1: Read `README.md`（仓库根）全文**

- [ ] **Step 2: 同步 install / list 用法**

按需删除 update 引用、补 install 描述。具体如本任务为"仓库级 summary"、详细命令应指向 cli/README.md。

如仓库根 README 含：
```markdown
npx yeizi-skills install ...
npx yeizi-skills update ...
```
**改为**：
```markdown
npx yeizi-skills install --platform claude
npx yeizi-skills list --platform claude
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(root): sync install/list usage with v2

仓库根 README 同步 v2: 删 update 命令 + 补 install 与 list 用法。
详细命令文档指向 cli/README.md。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6.4: F2 — `types/command/{install,list}/options.ts` 单文件合并

**Files:**
- Modify: `cli/src/types/command/install/index.ts`（清空桶）
- Modify: `cli/src/types/command/install/options.ts`（清空 → 删除）
- Modify: `cli/src/types/command/install.ts`（新文件 / 写合并内容）
- Modify: `cli/src/types/command/list/index.ts`（同样）
- Modify: `cli/src/types/command/list/options.ts`（同上）
- Modify: `cli/src/types/command/list.ts`（同上）
- Modify: `cli/src/types/command/index.ts`（桶调整）

**Why:** 当前 `options.ts` 单文件 + `index.ts` 桶两者组成"目录子文件"，但只装一个 interface；按 directory-rules "最小目录才有桶导出"、`install/` 子目录只有一个 options.ts 不达"最小目录"门槛。合并到 `install.ts` 单文件。

- [ ] **Step 1: 看现状**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
ls cli/src/types/command/install/ cli/src/types/command/list/
```

预期: 各有两个文件。

- [ ] **Step 2: 修改 `cli/src/types/command/install/options.ts` 内容并改名**

读取当前 `install/options.ts`（含 `InstallCommandOptions` + `RawInstallCommandOptions` + 其它可能）。新建 `cli/src/types/command/install.ts`：

```typescript
import type { Command } from "commander"

import type { CommandOptionDefinition } from "../command"

// Re-export 共享 command 主题（不复制）
export type { CommandOptionDefinition }

/**
 * 命令选项 install 阶段抛入结构化参数。
 */
interface InstallCommandOptions {
  /**
   * 逗号分隔的平台名称列表；undefined 表示未传参数。
   */
  platformNameList: PlatformName[]

  /**
   * 逗号分隔的技能列表；undefined 表示未传。
   */
  skillNameList: string[]

  /**
   * dry-run flag；true 时仅打印将执行的操作。
   */
  dryRun: boolean

  /**
   * backup flag；true 时覆盖前将目标目录重命名备份。
   */
  backup: boolean

  /**
   * offline flag；true 时 giget 走缓存优先。
   */
  offline: boolean
}

/**
 * commander 在 install 阶段抛入的原始 argv 字段。
 */
interface RawInstallCommandOptions {
  platform: string | undefined
  skill: string | undefined
  dryRun: boolean
  backup: boolean
  offline: boolean
}

export type {
  InstallCommandOptions,
  RawInstallCommandOptions,
}
```

**注意**：`PlatformName` 需 import from `@/types/platform`。

- [ ] **Step 3: 同样合并 list**

新建 `cli/src/types/command/list.ts`：

```typescript
/**
 * list 命令选项结构化参数。
 */
interface ListCommandOptions {
  /**
   * 逗号分隔的平台名称列表。
   */
  platformNameList: PlatformName[]
}

/**
 * commander 在 list 阶段抛入的原始 argv 字段。
 */
interface RawListCommandOptions {
  platform: string | undefined
}

export type {
  ListCommandOptions,
  RawListCommandOptions,
}
```

- [ ] **Step 4: 桶文件 `cli/src/types/command/install/index.ts` 改为 `install.ts` 入口**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
git rm cli/src/types/command/install/index.ts cli/src/types/command/install/options.ts && \
git rm cli/src/types/command/list/index.ts cli/src/types/command/list/options.ts
```

**桶文件** `cli/src/types/command/index.ts` 改为分别 re-export 自 `install.ts` / `list.ts`：

```typescript
export type { CommandOptionDefinition } from "./command"
export type { Command } from "commander"

export type { Command, CommandOptionDefinition } from "./command"

export type { InstallCommandOptions, RawInstallCommandOptions } from "./install"
export type { ListCommandOptions, RawListCommandOptions } from "./list"

export type { CommandType as Command } from "./command"
```

（注：`CommandOptionDefinition`、`Command` 等其它项目要保持 export。`export` 行精确按现有文件内容调整——**建议 implementer 直接 Read `cli/src/types/command/index.ts` 当前内容后只替换其中 `install/` 与 `list/` 相关行**。）

- [ ] **Step 5: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务相关 0 错（其它文件可能因 import 路径变化需要修复——例如 `commands/install/command.ts` 当前 import `@/types/command/install/options`、需改成 `@/types/command/install`）。**这一步要同步修复下游 import 路径**。

- [ ] **Step 6: 修复下游 import 路径**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -rn "types/command/install\|types/command/list" cli/src/
```

预期: 命令文件 import 路径在改完后仍指 `types/command/install/options`、会断。

修复：每个命中处 `from "@/types/command/install"` 改为 `from "@/types/command/install"` → 不变（因为 `install.ts` 就直接被 import）；`from "@/types/command/install/options"` → `from "@/types/command/install"`。

- [ ] **Step 7: lint**

```bash
cd cli && bun run lint
```

Expected: 全过。

- [ ] **Step 8: Commit**

```bash
git add cli/src/types/command/
git commit -m "refactor(types/command): merge install/list/options.ts into single files

types/command/install/{index,options}.ts → install.ts 单文件
types/command/list/{index,options}.ts → list.ts 单文件
types/command/index.ts 桶直接 re-export install / list 单文件

下游 commands/{install,list}/command.ts 的 import 路径同步修复。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6.5: F3 — config/ 子目录拆分

**Files:**
- Modify: `cli/src/config/platform.ts`（删除）
- Modify: `cli/src/config/repository.ts`（删除）
- Modify: `cli/src/config/index.ts`（桶调整）
- Create: `cli/src/config/platform/index.ts`
- Create: `cli/src/config/repository/index.ts`

**Why:** directory-rules "共享配置子目录使用配置主题名词"。`config/platform.ts` 与 `config/repository.ts` 是两个独立主题、不应直接放 config 根。

- [ ] **Step 1: 看现状 grep config/**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
grep -rn 'from "@/config' cli/src/ | head -10
```

预期: 1-3 个 import（如 install/command.ts）。

- [ ] **Step 2: 移动 platform.ts → platform/index.ts**

`git mv cli/src/config/platform.ts cli/src/config/platform/index.ts`

- [ ] **Step 3: 移动 repository.ts → repository/index.ts**

`git mv cli/src/config/repository.ts cli/src/config/repository/index.ts`

- [ ] **Step 4: 修改 `cli/src/config/index.ts` 桶**

```typescript
export { platformConfig } from "./platform"
export { repositoryConfig } from "./repository"
```

- [ ] **Step 5: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 0 error（import 路径不变，依然 `@/config` 走根桶）。

- [ ] **Step 6: Commit**

```bash
git add cli/src/config/
git commit -m "refactor(config): split into platform/ and repository/ subdirs

cli/src/config/platform.ts → cli/src/config/platform/index.ts
cli/src/config/repository.ts → cli/src/config/repository/index.ts
桶 src/config/index.ts 改为 re-export 两个子目录。

cli/CLAUDE.md directory-rules '共享配置子目录使用配置主题名词'。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6.6: F4 — PlatformConfigService 去深拷贝

**Files:**
- Modify: `cli/src/features/platform/config.ts`

**Why:** `[...platformConfig.platformList]` 是"不为未来变化提前扩展"——`platformConfig` 是 `as const readonly`、没人运行时改它，深拷贝徒增复杂度。

- [ ] **Step 1: Read `cli/src/features/platform/config.ts` 全文**

- [ ] **Step 2: 去掉深拷贝**

现有（大概）：
```typescript
private constructor() {
  this.platformConfig = {
    platformList: [...platformConfig.platformList],
  }
}
```

改为：
```typescript
private constructor() {
  this.platformConfig = platformConfig
}
```

- [ ] **Step 3: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 0 error。

- [ ] **Step 4: Commit**

```bash
git add cli/src/features/platform/config.ts
git commit -m "refactor(platform): drop unnecessary deep copy in PlatformConfigService

platformConfig 已是 as const readonly、无运行时 mutation 路径。
Servic 持有的副本属于 '不为未来变化提前扩展'。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-6）

- ✅ Task 6.1-6.6 全过
- ✅ `cd cli && bun run check` 全过
- ✅ README 不再提 update 命令
- ✅ CHANGELOG.md 顶部有 v2.0.0 条目（Removed/Changed/Added）
- ✅ `cli/src/types/command/{install,list}/` 单文件形态（不再有 index.ts 桶、每个都是 install.ts / list.ts）
- ✅ `cli/src/config/{platform,repository}/index.ts` 各自为子目录
- ✅ PlatformConfigService 构造无深拷贝
- ✅ 仓库根 README 同步