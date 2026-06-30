import boxen from "boxen"
import chalk from "chalk"

/**
 * 把错误标题和消息渲染成红框输出到 stderr。
 *
 * @param title - 错误标题。
 * @param message - 错误消息正文。
 * @returns 无返回值。
 *
 * @example
 * ```typescript
 * renderErrorDisplay("命令用法错误", "缺少必填选项。")
 * ```
 */
function renderErrorDisplay(title: string, message: string): void {
  console.error(boxen(
    chalk.yellow(message),
    {
      title: chalk.bold.red(title),
      titleAlignment: "center",
      padding: { top: 1, bottom: 1, left: 5, right: 5 },
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      textAlignment: "center",
    },
  ))
}

export { renderErrorDisplay }
