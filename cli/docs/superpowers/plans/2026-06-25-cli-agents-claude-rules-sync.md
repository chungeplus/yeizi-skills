# cli/AGENTS.md 与 cli/CLAUDE.md 规则同步 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `yeizi-styles/rules-project/rules/projects/*-rules.md` 和 `.../technologies/typescript/*-rules.md` 当前生效的规则，按既有「去示例」格式重新生成 `cli/AGENTS.md` 与 `cli/CLAUDE.md` 的规则正文，使两份文件与 7 份规则源逐条一致。

**Architecture:** `cli/AGENTS.md` 与 `cli/CLAUDE.md` 是 7 份规则源的「去示例」汇总：每份源对应一个 `## <stem>` 段（带 `*原始路径：…*` 标注），源的 `### 标题 + > 正文 + 非示例 bullets` 全部保留，**示例代码块（推荐/不推荐写法 + ``` 围栏）全部删除**。两份文件从第 6 行（`---` 之后）起正文逐字节相同，只有前 5 行 intro 不同。本次按源重新生成正文，分别套各自 intro。

**Tech Stack:** Markdown 文档；用 `diff`、`grep`、`cmp` 做一致性验证，无测试框架。

## Global Constraints

- **只改两份文件**：`cli/AGENTS.md`、`cli/CLAUDE.md`。不改任何 `rules/` 源、不改 `yeizi-styles/rules-project/` 下文件、不改其他任何文件（用户明确要求）。
- **执行模式**：在 `main` 分支直接改，**不提交**（沿用本会话既有约定）。无 git commit 步骤。
- **7 份规则源**（内容唯一来源，逐字采用其当前正文）：
  - `yeizi-styles/rules-project/rules/projects/shared-rules.md`
  - `yeizi-styles/rules-project/rules/projects/code-rules.md`
  - `yeizi-styles/rules-project/rules/technologies/typescript/comment-rules.md`
  - `yeizi-styles/rules-project/rules/technologies/typescript/implementation-rules.md`
  - `yeizi-styles/rules-project/rules/technologies/typescript/naming-rules.md`
  - `yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md`
  - `yeizi-styles/rules-project/rules/technologies/typescript/type-rules.md`
- **段顺序**（沿用现有文件，不重排）：shared-rules → code-rules → comment-rules → implementation-rules → naming-rules → statement-rules → type-rules。
- **去示例规则**：删除每条规则下的「推荐写法 / 不推荐写法」标签、所有 ```` ``` ```` 围栏代码块、以及只用于展示文件名的 ```` ```text ```` 块。保留 `> 正文` 和正文之外的非示例说明 bullets（如 is/has/can 三条、归类用的列表项）。最终两文件中 ```` ``` ```` 出现次数必须为 0、`推荐写法` 出现次数必须为 0。
- **两文件关系**：前 5 行 intro 各自保留（见 Task 文中给出的逐字内容），第 6 行起正文逐字节一致。
- **格式细节**：源文件的 H1（`# TypeScript 命名规则` 等）在汇总里降为 H2；段首加 `## <stem>` 和 `*原始路径：<相对 rules-project/rules 的路径>*`。

---

## File Structure

- Modify: `cli/AGENTS.md` — 跨工具 AI 约定入口；前 5 行 AGENTS intro + 去示例规则正文。
- Modify: `cli/CLAUDE.md` — Claude Code 入口；前 5 行 CLAUDE intro + 与 AGENTS.md 相同的规则正文。

两文件正文相同、仅 intro 不同，因此「生成正文」一次、「套两个 intro」两次。

---

### Task 1: 按源重新生成规则正文，写入 cli/AGENTS.md

**Files:**
- Modify: `cli/AGENTS.md`
- Read-only 源: 上述 7 份 `rules/` 文件

**Interfaces:**
- Consumes: 7 份规则源当前正文。
- Produces: `cli/AGENTS.md` 第 6 行起的「正文块」——Task 2 会把它逐字复制进 CLAUDE.md。

- [ ] **Step 1: 读取 7 份源文件全文，确认当前 ### 规则清单**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills/yeizi-styles/rules-project/rules"
for f in projects/shared-rules.md projects/code-rules.md \
  technologies/typescript/comment-rules.md \
  technologies/typescript/implementation-rules.md \
  technologies/typescript/naming-rules.md \
  technologies/typescript/statement-rules.md \
  technologies/typescript/type-rules.md; do
  echo "=== $f ==="; grep -nE "^#{1,3} " "$f"
done
```
Expected: 列出每份源的 `#`/`##`/`###` 结构。以此为本次正文的权威清单。

- [ ] **Step 2: 保留 AGENTS.md 前 5 行 intro，重写第 6 行起正文**

`cli/AGENTS.md` 前 5 行（含 `---`）保持不变，逐字为：
```markdown
# AGENTS.md

本文件面向所有 AI 工具（Cursor / Aider / Continue 等）。Claude Code 通过同名文件 CLAUDE.md 读取内容：本文件会在每个会话开始时被 Claude Code 自动读取。以下内容是项目 AI 生成代码必须遵守的完整规则（来自上游规则文件的去示例版本）。

> **关于 Claude Code**：Claude Code **不直接读取 AGENTS.md**。本项目的 Claude Code 入口是 `CLAUDE.md`（同一目录），由 Claude Code 自动读入。内容与 AGENTS.md 完全镜像同步。

---
```

从第 6 行起，按段顺序生成 7 个段。每段格式（以 shared-rules 为例）：
```markdown

## shared-rules
*原始路径：`projects/shared-rules.md`*

## 共享项目规则

## 先想清楚再动手

### 先查证再分清事实和假设

> 开始处理任务前，必须先查看当前项目里和任务直接相关的代码、文档、脚本和配置，再分开说明已确认信息、当前假设和判断口径。查不到、互相冲突或没有明确来源的内容按假设表述，先确认后再继续，不自己补全路径、命令、接口、字段和行为。
```

转换规则（对每份源逐条套用）：
1. 段首写 `## <stem>`（stem = 源文件名去掉 `.md`），换行写 `*原始路径：`<相对 rules-project/rules 的路径>`*`。各段的 stem 与原始路径：
   - `## shared-rules` / `*原始路径：`projects/shared-rules.md`*`
   - `## code-rules` / `*原始路径：`projects/code-rules.md`*`
   - `## comment-rules` / `*原始路径：`technologies/typescript/comment-rules.md`*`
   - `## implementation-rules` / `*原始路径：`technologies/typescript/implementation-rules.md`*`
   - `## naming-rules` / `*原始路径：`technologies/typescript/naming-rules.md`*`
   - `## statement-rules` / `*原始路径：`technologies/typescript/statement-rules.md`*`
   - `## type-rules` / `*原始路径：`technologies/typescript/type-rules.md`*`
2. 源文件的 H1（`# 共享项目规则`、`# TypeScript 命名规则` 等）降为 H2（`## 共享项目规则`）放在 `*原始路径*` 之后。
3. 源里的 `## 分类` 原样保留为 `## 分类`，`### 规则` 原样保留为 `### 规则`，每条 `> 正文` 逐字保留。
4. **删除所有示例**：去掉「推荐写法」「不推荐写法」标签行和其后所有 ```` ``` ```` / ```` ```typescript ```` / ```` ```text ```` 围栏代码块。
5. **保留非示例 bullets**：正文之外用于解释的 `- ` 列表项（如布尔规则的 is/has/can 三条）逐字保留。
6. 段与段之间留一行空行。

本次相对旧版的**已知内容变化**（必须体现，全部以源为准）：
- shared-rules：`### 生成产物优先回上游` → 现为 `### 生成产物回上游`，正文以源为准（源无「优先」二字）。
- code-rules：`### 命名优先使用完整词` → 现为 `### 命名使用完整词`，正文去掉「优先」。
- statement-rules：删除旧的 `### 目录门面文件职责`；新增 `### 导入导出使用具名形式`、`### 类型导入导出使用 type 形式`、`### 串行异步循环使用 for...of 配合 await`、`### 并发异步使用 Promise.all 配合数组方法`，正文均取源当前文本。
- 其余各段：凡源正文与旧版不一致处，一律以源为准（如 type-rules、naming-rules 的任何措辞变化）。

按以上规则用 Write 工具整体覆盖写入 `cli/AGENTS.md`。

- [ ] **Step 3: 验证 AGENTS.md 已无示例、段结构齐全**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
echo "fenced blocks (expect 0):"; grep -c '```' cli/AGENTS.md
echo "推荐写法 (expect 0):"; grep -c "推荐写法" cli/AGENTS.md
echo "段标记 (expect 7 行):"; grep -nE "^## (shared|code|comment|implementation|naming|statement|type)-rules$" cli/AGENTS.md
```
Expected: fenced blocks = 0；推荐写法 = 0；段标记 7 行，顺序为 shared/code/comment/implementation/naming/statement/type。

- [ ] **Step 4: 逐段核对 ### 规则标题与源完全一致**

Run（对每份源比对汇总段内的 `###` 标题集合；以 statement-rules 为例，其余同理替换路径与行号范围）：
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
echo "--- source statement-rules ### ---"
grep -E "^### " yeizi-styles/rules-project/rules/technologies/typescript/statement-rules.md
echo "--- digest statement-rules 段 ### ---"
awk '/^## statement-rules$/{f=1} /^## type-rules$/{f=0} f && /^### /' cli/AGENTS.md
```
Expected: 两侧 `###` 标题逐条一致（statement-rules 段必须含 `导入导出使用具名形式`、`类型导入导出使用 type 形式`、`串行异步循环使用 for...of 配合 await`、`并发异步使用 Promise.all 配合数组方法`，且不含 `目录门面文件职责`）。对全部 7 段重复此核对，任一段不一致则修正后重跑。

---

### Task 2: 把规则正文镜像到 cli/CLAUDE.md（保留 CLAUDE intro）

**Files:**
- Modify: `cli/CLAUDE.md`

**Interfaces:**
- Consumes: Task 1 生成的 `cli/AGENTS.md` 第 6 行起正文。
- Produces: `cli/CLAUDE.md`，前 5 行为 CLAUDE intro，第 6 行起与 AGENTS.md 逐字节一致。

- [ ] **Step 1: 用 AGENTS 正文 + CLAUDE intro 组装 CLAUDE.md**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
{
  cat <<'EOF'
# CLAUDE.md

Claude Code 项目入口：本文件会在每个会话开始时被 Claude Code 自动读取。以下内容是项目 AI 生成代码必须遵守的完整规则（来自上游规则文件的去示例版本）。

> AGENTS.md 是跨工具通用约定，内容与本文件完全一致。
EOF
  tail -n +6 cli/AGENTS.md
} > cli/CLAUDE.md
```
说明：`cat` 段输出 CLAUDE 的前 5 行（标题 + 两段 intro，第 5 行为 `---`，由 heredoc 最后一行提供——注意 heredoc 含末尾 `---` 行）。`tail -n +6 cli/AGENTS.md` 取 AGENTS.md 第 6 行起的全部正文（即 `---` 之后），拼到一起。

> 注意：上面 heredoc 只到 `> AGENTS.md …` 一行，**不含** `---`。`---` 在 AGENTS.md 第 5 行、属于「前 5 行 intro」。因此需把 `---` 也补进 CLAUDE 头部。改用下面这条等价、明确的命令：

```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
{
  printf '%s\n' \
'# CLAUDE.md' \
'' \
'Claude Code 项目入口：本文件会在每个会话开始时被 Claude Code 自动读取。以下内容是项目 AI 生成代码必须遵守的完整规则（来自上游规则文件的去示例版本）。' \
'' \
'> AGENTS.md 是跨工具通用约定，内容与本文件完全一致。'
  tail -n +6 cli/AGENTS.md
} > cli/CLAUDE.md
```
Expected: 命令成功，无输出。（`tail -n +6` 的第 6 行正是 AGENTS.md 的 `---`，所以 CLAUDE.md 第 6 行也是 `---`，与 AGENTS 结构对齐。）

- [ ] **Step 2: 验证两文件仅前 5 行不同、第 6 行起逐字节一致**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
echo "=== 正文（第6行起）应完全一致 ==="
diff <(tail -n +6 cli/AGENTS.md) <(tail -n +6 cli/CLAUDE.md) && echo "BODIES IDENTICAL"
echo "=== 整体 diff 应只在前 5 行（标题+intro）==="
diff cli/AGENTS.md cli/CLAUDE.md
```
Expected: 第一条输出 `BODIES IDENTICAL`；第二条只显示第 1、3、5 行的 intro 差异（`# AGENTS.md` vs `# CLAUDE.md` 等），无正文差异。

- [ ] **Step 3: 验证 CLAUDE.md 同样无示例、段齐全**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
echo "fenced (expect 0):"; grep -c '```' cli/CLAUDE.md
echo "推荐写法 (expect 0):"; grep -c "推荐写法" cli/CLAUDE.md
echo "段标记 (expect 7):"; grep -cE "^## (shared|code|comment|implementation|naming|statement|type)-rules$" cli/CLAUDE.md
```
Expected: fenced = 0；推荐写法 = 0；段标记 = 7。

---

### Task 3: 全量一致性与改动范围验证

**Files:** 只读校验，不改文件。

- [ ] **Step 1: 7 段全部逐段核对 ### 标题与源一致**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
declare -A MAP=(
  [shared-rules]=projects/shared-rules.md
  [code-rules]=projects/code-rules.md
  [comment-rules]=technologies/typescript/comment-rules.md
  [implementation-rules]=technologies/typescript/implementation-rules.md
  [naming-rules]=technologies/typescript/naming-rules.md
  [statement-rules]=technologies/typescript/statement-rules.md
  [type-rules]=technologies/typescript/type-rules.md
)
ORDER="shared-rules code-rules comment-rules implementation-rules naming-rules statement-rules type-rules"
for i in $ORDER; do
  src="yeizi-styles/rules-project/rules/${MAP[$i]}"
  echo "=== $i ==="
  diff <(grep -E "^### " "$src") \
       <(awk -v s="## $i" 'BEGIN{f=0} $0==s{f=1;next} /^## [a-z]+-rules$/{if(f)f=0} f && /^### /' cli/AGENTS.md) \
    && echo "OK: $i ### 一致" || echo "MISMATCH: $i"
done
```
Expected: 每段输出 `OK: <段> ### 一致`，无 `MISMATCH`。若有 MISMATCH，回 Task 1 Step 2 修正该段后重跑 Task 1–3。

- [ ] **Step 2: 抽查硬口径未被改写**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
grep -nE "不使用 .any. 和 .unknown.|禁用 .switch.|禁止使用三目|禁用关键字循环|参数签名不写" cli/AGENTS.md
```
Expected: 命中 type-rules 的 `不使用 any 和 unknown 兜底`、statement-rules 的 `禁用 switch`/`禁止使用三目运算符`/`禁用关键字循环`、implementation-rules 的 `参数签名不写 readonly…`，措辞与源一致（未软化为「优先」）。

- [ ] **Step 3: 确认只动了这两份文件**

Run:
```bash
cd "C:/Users/yeizi/Desktop/yeizi-skills"
git status --short -- cli/AGENTS.md cli/CLAUDE.md
echo "--- 确认 rules-project 两文件未被本次触碰 ---"
git status --short -- yeizi-styles/rules-project/AGENTS.md yeizi-styles/rules-project/CLAUDE.md
```
Expected: 第一条显示 `cli/AGENTS.md`、`cli/CLAUDE.md` 为改动/新增；第二条的输出与本任务开始前一致（本次不应新增对 rules-project 两文件的改动）。

- [ ] **Step 4: 交付说明**

向用户说明：已按 7 份规则源重新生成 `cli/AGENTS.md` 与 `cli/CLAUDE.md` 的去示例正文，两文件正文逐字节一致、各自保留 intro；只动了这两份文件；未提交。并指出关键内容更新点（生成产物回上游去「优先」、命名使用完整词去「优先」、statement-rules 增删的 4 条）。

---

## Self-Review

**1. Spec coverage（对照用户诉求）**
- 「同步 rules/ 修改到 cli 的 AGENTS.md/CLAUDE.md」→ Task 1 按 7 份源重生成正文，Task 2 镜像，Task 3 逐段核对。
- 「只改这两份文件」→ Global Constraints 明列；Task 3 Step 3 用 `git status` 验证范围。
- 「不用改其他文件」→ 无任何对 `rules/`、`yeizi-styles/rules-project/`、生成脚本的写操作。

**2. Placeholder scan**：无 TBD/“类似上文”等占位；intro 逐字给出，转换规则含 7 段 stem/路径映射与已知内容变化清单，验证命令均带预期输出。

**3. 一致性**：段顺序在 Global Constraints、Task 1 Step 2、Task 3 Step 1 三处一致（shared→code→comment→implementation→naming→statement→type）；「第 6 行起正文一致」在 Task 2 Step 2 与文件实测边界吻合。
