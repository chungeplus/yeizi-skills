# 角色目录文件名去后缀整改 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「角色目录」下文件名里与目录角色同义的后缀去掉，使文件名符合项目「目录角色不重复到文件名」规则。

**Architecture:** 仅做文件改名 + 桶导出/相对 import 路径更新，不改任何符号名、不改任何逻辑。涉及两个角色目录：`schemas/`（去 `-schema` 后缀，6 个文件）与 `apis/prompt/`（去 `-prompt` 后缀，1 个文件）。所有外部消费者均通过 `@/schemas`、`@/apis` 桶导入，改名对外部零影响。

**Tech Stack:** TypeScript、Bun（`bun run typecheck`）、git。

## Global Constraints

- 符号名一律不变：`csvOptionValueSchema`、`githubContentsEntrySchema`、`githubContentsEntryListSchema`、`packageJsonInfoSchema`、`skillFrontmatterSchema`、`skillNameSchema`、`skillVersionSchema`、`skillManifestEntrySchema`、`skillManifestSchema`、`supportedPlatformNameSchema`、`getInteractiveTerminal`、`promptPlatformList`、`promptSkillList`、`promptSkillListToUpdate` 全部保持原样。
- 只改文件名与 import/桶导出路径，不改文件内逻辑、不补注释、不调格式。
- 文件名统一小写中划线。
- 已知无关报错：仓库当前存在另一处重构遗留的 typecheck 报错（`ISkillIndexEntry`、`@/types` 缺导出、`./skill-index` 模块缺失、`@/tools` 缺 `loadPackageJsonInfo` 等）。这些与本任务无关，验证口径为「不新增任何涉及本次改名文件的报错」，不要求全项目零报错。
- 验证基线：本任务开始前，先记录一次 `bun run typecheck` 的报错清单作为基线，改完后比对，确保没有新增项。

---

## Task 1: schemas 目录去 `-schema` 后缀

**Files:**
- Rename: `src/schemas/csv-option-value-schema.ts` → `src/schemas/csv-option-value.ts`
- Rename: `src/schemas/github-contents-entry-schema.ts` → `src/schemas/github-contents-entry.ts`
- Rename: `src/schemas/package-json-info-schema.ts` → `src/schemas/package-json-info.ts`
- Rename: `src/schemas/skill-manifest-schema.ts` → `src/schemas/skill-manifest.ts`
- Rename: `src/schemas/skill-frontmatter-schema.ts` → `src/schemas/skill-frontmatter.ts`
- Rename: `src/schemas/supported-platform-name-schema.ts` → `src/schemas/supported-platform-name.ts`
- Modify: `src/schemas/skill-frontmatter.ts`（内部相对 import 路径）
- Modify: `src/schemas/index.ts`（桶导出路径）

**Interfaces:**
- Consumes: 无（纯改名）
- Produces: `@/schemas` 桶对外导出的全部符号名不变；外部消费者 import 路径不变。

**前置说明：**
- 已 git-tracked 的文件用 `git mv`：`csv-option-value-schema.ts`、`github-contents-entry-schema.ts`、`package-json-info-schema.ts`、`skill-frontmatter-schema.ts`。
- 未 git-tracked 的新文件用普通 `mv`：`skill-manifest-schema.ts`、`supported-platform-name-schema.ts`（这两个是当前工作区新增、尚未纳入版本控制，`git mv` 会报 `not under version control`）。
- 改名后 basename 会与 `types/source/github-contents-entry.ts`、`types/skill/skill-frontmatter.ts`、`types/skill/skill-manifest.ts` 相同；这是已接受的结果，不同目录、外部走桶导入，无歧义。

- [ ] **Step 1: 记录验证基线**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-baseline.txt; cat /tmp/typecheck-baseline.txt`
Expected: 输出当前已存在的无关报错清单（如 `ISkillIndexEntry`、`./skill-index`、`@/tools` 缺 `loadPackageJsonInfo` 等）。记下行数，作为后续比对基线。

- [ ] **Step 2: 改名 4 个 git-tracked 文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git mv src/schemas/csv-option-value-schema.ts src/schemas/csv-option-value.ts
git mv src/schemas/github-contents-entry-schema.ts src/schemas/github-contents-entry.ts
git mv src/schemas/package-json-info-schema.ts src/schemas/package-json-info.ts
git mv src/schemas/skill-frontmatter-schema.ts src/schemas/skill-frontmatter.ts
```

- [ ] **Step 3: 改名 2 个未跟踪文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
mv src/schemas/skill-manifest-schema.ts src/schemas/skill-manifest.ts
mv src/schemas/supported-platform-name-schema.ts src/schemas/supported-platform-name.ts
```

- [ ] **Step 4: 更新 `skill-frontmatter.ts` 内部相对 import**

把 `src/schemas/skill-frontmatter.ts` 第 3 行的相对路径从 `./skill-manifest-schema` 改为 `./skill-manifest`：

```ts
import { z } from "zod"

import { skillNameSchema, skillVersionSchema } from "./skill-manifest"

/**
 * 技能文档 frontmatter 的校验 schema。
 */
const skillFrontmatterSchema = z
  .object({
    /**
     * 技能名；以 `yeizi-` 开头，由 skillNameSchema 校验。
     */
    name: skillNameSchema,
    /**
     * 技能版本号；遵循 semver 规范。
     */
    version: skillVersionSchema,
    /**
     * 技能人类可读说明；可选。
     */
    description: z.string().trim().min(1, "技能说明不能为空。").optional(),
  })
  .strict()

export { skillFrontmatterSchema }
```

- [ ] **Step 5: 更新 `schemas/index.ts` 桶导出路径**

把全文替换为（仅去掉每行 `-schema` 后缀，顺序不变）：

```ts
export * from "./csv-option-value"
export * from "./github-contents-entry"
export * from "./package-json-info"
export * from "./skill-frontmatter"
export * from "./skill-manifest"
export * from "./supported-platform-name"
```

- [ ] **Step 6: 验证无新增报错且无旧名残留**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && grep -rn "schema\"" src --include=*.ts | grep -E "/(csv-option-value|github-contents-entry|package-json-info|skill-frontmatter|skill-manifest|supported-platform-name)-schema"`
Expected: 无输出（无任何文件仍引用旧的 `-schema` 路径）。

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-after-t1.txt; diff /tmp/typecheck-baseline.txt /tmp/typecheck-after-t1.txt`
Expected: 无 `>` 新增行（不出现任何提到 schemas 改名文件的新报错）。可能出现 `<` 减少行（若基线里有因旧名产生的报错被修复），属正常。

- [ ] **Step 7: Commit**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git add src/schemas/
git commit -m "refactor(schemas): 去掉文件名 -schema 角色后缀"
```

---

## Task 2: apis/prompt 目录去 `-prompt` 后缀

**Files:**
- Rename: `src/apis/prompt/platform-skill-prompt.ts` → `src/apis/prompt/platform-skill.ts`
- Modify: `src/apis/prompt/index.ts`（桶导出路径）

**Interfaces:**
- Consumes: 无（纯改名）
- Produces: `@/apis` 桶对外导出的 `getInteractiveTerminal`、`promptPlatformList`、`promptSkillList`、`promptSkillListToUpdate` 符号名与 import 路径均不变。

**前置说明：** `platform-skill-prompt.ts` 是当前工作区新增、尚未纳入版本控制（git status 显示为新增的 apis 重构产物），用普通 `mv`。改名后 basename `platform-skill` 在项目内唯一，无撞名。

- [ ] **Step 1: 改名文件**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
mv src/apis/prompt/platform-skill-prompt.ts src/apis/prompt/platform-skill.ts
```

- [ ] **Step 2: 更新 `apis/prompt/index.ts` 桶导出**

把全文替换为：

```ts
export * from "./platform-skill"
```

- [ ] **Step 3: 验证无旧名残留且无新增报错**

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && grep -rn "platform-skill-prompt" src --include=*.ts`
Expected: 无输出。

Run: `cd "c:\Users\yeizi\Desktop\yeizi-skills\cli" && bun run typecheck 2>&1 | sort > /tmp/typecheck-after-t2.txt; diff /tmp/typecheck-after-t1.txt /tmp/typecheck-after-t2.txt`
Expected: 无 `>` 新增行。

- [ ] **Step 4: Commit**

```bash
cd "c:\Users\yeizi\Desktop\yeizi-skills\cli"
git add src/apis/prompt/
git commit -m "refactor(prompt): 去掉文件名 -prompt 角色后缀"
```

---

## Self-Review

**1. 范围覆盖：** 用户确认改两类——schemas 去 `-schema`（Task 1，6 文件）、prompt 去 `-prompt`（Task 2，1 文件）。其余长文件名经判定属「领域目录 + 主符号语义」不违规，不在范围内。覆盖完整。

**2. 占位符扫描：** 无 TBD/TODO；每个改名、import、桶导出步骤均给出确切命令与完整文件内容。

**3. 类型/路径一致性：**
- `skill-frontmatter.ts` 内部相对 import `./skill-manifest-schema` → `./skill-manifest` 已在 Task 1 Step 4 同步。
- `schemas/index.ts` 6 行、`apis/prompt/index.ts` 1 行桶导出路径已全部对应改名后文件名。
- git-tracked 与未跟踪文件分别用 `git mv` / `mv`，与实际版本控制状态一致（Task 1 Step 2/3、Task 2 Step 1）。
- 撞名（3 对 schema/type basename 相同）已确认不影响编译且外部走桶导入，无需额外处理。
