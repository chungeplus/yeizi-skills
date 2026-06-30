# yeizi-skills v2.1 batch-4 Implementation Plan: scanner warnings & messages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 scanSKILL 警告 + 错误消息 + 旧业务残留的 7 项（spec §B5/B6/B7/B8 + §C2/C3/C4）。

**Architecture:**
- B5：`scanSkillEntryList` catch 内区分 ZodError 与其它、提取 `path` 字段路径拼出 `"缺少字段 name"` / `"描述为空"` 等具体文案
- B6：`REMOTE_REPOSITORY_EMPTY` 消息含 owner/repo/branch 坐标
- B7：`FILE_COPY_FAILED` 错误隐藏 tmpdir 源路径、用相对路径（`"仓库临时目录/${skillName}"`）
- B8：`compareDirectoryContentHash` source 不存在时返 false（与 target 不存在对称）
- C2：`schemas/skill/frontmatter.ts` TSDoc 措辞去"历史遗留 version"
- C3：`config/repository/index.ts`（或 `config/repository.ts`，看 F3 是否已重构）注释去掉 "raw URL 与 Contents API ?ref="
- C4：`tools/string/split-csv.ts` TSDoc 说明 v2 为何用纯字符串拆分代替 Zod schema

**Tech Stack:** TypeScript 5 / Bun / zod

**Spec 索引:** `cli/docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`

**Parent commit:** batch-3 ends.

## Global Constraints

- 项目无单元测试。验证 gate = `cd cli && bun run typecheck && bun run lint` 全过。
- 严格遵守 cli/CLAUDE.md：命名（小写中划线文件名、`List`/`Map` 后缀、`Item` 单项、`is/has/can` 布尔前缀、动作+对象、`selected` 前缀）；TypeScript（对象式枚举、interface 对象类型、禁 any/unknown/as、as const 例外）；语句（禁三目、禁 switch、关键字循环）；目录（最小目录做桶导出）。
- 错误文案使用中文、文件名/字段名/错误码等保留原文。
- 跨目录导入停在最小桶文件。

---

## File Structure（batch-4 涉及）

**Modify:**
- `cli/src/features/github/repository.ts`（B5：catch 内字段路径提取）
- `cli/src/error/definitions.ts`（B6 + B7：消息内容）
- `cli/src/types/error/types.ts`（B6：`REMOTE_REPOSITORY_EMPTY` 入参 schema）
- `cli/src/tools/filesystem/directory.ts`（B8：source 不存在返 false）
- `cli/src/schemas/skill/frontmatter.ts`（C2：TSDoc）
- `cli/src/config/platform.ts` 或 `cli/src/config/platform/index.ts`（C3：注释）
- `cli/src/tools/string/split-csv.ts`（C4：TSDoc）

---

### Task 4.1: B5 — scanSkillEntryList 警告具体到字段

**Files:**
- Modify: `cli/src/features/github/repository.ts`

**Why:** 当前 catch 块一律 `"frontmatter 解析失败"`，用户不知道哪个字段坏了。

- [ ] **Step 1: Read `cli/src/features/github/repository.ts` 全文**，定位 catch 块

- [ ] **Step 2: 改 catch 内的 warning 文案**

现有 catch 大致：
```typescript
catch {
  continue
}
```

或：
```typescript
catch (error) {
  continue
}
```

改为：区分 ZodError 提取 `path`：

```typescript
import { ZodError } from "zod"

// ... 在 catch 块
catch (error) {
  let warningMessage: string

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]
    const fieldPath = firstIssue?.path.join(".") ?? ""
    const issueMessage = firstIssue?.message ?? "格式不符"

    warningMessage = fieldPath.length > 0
      ? `跳过技能候选目录"${candidateDirectoryEntry.name}"：${fieldPath} 字段 ${issueMessage}。`
      : `跳过技能候选目录"${candidateDirectoryEntry.name}"：frontmatter ${issueMessage}。`
  }
  else {
    warningMessage = `跳过技能候选目录"${candidateDirectoryEntry.name}"：frontmatter 解析失败。`
  }

  warningList.push(warningMessage)
  continue
}
```

注意：`ZodError` 当前是 `zod` 包默认 export 的值；按现有 import 形态调整（项目内若用 `import { z } from "zod"`、`ZodError` 应为 `z.ZodError`，按文件实际）。

- [ ] **Step 3: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 4: Commit**

```bash
git add cli/src/features/github/repository.ts
git commit -m "feat(repository): surface per-skill frontmatter warnings with field path

scanSkillEntryList 内 catch 现在区分 ZodError、提取 path[0] 输出
"缺少字段 name" / "描述为空" 等具体文案。非 ZodError 回落通用文案。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4.2: B6 + B7 — REMOTE_REPOSITORY_EMPTY / FILE_COPY_FAILED 错误消息

**Files:**
- Modify: `cli/src/types/error/types.ts`（`REMOTE_REPOSITORY_EMPTY` 入参）
- Modify: `cli/src/error/definitions.ts`（B6 + B7 两条消息）

**Why:**
- B6：当前 message "远端仓库未发现任何技能，请检查仓库内容。" 太泛
- B7：当前 FILE_COPY_FAILED `params.sourcePath: sourcePath` 暴露 /tmp/yeizi-skills-repo-xxx/ 路径

- [ ] **Step 1: Read `cli/src/types/error/types.ts` 全文**，找 `REMOTE_REPOSITORY_EMPTY` 入参

- [ ] **Step 2: 修改 `REMOTE_REPOSITORY_EMPTY` 入参**

旧值（batch-1 已统一为 undefined）：
```typescript
[AppErrorCode.REMOTE_REPOSITORY_EMPTY]: undefined
```

改为：
```typescript
[AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
  repositoryOwner: string
  repositoryName: string
  repositoryBranch: string
}
```

- [ ] **Step 3: 修改 `cli/src/error/definitions.ts`**

`REMOTE_REPOSITORY_EMPTY` 条目 buildMessage 改：
```typescript
[AppErrorCode.REMOTE_REPOSITORY_EMPTY]: {
  title: "远端仓库异常",
  buildMessage: (params) =>
    `仓库 ${params.repositoryOwner}/${params.repositoryName}@${params.repositoryBranch} 内未发现任何 yeizi- 前缀技能目录。请确认：(1) 配置仓库地址正确；(2) 顶层存在至少一个 yeizi-xxx 子目录且包含 SKILL.md。`,
},
```

`FILE_COPY_FAILED` 条目 buildMessage 不变（消息模板已经是文本人话），但确认它不变：
```typescript
[AppErrorCode.FILE_COPY_FAILED]: {
  title: "文件复制失败",
  buildMessage: (params) => `从"${params.sourcePath}"复制到"${params.targetPath}"失败。`,
},
```

（B7 的修复在调用方 `features/skill/copier.ts` Task 3.4 已配合——`sourcePath` 现在传 `"仓库临时目录/${name}"` 不再含绝对 /tmp/路径。）

- [ ] **Step 4: 修改 `cli/src/features/github/repository.ts`**：在 throw `REMOTE_REPOSITORY_EMPTY` 时带上参数

```typescript
throw new AppError(AppErrorCode.REMOTE_REPOSITORY_EMPTY, {
  params: {
    repositoryOwner: repositoryConfig.repositoryOwner,
    repositoryName: repositoryConfig.repositoryName,
    repositoryBranch: repositoryConfig.repositoryBranch,
  },
})
```

顶部加 `import { repositoryConfig } from "@/config/repository"`（如未导入）。

- [ ] **Step 5: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 6: Commit**

```bash
git add cli/src/types/error/types.ts cli/src/error/definitions.ts cli/src/features/github/repository.ts
git commit -m "fix(errors): include repo coords in REMOTE_REPOSITORY_EMPTY

用户看到 '未发现任何技能' 错误时、之前无法判断是仓库错了还是内容错了。
现在消息含 owner/name/branch + 两条具体排查提示。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4.3: B8 — compareDirectoryContentHash source 不存在返 false

**Files:**
- Modify: `cli/src/tools/filesystem/directory.ts`

**Why:** source 与 target 行为不对称：target 不存在返 false、source 不存在抛 readdir ENOENT。让 source 也返 false（"两个目录内容不同"的合理推断），避免 race 时抛 raw fs 错。

- [ ] **Step 1: Read `cli/src/tools/filesystem/directory.ts` 全文**

- [ ] **Step 2: 修改 `compareDirectoryContentHash` 函数体**

现有结构：
```typescript
async function compareDirectoryContentHash(sourceDirectoryPath: string, targetDirectoryPath: string): Promise<boolean> {
  if (!existsSync(targetDirectoryPath)) {
    return false
  }

  const targetStat = await stat(targetDirectoryPath)

  if (!targetStat.isDirectory()) {
    return false
  }

  // 算 source hash 的部分
}
```

修改：source 端加同样守卫：
```typescript
async function compareDirectoryContentHash(sourceDirectoryPath: string, targetDirectoryPath: string): Promise<boolean> {
  if (!existsSync(sourceDirectoryPath) || !existsSync(targetDirectoryPath)) {
    return false
  }

  const sourceStat = await stat(sourceDirectoryPath)

  if (!sourceStat.isDirectory()) {
    return false
  }

  const targetStat = await stat(targetDirectoryPath)

  if (!targetStat.isDirectory()) {
    return false
  }

  // 算 hash 部分不变
}
```

- [ ] **Step 3: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 4: Commit**

```bash
git add cli/src/tools/filesystem/directory.ts
git commit -m "fix(filesystem): symmetric source check in compareDirectoryContentHash

之前 source 不存在时抛 readdir ENOENT raw 错、与 target 不存在的"返 false"
不对称。改成 source/target 任一不存在或非目录都返回 false。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4.4: C2 + C3 + C4 — 旧业务残留 TSDoc / 注释清理

**Files:**
- Modify: `cli/src/schemas/skill/frontmatter.ts`（C2）
- Modify: `cli/src/config/platform.ts` 或 `cli/src/config/platform/index.ts`（C3，看 batch-6 F3 是否已落地）
- Modify: `cli/src/tools/string/split-csv.ts`（C4）

**Why:** 注释里的措辞让维护者以为 v2 还在维护旧业务。

- [ ] **Step 1: grep 现状定位每条注释**

```bash
cd C:/Users/yeizi/Desktop/yeizi-skills && \
echo "===C2==="; grep -n "历史遗留" cli/src/schemas/skill/frontmatter.ts
echo "===C3==="; grep -n "raw URL\|Contents API" cli/src/config/*.ts cli/src/config/*/*.ts 2>/dev/null
echo "===C4==="; cat cli/src/tools/string/split-csv.ts | head -10
```

预期: 三处都命中。

- [ ] **Step 2: 修改 `cli/src/schemas/skill/frontmatter.ts` TSDoc**

现有 TSDoc（大概）：
```typescript
/**
 * 技能文档 frontmatter 的校验 schema。
 * 仅强校验 name 与 description。使用 passthrough 容忍历史遗留的 version 等额外字段。
 */
```

改为：
```typescript
/**
 * 技能文档 frontmatter 的校验 schema。
 *
 * 仅强校验 name 与 description；使用 passthrough 保留 frontmatter 上可能存在的额外字段（如版本号、tags）、
 * 但不参与业务读取。
 */
```

- [ ] **Step 3: 修改 `cli/src/config/platform.ts`（或 `config/platform/index.ts`）repositoryBranch 注释**

现有：
```typescript
/**
 * 拼接 raw URL 与 Contents API ?ref= 时使用的分支名。
 */
repositoryBranch: "main",
```

改为：
```typescript
/**
 * 调用 giget 拉取指定分支时的分支标识。
 */
repositoryBranch: "main",
```

- [ ] **Step 4: 修改 `cli/src/tools/string/split-csv.ts` TSDoc**

现有（要看实际，可能本身就是空函数体内联）：
```typescript
function splitCsvString(input: string): string[] {
  // ...
}
```

文件顶部加 TSDoc：

```typescript
/**
 * 按 "," 拆分字符串为去重非空字符串列表。
 *
 * v2 把 csv option 的 Zod schema 校验替换为纯字符串拆分。
 * 理由：平台名 / 技能名长度极短、选项集合小，纯字符串校验已足够。
 * 如未来选项可能含复杂字符再加 zod schema。
 *
 * @param input - 逗号分隔的字符串；undefined 视为无输入。
 * @returns 去重后的字符串列表；无输入或全空时返回空列表。
 */
```

- [ ] **Step 5: typecheck + lint**

```bash
cd cli && bun run check
```

Expected: 本任务文件 0 错。

- [ ] **Step 6: Commit**

```bash
git add cli/src/schemas/skill/frontmatter.ts cli/src/config/platform.ts cli/src/tools/string/split-csv.ts
# 如果 config 已变成子目录:
# git add cli/src/config/platform/index.ts
git commit -m "chore: align legacy TSDoc/comments with v2 reality (C2/C3/C4)

- C2: frontmatter schema TSDoc 把 '历史遗留 version' 措辞改成中性的 '可能存在的额外字段'。
  维护者不再以为项目还在维护 version 概念。
- C3: repositoryBranch 注释去掉 'raw URL 与 Contents API ?ref=' 已废场景、改为 'giget 拉取分支'。
- C4: split-csv 顶部 TSDoc 解释 v2 为何用纯字符串拆分替代原 Zod schema。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成定义（batch-4）

- ✅ Task 4.1-4.4 全过
- ✅ `cd cli && bun run check` 全过
- ✅ 全部 commit 落到 `main` 分支
- ✅ install 在遇到 SKILL.md frontmatter 坏掉时 summary 看到具体字段路径
- ✅ REMOTE_REPOSITORY_EMPTY 错误消息含 `owner/name@branch` 坐标
- ✅ compareDirectoryContentHash 在 source 不存在时返 false（之前可能抛 raw error）