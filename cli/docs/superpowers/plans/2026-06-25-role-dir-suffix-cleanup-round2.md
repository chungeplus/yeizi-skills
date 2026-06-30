# 角色目录文件名去后缀整改（第二轮）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `config/`、`constants/`、`errors/` 三个角色目录下文件名中与目录角色同义的冗余词去掉，使文件名符合「目录角色不重复到文件名」规则。

**Architecture:** 纯机械改名 + import/桶导出路径更新，不改任何符号名、不改任何文件内逻辑/注释/格式。三个文件全部 git-tracked，用 `git mv`。外部消费者均通过 `@/config`、`@/constants`、`@/errors` 桶导入，改名对外部零影响；唯一内部相对 import（`fatal-error-handler.ts` 引用 `./commander-error-adapter`）需同步。

**Tech Stack:** TypeScript、Bun（`bun run typecheck`）、git。

## Global Constraints

- 符号名一律不变：`repositoryConfig`、`platformDirectoryNames`、`buildCommanderAppError`、`buildCommanderErrorMessage`、`isCommanderNonFailure` 全部保持原样。
- 只改文件名与 import/桶导出路径，不改文件内逻辑、不补注释、不调格式。
- 文件名统一小写中划线。
- 已知无关报错：仓库当前存在另一处重构遗留的 typecheck 报错（`ISkillIndexEntry`、`./skill-index` 模块缺失、`@/tools` 缺 `loadPackageJsonInfo` 等）。这些与本任务无关，验证口径为「不新增任何涉及本次改名文件的报错」，不要求全项目零报错。
- 验证基线：本任务开始前，先记录一次 `bun run typecheck` 的报错清单作为基线，改完后比对，确保没有新增项。

---

## 全项目扫描判定（逐目录）

以下按「目录角色不重复到文件名」规则，对全项目 `src/**/*.ts` 逐目录判定。已在上轮整改的 7 个文件（schemas 6 个去 `-schema`、prompt 1 个去 `-prompt`）不在本表重复。

### 领域目录（目录名 = 业务领域，非角色分类）

领域目录下文件名带领域前缀是**语义限定**，不是角色重复，**保留**：

| 目录 | 文件 | 主符号 | 判定 |
|---|---|---|---|
| `features/skill/` | `skill-installer.ts` | `SkillInstaller` | 领域目录 + 领域前缀 = 语义限定，保留 |
| `features/skill/` | `skill-comparator.ts` | `SkillComparator` | 同上，保留 |
| `features/source/` | `github-skill-source.ts` | `GitHubSkillSource` | 同上，保留 |
| `types/platform/` | `supported-platform.ts` | `SupportedPlatform` | 同上，保留 |
| `types/platform/` | `platform-target.ts` | `IPlatformTarget` | 同上，保留 |
| `types/skill/` | `skill-comparison.ts` | `ISkillComparisonRow` 等 | 同上，保留 |
| `types/skill/` | `skill-frontmatter.ts` | `ISkillFrontmatter` | 同上，保留 |
| `types/skill/` | `skill-manifest.ts` | `ISkillManifest` 等 | 同上，保留 |
| `types/source/` | `downloaded-skill-file.ts` | `IDownloadedSkillFile` | 同上，保留 |
| `types/source/` | `github-api.ts` | `IGitHubApi` | 同上，保留 |
| `types/source/` | `github-contents-entry.ts` | `IGitHubContentsEntry` | 同上，保留 |
| `types/source/` | `skill-source.ts` | `ISkillSource` | 同上，保留 |
| `constants/` | `index.ts` | — | 桶导出，保留 |
| `tools/` | `parse-csv-option-values.ts` | `parseCsvOptionValues` | 领域目录，保留 |
| `apis/http-client/` | `http-request-client.ts` | `HttpRequestClient` | 领域目录，保留 |
| `apis/github/` | `contents-parser.ts` | `parseContentsEntries` | 领域目录，保留 |
| `apis/github/` | `github-api.ts` | `githubApi` | 领域目录，保留 |
| `apis/github/` | `url-builder.ts` | `buildGitHubRawUrl`、`buildGitHubContentsUrl` | 领域目录，保留 |
| `apis/github/` | `constants.ts` | `RAW_BASE_URL` 等 | 常量集合角色文件，保留 |
| `apis/package-json/` | `load-package-json-info.ts` | `loadPackageJsonInfo` | 领域目录，保留 |
| `commands/install/` | `command.ts` | `InstallCommand` | 命令目录，保留 |
| `commands/list/` | `command.ts` | `ListCommand` | 命令目录，保留 |
| `commands/update/` | `command.ts` | `UpdateCommand` | 命令目录，保留 |
| `config/` | `index.ts` | — | 桶导出，保留 |
| `errors/` | `app-error.ts` | `AppError` | `error` 是语义主题（AppError 类），非角色后缀，保留 |
| `errors/` | `error-code.ts` | `AppErrorCode`、`getAppErrorDefinition` | `error` 是语义主题（错误码），保留 |
| `errors/` | `error-display.ts` | `renderErrorDisplay` | `error` 是语义主题（错误展示），保留 |
| `errors/` | `fatal-error-handler.ts` | `handleFatalError`、`wrapAsFatalAppError` | `error` 是语义主题（致命错误处理），保留 |
| `errors/` | `index.ts` | — | 桶导出，保留 |
| `features/platform/` | `platform-resolver.ts` | `resolvePlatformSkillPaths` | 领域目录，保留 |
| `features/skill/builders/` | `selected-skill-entry.ts` | `buildSelectedSkillEntries` | 已有先例（去 -builder），保留 |
| `features/skill/parsers/` | `skill-document.ts` | `SkillDocumentParser` | 已有先例（去 -parser），保留 |
| `features/skill/parsers/` | `skill-manifest.ts` | `parseSkillManifest`、`parseSkillVersion` | 领域目录，保留 |
| `features/skill/parsers/` | `skill-name.ts` | `parseSkillName` | 领域目录，保留 |
| `tools/display/` | `command-summary.ts` | `renderSummaryDisplay` | 领域目录，保留 |
| `tools/display/` | `comparison-table.ts` | `renderComparisonTableDisplay` | 领域目录，保留 |

### 角色目录（目录名 = 角色分类，文件名含同义角色词）

本轮需整改 3 个文件：

| 文件 | 目录角色 | 冗余词 | 建议新名 | 理由 |
|---|---|---|---|---|
| `config/repository-config.ts` | `config/` | `-config` | `repository.ts` | 配置目录已标明角色，文件名只需表达语义主题「仓库」 |
| `constants/platform-directory-names.ts` | `constants/` | `-names` | `platform-directories.ts` | 常量目录已标明角色，`names` 在常量语境下冗余；文件内容是平台到目录名的映射，用 `platform-directories` 更简洁 |
| `errors/commander-error-adapter.ts` | `errors/` | `-error-` | `commander-adapter.ts` | 错误目录已标明角色，`error` 夹在中间冗余；在 errors/ 下「commander-adapter」语义清晰（Commander 错误适配器） |

---

## Task 1: config 去 `-config`

**Files:**
- Rename: `src/config/repository-config.ts` → `src/config/repository.ts`
- Modify: `src/config/index.ts`（桶导出路径）

**Interfaces:**
- Consumes: 无
- Produces: `@/config` 桶对外导出的 `repositoryConfig` 符号名与 import 路径均不变。

- [ ] **Step 1: 记录 typecheck 基线**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-baseline.txt; cat /tmp/typecheck-baseline.txt`
Expected: 输出当前已存在的无关报错清单。

- [ ] **Step 2: 改名文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git mv src/config/repository-config.ts src/config/repository.ts
```

- [ ] **Step 3: 更新 `config/index.ts` 桶导出**

把 `src/config/index.ts` 全文替换为：

```ts
export { repositoryConfig } from "./repository"
```

- [ ] **Step 4: 验证旧名零残留**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && grep -rn "repository-config" src --include=*.ts`
Expected: 无输出。

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && ls src/config/`
Expected: 显示 `index.ts`、`repository.ts`（无 `repository-config.ts`）。

- [ ] **Step 5: typecheck 无新增报错**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-after-t1.txt; diff /tmp/typecheck-baseline.txt /tmp/typecheck-after-t1.txt`
Expected: 无 `>` 新增行。

- [ ] **Step 6: Commit**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git add src/config/
git commit -m "refactor(config): 去掉文件名 -config 角色后缀"
```

---

## Task 2: constants 去 `-names`

**Files:**
- Rename: `src/constants/platform-directory-names.ts` → `src/constants/platform-directories.ts`
- Modify: `src/constants/index.ts`（桶导出路径）

**Interfaces:**
- Consumes: 无
- Produces: `@/constants` 桶对外导出的 `platformDirectoryNames` 符号名与 import 路径均不变。

- [ ] **Step 1: 改名文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git mv src/constants/platform-directory-names.ts src/constants/platform-directories.ts
```

- [ ] **Step 2: 更新 `constants/index.ts` 桶导出**

把 `src/constants/index.ts` 全文替换为：

```ts
export { platformDirectoryNames } from "./platform-directories"
```

- [ ] **Step 3: 验证旧名零残留**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && grep -rn "platform-directory-names" src --include=*.ts`
Expected: 无输出。

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && ls src/constants/`
Expected: 显示 `index.ts`、`platform-directories.ts`（无 `platform-directory-names.ts`）。

- [ ] **Step 4: typecheck 无新增报错**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-after-t2.txt; diff /tmp/typecheck-after-t1.txt /tmp/typecheck-after-t2.txt`
Expected: 无 `>` 新增行。

- [ ] **Step 5: Commit**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git add src/constants/
git commit -m "refactor(constants): 去掉文件名冗余 -names"
```

---

## Task 3: errors 去 `-error-`

**Files:**
- Rename: `src/errors/commander-error-adapter.ts` → `src/errors/commander-adapter.ts`
- Modify: `src/errors/fatal-error-handler.ts`（相对 import 路径）
- Modify: `src/errors/index.ts`（桶导出路径）

**Interfaces:**
- Consumes: 无
- Produces: `@/errors` 桶对外导出的 `buildCommanderAppError`、`buildCommanderErrorMessage`、`isCommanderNonFailure` 符号名与 import 路径均不变。

**前置说明：** `fatal-error-handler.ts` 在同一目录下直接相对 import 了 `./commander-error-adapter`，改名后需同步该 import 路径。桶导出在 `errors/index.ts` 也需同步。

- [ ] **Step 1: 改名文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git mv src/errors/commander-error-adapter.ts src/errors/commander-adapter.ts
```

- [ ] **Step 2: 更新 `fatal-error-handler.ts` 相对 import**

把 `src/errors/fatal-error-handler.ts` 第 5 行：

```ts
import { buildCommanderAppError, isCommanderNonFailure } from "./commander-error-adapter"
```

改为：

```ts
import { buildCommanderAppError, isCommanderNonFailure } from "./commander-adapter"
```

- [ ] **Step 3: 更新 `errors/index.ts` 桶导出**

把 `src/errors/index.ts` 第 2 行：

```ts
export { buildCommanderAppError, buildCommanderErrorMessage, isCommanderNonFailure } from "./commander-error-adapter"
```

改为：

```ts
export { buildCommanderAppError, buildCommanderErrorMessage, isCommanderNonFailure } from "./commander-adapter"
```

- [ ] **Step 4: 验证旧名零残留**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && grep -rn "commander-error-adapter" src --include=*.ts`
Expected: 无输出。

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && ls src/errors/`
Expected: 显示 `app-error.ts`、`commander-adapter.ts`、`error-code.ts`、`error-display.ts`、`fatal-error-handler.ts`、`index.ts`（无 `commander-error-adapter.ts`）。

- [ ] **Step 5: typecheck 无新增报错**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-after-t3.txt; diff /tmp/typecheck-after-t2.txt /tmp/typecheck-after-t3.txt`
Expected: 无 `>` 新增行。

- [ ] **Step 6: Commit**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git add src/errors/
git commit -m "refactor(errors): 去掉文件名冗余 -error-"
```

---

## Self-Review

**1. 范围覆盖：**
- Task 1: `config/repository-config.ts` → `repository.ts`（去 `-config`）✅
- Task 2: `constants/platform-directory-names.ts` → `platform-directories.ts`（去 `-names`）✅
- Task 3: `errors/commander-error-adapter.ts` → `commander-adapter.ts`（去 `-error-`）✅

**2. 占位符扫描：** 无 TBD/TODO/"implement later"。每个改名、import、桶导出步骤均给出确切命令与完整代码。

**3. 类型/路径一致性：**
- `fatal-error-handler.ts` 的相对 import `./commander-error-adapter` → `./commander-adapter` 在 Task 3 Step 2 同步。
- `config/index.ts`、`constants/index.ts`、`errors/index.ts` 三处桶导出路径在各自 Task 的 Step 3/2 同步。
- 所有导出符号名保持不变，与上轮整改（schemas 去 -schema，符号名不变）口径一致。
- 外部消费者均通过 `@/config`、`@/constants`、`@/errors` 桶导入，不受文件名变化影响。

**4. 遗漏检查：** 全项目 40+ 个 ts 文件逐目录判定（领域目录保留、角色目录整改），除上轮已改的 7 个 + 本轮 3 个外，无其他违规。
