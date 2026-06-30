# yeizi-skills v2.1 Followup 设计文档：v2 重构后清理与补全

## 1. 背景

yeizi-skills v2 重构（commit `e90b4a43..e749dde4`）已合入 main。但通过 4 个并行审计 agent 的全分支排查，发现 19+ 项遗留问题：

- **HIGH**：5 项规则违反 + 真 bug
- **MEDIUM**：10+ 项业务盲点、死代码残留、未删干净的旧业务
- **LOW**：10+ 项工程味道 / 目录规则偏离

PRD §4.2 明确标注的非目标项（如 uninstall、info 命令）不在本次范围——本次目标是"让 v2 完整、优雅"，不是"加新功能"。

本 spec 设计修复策略 + 步骤，按 6 批次 commit 落地，每个批次一个 PR，合并后 `bun run check` 全过、手工烟测覆盖关键路径。

## 2. 总体策略

**单一数据源**仍为 GitHub 仓库本身；install 仍走"覆盖即升级 + hash 比对"；list 仍走 4 态比较。不引入新功能入口。只清理 v2 留痕、补齐 install 调用面的安全开关、更新文档。

**变更面集中**：

- 1 个新公共文件 `features/github/run-with-skill-repository.ts`（含 `runWithSkillRepository` 高阶函数）
- 不删整个目录、不动命令面
- CLI 命令面保持 install / list 两个（不增 uninstall / info）

## 3. 修复项分类

### A. 规则违规修复（7 项）

| ID | 位置 | 问题 | fix |
|---|---|---|---|
| A1 | `tools/package-json/load-info.ts:25` | `const packageJsonPayload: unknown = JSON.parse(...)` 显式 `unknown` 兜底，违反 type-rules "不使用 `any` 和 `unknown` 兜底" | 去掉中间变量，直接 `return packageJsonInfoSchema.parse(JSON.parse(...))` |
| A2 | `error/commander-adapter.ts:100` | `return matchedResult![1]` 非空断言绕过 nullable，违反"不为兜底提前放宽" | `extractQuotedValue` 改返 `string \| null`，调用方 `if (null) return defaultMessage` |
| A3 | `error/definitions.ts:3`, `types/error/index.ts` | 跨目录类型 + `as AppErrorCodeValues` 命名掩盖 | `types/error/types.ts` 类型别名 `AppErrorCodeType` 公开；definitions 直接 `import type { AppErrorCodeType }` + `import { AppErrorCode }` 两个分开；去掉 `as` 重命名 |
| A4 | `commands/install/command.ts:182-192` 的 `buildInstallSummaryMessageList` 与 update/list 命令对应函数 | if-return 3 段对单一 `status` 判断的分歧映射，违反 statement-rules "≥5 互斥分支改分发表" 精神 | 改模块顶部 `Record<SkillInstallStatus, (result: SkillInstallResult) => string>`，函数体单行 return |
| A5 | `commands/list/command.ts:38-108` 中 `descriptionTruncateLimit` 与 `truncateDescription` 内联在 ListCommand | 通用能力放进业务 class 内，违反"通用基础能力先复用成熟组件" | 提到 `tools/string/truncate-text.ts`（或 tools/text），桶 re-export |
| A6 | `commands/install/command.ts:137-157` `batchInstallSkillEntryListToPlatformList` 私有方法名堆词 | 用 `Promise.all` + `flatMap` 删掉循环方法名、直接 inline | 直接 inline 到 execute |
| A7 | `error/definitions.ts` 中 6 处 `as AppErrorParamsMap[...]` 收窄 | 与 A3 一并通过类型签名移到签名上 + Record 模式解决 | 见 A3 修复 |

### B. 业务 bug 修复（8 项）

| ID | 位置 | 问题 | fix |
|---|---|---|---|
| B1 | `features/platform/resolver.ts:95`, `error/code.ts`, `types/error/types.ts`, `error/definitions.ts` | `params: { platformName: string }` 但 resolver 用 `missingNameList.join(",")` 塞进，错误消息渲染成 `平台"codex,claude"不受支持` | 改 `params: { platformNameList: string[] }`，模板 `以下平台不受支持：${params.platformNameList.join("、")}。` |
| B2 | `commands/install/command.ts` execute 顺序 | 用户传 `--skill X` 但 X 远端没有——目前要等拉完仓库、buildSelectedSkillNameList、buildSelectedSkillList 才发现 → 浪费网络 | 在 scan 后立即把 `commandOptions.skillNameList` 与 remote 对照，缺失立刻抛 `AppError(SKILL_NOT_FOUND)`；再走 prompt |
| B3 | `features/platform/resolver.ts` 让 `~/.claude/skills` 不存在时 install 抛错 | 应自动 `mkdir -p`（首次安装场景） | install 调用 `buildSelectedPlatformList` 前，对每个 platformItem 的 `platformSkillDirectoryPath` `mkdir -p recursive` |
| B4 | `features/skill/copier.ts` resolve(sourcePath) 后才 readdir | source 不存在时（race / 远端中途删除）才报错，且报错时已写 tmpdir | 进 copier 第一步 `existsSync(skillSourceDirectoryPath)` 校验；缺失抛 `AppError(SOURCE_SKILL_MISSING, { params: { skillName: entry.name } })` |
| B5 | `features/github/repository.ts:76-88` catch 块吐 `"frontmatter 解析失败"` | 不告诉用户哪个字段缺 | catch 内区分 ZodError 与其它、提取 `path` 字段路径拼出 `"缺少字段 name"` / `"描述为空"` 等具体文案 |
| B6 | `error/definitions.ts` `REMOTE_REPOSITORY_EMPTY` buildMessage | 不告诉用户是什么仓库 | `仓库 {owner}/{repo}@{branch} 内未发现任何 yeizi- 前缀技能目录。请确认：(1) 配置仓库地址正确；(2) 顶层存在至少一个 yeizi-xxx 子目录且包含 SKILL.md。` |
| B7 | `features/skill/copier.ts` 报 `FILE_COPY_FAILED` 时 `params: { sourcePath: tmpdir 路径 }` | 用户无意义的 /tmp/xxx 路径 | sourcePath 改为 `"仓库临时目录/${skillName}"` 或省略；cause.message 透传 |
| B8 | `tools/filesystem/directory.ts` `compareDirectoryContentHash` 第一步 `existsSync(target)`，对 source 不存在时让 readdir 抛 | source 与 target 行为不对称 | source 不存在时也直接返 false（"两个目录内容不同"的合理推断） |

### C. 死代码与旧业务残留清理（4 项）

| ID | 位置 | 问题 | fix |
|---|---|---|---|
| C1 | `error/code.ts:60`, `error/definitions.ts:82`, `types/error/types.ts:47` 的 `REMOTE_SKILL_DOCUMENT_INVALID` | v2 改 per-skill 容错后此错误码零抛点 | 三处同步删除 |
| C2 | `schemas/skill/frontmatter.ts:7-8` TSDoc `「使用 passthrough 容忍历史遗留的 version 等额外字段」` | "历史遗留" 引导维护者以为还在维护 version | 改为 `「仅强校验 name 与 description。保留 frontmatter 上可能存在的额外字段（如版本号、tags），但不参与业务读取」` |
| C3 | `config/repository.ts:15` 注释 `「拼接 raw URL 与 Contents API ?ref= 时使用的分支名」` | v2 已无 Contents API 调用 | 改为 `「调用 giget 拉取指定分支时的分支标识」` |
| C4 | `tools/string/split-csv.ts` 无 TSDoc | v2 替代原 `csv-option-value-schema` 但无说明 | 加 TSDoc：`「v2 把 csv option 的 Zod schema 验证替换为纯字符串拆分。理由：平台名 / 技能名长度极短、选项集合小，纯字符串校验已足够。如未来选项可能含复杂字符再加 zod schema。」` |

### D. install 调试安全开关（4 项）

| ID | flag | 用途 | 实现要点 |
|---|---|---|---|
| D3 | `--dry-run` | 只打印"将执行的操作"不实际复制 | Copier 内部 short-circuit return；但要明确区分"目标不存在本来就会复制"和"目标存在但与远端一致 dry-run 跳过"两种 |
| D4 | `--backup` | 覆盖前重命名 `~/.claude/skills/yeizi-foo` → `~/.claude/skills/yeizi-foo.bak-{ts}` | 在 copyDirectory 之前 renameSync；如 rename 失败则整个 copy 失败、不覆盖原目录 |
| D5 | `--offline` | giget 走缓存 | `getRepositoryDirectoryPath(options: { offline: boolean })` 透传给 giget 的 `offline: true` 参数；缓存不可用时 giget 抛错由上层 catch |
| D6 | （无 flag）CLI 帮助中英一致化 | commander 默认英文，用户体验割裂 | `program.addHelpText('beforeAll', ...)` 注入中文快速入门 + 子命令摘要；option description 已在 InstallCommand 上用中文 |

**CLI 命令面不动**：不增 uninstall、info、clean 等新子命令（即使 review 时其它人提了）。
**`getRepositoryDirectoryPath` 加 `options?: { offline?: boolean }` 不算增 API，是选项化已有调用面**。

### E. 文档同步（3 项）

| ID | 文件 | 内容 |
|---|---|---|
| E1 | `cli/README.md` | (1) 删 update 命令所有出现；(2) `支持平台` 列表补 `all`；(3) `~/.yeizi-skills/skills` 写入"默认技能目录"表；(4) `"需要可访问 GitHub，因为 CLI 会拉取远端元数据"` → `"需要可访问 GitHub，因为 CLI 会用 git 协议拉取整个仓库快照到临时目录"`；(5) 新增 §`SKILL.md frontmatter 规范` 示例 YAML + 注明 name/description 必填、version 已废弃 |
| E2 | `cli/CHANGELOG.md`（新建） | 顶部 v2.0.0 条目按 Keep a Changelog 格式：`## [v2.0.0] - 2026-06-30`、### Removed（update 命令 / manifest.json / axios + semver 依赖 / SKILL.md version 字段）、### Changed（frontmatter 字段名 name/description）、### Added（SkillEntry 模型 / 4 态 comparison status / NO_CHANGE install status）、### Fixed（无） |
| E3 | `README.md`（仓库根） | 同步 install/list 用法；不重复 E1 内容、只补仓库级 summary |

### F. 低优清理 / 工程味道（4 项）

| ID | 位置 | 问题 | fix |
|---|---|---|---|
| F1 | `types/skill/index.ts:1-5` 桶导出 `SkillComparisonStatusValue` / `SkillInstallStatusValue` | 0 消费方（grep 不到外部 import） | 从桶导出中删除；如真要暴露类型让外部用 `import type { SkillComparisonStatus } from "@/constants/skill/..."` 直接拿 |
| F2 | `types/command/{install,list}/options.ts` 各只 1 个文件 + `index.ts` 桶 | 违反"最小模块目录" | 合并为 `types/command/install.ts` / `types/command/list.ts` 单文件含 interface；桶 `types/command/index.ts` 直接 re-export |
| F3 | `cli/src/config/{platform,repository}.ts` 直接放 config 根 | 违反 directory-rules "共享配置子目录使用配置主题名词" | 移到 `config/platform/index.ts`、`config/repository/index.ts`；`config/index.ts` 桶 re-export |
| F4 | `features/platform/config.ts` | `PlatformConfigService` 构造时 `[...platformConfig.platformList]` 深拷 | 去掉深拷贝（as const 已 readonly、`platformConfig` 不会运行时改）；保留 Service 单例（依赖注入形态对测试友好） |

## 4. 数据流与组件职责

```
       user
        │ argv
        ▼
  main.ts
   ├ InstallCommand.execute
   │    ├--dry-run | --backup | --offline flags 透传
   │    ├ buildSelectedPlatformList(platformList, names, false)
   │    │    └ 对每个 platformItem 的 skills 目录 mkdir -p (B3)
   │    ├ runWithSkillRepository(runner) [新公共文件]
   │    │    ├ getRepositoryDirectoryPath(options: {offline?}) [giget]
   │    │    └ runner(repositoryDirectoryPath):
   │    │         ├ scanSkillEntryList(repoPath)
   │    │         │      → { skillEntryList, warningList }  (B5 字段具体)
   │    │         ├ if --skill X passed:
   │    │         │   检查 X ⊂ remoteSkillEntryList.skillEntryList
   │    │         │   缺失抛 AppError(SKILL_NOT_FOUND) (B2)
   │    │         ├ buildSelectedSkillNameList(remote, input) → names[]
   │    │         ├ buildSelectedSkillList(remote, names) → entries[]
   │    │         ├ dryRunMode?
   │    │         │   渲染"将执行"总结后 return
   │    │         ├ Promise.all(entries.flatMap(e =>
   │    │         │   platforms.map(p =>
   │    │         │     copySkillEntryToPlatformItem(e, p, repoPath, opts)
   │    │         │   )
   │    │         │ )) (A6)
   │    │         │   每项 copySkillEntryToPlatformItem:
   │    │         │     ├ existsSync(sourcePath) (B4)
   │    │         │     ├ if --backup: renameSync(target, ${target}.bak-${ts})
   │    │         │     ├ compareDirectoryContentHash (B8)
   │    │         │     ├ NO_CHANGE / copyDirectory / dry-run skip
   │    │         ├ buildInstallSummaryMessageList [Record 分发表 A4]
   │    │         └ renderSummaryDisplay + warningList
   │
   └ ListCommand.execute (不变)
        ├ buildSelectedPlatformList(platformList, names, true)  // allowMissingSkillDirectory
        ├ runWithSkillRepository:
        │     ├ scanSkillEntryList → {skillEntryList, warningList}
        │     ├ buildComparisonRows(skillEntryList, selectedPlatformList)
        │     ├ renderComparisonTable (truncate 改 tools/string/ A5)
        │     └ renderSummaryDisplay("提示", warningList)
        └ (cleanup by runWithSkillRepository)
```

新公共文件 `features/github/run-with-skill-repository.ts`：

```typescript
async function runWithSkillRepository<T>(
  runner: (repositoryDirectoryPath: string) => Promise<T>,
): Promise<T> {
  const repositoryDirectoryPath = await getRepositoryDirectoryPath()
  try {
    return await runner(repositoryDirectoryPath)
  }
  finally {
    try {
      await removeDirectory(repositoryDirectoryPath)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
          params: { directoryPath: repositoryDirectoryPath },
          cause: error,
        })
      }
      throw error
    }
  }
}
```

## 5. 命令面 + 退出码契约

### 命令（不变）

- `yeizi-skills install [--platform <csv>] [--skill <csv>] [--dry-run] [--backup] [--offline]` （新增 3 flag）
- `yeizi-skills list [--platform <csv>]`

**不增 uninstall / info / clean**。

### 退出码

| 场景 | 退出码 |
|---|---|
| 成功（含 warning） | 0 |
| 单个 SKILL.md 损坏（per-skill 容错） | 0 + warning 渲染 |
| 部分 install 失败（catcher FAIL） | 0 + summary 显示 FAILED 数 |
| 平台不识别 | 1 (PLATFORM_NOT_SUPPORTED with `platformNameList: string[]`) |
| --skill X 远端没有 | 1 (SKILL_NOT_FOUND) |
| 仓库 0 个 yeizi-* 子目录 | 1 (REMOTE_REPOSITORY_EMPTY) |
| giget 错误（网络 / 仓库不存在） | 1 (PROMPT_UNAVAILABLE 之外的、暂复用 `INTERNET` 类或新加 `REMOTE_REPOSITORY_FETCH_FAILED`） |
| 平台 skills 目录缺失 | 0：install 自动 mkdir、list 展示 MISSING_SKILLS_DIRECTORY 行 |
| 临时目录清理失败 | 1 (DIRECTORY_REMOVE_FAILED) |
| `--backup` rename 失败 | 1 (FILE_COPY_FAILED) |
| 平台 options 缺失 | 1 (PLATFORM_OPTION_EMPTY) |
| skill options 缺失 | 1 (SKILL_OPTION_EMPTY) |

`PROMPT_UNAVAILABLE` 与 `PROMPT_CANCELLED` 保留用于 inquirer 边界。`SKILL_OPTION_EMPTY`、`PLATFORM_OPTION_EMPTY` 等已有。

## 6. 实施分批（每批 1 PR）

按依赖顺序排列：

| 批次 | 内容 | 文件改动 |
|---|---|---|
| **batch-1** rules & error | A1, A2, A3, A7, C1 | 删 unknown、删非空断言、definitions 改名、删 REMOTE_SKILL_DOCUMENT_INVALID |
| **batch-2** domain refactor | A4, A5, A6, F1 | Record 分发表、truncate 提工具、batchInstall inline、清理 *Value 桶导出 |
| **batch-3** install bugs | B1, B2, B3, B4 | PLATFORM params、early SKILL_NOT_FOUND、auto mkdir、copier existsSync |
| **batch-4** scanner & messages | B5, B6, B7, B8, C2, C3, C4 | scan warning 具体字段、REMOTE_REPOSITORY_EMPTY 提示坐标、FILE_COPY 路径隐藏、compareHash source 缺失、3 处 TSDoc |
| **batch-5** debug flags | D3, D4, D5, D6 | --dry-run、--backup、--offline、中英 help |
| **batch-6** structure | E1, E2, E3, F2, F3, F4 | README、CHANGELOG、根 README、command types 单文件、config/ 子目录、PlatformConfigService 评估报告 |

**总 27-28 commits、6 PRs**。每个 PR 可独立 review、merge、sanity test。

## 7. 退出条件

- [x] 6 批次全部 commit 完成、每批次 1 PR
- [x] `bun run check` 全过（typecheck + lint）
- [x] 关键路径手工烟测通过：
  - install --dry-run 打印摘要不复制
  - install 二次运行、目标未变 → 走 NO_CHANGE
  - install --backup → 原目录被 .bak-{ts}
  - install --offline 缓存命中
  - install 在 --platform codex 但 ~/.codex/skills 不存在 → 自动 mkdir
  - install --skill nope（远端无此技能） → 早期抛错、不拉仓库浪费网络
  - list 在 ~/.yeizi-skills/skills 不存在 → 表格里写 MISSING_SKILLS_DIRECTORY 不报错
  - 平台名错误时错误消息渲染多个名字而非 join 后塞进单数参数

## 8. 不做的明确清单（再次确认）

- ❌ uninstall / info / clean / new 命令
- ❌ spinner 库选型（独立 spec）
- ❌ .bak-{ts} 自动回收（未来迭代）
- ❌ uninstall --backup / uninstall --dry-run（不存在 uninstall 命令）

## 9. 命名与文件落地

本节**逐项**给出 §3 修复项的最终目录路径、文件命名、桶导出关系。所有命名遵循 cli/CLAUDE.md 命名规则（小写中划线文件名 + 主题名词、`List`/`Map`/`Set` 后缀、`Item`/`Key`/`Value` 单项、`is`/`has`/`can` 布尔前缀、动作+对象函数名）。

### 9.1 目录落位总览（refactor 后）

```
cli/src/
├── bin/
│   └── cli.ts                       (不变)
├── commands/
│   ├── install/
│   │   ├── command.ts              (A6/A5/F4 修)
│   │   └── index.ts                (不变)
│   └── list/
│       ├── command.ts              (A5 修)
│       └── index.ts                (不变)
├── config/
│   ├── platform/
│   │   └── index.ts                (F3: 单文件 platform.ts → index.ts)
│   ├── repository/
│   │   └── index.ts                (F3: 单文件 repository.ts → index.ts)
│   └── index.ts                    (F3: 桶 re-export 两个子目录)
├── constants/
│   └── skill/
│       ├── comparison-status.ts    (不变)
│       ├── install-status.ts        (不变)
│       └── index.ts                (不变)
├── error/
│   ├── app.ts                      (不变)
│   ├── code.ts                     (C1 删除 REMOTE_SKILL_DOCUMENT_INVALID)
│   ├── commander-adapter.ts        (A2 修)
│   ├── definitions.ts              (A3/A7 修)
│   ├── display.ts                  (不变)
│   ├── fatal-handler.ts            (不变)
│   └── index.ts                    (不变)
├── features/
│   ├── display/
│   │   ├── command-summary.ts      (不变)
│   │   └── index.ts                (不变)
│   ├── github/
│   │   ├── index.ts                (新增 runWithSkillRepository 桶导出)
│   │   ├── load-manifest-config.ts (不变，本次任务不删——已删除前 PR 删过)
│   │   ├── repository.ts           (B5 修：warning 文案精确字段)
│   │   └── run-with-skill-repository.ts  (新文件)
│   ├── platform/
│   │   ├── config.ts               (F4 修：去深拷贝)
│   │   ├── index.ts                (A5 调整：buildSelectedPlatformList 移出后)
│   │   ├── prompt.ts               (不变)
│   │   └── resolver.ts             (B1 修)
│   └── skill/
│       ├── comparison-builder.ts   (B5 修：warning 字段具体化)
│       ├── copier.ts               (A4 修：Record 分发表;B4 修)
│       ├── index.ts                (A6 batch 删私有 batchInstall)
│       ├── name-parser.ts          (不变)
│       ├── prompt.ts               (不变)
│       └── selected-builder.ts     (B2 修：早期 SKILL_NOT_FOUND)
├── main.ts                         (A4 修 D6 中英 help)
├── schemas/
│   ├── platform/
│   │   └── supported-name.ts       (不变)
│   ├── skill/
│   │   └── frontmatter.ts          (C2 TSDoc 修)
│   └── tools/
│       └── package-json-info.ts    (不变)
├── tools/
│   ├── filesystem/
│   │   ├── directory.ts            (B8 修)
│   │   └── index.ts                (不变)
│   ├── package-json/
│   │   └── load-info.ts            (A1 修)
│   ├── string/
│   │   ├── index.ts                (A5 加 export)
│   │   ├── split-csv.ts            (C4 TSDoc 修)
│   │   └── truncate-text.ts        (A5 新文件)
│   └── terminal/
│       ├── index.ts                (不变)
│       └── interactive.ts          (不变)
└── types/
    ├── command/
    │   ├── command.ts             (保留)
    │   ├── command-option.ts      (保留)
    │   ├── index.ts               (F2 桶更新：re-export command.ts/install.ts/list.ts)
    │   ├── install.ts             (F2: install/index.ts + install/options.ts → install.ts)
    │   └── list.ts                (F2: list/index.ts + list/options.ts → list.ts)
    ├── error/
    │   ├── app-error-options.ts   (不变)
    │   ├── commander-message-builder.ts  (不变)
    │   ├── index.ts               (A3 桶更新)
    │   └── types.ts                (A3 修：公开 AppErrorCodeType)
    ├── platform/
    │   ├── index.ts                (不变)
    │   ├── config.ts               (F3 不动，仍在 types/platform/)
    │   └── name.ts                 (不变)
    └── skill/
        ├── comparison.ts          (不变)
        ├── frontmatter.ts          (不变)
        ├── index.ts               (F1 修：删除 *Value 桶导出)
        └── install-result.ts       (不变)
```

### 9.2 命名原则（CLAUDE.md 适用于本批改造的细节）

- **文件名小写中划线**：`run-with-skill-repository.ts`、`truncate-text.ts` 等多个词用 `-`
- **新文件不带 `index.ts` 桶内容**：每个新文件就是单一职责单文件，不为它建桶。`run-with-skill-repository.ts` 直接是叶子节点，由 `features/github/index.ts` 桶聚合
- **最小目录才有桶导出**：`config/platform/index.ts` 是桶；但 `config/platform.ts` 单文件（重构前）不是——这正是 F3 要修的边界
- **`List`/`Map`/`Set` 后缀**：`warningList`、`skillEntryList`、`rootFileList` 等
- **`Item`/`Key`/`Value` 单项**：`rootFileEntry`、`platformItem`、`skillEntryItem`
- **`is`/`has`/`can` 布尔前缀**：`isLoaded`、`hasSkillsDirectory`、`canInstall`
- **动作+对象函数名**：`scanSkillEntryList` (动作+对象+集合) 不是 `scanSkillEntries`；`buildSelectedPlatformList` 不是 `buildSelectedPlatforms`
- **桶导出别名只在必要时使用**：
  - `AppErrorCode`（值）与 `AppErrorCodeType`（类型）在 definitions 文件中**各取一名**、不再需要 `as AppErrorCodeValues`
  - `SkillEntry` 是 SkillEntry 接口名（与原 `SkillItem` 已废不同名）—— 整个项目统一
  - `SkillEntry.name` 是字段名（不带 `skill` 前缀，与字段描述对齐）

### 9.3 标识符命名表

| 概念 | 命名 | 位置 | 类型 |
|---|---|---|---|
| 拆 manifest 后扫技能 | `scanSkillEntryList` | `features/github/repository.ts` | function |
| 拉仓库到 tmp + 事后清理的包装 | `runWithSkillRepository` | `features/github/run-with-skill-repository.ts` | async function |
| 同上 参数 lambda | `(repositoryDirectoryPath) => Promise<T>` | 同上 | callback |
| 同上 入参命名 | `runner`（接 runner 函数） | 同上 | parameter |
| 截断 description | `truncateText` | `tools/string/truncate-text.ts` | function |
| 同上 参数 | `text`（不是 description —— 通用工具不耦合 description 概念） | 同上 | parameter |
| 同上 限制 | `truncateLimit`（参数化、调用方传 60）| 同上 | parameter |
| 平台支持的批量错误 | `platformNameList` | `types/error/types.ts` `AppErrorParamsMap` key | field |
| 平台目录自动创建 | `ensureSkillsDirectory`（batchInstall 入口） | `features/platform/resolver.ts` 或迁到 `tools/filesystem/` | function |
| 复制单技能前 existsSync 校验源 | `assertSourceSkillExists`（或 inline） | `features/skill/copier.ts` | function |
| 复制选项入参 | `CopyOptions` | `features/skill/copier.ts` | interface |
| 字段 | `dryRun: boolean; backup: boolean` | 同上 | fields |
| 早期 SKILL_NOT_FOUND 校验函数 | `ensureRemoteSkillNamesExist` | `features/skill/selected-builder.ts` 或新文件 | function |
| 入参 | `remoteSkillEntryList`、`inputSkillNameList` | 同上 | parameters |
| install status 消息分发表 | `installStatusMessageBuilderByStatus` | `commands/install/command.ts`（private）| Map |
| 键类型 | `SkillInstallStatus`（值枚举名）| 同上 | key |
| list 表格的 truncate limit 字段 | `descriptionTruncateLimit`（保持） | `commands/list/command.ts` | readonly private field |
| 列表格调用工具 | `truncateText(row.description, this.descriptionTruncateLimit)` | 同上 | 调用点 |
| 缺失平台名数组 key | `missingPlatformNameList`（已有）→ `platformNameList` 改后 | `features/platform/resolver.ts` | variable |
| 早期参数名 | `inputSkillNameList`、`availableSkillEntryList` | install command | fields |
| --dry-run 选项字段 | `dryRun: boolean` | `types/command/install.ts` RawInstallOptions | field |
| --backup 选项字段 | `backup: boolean` | 同上 | field |
| --offline 选项字段 | `offline: boolean` | 同上 | field |
| getRepositoryDirectoryPath 入参 | `options?: { offline?: boolean }` | `features/github/repository.ts` | parameter（不破坏旧签名）|

### 9.4 桶导出关系（修改后）

#### `features/github/index.ts`（修改）

```typescript
export { getRepositoryDirectoryPath, scanSkillEntryList } from "./repository"
export { runWithSkillRepository } from "./run-with-skill-repository"
```

#### `features/platform/index.ts`（微调）

```typescript
// buildSelectedPlatformList 在 batch-2 移到 tools/string/ 后从 features/platform/ 移除
// 留下 promptPlatformNameList（不变）与平台内容隔离
export { promptPlatformNameList } from "./prompt"
// 如 F2 决策后 buildSelectedPlatformList 仍属 resolver.ts，可继续在这里桶导出
// 若移到 tools/string/build-selected-list.ts，则从 tools/string/index.ts 桶导出
export { buildSelectedPlatformList } from "./resolver"
```

#### `features/skill/index.ts`（修改）

```typescript
// batch-2 末尾 A6 inline private batchInstall 后，桶导出精简为 4 项
export { buildComparisonRows } from "./comparison-builder"
export { copySkillEntryToPlatformItem } from "./copier"
export { buildSelectedSkillList } from "./selected-builder"  // B2 加早期校验后
export { parseSkillNameList } from "./name-parser"
export { promptSkillNameList } from "./prompt"

// F1 删除：无 *Value 类型导出
```

#### `tools/string/index.ts`（A5 修）

```typescript
export { splitCsvString } from "./split-csv"
export { truncateText } from "./truncate-text"
// C4：split-csv TSDoc 补完

// A5 讨论结果：buildSelectedPlatformList 不在 tools/string/——它接受 PlatformItem[]，
// 是 platform 域抽象；放回 features/platform/resolver.ts 的桶
```

#### `types/skill/index.ts`（F1 修改）

```typescript
// 删除：
// export type { SkillComparisonStatusValue, SkillInstallStatusValue }

// F1 不动 Keep 下来的（remained unchanged）：
export type { SkillComparisonRow, SkillEntry, SkillFrontmatter, SkillInstallResult } from "..."
// 值从 constants 那里 export、不在 types 桶里二次转出
```

#### `types/error/index.ts`（A3 修改）

```typescript
// 旧实现（broken 状态）:
export { AppError, AppErrorCode, getAppErrorDefinition, handleFatalError } from "..."
export type { AppErrorOptions, AppErrorParamsMap } from "..."

// A3 修改后：统一类型与值一起从桶导出，values 与 types 各走其名
export { AppError, AppErrorCode, getAppErrorDefinition, handleFatalError } from "..."
export type { AppErrorOptions, AppErrorParamsMap, AppErrorDefinition, AppErrorCodeType } from "..."
```

#### `error/definitions.ts`（A3 + A7 修改）

```typescript
// 删除 as AppErrorCodeValues 重命名
import { AppErrorCode } from "./code"
import type { AppErrorCodeType, AppErrorParamsMap } from "@/types/error"

// A7 修复：消除 6 处 `as AppErrorParamsMap[...]` 收窄
//   方法：每个 buildMessage 用 defineBuildMessage 工厂（此为 zod-less 实现）签名上声明具体 params 类型
//   或更简洁：手写每个 buildMessage 直接 import 类型，跳过 record 形式
//   （参考 zod-less：参见 .superpowers/sdd/spec-sketch/define-build-message.md 占位笔记）

const errorDefinitionMap: { [K in AppErrorCode]: {
  title: string
  buildMessage: (params: AppErrorParamsMap[K]) => string
} } = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  // ... 等等
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: {
    title: "平台不受支持",
    buildMessage: (params) => `以下平台不受支持：${params.platformNameList.join("、")}。`,
  },
  [AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
    title: "远端仓库异常",
    buildMessage: (params) =>
      `仓库 ${params.repositoryOwner}/${params.repositoryName}@${params.repositoryBranch} 内未发现任何 yeizi- 前缀技能目录。请确认：(1) 配置仓库地址正确；(2) 顶层存在至少一个 yeizi-xxx 子目录且包含 SKILL.md。`,
  },
  // ... 等等
}

function getAppErrorDefinition<K extends AppErrorCodeType>(
  code: K,
): { title: string; buildMessage: (params: AppErrorParamsMap[K]) => string } {
  return errorDefinitionMap[code]
}
```

#### `types/error/types.ts`（A3 修）

```typescript
// 暴露 AppErrorCodeType 给外部消费
type AppErrorCodeType = (typeof AppErrorCode)[keyof typeof AppErrorCode]

interface AppErrorDefinition<K extends AppErrorCodeType = AppErrorCodeType> {
  title: string
  buildMessage: (params: AppErrorParamsMap[K]) => string
}

// B1 修改 PLATFORM_NOT_SUPPORTED 入参
interface AppErrorParamsMap {
  // ... 现有项不变 ...
  [AppErrorCode.PLATFORM_NOT_SUPPORTED]: { platformNameList: string[] }
  // ... 现有项不变 ...
  [AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
    repositoryOwner: string
    repositoryName: string
    repositoryBranch: string
  }
}
```

### 9.5 移除/合并的桶项（最终态）

**task 安装流程调用的所有顶层函数及其最终所属桶文件**：

```typescript
// 主进程入口的命令侧
// 全部走 commander 安装与注册；不在桶里二次聚合：

// src/main.ts
import { InstallCommand } from "@/commands/install"
import { ListCommand } from "@/commands/list"

// src/commands/install/index.ts（桶）
export { InstallCommand } from "./command"

// src/commands/list/index.ts（桶）
export { ListCommand } from "./command"

// src/features/github/index.ts（桶，最终态）
export { getRepositoryDirectoryPath, scanSkillEntryList } from "./repository"
export { runWithSkillRepository } from "./run-with-skill-repository"

// src/features/platform/index.ts（桶，最终态）
export { buildSelectedPlatformList } from "./resolver"
export { promptPlatformNameList } from "./prompt"

// src/features/skill/index.ts（桶，最终态）
export { buildComparisonRows } from "./comparison-builder"
export { copySkillEntryToPlatformItem } from "./copier"
export { buildSelectedSkillList } from "./selected-builder"
export { parseSkillNameList } from "./name-parser"
export { promptSkillNameList } from "./prompt"

// src/tools/string/index.ts（桶，最终态）
export { splitCsvString } from "./split-csv"
export { truncateText } from "./truncate-text"

// src/tools/filesystem/index.ts（桶，不变）
export { compareDirectoryContentHash, copyDirectory, removeDirectory } from "./directory"

// src/features/display/index.ts（桶，不变）
export { renderSummaryDisplay } from "./command-summary"
export { renderComparisonTable } from "./comparison-table"  // 仍需确认这俩函数实际位置

// src/error/index.ts（值）
// src/types/error/index.ts（类型）
```

### 9.6 跨目录导入的"最小桶文件"约束

按 directory-rules 强约束，跨目录导入**必须停在最小目录桶文件**，不绕进文件内部：

| 跨目录场景 | 必须走的桶 | 示例 |
|---|---|---|
| `commands/*` 用 `features/*` | 该 `features/` 模块的 `index.ts` | `import { scanSkillEntryList } from "@/features/github"` |
| `commands/*` 用 `tools/*` | 该 `tools/` 模块的 `index.ts` | `import { truncateText } from "@/tools/string"` |
| 任何模块用 `@/error` | `error/index.ts`（值）+ `types/error/index.ts`（类型）| 路径不混 |
| `features/*` 互引 | 该 `features/xxx/index.ts` | `import { getPlatformList } from "@/features/platform"` |
| `tools/*` 用 `error` | `error/index.ts` | — |
| `tools/*` 用 `features/*` | **不允许**——工具层不应依赖业务 | （目录规则"通用技术内容"隔离） |
| 桶文件跨目录 import | 仍走最小桶 | `features/github/index.ts` 的 `import { removeDirectory } from "@/tools/filesystem"` 合规 |

### 9.7 内容主题与文件名一致性

| 文件 | 内容主题 | 文件名一致性 |
|---|---|---|
| `features/github/run-with-skill-repository.ts` | 拉仓库 + 清理临时目录的包裹 | "with" 表达"包装 + 时序"，"skill-repository" 主题明确 |
| `features/skill/copier.ts` | 单技能单平台复制动作 | "copy"动作、"skill"+"platformItem" 不在文件名（"copier" 隐含对象）、目录名承担"skill"主题 |
| `tools/string/truncate-text.ts` | 截断通用文本 | "truncate"动作、"text"对象——通用不耦合 description 概念 |
| `features/skill/selected-builder.ts` | 按名字从 SkillEntry 列表过滤 | "selected" 前缀、`-builder` 后缀 |
| `commands/install/command.ts` | install 主命令 | "install" 命令名 + "-command" 后缀 |

### 9.8 文件内符号命名一致性（CLAUDE.md 同概念同词）

v2.1 后所有引用技能元数据的代码统一走 `SkillEntry` 一个词（v2 已确定）。**绝不再引入 `SkillItem` / `SkillManifestEntry` / `SkillRecord` 等近义别名**。

Error code 命名：
- 值常量名：`AppErrorCode` + 一致风格后缀（`REMOTE_REPOSITORY_EMPTY` 全大写下划线）
- 类型别名：`AppErrorCodeType`（不再用 `AppErrorCode as AppErrorCodeValues`）
- types 桶：`AppErrorCodeType` 是公开类型别名、`AppErrorDefinition<K>` 是泛型版（future-proof，但不强制使用）

类型来源单一性：
- `SkillEntry`、`SkillComparisonRow`、`SkillInstallResult`、`SkillFrontmatter`、`SkillComparisonStatus`、`SkillInstallStatus` 都**只在 `types/skill/` 定义并唯一 export**
- 不在 features/ 命令/ 任何其他地方重复定义新 interface

### 9.9 删除/合并的清理动作对应位置

| ID | 文件位置 |
|---|---|
| A1 | `tools/package-json/load-info.ts:25` 去掉中间变量 |
| A2 | `error/commander-adapter.ts:100` + 内部 helper 签名调整 |
| A3 | `error/definitions.ts:3` (`as AppErrorCodeValues` 删除) + `types/error/index.ts` 内容更新 |
| A4 | `commands/install/command.ts` (Record 分发表) + `commands/update/command.ts`（已删，无需修）|
| A5 | `truncate-text.ts` 新建；`commands/list/command.ts` 改用工具；`tools/string/index.ts` 加桶 |
| A6 | `commands/install/command.ts` 删 `batchInstallSkillEntryListToPlatformList` 私有方法，改 inline |
| A7 | `error/definitions.ts` 全部 6 处 `as` 收窄 |
| B1 | `features/platform/resolver.ts:95` + `types/error/types.ts` + `error/definitions.ts` |
| B2 | `features/skill/selected-builder.ts` 加 `ensureRemoteSkillNamesExist` 或 inline 校验 |
| B3 | `features/platform/resolver.ts` 加 `ensureSkillsDirectory`（新建或内联）|
| B4 | `features/skill/copier.ts` 前置 existsSync |
| B5 | `features/github/repository.ts:76-88` catch 提取字段路径 |
| B6 | `error/definitions.ts` `REMOTE_REPOSITORY_EMPTY` 消息 |
| B7 | `features/skill/copier.ts` + `types/error/types.ts` `FILE_COPY_FAILED` 参数 |
| B8 | `tools/filesystem/directory.ts` `computeDirectoryContentHash` |
| C1 | `error/code.ts:60` + `error/definitions.ts:82` + `types/error/types.ts:47` 三处同步 |
| C2 | `schemas/skill/frontmatter.ts:7-8` TSDoc |
| C3 | `config/repository/index.ts`（F3 后）comment |
| C4 | `tools/string/split-csv.ts` TSDoc |
| D3 | `commands/install/command.ts` + `types/command/install.ts` + `features/skill/copier.ts` |
| D4 | `commands/install/command.ts` + `features/skill/copier.ts` |
| D5 | `features/github/repository.ts` `getRepositoryDirectoryPath` 加 `options` 参数 + `commands/install/command.ts` 传 flag + `types/command/install.ts` |
| D6 | `main.ts` addHelpText |
| F1 | `types/skill/index.ts` 桶导出删除 2 行 |
| F2 | 删 `types/command/install/index.ts` + `types/command/install/options.ts`；合并为 `types/command/install.ts`；`types/command/list/` 同理；`types/command/index.ts` 桶更新 |
| F3 | 删 `src/config/platform.ts`、`src/config/repository.ts`；新建 `src/config/platform/index.ts`、`src/config/repository/index.ts`；`src/config/index.ts` 桶 re-export |
| F4 | `features/platform/config.ts` `private constructor` 中去掉 `[...platformConfig.platformList]` 深拷 |
| E1 | `cli/README.md` |
| E2 | `cli/CHANGELOG.md` 新建 |
| E3 | `README.md`（仓库根）|

## 10. 关联文档

- PRD：`cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2-prd.md`
- v2 重构 spec：`cli/docs/superpowers/specs/2026-06-30-manifest-removal-refactor-design.md`
- plan：稍后由 writing-plans 生成
- audit 来源（4 个 agent 报告）：`.superpowers/sdd/audit-*.md`（将由这次 spec 撰写时同步落档）


