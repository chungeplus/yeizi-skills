# service 层目录重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/apis/` 重命名为 `src/service/`，按 soybean 风格分为 `service/apis/`（域端点）+ `service/request/`（HTTP 传输层），并把非网络模块 `prompt`、`package-json` 搬回 `src/tools/`。

**Architecture:** 纯结构调整——文件移动、目录改名、import 路径改写。不改任何函数实现，不拆分文件内部内容。`git mv` 保留历史；每个任务以 `bun run check` 为验证门并单独提交。

**Tech Stack:** TypeScript，Bun，eslint，tsc。路径别名 `@/* → src/*`。

## Global Constraints

- 不改任何函数实现、注释、格式；只动文件位置、目录名、import 路径。
- 不拆分 `request/` 内部：`http-request-client.ts` 的 `HttpRequestError`、retry 函数、`MAX_ATTEMPTS` 等常量只单文件使用，留在原文件。
- 不动 github 类型（`src/types/source/`）、不动 `apis/github/constants.ts` 文件名。
- `service/apis/`（apis 用复数）。
- 目录门面 `index.ts` 只允许 `export *` / `export { ... }` / `export type { ... }`。
- 验证命令：`bun run check`（= `tsc --noEmit && eslint .`，0 错 0 警）、`bun test`、`bun run build`。
- 每个任务单独一个 commit。

---

### Task 1: 搬移 HTTP 传输层与域端点到 service/

**Files:**
- Move: `src/apis/http-client/` → `src/service/request/`（含 `index.ts`、`http-request-client.ts`）
- Move: `src/apis/github/` → `src/service/apis/github/`（含 5 文件）
- Modify: `src/service/apis/github/github-api.ts:4`（改 import）
- Create: `src/service/apis/index.ts`（桶导出 github）
- Create: `src/service/index.ts`（桶导出 apis、request）
- Delete: `src/apis/index.ts`（旧总门面，内容拆分后不再需要这一版）

**Interfaces:**
- Consumes: 无（搬移现有代码）
- Produces:
  - `@/service/request` 导出 `HttpRequestClient`
  - `@/service/apis/github` 导出 `githubApi`、`buildContentsApiUrl`、`buildSkillsJsonUrl`、`parseContentsEntries`、`GitHubContentsPayload`、`RAW_BASE_URL`、`CONTENTS_BASE_URL`、`DEFAULT_TIMEOUT_MS`
  - `@/service` 同时再导出以上两者

- [ ] **Step 1: 用 git mv 搬移两个目录**

```bash
cd cli
git mv src/apis/http-client src/service/request
git mv src/apis/github src/service/apis/github
```

- [ ] **Step 2: 改 github-api.ts 的传输层 import**

`src/service/apis/github/github-api.ts` 第 4 行：

```typescript
// 改前
import { HttpRequestClient } from "@/apis/http-client"
// 改后
import { HttpRequestClient } from "@/service/request"
```

- [ ] **Step 3: 新建 service/apis/index.ts**

`src/service/apis/index.ts`：

```typescript
export * from "./github"
```

- [ ] **Step 4: 新建 service/index.ts**

`src/service/index.ts`：

```typescript
export * from "./apis"
export * from "./request"
```

- [ ] **Step 5: 删除旧 apis 总门面**

```bash
cd cli
git rm src/apis/index.ts
```

注意：此时 `src/apis/` 下还剩 `package-json/`、`prompt/`，Task 2 处理；本步只删旧总门面 `index.ts`。

- [ ] **Step 6: 改下游引用 github 的 import**

`src/features/source/github-skill-source.ts` 第 9 行：

```typescript
// 改前
import { githubApi } from "@/apis/github"
// 改后
import { githubApi } from "@/service/apis/github"
```

- [ ] **Step 7: 验证 typecheck + lint**

此时 `prompt`/`package-json` 仍在 `@/apis`（旧总门面已删，但 `commands/*` 和 `main.ts` 还引用 `@/apis`，会报错），所以本步只单独验证 service 子树不引入新错误的方式是构建整体检查——预期仍有 `@/apis` 解析失败。改为按文件验证 service 子树：

Run: `cd cli && npx tsc --noEmit 2>&1 | grep -E "service/" || echo "service 子树无 TS 错误"`
Expected: 输出 `service 子树无 TS 错误`（service/ 下文件本身不报错；`@/apis` 的残留错误在 Task 2 清掉）

- [ ] **Step 8: 提交**

```bash
cd cli
git add -A
git commit -m "refactor(service): 搬移 http-client 与 github 到 service/request 与 service/apis

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 搬移 prompt 与 package-json 回 tools/

**Files:**
- Move: `src/apis/prompt/platform-skill-prompt.ts` → `src/tools/prompt-service.ts`
- Move: `src/apis/package-json/load-package-json-info.ts` → `src/tools/load-package-json-info.ts`
- Delete: `src/apis/prompt/`、`src/apis/package-json/`（含各自 `index.ts`），最终删空 `src/apis/`
- Modify: `src/tools/index.ts`（补两条桶导出）
- Modify: `src/commands/install/command.ts:4`、`src/commands/list/command.ts:4`、`src/commands/update/command.ts:4`、`src/main.ts:5`（改 import 来源）

**Interfaces:**
- Consumes: 无
- Produces: `@/tools` 额外导出 `getInteractiveTerminal`、`promptPlatformList`、`promptSkillList`、`promptSkillListToUpdate`、`loadPackageJsonInfo`

- [ ] **Step 1: git mv 两个文件并删空目录**

```bash
cd cli
git mv src/apis/prompt/platform-skill-prompt.ts src/tools/prompt-service.ts
git mv src/apis/package-json/load-package-json-info.ts src/tools/load-package-json-info.ts
git rm src/apis/prompt/index.ts src/apis/package-json/index.ts
```

- [ ] **Step 2: 补 tools/index.ts 桶导出**

`src/tools/index.ts` 全文改为：

```typescript
export * from "./display"
export * from "./load-package-json-info"
export * from "./parse-csv-option-values"
export * from "./prompt-service"
```

- [ ] **Step 3: 改 commands 与 main 的 import 来源**

`src/commands/install/command.ts` 第 4 行：

```typescript
// 改前
import { getInteractiveTerminal, promptPlatformList, promptSkillList } from "@/apis"
// 改后
import { getInteractiveTerminal, promptPlatformList, promptSkillList } from "@/tools"
```

`src/commands/list/command.ts` 第 4 行：

```typescript
// 改前
import { getInteractiveTerminal, promptPlatformList } from "@/apis"
// 改后
import { getInteractiveTerminal, promptPlatformList } from "@/tools"
```

`src/commands/update/command.ts` 第 4 行：

```typescript
// 改前
import { getInteractiveTerminal, promptPlatformList, promptSkillListToUpdate } from "@/apis"
// 改后
import { getInteractiveTerminal, promptPlatformList, promptSkillListToUpdate } from "@/tools"
```

`src/main.ts` 第 5 行：

```typescript
// 改前
import { loadPackageJsonInfo } from "@/apis"
// 改后
import { loadPackageJsonInfo } from "@/tools"
```

- [ ] **Step 4: 确认 src/apis 已删空**

Run: `cd cli && test -d src/apis && echo "残留目录存在" || echo "src/apis 已删除"`
Expected: 输出 `src/apis 已删除`（git mv/rm 后空目录应已消失；若仍存在则 `rmdir src/apis`）

- [ ] **Step 5: 验证无残留旧路径**

Run: `cd cli && grep -rn "@/apis" src || echo "无 @/apis 残留"`
Expected: 输出 `无 @/apis 残留`

- [ ] **Step 6: 验证 typecheck + lint**

Run: `cd cli && bun run check`
Expected: 0 错 0 警，退出码 0

- [ ] **Step 7: 提交**

```bash
cd cli
git add -A
git commit -m "refactor(tools): prompt 与 package-json 搬回 tools/

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 全量验证

**Files:** 无改动，仅验证。

**Interfaces:**
- Consumes: Task 1、2 的成果
- Produces: 无

- [ ] **Step 1: typecheck + lint**

Run: `cd cli && bun run check`
Expected: 0 错 0 警，退出码 0

- [ ] **Step 2: 测试**

Run: `cd cli && bun test`
Expected: 全部通过（无新增/删除测试，行为不变）

- [ ] **Step 3: 构建**

Run: `cd cli && bun run build`
Expected: 构建成功，退出码 0

- [ ] **Step 4: 最终结构核对**

Run: `cd cli && find src/service src/tools -type f | sort`
Expected: 列出
```
src/service/apis/github/constants.ts
src/service/apis/github/contents-parser.ts
src/service/apis/github/github-api.ts
src/service/apis/github/index.ts
src/service/apis/github/url-builder.ts
src/service/apis/index.ts
src/service/index.ts
src/service/request/http-request-client.ts
src/service/request/index.ts
src/tools/display/...（原有不变）
src/tools/load-package-json-info.ts
src/tools/parse-csv-option-values.ts
src/tools/prompt-service.ts
src/tools/index.ts
```
且 `src/apis/` 不存在。

- [ ] **Step 5: 无残留路径核对**

Run: `cd cli && grep -rn "@/apis\|apis/http-client\|apis/github" src || echo "无残留"`
Expected: 输出 `无残留`

（无需额外 commit；Task 1、2 已提交，本任务仅确认。若验证暴露问题，回到对应任务修复并修订其 commit。）
