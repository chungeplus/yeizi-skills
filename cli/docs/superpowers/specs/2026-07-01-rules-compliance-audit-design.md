# Rules Compliance Audit 设计文档

## 1. 背景

`yeizi-skills` CLI 项目（`C:/Users/yeizi/Desktop/yeizi-skills/cli`）当前分支 `v2.1-cleanup` 已合入 v2 重构（删 manifest）与 v2.1 followup 的 6 批次清理（27 项修复全部 commit）。但上游 `yeizi-styles/rules-project/rules/` 在外部仓库被更新，更新内容未同步到 `cli/CLAUDE.md` / `AGENTS.md`，且 `tasks/` 目录下有 3 个规则细化 PRD 待落地（option-suffix、iteration-item、raw-text-payload）。

本次任务是**对全项目做一次新规则审计**，只出报告，不动代码。审计对象是当前 `src/` 下 57 个 .ts 文件在当前 `CLAUDE.md` 规则下的合规性，目标是产出一份违规清单 + 修复建议，支撑后续代码重构决策。

**约束**（来自用户确认 + 项目 memory `rule-review-scope`）：

- 报告 only，不动代码
- 不动 `CLAUDE.md` / `AGENTS.md`
- 不动 `tasks/` 下 3 个 PRD
- 不动工作区已修改未提交的文件（按修改后状态审计）

## 2. 审计范围

### 2.1 覆盖文件

`src/` 下所有 .ts 文件，按目录组织：

| 目录 | 文件数 | 角色 |
|---|---|---|
| `bin/` | 1 | CLI 入口 |
| `commands/install/`, `commands/list/` | 4 | 子命令 |
| `config/platform/`, `config/repository/`, `config/index.ts` | 3 | 配置 |
| `constants/skill/` | 3 | 常量 |
| `error/` | 7 | 错误系统 |
| `features/{display,github,platform,skill}/` | 14 | 业务特性 |
| `main.ts` | 1 | 主入口 |
| `schemas/{platform,skill,tools}/` | 3 | Zod 校验 |
| `tools/{filesystem,package-json,string,terminal}/` | 7 | 通用工具 |
| `types/{command,error,platform,skill}/` | 14 | 类型 |
| **合计** | **约 57 个 .ts** | |

### 2.2 覆盖规则

当前 `CLAUDE.md` 中 8 个分类下的全部条款（`### ` 段落）。详细 ID 与文本在 S1 阶段从 CLAUDE.md 动态提取。

### 2.3 不覆盖

- `docs/`、`tasks/`、`scripts/`、`.superpowers/`、`bun.lock`、`package.json`、根 `README.md`、`CHANGELOG.md`、`eslint.config.ts`、`tsconfig.json`
- 非 `.ts` 文件（`.py`、`.md`、配置等）
- 任何生成产物（`dist/`）

## 3. 审计方法论

### 3.1 流程概览

```
S1: 解析 CLAUDE.md 提取规则清单 (rule-list)
         │
         ▼
S2: 创建报告骨架 (§0/§1/§5)
         │
         ▼
S3: 8 个 per-category 子任务并行 (shared-rules / code-rules / comment-rules
         / implementation-rules / naming-rules / statement-rules
         / type-rules / directory-rules)
         │
         ▼
S4: 跨规则聚合 (按 file:line 去重 + 按 file 归并)
         │
         ▼
S5: 写入 §2 逐文件审计
         │
         ▼
S6: 生成 §3 双索引 + §4 引用
         │
         ▼
S7: 自审报告
```

### 3.2 S1 规则清单提取

从 `CLAUDE.md` 解析出 `rule-list.json`（内部用，不入报告）：

```typescript
interface RuleEntry {
  id: string            // 例: "naming.is-prefix"
  category: string      // 例: "naming-rules"
  title: string         // 规则标题
  text: string          // 规则正文
  judgePointList: string[]  // 判定要点（违规特征）
  severityHint: "CRITICAL" | "MAJOR" | "MINOR"
}
```

判定要点从规则正文中提炼关键词，用于子任务自动化 grep。每个分类的判定要点模板：

- **shared-rules**（4 条）：不写断言式检查，靠人工读 §2 finding 时的合规判断；本分类主要靠审计员读上下文判定
- **code-rules**（5 条）：注释 `^//` 写末尾而非上方（grep `// .+;$`）、类型守卫缺失、`switch` 关键字（grep `\bswitch\b`）、空泛词（grep `\b(value|item|data|info)\b` in identifier）
- **comment-rules**（3 条）：TSDoc 缺失（export function 无 `/**`）、`@param` 缺失（function 形参 > 0 但无 `@param`）、`@example` 缺失（可复用函数无 `@example`）
- **implementation-rules**（4 条）：函数参数 `readonly`（grep `readonly \w+:` in param）、catch 不收窄（grep `catch \(\w+\) {[^}]*\.message`）、class 构造函数 `public` 声明属性（grep `constructor\([^)]*\b(public|private|protected)\b`）
- **naming-rules**（12+ 条）：每个后缀/前缀一条独立 grep
- **statement-rules**（5 条）：`var` 关键字（grep `\bvar\b`）、`switch`（同 code-rules）、`for\b` / `for-in` / `while` 关键字循环（grep `\bfor\s*\(`、`\bfor\s*\(\s*\w+\s+in\b`、`\bwhile\s*\(`）、`as` 类型断言（grep `\bas\s+[A-Z]` 但排除 `as const`）、`*` 通配再导出（grep `export \*`）
- **type-rules**（3 条）：`enum` 关键字（grep `\benum\s+[A-Z]`）、`any` / `unknown` 兜底（grep `: any\b`、`as any\b`、`: unknown\b`、`as unknown`）、`as` 断言（同上）
- **directory-rules**（4 条）：桶文件存在 `export \*`、跨目录导入绕进文件内部（非桶路径）、文件名含角色词（grep 目录名重复在文件名中）、单文件目录命名（grep `src/[^/]+/[^/]+\.ts` 的目录是否需要进一步拆）

### 3.3 S3 per-category 子任务

每个分类起 1 个子任务（不是每条规则 1 个子任务——粒度太细），子任务职责：

1. 加载该分类的判定要点 + 规则清单
2. 对每条规则用 Grep/Read 在 `src/` 下找违规
3. 每条命中必须 Read 上下文 ≥ 5 行确认是违规不是误报
4. 输出 finding：

```typescript
interface Finding {
  file: string             // 相对 src/ 的路径
  line: number             // 违规起始行
  ruleId: string           // 规则 ID
  ruleTitle: string        // 规则标题
  severity: "CRITICAL" | "MAJOR" | "MINOR"
  snippet: string          // ≤ 3 行代码片段
  suggestion: string       // 可执行修复建议
}
```

### 3.4 严重度判定

| 级别 | 判定标准 | 典型规则 |
|---|---|---|
| 🔴 CRITICAL | 触发 lint 错误 / 真 bug / 硬约束违反 | `enum`、`as any`、`var`、`: unknown` 兜底、`export *` 通配再导出 |
| 🟠 MAJOR | 违反 `CLAUDE.md` 明确条款 | `as SomeType` 断言、`for`/`while` 关键字循环、TSDoc 缺失（export 函数）、`switch` 用法、catch 不收窄 |
| 🟡 MINOR | 风格/可选优化 | 注释位置、可选参数命名一致性、桶导出粒度、目录命名 |

severityHint 在 S1 阶段给定，但子任务可基于上下文调整（如规则正文是 `禁用` 但落地为可选参数，仍记 MINOR）。

### 3.5 S4 跨规则聚合

按 `(file, line, ruleId)` 三元组去重，相同 finding 由多个规则都发现时只保留最高严重度。归并后按 `file` 分组，每组内按 `severity` 降序、再按 `line` 升序。

### 3.6 关键约束

- **0 匹配处理**：S3 中所有"无命中"的规则在报告中不出现
- **finding 必须可执行**：每条 suggestion 精确到改什么不改什么
- **不复用 v2.1 followup 报告 finding**：避免重复记账
- **工作区 M 文件按已修改后状态审计**：即 audit 时 Read 文件读的是 disk 当前内容
- **不调用 `bun run check`**：避免假阳性 lint 报错淹没真实违规
- **不修改任何源文件**

## 4. 报告结构

### 4.1 §0 报告元信息（约 30 行）

```
# Rules Compliance Audit Report

- 日期: 2026-07-01
- 审计员: Claude (M3)
- 范围: src/ 下 57 个 .ts 文件
- 依据: CLAUDE.md (commit <hash> 或 untracked 当前内容)
- 方法论: pipeline per-category 深度审计 + 跨规则聚合
- 严重度: 🔴 CRITICAL / 🟠 MAJOR / 🟡 MINOR
- 边界: 不动代码 / 不动 CLAUDE.md / 不动 tasks/ 3 个 PRD
- 引用: v2.1 followup design §X.X, batch-Y commit <hash>
```

### 4.2 §1 严重度概览（约 50 行）

- 三张表：CRITICAL 数量 / MAJOR 数量 / MINOR 数量
- 每张表按 `rule-id` 聚合，列出命中文件数（不是 finding 数）
- 重点规则：命中文件数 TOP 5
- 总量统计：本审计发现的总 finding 数

### 4.3 §2 逐文件审计（主体，§2.1 ~ §2.N，每文件一节）

每节结构：

```
### §2.X 文件 src/path/to/file.ts（🔴N 🟠M 🟡K）

文件角色: <bin/cli | commands/install | features/github | ...>
总行数: N（含工作区 M 修改后）
涉及规则: rule-id-1, rule-id-2, ...

| 规则 | 级别 | 行号 | 当前内容 | 建议修复 |
|---|---|---|---|---|

- 🔴 CRITICAL
  - L23 `xxx` 违反 rule-id-1 描述
- 🟠 MAJOR
  - L45 ...
- 🟡 MINOR
  - L78 ...
```

每条 finding 必带：① 规则 ID / 名称 ② 严重度 ③ `file:line` ④ 代码片段（≤ 3 行） ⑤ 修复建议

### 4.4 §3 双索引

- **§3.1 按文件索引**——按 `src/` 目录树顺序列出每文件的 finding 数
- **§3.2 按规则索引**——按 `rule-id` 字母序列出每条规则的 finding 列表

### 4.5 §4 引用与上下文

- 引用的 v2.1 followup 设计章节（仅引用，不重复 finding）
- 引用的 3 个 PRD（仅引用其规则变更意图，不重复 finding）
- 引用的 6 批次 commit（仅引用 commit hash）

### 4.6 §5 边界声明

- 不审计的非 src 文件清单 + 理由
- 不审计的运行时检查清单 + 理由
- 已知的潜在误报位置（要求用户复核时优先看）

### 4.7 格式约束

- 单 finding 不超过 5 行表格
- 代码片段一律放在 Markdown ` ```typescript ``` ` 代码块内
- 严重度用 emoji：`🔴 CRITICAL` / `🟠 MAJOR` / `🟡 MINOR`
- 报告不输出"good job"段落，只输出 finding

## 5. 执行步骤

| 步骤 | 任务 | 产物 | 验证点 |
|---|---|---|---|
| S1 | 解析 CLAUDE.md 提取规则清单 | `rule-list.json`（内部） | 8 个分类全覆盖、每条规则有 ID + 文本 + 判定要点 |
| S2 | 创建报告骨架 | `2026-07-01-rules-compliance-audit.md` | 文件位置在 `docs/superpowers/specs/` |
| S3 | 8 个 per-category 子任务并行 | finding 集合（JSON） | 每条 finding 都有 file:line + rule-id + 片段 + 修复 |
| S4 | 跨规则聚合 | `merged-findings.json` | 同一 file:line 不重复记账 |
| S5 | 写入 §2 各小节 | 报告主体 | 严重度排序正确、表格列齐全 |
| S6 | 生成 §3 双索引 + §4 引用 | 报告索引段 | 排序与目录树一致、规则 ID 字母序正确 |
| S7 | 自审报告 | 自审 checklist 记录 | 5 个占位检查点全过 |

## 6. 验证策略

- **finding 准确性**：每条 finding 至少 1 个独立子任务复核（不同上下文读同一行确认是违规不是误报）
- **规则覆盖完整性**：S1 输出的规则数 = CLAUDE.md 中 `### ` 段落数
- **0 匹配处理**：S3 中所有"无命中"的规则在报告中不出现
- **跨章节一致性**：§2 finding 数 = §3 索引数 = §1 概览数
- **报告可读性**：报告 commit 后由 `Read` 工具全文复读一次

## 7. 完成条件（DoD）

- [x] 报告文件存在于 `docs/superpowers/specs/2026-07-01-rules-compliance-audit.md`
- [x] 报告未 commit（是否入 git 由用户后续决定）
- [x] §0 ~ §5 章节齐全
- [x] §1 概览数 = §2 finding 数 = §3 索引数
- [x] 每条 finding 都有可执行的修复建议
- [x] 未修改任何 src 文件、未修改 CLAUDE.md/AGENTS.md、未修改 3 个 PRD

## 8. 风险与缓解

| 风险 | 缓解 |
|---|---|
| grep 假阳性泛滥 | S3 子任务不只 grep，必须 Read 文件上下文 ≥ 5 行后再判定 |
| 规则文本理解偏差 | S1 阶段对每条规则写"判定要点"短句，子任务按要点判断 |
| 审计耗时过长 | S3 子任务并行启动 + per-category 隔离（单条规则超时不影响其他） |
| 工作区 M 文件状态漂移 | audit 开始时 Read 所有 M 文件生成 content snapshot，S3-S6 全程使用 snapshot |
| v2.1 followup finding 重复 | S3 子任务跳过 v2.1 followup §3 已列出的 27 项位置 |

## 9. 不做的明确清单

- ❌ 修复任何违规
- ❌ 动工作区 M 文件
- ❌ 动 CLAUDE.md / AGENTS.md
- ❌ 动 3 个 PRD
- ❌ 写"建议性 / 探索性"finding
- ❌ 引入新规则
- ❌ 调用 `bun run check` / `bun tsc` / `bun test`
- ❌ 把审计报告 commit 到 git（仅生成文件，由用户决定后续动作）

## 10. 关联文档

- 上游规则源：`yeizi-styles/rules-project/rules/`（外部仓库，本地未检出）
- 当前规则：`cli/CLAUDE.md`、`cli/AGENTS.md`（untracked）
- v2.1 followup：`docs/superpowers/specs/2026-06-30-yeizi-skills-v2.1-followup-design.md`
- 6 批次 commit：参见 `git log --oneline v2.1-cleanup` 30 条内
- 3 个 PRD：`cli/tasks/prd-{refine-option-suffix,refine-iteration-item,merge-raw-text-payload}-naming-rules.md`
