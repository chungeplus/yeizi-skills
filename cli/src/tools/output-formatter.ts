import type { ISkillComparisonRow } from "@/types/skill"

/**
 * 输出格式化器。
 */
export class OutputFormatter {
  /**
   * 渲染技能比较表格。
   *
   * @param comparisonRows - 比较结果行列表。
   * @returns 可直接输出的表格文本。
   * @example renderComparisonTable([{ platformName: "codex", skillName: "yeizi-demo", remoteVersion: "1.0.0", localVersion: null, statusMessage: "该技能尚未安装。" }]) => "平台 | 技能 | 远端版本 | 本地版本 | 状态\n--..."
   */
  public renderComparisonTable(comparisonRows: readonly ISkillComparisonRow[]): string {
    const headerCells = ["平台", "技能", "远端版本", "本地版本", "状态"]
    const dividerCells = headerCells.map(() => "---")
    const bodyRows = comparisonRows.map(comparisonRow => [
      comparisonRow.platformName,
      comparisonRow.skillName,
      comparisonRow.remoteVersion,
      comparisonRow.localVersion ?? "-",
      comparisonRow.statusMessage,
    ])
    const lineRows = [headerCells, dividerCells, ...bodyRows]

    return lineRows.map(lineCells => lineCells.join(" | ")).join("\n")
  }

  /**
   * 渲染汇总消息。
   *
   * @param summaryMessages - 汇总消息列表。
   * @returns 可直接输出的汇总文本。
   * @example renderSummary(["已完成安装。", "已完成更新。"]) => "已完成安装。\n已完成更新。"
   */
  public renderSummary(summaryMessages: readonly string[]): string {
    return summaryMessages.join("\n")
  }
}
