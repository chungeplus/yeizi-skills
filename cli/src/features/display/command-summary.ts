import boxen from "boxen"
import chalk from "chalk"

/**
 * 渲染并显示命令汇总消息到 stdout。
 *
 * @param title - 标题文案。
 * @param summaryMessageList - 汇总消息列表。
 * @returns 无返回值。
 *
 * @example
 * ```typescript
 * renderSummaryDisplay("更新完成", ["已完成安装。"])
 * ```
 */
function renderSummaryDisplay(title: string, summaryMessageList: string[]): void {
  console.log(boxen(
    chalk.yellow(summaryMessageList.join("\n")),
    {
      title: chalk.bold.green(title),
      titleAlignment: "center",
      padding: { top: 1, bottom: 1, left: 5, right: 5 },
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      textAlignment: "center",
    },
  ))
}

export { renderSummaryDisplay }
