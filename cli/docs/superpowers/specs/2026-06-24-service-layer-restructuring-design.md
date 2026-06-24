# service 层目录重构设计

## 状态

待评审的设计草案，评审通过后进入实施计划。

## 背景

当前 `src/apis/` 目录承载四个模块，但其中只有两个是真正的网络访问能力：

```
src/apis/
  github/          # GitHub 端点调用（外部访问）
  http-client/     # axios 封装 + 重试 + 错误类型（外部访问传输层）
  package-json/    # 读取本地 package.json（fs.readFileSync，非网络）
  prompt/          # inquirer 交互式选择（终端 UI，非网络）
```

用户反馈 `apis/github/` 的封装结构不直观，并给出两个一线参考：

- `PanJiaChen/vue-element-admin`：`src/api/<resource>.js`（域端点） + `src/utils/request.js`（axios 实例）。
- `soybeanjs/soybean-admin`：`src/service/` 下分 `api/`（端点模块） + `request/`（axios 传输 + 类型）。已用 GitHub API 核实其实际结构为 `service/api/{auth,route,index}.ts` 与 `service/request/{index,shared,type}.ts`。

两个参考都把「HTTP 传输」和「域端点」分成两层。当前项目的 `http-client/` + `github/` 已经是这个划分，只是命名为 `apis/`，且与两个非网络模块混在同一目录，造成「奇怪」的观感。

## 目标

- 把 `apis/` 重命名为 `service/`，并按 soybean 风格分为 `apis/`（域端点） + `request/`（传输层）。
- 让 `service/` 只承载外部网络访问能力，与「外部访问能力只在全局共享层保留一份」的规则一致。
- 把两个非网络模块 `prompt/`、`package-json/` 搬回它们重构前所在的 `tools/`。
- 纯结构调整：文件移动、目录改名、import 路径改写。不改任何函数实现，不拆分文件内部内容。

## 非目标

- 不拆分 `request/` 内部：`http-request-client.ts` 当前承载的 `HttpRequestError`、retry 函数、`MAX_ATTEMPTS` 等常量都只在该文件内部使用，按规则留在原文件。
- 不调整 github 的类型定义：`IGitHubApi`、`IGitHubContentsEntry` 已在全局 `src/types/source/`（跨模块共用），位置正确，保持不动。
- 不动 `features/skill/`、`features/platform/`、`errors/`、`commands/` 等其他在途重构或无关目录。
- 不新增依赖，不引入测试桩或工厂抽象。

## 依据规则

全部来自 `yeizi-styles/rules-project/rules/projects/code-rules.md` 与 `technologies/typescript/naming-rules.md`，每条改动对应一条现有规则：

- **§外部访问能力**：「访问项目外部系统、服务或资源的代码属于外部访问能力。外部访问能力全项目只在全局共享层保留一份，私有模块不建立访问层。」→ `service/` 是这唯一的全局 HTTP 层；`prompt/`、`package-json/` 不访问网络，不属于这一层。
- **§常量内容**：「固定不变的值属于常量内容。只在单个文件使用的留在当前文件，被同模块多个文件共用的放到模块内共享层，被多个模块共用的放到全局共享层。」→ github 的 base URL / 超时被 `url-builder.ts` 与 `github-api.ts` 共用 → 留在 github 模块内的常量文件；`request/` 内的常量只单文件使用 → 留在文件内。
- **§类型内容**：同上分层 → github 类型跨模块共用，留在全局 `src/types/source/`。
- **naming-rules §其他角色文件优先使用语义主题加角色**：「只有当前目录已经完整限定主题，且该文件承担当前目录唯一的同类角色时，才使用 `constants.ts` 这类纯角色名。」→ `service/apis/github/` 已限定 github 主题且常量文件是目录内唯一同类角色 → `constants.ts` 被允许，保留原名。
- **§小范围修改 / 不修改无关内容**：不拆 `request/`、不动类型、不改实现。

## 目标结构

```
src/
  service/                          # 原 apis/，只保留外部网络访问能力
    index.ts                        # 桶导出 ./apis ./request
    request/                        # 原 http-client/  (= soybean request/)
      index.ts
      http-request-client.ts        # 原样搬移，内部不拆分
    apis/                           # (= soybean api/，本项目用复数 apis)
      index.ts                      # 桶导出 ./github
      github/                       # 原 apis/github/，文件保持扁平
        index.ts
        github-api.ts
        url-builder.ts
        contents-parser.ts
        constants.ts                # 保留原名（规则允许）
  tools/                            # prompt 和 package-json 搬回
    display/                        # 不动
    parse-csv-option-values.ts      # 不动
    prompt-service.ts               # 原 apis/prompt/platform-skill-prompt.ts
    load-package-json-info.ts       # 原 apis/package-json/load-package-json-info.ts
    index.ts                        # 补两条桶导出
```

## 文件移动与改名清单

| 现在 | 改为 | 处理 |
|---|---|---|
| `apis/index.ts` | `service/index.ts` | 桶导出改为 `./apis` `./request` |
| `apis/http-client/index.ts` | `service/request/index.ts` | 原样 |
| `apis/http-client/http-request-client.ts` | `service/request/http-request-client.ts` | 原样，内部不拆分 |
| `apis/github/index.ts` | `service/apis/github/index.ts` | 原样 |
| `apis/github/github-api.ts` | `service/apis/github/github-api.ts` | 仅改 import：`@/apis/http-client` → `@/service/request` |
| `apis/github/url-builder.ts` | `service/apis/github/url-builder.ts` | 原样 |
| `apis/github/contents-parser.ts` | `service/apis/github/contents-parser.ts` | 原样 |
| `apis/github/constants.ts` | `service/apis/github/constants.ts` | 保留原名 |
| `apis/package-json/load-package-json-info.ts` | `tools/load-package-json-info.ts` | 搬回 tools |
| `apis/prompt/platform-skill-prompt.ts` | `tools/prompt-service.ts` | 搬回 tools，沿用历史文件名 |
| `apis/package-json/index.ts` | （删除） | 内容并入 `tools/index.ts` |
| `apis/prompt/index.ts` | （删除） | 内容并入 `tools/index.ts` |
| — | `service/apis/index.ts` | 新建桶导出 `./github` |

## import 改写点

全部 6 处已核实：

| 文件 | 改动 |
|---|---|
| `service/apis/github/github-api.ts` | `@/apis/http-client` → `@/service/request` |
| `features/source/github-skill-source.ts` | `@/apis/github` → `@/service/apis/github` |
| `commands/install/command.ts` | `getInteractiveTerminal, promptPlatformList, promptSkillList` 从 `@/apis` → `@/tools` |
| `commands/list/command.ts` | `getInteractiveTerminal, promptPlatformList` 从 `@/apis` → `@/tools` |
| `commands/update/command.ts` | `getInteractiveTerminal, promptPlatformList, promptSkillListToUpdate` 从 `@/apis` → `@/tools` |
| `main.ts` | `loadPackageJsonInfo` 从 `@/apis` → `@/tools` |

`tools/index.ts` 补 `export * from "./prompt-service"` 与 `export * from "./load-package-json-info"`。

## 验证

- `bun run check`（typecheck + lint，0 错 0 警）
- `bun test`
- `bun run build`
- `grep -rn "@/apis" src` 确认无残留旧路径
- 确认旧 `src/apis/` 目录已完全删除，无残留文件

## 范围边界

纯文件搬移 + 目录改名 + import 改写。不拆 `request/` 内部、不动 github 类型、不改任何函数实现、不碰其他在途重构。
