# 多平台 AI 技能同步管理场景原型

## 场景识别信息
- 当前参考项目对应的是一个以命令行为主入口的多平台 AI 技能同步管理场景，用于把远端仓库中的技能同步到本地多个 AI 平台的 `skills` 目录。
- 当前场景的主交互形态是 CLI 子命令，围绕技能列表查看、技能安装和已安装技能更新展开；主技术轮廓是 `Node.js + TypeScript`。

## 场景结构规则
- CLI 启动入口与程序主入口分开，启动入口只负责拉起运行，程序主入口统一负责读取程序元信息、注册全部一级命令、处理默认帮助输出和统一错误出口。
- 一级命令按 `src/commands/<command-name>/` 组织，根级命令注册集中在 `src/commands/index.ts`，不为单个命令再建立第二套根注册入口。
- 参数读取、交互补选、结果输出和命令入口收束默认留在 `src/commands/*`；某段逻辑即使变长，只要仍然只服务当前命令，就不因为“代码更多了”自动提升到共享层。
- 共享支持层按 `config / constants / errors / features / schemas / tools / types` 分层；跨多个命令复用的能力进入共享层，只服务单个命令的内容留在对应命令目录内部。
- 常量只有在它本身是当前场景统一映射表、统一目录名表或会被多个模块共同依赖的固定表时，才进入共享 `constants`；只在单文件使用的固定值留在当前文件，当前项目也不为了目录整齐额外建立命令内 `constants`。
- 命令专用的选项结构、局部输入输出结构和局部交互结构留在 `src/commands/*/types`；被多个命令或多个共享模块共同依赖的公共结构，进入共享 `src/types/*`。
- 远端公共载荷、统一索引结构和统一文档结构的运行时校验进入共享 `src/schemas/*`；当前项目不为单个命令单独建立局部 `schemas` 目录。
- 只替单个命令做局部拼装、局部整理的 helper 留在命令内部；被多个命令共同复用、且不承载业务判断的交互、输出和错误展示能力进入共享 `src/tools/*`。
- 平台解析、远端来源访问和技能处理分别按 `features/platform`、`features/source`、`features/skill` 分域组织，命令层只负责编排调用，不直接承载这些共享实现细节。
- 命令层默认只依赖共享能力层和共享支持层；共享能力层默认不反向依赖具体命令目录，也不从命令目录回收共享实现细节。
- 只是继续补当前职责时，默认写回现有文件或现有模块；只有出现新职责、新副作用边界或新的稳定复用点时，才考虑新建文件或新模块。
- `package.json` 是 CLI 名称、描述和版本的单一事实来源，`src/config/repository-config.ts` 是远端仓库来源配置的单一事实来源，`src/constants/platform-directory-names.ts` 是平台目录映射的单一事实来源。

## 技术方案
- 运行时采用 `Node.js >= 20`，模块形式采用 `ESM`。
- 主程序语言采用 `TypeScript`，基础校验命令固定为 `tsc`、`eslint` 和 `vite build`，代码规范使用 `@antfu/eslint-config`。
- 根命令装配、子命令解析和帮助输出使用 `commander`。
- 交互式平台选择、技能选择和更新项选择使用 `inquirer`。
- 输入值、远端索引、GitHub Contents 响应和技能文档 frontmatter 的运行时校验使用 `zod`，技能文档 frontmatter 解析使用 `gray-matter`，版本比较使用 `semver`。
- 远端文本和 JSON 读取沿用原生 `fetch`，致命错误展示使用 `boxen` 和 `chalk`。

## 业务规则
- CLI 启动后先读取 `package.json` 中的程序名称、描述和版本，再注册全部一级命令；如果没有传入子命令，则直接输出帮助信息并结束。
- `list` 命令先解析平台参数；如果没有显式传入平台，就通过交互选择平台；随后读取远端技能索引，构造各平台目标 `skills` 目录状态，并输出远端版本、本地版本和状态的比较表格。
- `install` 命令先解析平台和技能参数；缺少平台时交互选择平台，缺少技能时交互选择技能；随后读取远端技能索引和目标技能文件，校验远端技能版本与索引一致，再把选中的技能安装到目标平台的本地 `skills` 目录。
- `update` 命令先解析平台参数；缺少平台时交互选择平台；随后读取远端技能索引，对比本地已安装技能版本，只对存在可用更新的技能继续交互选择，再执行更新。
- 当目标平台不存在 `skills` 目录时，不自动创建目录，而是跳过该平台，并在最终汇总输出里说明原因。
- 技能安装与更新都先把远端文件下载到临时目录，完成版本与路径校验后再替换目标技能目录；如果替换中途失败，则尝试恢复原目录，避免留下半完成状态。
- 命令参数值、平台名称、技能名称、远端索引、远端技能文档 frontmatter 和远端内容列表都必须先校验，再进入业务逻辑。
- 命令成功时统一输出表格或摘要文本；出现业务错误或未知异常时，统一转换到 `AppError` 体系，通过统一错误展示出口输出可读错误信息，并设置非 `0` 退出码。

## 实现边界
- `src/bin/cli.ts` 只负责 shebang 和调用 `runCli`，不承载命令解析、帮助输出或错误处理。
- `src/main.ts` 负责读取 `package.json` 元信息、创建 `commander` 程序实例、注册全部一级命令、处理无参数帮助输出和统一致命错误出口。
- `src/commands/index.ts` 只负责注册 `list`、`install`、`update` 三个一级命令。
- `src/commands/*/types/*` 只负责当前命令自己的选项结构和局部命令输入输出类型，不承载跨命令公共结构。
- `src/commands/list/command.ts` 负责 `list` 命令的平台参数读取、平台选择、远端索引读取、比较结果组装和表格输出。
- `src/commands/install/command.ts` 负责 `install` 命令的平台与技能参数读取、交互补选、远端技能文件加载、版本一致性校验和安装结果汇总。
- `src/commands/update/command.ts` 负责 `update` 命令的平台参数读取、可更新技能筛选、交互选择和更新结果汇总。
- `src/features/platform/*` 负责平台参数解析，以及按用户主目录组装各平台 `skills` 目录目标信息。
- `src/features/source/*` 负责远端 JSON/文本请求、技能索引读取、远端技能文件递归加载和远端版本校验。
- `src/features/skill/*` 负责本地远端版本比较、技能条目收束、技能文档解析、技能索引解析和本地技能目录更新。
- `src/tools/*` 负责平台、安装技能和待更新技能的交互选择，以及共享输出和致命错误展示。
- `src/config/repository-config.ts` 负责远端仓库来源配置，`src/constants/platform-directory-names.ts` 负责跨模块共享的平台目录名称映射，`src/errors/*` 负责统一错误类型与错误码。
- `src/schemas/*` 负责远端公共载荷、技能索引和技能文档 frontmatter 的共享校验结构，不把这些公共结构校验散落到命令文件里。
- `src/types/command/*` 负责跨命令共享的命令接口和通用选项类型，`src/types/platform/*`、`src/types/skill/*`、`src/types/source/*` 负责平台、技能来源和下载文件等共享类型定义。

## 目录参考
```text
package.json
README.md
tsconfig.json
vite.config.ts
eslint.config.js
src/
  bin/
    cli.ts
  main.ts
  commands/
    index.ts
    install/
      command.ts
      index.ts
      types/
    list/
      command.ts
      index.ts
      types/
    update/
      command.ts
      index.ts
      types/
  config/
    repository-config.ts
  constants/
    platform-directory-names.ts
  errors/
  features/
    platform/
    skill/
    source/
  schemas/
  tools/
  types/
    command/
    platform/
    skill/
    source/
```
