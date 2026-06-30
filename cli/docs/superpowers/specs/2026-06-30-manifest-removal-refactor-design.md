# yeizi-skills 重构设计：去 manifest、覆盖即升级、去 update

## 1. 背景

当前 CLI 通过远端 `manifest.json` 维护"远端可用技能 + 版本号"，并通过解析本地各平台 `<skills-dir>/<skill-name>/SKILL.md` 的 frontmatter 反推本地版本号，再用 `semver.lt` 做版本比对。

调研主流 skill/插件分发系统（Claude Code 官方 skills、Cursor rules、`gh extension`、`degit`、`giget` 等）后确认：**面向 AI 工具的轻量 skill 分发，主流做法是"覆盖即升级"，不跟踪本地版本**。Anthropic 官方 SKILL.md frontmatter 也只定义 `name + description`，没有 `version` 字段。

当前实现混合了"npm/pip 式版本比对"和"git 仓库式分发"两套模式，带来三个问题：

1. **可信度低**：本地版本来源是用户可改的文档 frontmatter
2. **同步负担**：`manifest.json` 与 `SKILL.md` 两处必须手工保持一致
3. **概念不一致**：与 Claude Code 官方约定不对齐

去掉版本号比对后，`update` 命令在新模型下退化为 `install` 的真子集：同一份远端数据、同一种复制行为、唯一差异是"自动选已装的、不弹 prompt"。按 CLAUDE.md "现有结构能满足时必须复用 / 不为未来变化提前扩展"原则，`update` 命令一并删除。

本次重构把 CLI 收敛到"git 仓库即唯一数据源、覆盖即升级、只有 install + list 两个命令"的纯净模型。

## 2. 目标

- 删除 `manifest.json` 这条数据源，统一从 GitHub 仓库目录结构推导技能集合
- 去除全部本地/远端版本号字段及比对逻辑
- 对齐 Claude Code 官方 frontmatter 约定（`name + description`）
- **删除 `update` 命令**——新模型下它已退化为 install 真子集
- `install` / `list` 两个命令在新模型下重新定义语义
- 同步删除随之失效的死代码（service/request、axios、ManifestConfigService、UpdateCommand 等）
- 不引入新的间接层、不为未来变化提前扩展

## 3. 总体架构

```
GitHub repo (chungeplus/yeizi-skills)
 ├── yeizi-auto-self-review/
 │    └── SKILL.md   (frontmatter: name + description)
 ├── yeizi-command-bug-workflow/
 │    └── SKILL.md
 └── ... (其他 yeizi-* 目录)
                ↓ giget (git 协议拉到临时目录，每次联网校新鲜度)
临时下载目录 (/tmp/yeizi-skills-repo-xxx, 每次 mkdtemp)
 ├── yeizi-auto-self-review/SKILL.md
 ├── yeizi-command-bug-workflow/SKILL.md
 └── ...
                ↓ CLI 流程
本地各平台 skills 目录
 ~/.codex/skills/yeizi-foo/
 ~/.claude/skills/yeizi-foo/
 ~/.trae/skills/yeizi-foo/
 ~/.yeizi-skills/skills/yeizi-foo/
```

**单一数据源**：GitHub 仓库本身。无 manifest、无本地版本号文件、无 GitHub API 调用、无速率限制。

## 4. 核心决策

| # | 议题 | 决定 |
|---|---|---|
| 1 | 本地版本号 | 不跟踪，覆盖即升级 |
| 2 | manifest.json | 删除 |
| 3 | 远端技能集合来源 | giget 拉仓库后扫根目录的 `yeizi-*` 子目录 |
| 4 | SKILL.md frontmatter 字段 | `name + description`（去除 `version`） |
| 5 | frontmatter schema 字段名 | 沿用官方 `name` / `description`，CLI 内部类型同步重命名（不再保留 `skillName`/`skillVersion` 这类 `skill` 前缀变体） |
| 6 | install 流程 | 拉仓库 → 扫子目录 + 解析 SKILL.md → inquirer 带 description → 复制 |
| 7 | install 复制前 hash 比对 | 复制前比对源/目标目录递归内容 hash，相同则汇报"无变化"、不复制 |
| 8 | list 表格列 | 平台 / 技能 / 状态 / 介绍（description 单列，截断到 60 字符） |
| 9 | list 技能集合 | 远端 `∪` 各选中平台已装本地 `yeizi-*` 目录；本地有而远端没有的行状态显示"远端已移除" |
| 10 | update 命令 | **删除**。"重装已装"的需求由 `install` 覆盖；"远端有哪些新技能"由 `list` 表格直接看到 |
| 11 | giget 缓存策略 | 两个命令均**去掉 `preferOffline: true`**，每次联网校新鲜度（giget 自身仍会用 etag 走 304，正常使用无明显延迟） |
| 12 | install Ctrl-C 中断 | 不做原子性保证；半成品由用户重跑 install 覆盖修复 |
| 13 | frontmatter 解析降级 | per-skill 容错：YAML 损坏或 `name` 缺失 → 跳过该技能、加入命令末尾 warning；`description` 缺失 → 仍纳入列表、description 列显示空 |
| 14 | 边界场景报错策略 | "未选中任何技能"等异常情况统一在 summary 行提示，不抛 AppError、不退出非零状态；只有"远端仓库一个 yeizi-* 都没有"才报错（说明仓库异常） |

## 5. 命令流程

### 5.1 install

```
1. 拉仓库到临时目录（giget，无 preferOffline）
2. 扫临时目录根下的 yeizi-* 子目录 → 候选 SkillEntry 列表（每个 entry 含 name + description）
3. 逐个读 SKILL.md，解析 frontmatter → 补 description（容错：损坏/缺 name 跳过 + warning）
4. inquirer prompt 显示（技能名 + description 一行）让用户选
5. 选完后对每个 (平台, 技能) 对：
   - 计算源目录和目标目录的递归内容 hash
   - 相同 → 跳过、汇报"无变化"
   - 不同 / 目标不存在 → copyDirectory 覆盖、汇报"已安装"
6. finally 清理临时目录
7. 输出 summary
```

**install 同时承担"安装"和"重装/升级"两种语义**——用户在第 4 步可以勾选任意已装/未装的技能；第 5 步的 hash 比对决定"是否真复制"，避免无变化时无意义写入。

### 5.2 list

```
1. 拉仓库到临时目录（giget，无 preferOffline）
2. 扫临时目录根下的 yeizi-* 子目录 → 远端 SkillEntry 列表（含 description）
3. 对每个选中平台：
   - 平台 skills 目录不存在 → 全部行状态为"平台 skills 目录缺失"
   - 否则列出本地已存在的 yeizi-* 子目录，与远端列表合并去重
4. 渲染表格：平台 / 技能 / 状态 / 介绍
   状态枚举：已安装 / 未安装 / 远端已移除 / 平台 skills 目录缺失
5. finally 清理临时目录
```

用户通过 list 一眼看清"远端有哪些新技能未安装"、"本地有哪些孤儿"，决策后再跑 install。**不再需要 update 命令承担"汇报新增/重装"职责**。

## 6. 模块改动清单

### 6.1 删除文件

| 路径 | 原因 |
|---|---|
| `manifest.json`（仓库根） | 远端 manifest 数据源废弃 |
| `cli/src/features/github/load-manifest-config.ts` | 不再加载 manifest |
| `cli/src/features/skill/manifest-config.ts` | ManifestConfigService 整个废弃 |
| `cli/src/schemas/skill/manifest-config.ts` | manifest 校验 schema |
| `cli/src/types/skill/manifest-config.ts` | manifest 类型 |
| `cli/src/service/request/http-client.ts` | 唯一使用方是 loadManifestConfig |
| `cli/src/service/request/index.ts` | 桶文件失去内容 |
| `cli/src/service/apis/github/index.ts` | 同上 |
| `cli/src/service/` 整目录 | 全部失去使用方 |
| `cli/src/features/skill/document-parser.ts` | parseSkillVersion 删除；parseFrontmatter 不再单独存在，逻辑合并到 `features/github/repository.ts` 的 `scanSkillEntryList` 内部（"扫目录 + 解析 frontmatter"是同一流程的两步，按 CLAUDE.md"同一流程步骤逻辑留在同文件"合并）。**整个 document-parser.ts 文件删除** |
| `cli/src/commands/update/command.ts` | update 命令删除（新模型下退化为 install 真子集） |
| `cli/src/commands/update/index.ts` | 桶文件失去内容 |
| `cli/src/commands/update/` 整目录 | update 命令删除 |
| `cli/src/types/command/update/options.ts` | UpdateCommandOptions 不再需要 |
| `cli/src/types/command/update/index.ts` | 桶文件失去内容 |
| `cli/src/types/command/update/` 整目录 | update 类型删除 |

### 6.2 修改文件

| 路径 | 改动 |
|---|---|
| `cli/src/schemas/skill/frontmatter.ts` | 重写为 `z.object({ name: z.string(), description: z.string() }).passthrough()`：字段对齐 Claude 官方，passthrough 让带历史 `version` 的本地 SKILL.md 不报错 |
| `cli/src/types/skill/frontmatter.ts` | 字段重命名：`skillName` → `name`，删除 `skillVersion`，新增 `description` |
| `cli/src/types/skill/comparison.ts` | `SkillComparisonRow` 重写：删除 `remoteVersion` / `localVersion`，保留 `platformName` + `skillName` + `description` + `statusMessage` |
| `cli/src/types/skill/index.ts` | 桶导出同步：移除 `ManifestConfig` / `ManifestConfigPayload` / `SkillItem` |
| `cli/src/types/skill/install-result.ts` | 字段不动；新增结果状态 `NO_CHANGE`（hash 相同跳过时使用） |
| `cli/src/constants/skill/comparison-status.ts` | 重写为四态：`INSTALLED` / `NOT_INSTALLED` / `REMOTE_REMOVED` / `MISSING_SKILLS_DIRECTORY`。删除 `UP_TO_DATE` / `UPDATE_AVAILABLE` / `LOCAL_SKILL_INVALID` |
| `cli/src/constants/skill/install-status.ts` | 新增 `NO_CHANGE` 值，对应 hash 相同跳过 |
| `cli/src/features/github/repository.ts` | 去掉 `preferOffline: true`；新增导出 `scanSkillEntryList(repositoryDirectoryPath): SkillEntry[]`，封装"扫 `yeizi-*` 子目录 + 用 gray-matter 读 SKILL.md frontmatter + zod 校验"三步，所有平台/命令共享同一个数据源 |
| `cli/src/features/github/index.ts` | 桶导出更新：移除 `loadManifestConfig`，新增 `scanSkillEntryList` |
| `cli/src/tools/filesystem/` | 新增 `compareDirectoryContentHash(srcDir, destDir): Promise<boolean>` 函数（Node 自带 crypto，递归 SHA-256），归入既有 `tools/filesystem/` 目录，作为通用文件操作能力，被 copier 复用 |
| `cli/src/features/skill/comparison-builder.ts` | 重写：buildComparisonRows 改为 (remoteSkillEntryList, selectedPlatformList) → 行集合 = 远端 ∪ 本地、状态按 4 态判定；**删除 `buildUpdateRows` / `buildUpdateSkillNameList` / `buildSelectedRows`**（update 命令已不存在，整套"更新行筛选"逻辑废弃） |
| `cli/src/features/skill/selected-builder.ts` | 入参类型从 `SkillItem[]` 调整为新的 `SkillEntry[]`（字段从 `skillName` 调整为 `name`），其余不变 |
| `cli/src/features/skill/copier.ts` | 函数参数 `skillItem` 调整为 `skillEntry`（`name` 字段）；复制前先调 `tools/filesystem/compareDirectoryContentHash` 比对、相同则返回 NO_CHANGE |
| `cli/src/features/skill/prompt.ts` | inquirer choice 改为 `{ name: ` 技能名 + 缩进 description `, value: skillEntry.name }`；**删除 `promptSkillNameListToUpdate`**（仅 update 用） |
| `cli/src/features/skill/name-parser.ts` | 不动 |
| `cli/src/features/skill/index.ts` | 桶导出更新：移除 ManifestConfigService、buildUpdateRows、buildUpdateSkillNameList、buildSelectedRows、promptSkillNameListToUpdate；新增 SkillEntry 相关导出 |
| `cli/src/commands/install/command.ts` | 移除 ManifestConfigService 依赖；execute 顺序：拉仓库 → 调 `scanSkillEntryList` 拿候选 → inquirer prompt 带 description → 用户选完 → copier 复制（内部 hash 比对决定是否真复制） → finally 清理临时目录 |
| `cli/src/commands/list/command.ts` | 重写为：拉仓库 → scan → 渲染表格（含 description 列、4 态状态）→ finally 清理临时目录 |
| `cli/src/main.ts` | 删除 `new UpdateCommand().register(program)` 一行及对应 import |
| `cli/src/error/code.ts` | 删除 `REMOTE_SKILL_CATALOG_INVALID`；新增 `REMOTE_REPOSITORY_EMPTY`（仓库一个 yeizi-* 都没有时） |
| `cli/src/error/definitions.ts` | 同步增删 buildMessage |
| `cli/package.json` | 移除依赖：`axios`、`semver`；移除 devDependency `@types/semver` |
| 仓库根 `yeizi-auto-self-review/SKILL.md` | 删除 frontmatter 中 `version: 1.0.0` 行 |
| 仓库根 `yeizi-command-bug-workflow/SKILL.md` | 同上 |
| 仓库根 `yeizi-command-pair-program/SKILL.md` | 同上 |

### 6.3 新增文件

无新建模块文件。`scanSkillEntryList` 与 `compareDirectoryContentHash` 分别加入既有的 `features/github/repository.ts` 与 `tools/filesystem/` 内，避免引入额外间接层。

## 7. 类型与命名

### 7.1 SkillEntry

```ts
interface SkillEntry {
  name: string         // 与 SKILL.md frontmatter 一致
  description: string  // 解析失败/缺失时为空串
}
```

整个项目对"一个技能的元数据"只用 `SkillEntry` 一个词，**不引入** `SkillItem` / `SkillFrontmatter` / `SkillChoice` / `SkillRecord` 等同义近义词。

### 7.2 SkillComparisonRow

```ts
interface SkillComparisonRow {
  platformName: PlatformName
  skillName: string
  description: string
  statusMessage: SkillComparisonStatus
}
```

### 7.3 SkillComparisonStatus 常量

```ts
const SkillComparisonStatus = {
  INSTALLED: "已安装",
  NOT_INSTALLED: "未安装",
  REMOTE_REMOVED: "远端已移除",
  MISSING_SKILLS_DIRECTORY: "该平台的 skills 目录不存在",
} as const
```

### 7.4 SkillInstallStatus 常量

```ts
const SkillInstallStatus = {
  SUCCESS: "success",
  NO_CHANGE: "no-change",
  FAILED: "failed",
} as const
```

## 8. 错误处理增删

### 8.1 删除

- `REMOTE_SKILL_CATALOG_INVALID`（manifest schema 错；无 manifest 后失意义）

### 8.2 新增

- `REMOTE_REPOSITORY_EMPTY`：拉到的仓库根目录下没有任何 `yeizi-*` 子目录

### 8.3 保留

- `REMOTE_SKILL_DOCUMENT_INVALID`：仍用于 frontmatter 解析失败的硬错误（YAML 不可读时）。注意 install 流程对此错误是 per-skill 容错（跳过 + warning），不再让单个坏 SKILL.md 中止整个命令

## 9. 命令边界场景与退出码契约

### 9.1 install

| 场景 | 行为 |
|---|---|
| 用户在 inquirer 里一个也没选 | summary 显示"未选中任何技能"，exit 0 |
| 选中的技能 + 平台组合里有任意一个 (skill, platform) 已存在且 hash 相同 | 该项 summary 显示"无变化"，其余正常复制，exit 0 |
| 远端仓库扫不到任何 yeizi-* 子目录 | 抛 `REMOTE_REPOSITORY_EMPTY`，exit 1 |
| 远端某个 SKILL.md YAML 损坏 | 该技能跳过 + 末尾 warning，其它技能正常处理，exit 0 |
| 文件系统级 IO 错误（权限、磁盘满） | 抛对应既有错误码，exit 1 |

### 9.2 list

| 场景 | 行为 |
|---|---|
| 选中平台 skills 目录不存在 | 该平台所有行状态显示"平台 skills 目录缺失"，exit 0 |
| 远端有但本地未装 | 状态"未安装"，exit 0 |
| 本地有但远端已移除 | 状态"远端已移除"，exit 0 |
| 远端仓库扫不到任何 yeizi-* 子目录 | 抛 `REMOTE_REPOSITORY_EMPTY`，exit 1 |

## 10. 迁移代价

### 10.1 内部代价

- 仓库根 3 个 SKILL.md 同步去 `version` 行（一次性、单 PR 合并）
- `package.json` 删除 `axios`、`semver`、`@types/semver` 依赖

### 10.2 外部 SKILL 作者代价

- **新规范**：写新 SKILL.md 时 frontmatter 只写 `name + description`，不再写 `version`
- **容忍但不鼓励**：schema 用 `.passthrough()` 让旧文件不被拒绝，**未来 README/CONTRIBUTING 应明示"`version` 字段已废弃，写了也不读"**
- 推荐作者参照 Anthropic 官方 skill frontmatter 写法

### 10.3 已装老用户代价

- 已经装过老版本（带 `version` 字段）的用户跑 install 不会失败（passthrough）
- `update` 命令消失：习惯打 `yeizi-skills update` 的用户会被 commander 提示"未知命令"
  - 缓解：可在 README 加 changelog 节明示"update 命令已并入 install，运行 `yeizi-skills install` 重选已装技能即可重装"
- `list` 表格不再显示版本列

## 11. 未来演进路径预留

如果将来需要"breaking change 提示"或某种最小的版本身份标识，最小演进路径已经预留：

- 在 SKILL.md frontmatter 加可选 `changelogId: string` 字段（不是 semver、只是身份）
- install 复制后在目标目录加同名隐藏文件存当前值
- update 比对 `changelogId` 不一致时输出提示

本次重构不实施此路径。仅在 spec 中记录，避免未来"全套版本通道"误以为已被彻底关闭。

## 12. 验证标准

- `bun run build` 编译通过
- `bun run lint` 通过（按 CLAUDE.md 命名/语句规则）
- `npx tsc --noEmit` 通过
- 手工跑 `yeizi-skills install` / `list` 在 codex/claude/trae 三个平台上得到预期输出
- 运行 `yeizi-skills update` 应得到 commander "未知命令"提示
- 仓库根 3 个 SKILL.md 已去除 `version` 行
- 卸载 axios/semver 后包安装大小变小（dependencies 从 9 个减为 7 个）
- main.ts 不再 register UpdateCommand
- `cli/src/commands/update/` 与 `cli/src/types/command/update/` 目录已删除

## 13. 实施顺序建议（供 writing-plans 参考）

1. types + schemas 重写（SkillEntry / passthrough frontmatter / 状态枚举）
2. constants 重写（status 常量）
3. features/github 改写（去 preferOffline + 加 scanSkillEntryList）
4. tools/filesystem 加 compareDirectoryContentHash
5. features/skill 改写（comparison-builder 重写 + copier 加 hash + prompt 带 description + 删 document-parser/manifest-config/promptSkillNameListToUpdate/buildUpdateRows 等）
6. commands 改写（install 改写、list 改写、**update 整个目录删**）
7. types/command/update 整个目录删
8. main.ts 移除 UpdateCommand 注册
9. error 增删（code + definitions）
10. 仓库根 SKILL.md 去 version、删 manifest.json
11. package.json 去依赖 axios/semver
12. service/ 整目录删除
13. 跑 typecheck / lint / 手工烟测
