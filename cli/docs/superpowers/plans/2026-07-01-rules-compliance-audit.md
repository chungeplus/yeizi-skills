# Rules Compliance Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a comprehensive rules compliance audit report for the `yeizi-skills` CLI project's `src/` directory against the current `CLAUDE.md` rules — without modifying any source code.

**Architecture:** Pipeline of 8 parallel per-category sub-tasks (one per rule group: shared-rules, code-rules, comment-rules, implementation-rules, naming-rules, statement-rules, type-rules, directory-rules) that emit JSON findings, followed by cross-rule aggregation, file-grouped report writing, and double-index generation. Output is one Markdown report at `docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`.

**Tech Stack:**
- Read / Grep / Glob tools (no `bun run check` per design §3.6)
- JSON for intermediate findings (machine-readable cross-task handoff)
- Markdown for the final report (human-readable)
- Git on branch `v2.1-cleanup` (no commits — report file is generated but not committed per design §7)

## Global Constraints

- Source: `C:/Users/yeizi/Desktop/yeizi-skills/cli` (working directory)
- Branch: `v2.1-cleanup`
- Audit scope: `src/` 下 57 个 .ts 文件（按 `docs/superpowers/specs/2026-07-01-rules-compliance-audit-design.md` §2.1 列举）
- Audit rules: `CLAUDE.md` 全部 `### ` 段落（8 个分类、约 50+ 条规则）
- **NOT modified:** 任何 src 文件、CLAUDE.md、AGENTS.md、3 个 PRD（`tasks/prd-*.md`）、其他非 src 文件
- **NOT committed:** 审计报告与所有中间 JSON 产物（设计 §7：报告是否入 git 由用户后续决定）
- 工作区 M 文件按 disk 当前内容审计（设计 §3.6）
- 严重度定义：🔴 CRITICAL（lint 错误 / 真 bug / 硬约束） / 🟠 MAJOR（违反 CLAUDE.md 明确条款） / 🟡 MINOR（风格 / 可选优化）
- 0 匹配规则在报告中不出现（设计 §3.6 关键约束）
- 引用 v2.1 followup 的 27 项已修位置时不重复记账

---

### Task 1: 提取规则清单 (S1)

**Files:**
- Read: `C:/Users/yeizi/Desktop/yeizi-skills/cli/CLAUDE.md`
- Create: `output/rule-list.json`（git-ignored 临时目录）

**Interfaces:**
- Consumes: 无
- Produces: `output/rule-list.json` — `RuleEntry[]`，结构见设计 §3.2

- [ ] **Step 1: 准备输出目录**

```bash
mkdir -p "C:/Users/yeizi/Desktop/yeizi-skills/cli/output/findings"
```

- [ ] **Step 2: 读取 CLAUDE.md 全文并解析 `### ` 段落**

使用 Read 工具读 `CLAUDE.md`（一次最多 2000 行），识别所有 `### ` 开头的标题行。每条规则提取：
- `id`: `<category>-<kebab-case-title>`，例 `naming-is-prefix`
- `category`: 所属 `## ` 分类名（shared-rules / code-rules / ...）
- `title`: 标题文本（去掉 `### ` 前缀）
- `text`: 标题下到下一个 `### ` 或 `## ` 之间的正文（去掉 `>` 引用符但保留段落）
- `judgePointList`: 从正文中提取的判定要点（grep 关键词列表）
- `severityHint`: CRITICAL / MAJOR / MINOR（基于正文是否含"禁用" / "禁止" / "必须"等硬约束词）

- [ ] **Step 3: 写入 rule-list.json**

写入 `output/rule-list.json`，格式：

```json
[
  {
    "id": "naming-is-prefix",
    "category": "naming-rules",
    "title": "布尔状态变量使用 is 前缀",
    "text": "表示是否处于某种状态的布尔变量，使用 is 作为前缀。",
    "judgePointList": ["identifier-match-^(is|has|can)[A-Z]"],
    "severityHint": "MAJOR"
  }
]
```

- [ ] **Step 4: 验证规则数与 CLAUDE.md 中 `### ` 段落数一致**

```bash
grep -c '^### ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/CLAUDE.md"
```

预期：与 `output/rule-list.json` 的数组长度一致。

- [ ] **Step 5: 验证 8 个分类全覆盖**

```bash
grep -c '^## ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/CLAUDE.md"
```

预期：8（shared-rules、code-rules、comment-rules、implementation-rules、naming-rules、statement-rules、type-rules、directory-rules）。`output/rule-list.json` 中所有 RuleEntry 的 `category` 字段去重后正好等于这 8 个。

- [ ] **Step 6: 不 commit（仅生成文件）**

不执行 `git add` / `git commit`。`output/` 加入 `.gitignore` 临时忽略（如果尚未忽略）。验证方式：报告自身不需要 git 操作。

---

### Task 2: 创建报告骨架 (S2)

**Files:**
- Create: `C:/Users/yeizi/Desktop/yeizi-skills/cli/docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`

**Interfaces:**
- Consumes: 无（仅按设计 §4.1 / §4.2 / §4.6 写固定内容）
- Produces: 报告骨架（§0 元信息 / §1 严重度概览占位 / §5 边界声明）+ 后续任务填充 §2 / §3 / §4

- [ ] **Step 1: 写入报告骨架**

使用 Write 工具创建文件，内容如下（§2 / §3 / §4 留空占位）：

```markdown
# Rules Compliance Audit Report

## §0 报告元信息

- 日期: 2026-07-01
- 审计员: Claude (M3)
- 范围: `src/` 下 57 个 .ts 文件
- 依据: `cli/CLAUDE.md`（untracked 工作区当前内容）
- 方法论: pipeline per-category 深度审计 + 跨规则聚合
- 严重度: 🔴 CRITICAL / 🟠 MAJOR / 🟡 MINOR
- 边界: 不动代码 / 不动 CLAUDE.md / 不动 3 个 PRD
- 设计文档: `docs/superpowers/specs/2026-07-01-rules-compliance-audit-design.md`
- 执行计划: `docs/superpowers/plans/2026-07-01-rules-compliance-audit.md`

## §1 严重度概览

（由 Task 12 填充）

## §2 逐文件审计

（由 Task 12 填充）

## §3 双索引

### §3.1 按文件索引

（由 Task 13 填充）

### §3.2 按规则索引

（由 Task 13 填充）

## §4 引用与上下文

（由 Task 13 填充）

## §5 边界声明

- 不审计的非 src 文件：`docs/`、`tasks/`、`scripts/`、`.superpowers/`、`bun.lock`、`package.json`、根 `README.md`、`CHANGELOG.md`、`eslint.config.ts`、`tsconfig.json`
- 不审计的运行时检查：`bun run check` / `bun tsc --noEmit` / `bun test`（按设计 §3.6，避免假阳性 lint 报错淹没真实违规）
- 已修复的 v2.1 followup 27 项不重复审计：参见 `docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md` §3
- 工作区 M 文件按 disk 当前内容审计：参见 `git status` 标 M 的 12 个文件
- 已知潜在误报位置：catch 块内的 `error.message` 访问（实现规则要求收窄但部分场景可豁免）

```

- [ ] **Step 2: 验证骨架文件存在且字节数 > 500**

```bash
wc -c "C:/Users/yeizi/Desktop/yeizi-skills/cli/docs/superpowers/specs/2026-07-01-rules-compliance-audit.md"
```

预期：> 500 字节。

- [ ] **Step 3: 不 commit（仅生成文件）**

不执行 `git add` / `git commit`。

---

### Task 3: 审计 shared-rules 分类 (S3 子任务 1/8)

**Files:**
- Read: `output/rule-list.json`（Task 1 产物）、`CLAUDE.md`（shared-rules 段）
- Search: `C:/Users/yeizi/Desktop/yeizi-skills/cli/src/**/*.ts`
- Create: `output/findings/shared-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "shared-rules"` 的 RuleEntry[]
- Produces: `output/findings/shared-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 shared-rules 规则清单**

从 `output/rule-list.json` 筛选 `category === "shared-rules"` 的条目。该分类约 4 条（编码前思考 / 简洁优先 / 精准修改 / 目标驱动执行）。

- [ ] **Step 2: 人工逐文件审计**

shared-rules 全部为"做事原则"，**无自动化 grep 模式**。审计方法：
1. Read 每个 src 文件（按 `src/` 目录顺序）
2. 评估每条原则的合规性：
   - **编码前思考**：代码中是否在无确认情况下做了大重构（仅基于 git log 推断）
   - **简洁优先**：是否存在未使用导入 / 死代码 / 冗余分支
   - **精准修改**：是否存在无关修改（基于 git log vs 当前 commit）
   - **目标驱动执行**：函数 / 类是否有清晰的"完成标准"（基于 TSDoc 与函数名）
3. 记录每条 finding

- [ ] **Step 3: 写入 shared-rules.json**

```json
[
  {
    "file": "src/commands/install/command.ts",
    "line": 23,
    "ruleId": "shared-simplicity-first",
    "ruleTitle": "简洁优先",
    "severity": "MINOR",
    "snippet": "const x = ...\nconst y = ... // unused",
    "suggestion": "删除 line 24 未使用的 const y 声明"
  }
]
```

- [ ] **Step 4: 验证**

预期 `shared-rules.json` 数组长度 ≥ 0（允许 0 finding，但若 0 必须在文件中写明 "无违规" 占位说明）。检查字段完整性：每个 finding 都有 `file` / `line` / `ruleId` / `ruleTitle` / `severity` / `snippet` / `suggestion` 7 个字段。

- [ ] **Step 5: 不 commit**

---

### Task 4: 审计 code-rules 分类 (S3 子任务 2/8)

**Files:**
- Read: `output/rule-list.json`（code-rules 条目）、`CLAUDE.md`（code-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/code-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "code-rules"` 的 RuleEntry[]
- Produces: `output/findings/code-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 code-rules 规则清单**

该分类约 5 条（注释规则 / 输入与边界规则 / 流程与分支规则 / 命名一致性规则 / 人类可见文案）。

- [ ] **Step 2: 执行 grep 模式**

```bash
# 注释末尾
grep -rn '^[^/].*//.*;$' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# switch 关键字
grep -rn '\bswitch\s*(' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 中文文案（应使用中文）
grep -rn 'console\.\(log\|error\|warn\)\(['\''"][A-Za-z]' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 三目运算符
grep -rn '? .* : ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | grep -v '^[^:]*:[0-9]*:\s*//' | head -20

# 空泛词命名（value / item / data / info）
grep -rn '\b\(value\|item\|data\|info\)\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | grep -E ':\s*(const|let)\s+\w*(value|item|data|info)\w*\s*[:=]' | head -20
```

- [ ] **Step 3: 对每条 grep 命中 Read 上下文确认**

每条命中必须 Read 文件 ≥ 5 行上下文，确认是违规不是误报（注释里出现"switch"、字符串字面量包含 "value"、类型定义里的 `info: string` 字段都可能是误报）。

- [ ] **Step 4: 写入 code-rules.json**

格式同 Task 3 Step 3。

- [ ] **Step 5: 验证 finding 字段完整性**

每条 finding 7 字段齐全。`severity` 字段值 ∈ {CRITICAL, MAJOR, MINOR}。

- [ ] **Step 6: 不 commit**

---

### Task 5: 审计 comment-rules 分类 (S3 子任务 3/8)

**Files:**
- Read: `output/rule-list.json`（comment-rules 条目）、`CLAUDE.md`（comment-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/comment-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "comment-rules"` 的 RuleEntry[]
- Produces: `output/findings/comment-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 comment-rules 规则清单**

该分类约 3 条（TSDoc 注释 / 多行注释 / 单行注释）。核心检查点：
- `export function` / `export class` / `export const` / `export interface` / `export type` 之前必须有 `/** */` 块
- 函数有参数时必须写 `@param`
- 函数有返回值时必须写 `@returns`
- 函数会抛错时必须写 `@throws`
- 可复用函数必须有 `@example`（至少 1 个）
- TSDoc 标签块内部不空行、块之间空行

- [ ] **Step 2: 执行 grep 模式**

```bash
# export 但没有上一行 /**
grep -rn -B1 '^export ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | grep -B1 'export' | grep -v '\*/' | head -40

# 形参但没有 @param
grep -rn -A20 'export function' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -100
```

- [ ] **Step 3: 逐文件人工审计 TSDoc 完整性**

对每个 `export function` / `export class` / `export const` 声明，Read 该声明上方 20 行，确认 TSDoc 块齐全。

- [ ] **Step 4: 写入 comment-rules.json**

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 6: 审计 implementation-rules 分类 (S3 子任务 4/8)

**Files:**
- Read: `output/rule-list.json`（implementation-rules 条目）、`CLAUDE.md`（implementation-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/implementation-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "implementation-rules"` 的 RuleEntry[]
- Produces: `output/findings/implementation-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 implementation-rules 规则清单**

该分类约 4 条（函数实现规则 / class 和 function 使用规则 / 类实现规则 / 错误实现规则）。核心检查点：
- 函数参数不写 `readonly`
- 函数内不直接修改参数 / 原地修改参数承载的数据
- 构造函数参数不直接声明属性（`public xxx` / `private xxx` / `protected xxx` in constructor params）
- catch 内先用 `instanceof` 收窄
- 抛错只用 `Error` 或其子类
- 单次处理用 function、需要数据+多方法时用 class
- class 自身职责步骤封装在 class 内

- [ ] **Step 2: 执行 grep 模式**

```bash
# readonly 参数
grep -rn 'function.*readonly' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 构造函数 public/private 声明属性
grep -rn -E 'constructor\([^)]*\b(public|private|protected)\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# catch 不收窄（直接访问 .message）
grep -rn -A3 'catch (' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -40
```

- [ ] **Step 3: 逐文件 Read 上下文确认**

- [ ] **Step 4: 写入 implementation-rules.json**

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 7: 审计 naming-rules 分类 (S3 子任务 5/8)

**Files:**
- Read: `output/rule-list.json`（naming-rules 条目）、`CLAUDE.md`（naming-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/naming-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "naming-rules"` 的 RuleEntry[]
- Produces: `output/findings/naming-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 naming-rules 规则清单**

该分类约 12+ 条（变量 / 常量 / 配置对象 / 函数 / 类 / 接口 / 类型 / 枚举）。核心检查点：
- 普通变量小驼峰
- 布尔状态 `is` 前缀、布尔包含 `has` 前缀、布尔能力 `can` 前缀
- 集合 `List` 后缀、映射 `Map` 后缀、去重 `Set` 后缀
- 选中内容 `selected` 前缀
- 遍历单项：基本类型不加 `Item`、对象类型加 `Item`（按 PRD 2 新规则）
- 遍历索引 `Index` 后缀
- 外部未处理文本 `rawXxxText` 形式（按 PRD 3 新规则）
- 配置对象 `Config` 后缀
- 单个选项 `Option` 后缀（按 PRD 1 新规则）
- 验证模式 `Schema` 后缀
- 普通常量大写下划线
- 固定配置对象小驼峰
- 函数 / 方法 / 类 / 接口 / 类型 / 枚举主体大驼峰
- 枚举成员大写下划线

- [ ] **Step 2: 执行 grep 模式**

```bash
# 变量命名（非小驼峰）
grep -rn -E '^\s*(const|let|var)\s+[A-Z]' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 集合未用 List 后缀
grep -rn -E ':\s*\w+\[\]\s*=' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -30

# 外部输入但缺 Text 后缀或缺 raw 前缀
grep -rn -E 'raw\w*Value\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
grep -rn -E 'function\s+\w+\([^)]*\b\w+Text\s*:' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 枚举
grep -rn -E '\benum\s+[A-Z]' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
```

- [ ] **Step 3: 逐文件 Read 上下文确认**

- [ ] **Step 4: 写入 naming-rules.json**

预计是 finding 数最多的分类（命名规则最多、最易违规）。

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 8: 审计 statement-rules 分类 (S3 子任务 6/8)

**Files:**
- Read: `output/rule-list.json`（statement-rules 条目）、`CLAUDE.md`（statement-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/statement-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "statement-rules"` 的 RuleEntry[]
- Produces: `output/findings/statement-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 statement-rules 规则清单**

该分类约 5 条（声明与赋值 / 模块 / 条件 / 循环 / 异步循环）。核心检查点：
- 不用 `var`
- 重赋值用 `let`、不重赋值用 `const`
- 模块导出统一写在文件底部
- 导入导出具名形式
- 不用 `import { default as xxx }`
- 类型导入导出用 `type` 形式
- 桶文件不用 `export *`
- 判断不写 `=== true/false`
- 不用三目运算符
- 不用 `switch`
- 同步遍历不用 `for` / `for-in` / `while` / `do-while`
- 其他可遍历内容先转数组
- 串行异步用 `for...of` + `await`
- 并发异步用 `Promise.all` + 数组方法

- [ ] **Step 2: 执行 grep 模式**

```bash
# var
grep -rn '\bvar\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# export *
grep -rn 'export \*' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# switch
grep -rn '\bswitch\s*(' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 关键字循环
grep -rn -E '\bfor\s*\(' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
grep -rn -E '\bwhile\s*\(' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 三目
grep -rn '? .* : ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# default as
grep -rn 'default as' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# === true/false
grep -rn -E '===\s*(true|false)\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
```

- [ ] **Step 3: 逐文件 Read 上下文确认**

- [ ] **Step 4: 写入 statement-rules.json**

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 9: 审计 type-rules 分类 (S3 子任务 7/8)

**Files:**
- Read: `output/rule-list.json`（type-rules 条目）、`CLAUDE.md`（type-rules 段）
- Search: `src/**/*.ts`
- Create: `output/findings/type-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "type-rules"` 的 RuleEntry[]
- Produces: `output/findings/type-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 type-rules 规则清单**

该分类约 3 条（枚举类型规则 / 类型定义规则 / 类型使用规则）。核心检查点：
- 枚举值用 `const` 对象 + 联合类型，不用 `enum`
- 对象类型用 `interface`
- 组合和派生类型用 `type`
- 不用 `any` / `unknown` 兜底
- 类型明确时不额外使用泛型
- 不用 `as` 类型断言（`as const` 除外）

- [ ] **Step 2: 执行 grep 模式**

```bash
# enum
grep -rn -E '\benum\s+[A-Z]' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# any / unknown
grep -rn -E ':\s*any\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
grep -rn -E ':\s*unknown\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
grep -rn -E '\bas\s+any\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
grep -rn -E '\bas\s+unknown\b' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# as 类型断言（排除 as const）
grep -rn -E '\bas\s+[A-Z]' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20
```

- [ ] **Step 3: 逐文件 Read 上下文确认**

- [ ] **Step 4: 写入 type-rules.json**

预计是 finding 数较多的分类（CRITICAL 级别命中多）。

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 10: 审计 directory-rules 分类 (S3 子任务 8/8)

**Files:**
- Read: `output/rule-list.json`（directory-rules 条目）、`CLAUDE.md`（directory-rules 段）
- Search: `src/**/*.ts`、整个 `src/` 目录结构
- Create: `output/findings/directory-rules.json`

**Interfaces:**
- Consumes: `output/rule-list.json` 中 `category === "directory-rules"` 的 RuleEntry[]
- Produces: `output/findings/directory-rules.json` — `Finding[]`

- [ ] **Step 1: 加载 directory-rules 规则清单**

该分类约 4 条（内容定义 / 内容落位 / 共享模块访问 / 文件命名）。核心检查点：
- 类型内容镜像到 `types/`
- 校验内容镜像到 `schemas/`
- 单文件常量留在当前文件
- 共享常量提升到 `constants/`
- 配置内容放到 `config/`
- 错误内容放到 `error/`
- 共享功能代码放到 `features/`
- 共享工具代码放到 `tools/`
- 请求传输层放到 `service/request/`
- 请求资源层放到 `service/apis/`
- 子目录名词使用小写中划线
- 共享目录最小目录用 `index.ts` 做桶导出
- 跨目录导入停在最小目录桶文件
- 文件名延续上级目录主题
- 文件内符号名不受目录简写影响

- [ ] **Step 2: 执行 grep / 目录结构检查**

```bash
# 桶文件用了 export *
grep -rn 'export \*' "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -20

# 跨目录导入绕进文件内部
grep -rn "from \"@/\w\+/\w\+/[^/]*\"" "C:/Users/yeizi/Desktop/yeizi-skills/cli/src" | head -30
# 即 import 直接 from "@/xxx/yyy.ts" 而非 from "@/xxx"（桶文件）

# 目录结构
ls -la "C:/Users/yeizi/Desktop/yeizi-skills/cli/src"
```

- [ ] **Step 3: 逐文件 Read 上下文确认**

重点检查：
- 单文件目录（应进一步拆分）
- 文件名含角色词（违反"延续上级目录主题"）
- 跨目录导入路径不经过桶文件

- [ ] **Step 4: 写入 directory-rules.json**

- [ ] **Step 5: 验证字段完整**

- [ ] **Step 6: 不 commit**

---

### Task 11: 跨规则聚合 (S4)

**Files:**
- Read: `output/findings/*.json`（8 个文件，Task 3-10 产物）
- Create: `output/merged-findings.json`

**Interfaces:**
- Consumes: 8 个 per-category finding JSON
- Produces: `output/merged-findings.json` — 去重 + 按 file 分组 + 按 severity 排序的 `Finding[]`

- [ ] **Step 1: 加载所有 8 个 findings JSON**

```bash
ls "C:/Users/yeizi/Desktop/yeizi-skills/cli/output/findings"
```

预期：8 个文件，文件名对应 8 个分类。

- [ ] **Step 2: 合并数组并去重**

按 `(file, line, ruleId)` 三元组去重。相同 finding 由多个规则都发现时只保留最高严重度（CRITICAL > MAJOR > MINOR）。

- [ ] **Step 3: 按 file 路径分组**

输出数组的顺序：先按 `file` 路径字典序排序，相同 file 内按 `line` 升序，相同 line 按 `severity` 降序。

- [ ] **Step 4: 写入 merged-findings.json**

格式：

```json
[
  {
    "file": "src/bin/cli.ts",
    "line": 5,
    "ruleId": "comment-tsdoc-params",
    "ruleTitle": "TSDoc 有参数时写 @param",
    "severity": "MAJOR",
    "snippet": "...",
    "suggestion": "..."
  },
  ...
]
```

- [ ] **Step 5: 验证 finding 总数**

```bash
cat "C:/Users/yeizi/Desktop/yeizi-skills/cli/output/merged-findings.json" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.length); console.log(d.filter(x=>x.severity==='CRITICAL').length); console.log(d.filter(x=>x.severity==='MAJOR').length); console.log(d.filter(x=>x.severity==='MINOR').length);"
```

预期：打印 4 个数字，总数 = CRITICAL + MAJOR + MINOR。

- [ ] **Step 6: 不 commit**

---

### Task 12: 写入 §2 逐文件审计 (S5)

**Files:**
- Read: `output/merged-findings.json`（Task 11 产物）
- Modify: `docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`（Task 2 创建）

**Interfaces:**
- Consumes: `output/merged-findings.json`（按 file 分组、severity 排序的 Finding[]）
- Produces: 报告 §2 各小节 + §1 严重度概览

- [ ] **Step 1: 加载 merged-findings.json**

使用 Read 工具读 `output/merged-findings.json`。

- [ ] **Step 2: 按 file 分组生成 §2 各小节**

对每个出现 finding 的 file 写一节，结构：

```markdown
### §2.X src/path/to/file.ts（🔴N 🟠M 🟡K）

文件角色: <bin/cli | commands/install | features/github | ...>
总行数: N（含工作区 M 修改后）
涉及规则: rule-id-1, rule-id-2, ...

| 规则 | 级别 | 行号 | 当前内容 | 建议修复 |
|---|---|---|---|---|
| 规则名 | 🔴 | 23 | `snippet` | `suggestion` |
| ... | ... | ... | ... | ... |

- 🔴 CRITICAL
  - L23 `xxx` 违反 rule-id-1 描述
- 🟠 MAJOR
  - L45 ...
- 🟡 MINOR
  - L78 ...
```

- [ ] **Step 3: 填充 §1 严重度概览**

回到报告 §1，写入：

```markdown
## §1 严重度概览

| 级别 | finding 数 | 涉及文件数 |
|---|---|---|
| 🔴 CRITICAL | N | M |
| 🟠 MAJOR | N | M |
| 🟡 MINOR | N | M |
| **合计** | **N** | **M** |

### 命中 TOP 5 规则

| 规则 ID | 规则名 | 命中文件数 | 严重度 |
|---|---|---|---|
| rule-id-1 | 规则名 | N | 🔴 |
| ... |
```

- [ ] **Step 4: 验证 §1 概览数 = §2 finding 数 = Task 11 Step 5 打印的总数**

- [ ] **Step 5: 不 commit**

---

### Task 13: 生成 §3 双索引 + §4 引用 (S6)

**Files:**
- Read: `output/merged-findings.json`
- Modify: `docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`

**Interfaces:**
- Consumes: `output/merged-findings.json`
- Produces: 报告 §3（双索引）+ §4（引用）

- [ ] **Step 1: 生成 §3.1 按文件索引**

对 `output/merged-findings.json` 按 `file` 分组（按 src/ 目录树顺序），统计每文件 finding 数（按 severity 分类），格式：

```markdown
### §3.1 按文件索引

| 目录 | 文件 | 🔴 | 🟠 | 🟡 | 合计 |
|---|---|---|---|---|---|
| bin/ | cli.ts | 0 | 2 | 1 | 3 |
| commands/install/ | command.ts | 1 | 5 | 2 | 8 |
| ... |
```

- [ ] **Step 2: 生成 §3.2 按规则索引**

对 `output/merged-findings.json` 按 `ruleId` 字母序分组，列出每条规则的 finding 列表（file:line + suggestion 简述），格式：

```markdown
### §3.2 按规则索引

#### comment-tsdoc-params（MAJOR，N 处违规）

- `src/bin/cli.ts:5` 添加 `@param xxx`
- `src/commands/install/command.ts:42` 添加 `@param xxx`
- ...

#### statement-no-switch（CRITICAL，M 处违规）
...
```

- [ ] **Step 3: 填充 §4 引用与上下文**

```markdown
## §4 引用与上下文

- 上游规则源：`yeizi-styles/rules-project/rules/`（外部仓库，本地未检出）
- 当前规则：`cli/CLAUDE.md`、`cli/AGENTS.md`（untracked）
- v2.1 followup 设计：`docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`（27 项已修位置不重复审计）
- 6 批次 commit hash：见 `git log --oneline v2.1-cleanup` 30 条内
- 3 个 PRD：`cli/tasks/prd-{refine-option-suffix,refine-iteration-item,merge-raw-text-payload}-naming-rules.md`（新规则细化提案，本次仅引用其规则变更意图，不重复审计）
```

- [ ] **Step 4: 验证 §3 索引数 = Task 11 总数**

- [ ] **Step 5: 不 commit**

---

### Task 14: 自审报告 (S7)

**Files:**
- Read: `docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`（完整报告）
- Create: `output/audit-self-review.md`（自审 checklist 记录）

**Interfaces:**
- Consumes: 完整报告
- Produces: `output/audit-self-review.md`（自审结果记录）

- [ ] **Step 1: 占位扫描**

```bash
grep -nE 'TBD|TODO|FIXME|XXX|TBA' "C:/Users/yeizi/Desktop/yeizi-skills/cli/docs/superpowers/specs/2026-07-01-rules-compliance-audit.md"
```

预期：无输出。如有输出，定位并修复。

- [ ] **Step 2: 章节完整性检查**

```bash
grep -nE '^## ' "C:/Users/yeizi/Desktop/yeizi-skills/cli/docs/superpowers/specs/2026-07-01-rules-compliance-audit.md"
```

预期：6 个章节（§0 / §1 / §2 / §3 / §4 / §5）。

- [ ] **Step 3: 跨章节一致性**

§1 finding 总数 = §2 finding 总数 = §3.1 finding 总数 = §3.2 finding 总数。手动统计 + 对比。

- [ ] **Step 4: 字段完整性**

对每条 finding 验证 7 字段齐全：`file` / `line` / `ruleId` / `ruleTitle` / `severity` / `snippet` / `suggestion`。

- [ ] **Step 5: 报告可读性**

使用 Read 工具读完整报告，确认：
- Markdown 表格列对齐
- 代码块使用 ```typescript 包裹
- 严重度 emoji 标记一致（🔴 / 🟠 / 🟡）
- 无截断 / 乱码

- [ ] **Step 6: 写入自审记录**

```markdown
# Audit Self-Review Checklist

- 占位扫描: ✓ 无 TBD/TODO/FIXME
- 章节完整性: ✓ 6 个章节齐全（§0-§5）
- 跨章节一致性: ✓ §1 = §2 = §3.1 = §3.2 = N
- 字段完整性: ✓ 每条 finding 7 字段齐全
- 报告可读性: ✓ Markdown / 代码块 / emoji 一致

## 完成确认

- [x] 报告文件: docs/superpowers/specs/2026-07-01-rules-compliance-audit.md
- [x] 未 commit（设计 §7 约束）
- [x] §0-§5 齐全
- [x] 跨章节 finding 数一致
- [x] 未修改任何 src 文件
- [x] 未修改 CLAUDE.md / AGENTS.md
- [x] 未修改 3 个 PRD
```

- [ ] **Step 7: 不 commit**

---

## Self-Review

**1. Spec coverage:**

- 设计 §2 范围 → Task 1（规则清单） + Task 2（报告骨架）覆盖
- 设计 §3 方法论 → Task 3-10（per-category 子任务） + Task 11（聚合）覆盖
- 设计 §4 报告结构 → Task 12（§1 §2） + Task 13（§3 §4）覆盖
- 设计 §5 执行步骤 → Task 14 自审覆盖
- 设计 §6 验证策略 → Task 11 Step 5 + Task 12 Step 4 + Task 13 Step 4 + Task 14 Step 3 覆盖
- 设计 §7 DoD → Task 14 Step 6 完成确认覆盖
- 设计 §8 风险 → 各任务 Step 中"Read 上下文确认"覆盖
- 设计 §9 不做的清单 → Task 2 Step 1 §5 已声明 + 每个 Task 末尾"不 commit"步骤覆盖
- 设计 §10 关联文档 → Task 13 Step 3 §4 引用覆盖

**2. Placeholder scan:**

- 无 "TBD" / "TODO" / "implement later" / "fill in details" / "add appropriate" / "Similar to Task N"
- 所有代码块均显示完整内容（grep 命令、JSON 格式、文件内容片段）
- 每个 Step 有明确的动作（write / read / grep / commit-skip）

**3. Type consistency:**

- `RuleEntry` 接口（Task 1 Step 3）和 finding 输出格式（Task 3-10 Step 3 / Task 11 Step 4）字段一致：`id` / `category` / `title` / `text` / `judgePointList` / `severityHint`（RuleEntry）和 `file` / `line` / `ruleId` / `ruleTitle` / `severity` / `snippet` / `suggestion`（Finding）—— 区分清楚
- `merged-findings.json`（Task 11 Step 4）和 §2 / §3 索引（Task 12-13）使用相同的 Finding 结构
- 严重度值 CRITICAL / MAJOR / MINOR 在所有 Task 中一致
- `output/` 目录路径在所有 Task 中一致（`C:/Users/yeizi/Desktop/yeizi-skills/cli/output/`）

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-01-rules-compliance-audit.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
