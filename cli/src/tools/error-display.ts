import boxen from "boxen"
import chalk from "chalk"

/**
 * 渲染 CLI 致命错误展示。
 *
 * @param title - 错误标题。
 * @param message - 错误消息。
 * @example renderErrorDisplay("程序异常", "发生了未知错误。") => void
 */
export function renderErrorDisplay(title: string, message: string): void {
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
