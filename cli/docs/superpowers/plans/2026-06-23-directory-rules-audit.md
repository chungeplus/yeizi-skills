# 目录规则自审与整改实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按更新后的 directory-rules 自审全部 76 个源文件，识别 9 类内容归类错位并整改项目结构，最后跑 typecheck/lint/build 验证。

**Architecture:** 自下而上逐层审计（types → schemas → constants → config → errors → features → commands → tools → apis → main/bin），每个文件先判定内容分类，再判定落点是否符合规则，记录违规表，最后按违规表逐项整改。整改只动归属错误的文件，不修改不相关的现有代码。

**Tech Stack:** TypeScript, Bun, Commander, ESLint (`@antfu/eslint-config`), Zod

## Global Constraints

- 项目禁用 `any` / `unknown`
- `let` 优先于 `const`（除 SCREAMING_SNAKE_CASE / 对象式枚举 / 固定配置 / 模块级单例 / Zod schema 外）
- catch 只留在程序入口 / 任务入口 / 文件读写 / 网络请求 / 统一错误处理 这 5 个白名单位置
- `AppError extends Error`，带 `code` / `title` / `message`，name 保持类名
- 文件名：小写中划线，不使用泛化文件名（helpers/utils/common/temp）
- 业务错误与日志文案使用中文
- 全局共享层：`apis/`、`config/`、`constants/`、`errors/`、`schemas/`、`tools/`、`types/`
- 私有层：`features/`、`commands/`
- 入口层：`main.ts`、`bin/cli.ts`

## Audit Findings

| # | 文件 | 当前分类 | 应在分类 | 违规 |
|---|------|----------|----------|------|
| 1 | `src/types/package-json.ts` | 类型 | 应删除（内容未被任何文件使用） | 类型内容未被使用 |

### 已确认合规的项目结构

经全量审计后，下列目录归类均符合 directory-rules：

- `apis/github/`、`apis/http-client/`：外部访问能力
- `config/repository-config.ts`：配置（全局唯一）
- `constants/platform-directory-names.ts`：跨模块常量
- `errors/*`：错误（全局唯一）
- `schemas/*`：运行时校验（跨模块）
- `types/{command,platform,skill,source}/*`：跨模块类型
- `types/package-json.ts`：违反规则（见上表 #1）
- `features/{platform,skill,source}/*`：私有业务代码（features/source 通过 features/skill 的 index.ts 门面访问，符合 "私有模块只通过对方公开入口读取私有能力"）
- `commands/*`：任务入口业务代码
- `tools/{comparison-table-display,parse-csv-option-values,prompt-service,summary-display,load-package-json-info}.ts`：工具代码
- `main.ts`、`bin/cli.ts`：入口层（只装配不实现）

未发现以下情况：
- 泛化文件名（helpers/utils/common/temp）
- 私有模块复制共享层内容
- 入口层实现业务流程
- 跨模块业务代码漏放在全局共享层

---

## File Structure

本计划仅修改：

- `src/types/package-json.ts` —— 删除（文件级删除）
- `src/types/index.ts` —— 移除 `./package-json` barrel re-export

---

### Task 1: 删除未使用的 `types/package-json.ts`

**Files:**
- Delete: `src/types/package-json.ts`
- Modify: `src/types/index.ts:2`

**Interfaces:**
- Consumes: 无
- Produces: 无

**Why this task:**
- 经 `grep -rn "IPackageJsonInfo" src/` 验证，`IPackageJsonInfo` 仅在自己的定义文件里出现，没有任何外部使用方
- 实际代码用 `ReturnType<typeof packageJsonInfoSchema.parse>` 作为返回类型，已与 schema 同步；`IPackageJsonInfo` 是手写的旧类型，且与 schema（带 `.passthrough()`）并不等价
- 放在全局 `types/` 层会误导后续维护者认为这是公共 API，按 directory-rules "类型内容按共享范围和结构属性分落点"，未被使用的类型不应占用全局类型层

- [ ] **Step 1: 删除 `src/types/package-json.ts`**

```bash
rm src/types/package-json.ts
```

- [ ] **Step 2: 从 `src/types/index.ts` 移除 `./package-json` 的 barrel re-export**

Read `src/types/index.ts`，当前内容：

```typescript
export * from "./command"
export * from "./package-json"
export * from "./platform"
export * from "./skill"
export * from "./source"
```

改为：

```typescript
export * from "./command"
export * from "./platform"
export * from "./skill"
export * from "./source"
```

即删除第 2 行 `export * from "./package-json"`。

- [ ] **Step 3: 跑 `bun run typecheck` 验证无外部引用**

Run: `bun run typecheck`
Expected: PASS（无 TS 错误）

- [ ] **Step 4: 跑 `bun run lint` 验证**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 5: 跑 `bun run build` 完整构建**

Run: `bun run build`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "refactor(types): 删除未使用的 IPackageJsonInfo"
```

---

## Self-Review

1. **Spec coverage:** directory-rules 9 类内容 + 私有模块不复制共享层 + 入口层只装配不实现 + 不为整齐拆空壳文件 —— 全部覆盖；唯一违规是 `types/package-json.ts` 的 `IPackageJsonInfo` 无人使用，已规划删除。

2. **Placeholder scan:** 无 "TBD" / "TODO" / "fill in details" 等占位符；步骤 3-5 给出了明确的命令与预期输出。

3. **Type consistency:** 本任务只删除文件与一行 barrel export，不引入新类型；不存在类型一致性问题。