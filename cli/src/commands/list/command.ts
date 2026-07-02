import type { Command } from "commander"
import type { CommandOption } from "@/types/commands"
import type { RawListCommandOption } from "@/types/commands/list"
import type { SkillComparisonRow } from "@/types/skill"

import boxen from "boxen"
import chalk from "chalk"

import { buildPlatformList, promptPlatformNameList } from "@/features/platform"
import { RemoteRepositoryService } from "@/features/repository"
import { buildComparisonRows, SkillContentService } from "@/features/skill"
import { truncateText } from "@/tools/string"

/**
 * list 命令。
 */
class ListCommand {
  /**
   * Commander 命令名。
   */
  public readonly commandName = "list"

  /**
   * 展示在帮助信息中的命令说明。
   */
  public readonly commandDescription = "查看技能列表。"

  /**
   * 技能简介在表格内的最大字符数，超出部分尾部追加省略号。
   */
  private readonly descriptionTruncateLimit = 60

  /**
   * 命令支持的选项定义列表。
   */
  public readonly commandOptionList: readonly CommandOption[] = []

  /**
   * 渲染并显示技能比较表格到 stdout。
   *
   * @param title - 标题文案。
   * @param comparisonRowList - 比较结果行列表。
   */
  private renderComparisonTable(
    title: string,
    comparisonRowList: SkillComparisonRow[],
  ): void {
    const headerCellList = ["平台", "技能", "状态", "介绍"]
    const dividerCellList = headerCellList.map(() => "---")
    const bodyRowList = comparisonRowList.map(comparisonRowItem => [
      comparisonRowItem.platformName,
      comparisonRowItem.skillName,
      comparisonRowItem.statusMessage,
      truncateText(comparisonRowItem.skillDescription, this.descriptionTruncateLimit),
    ])
    const lineRowList = [headerCellList, dividerCellList, ...bodyRowList]
    const tableText = lineRowList.map(lineCellList => lineCellList.join(" | ")).join("\n")

    console.log(boxen(
      chalk.yellow(tableText),
      {
        title: chalk.bold.green(title),
        titleAlignment: "center",
        padding: { top: 1, bottom: 1, left: 5, right: 5 },
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
        textAlignment: "left",
      },
    ))
  }

  /**
   * 解析参数、拉取远端仓库快照并显示远端与各平台本地的技能比较表格。
   *
   * @param _rawOptions - Commander 解析后的原始选项。
   */
  public async execute(_rawOptions: RawListCommandOption): Promise<void> {
    const selectedPlatformNameList = await promptPlatformNameList()
    const selectedPlatformList = await buildPlatformList(selectedPlatformNameList)

    const remoteSkillList = await SkillContentService.getRemoteSkillList()

    try {
      const comparisonRowList = await buildComparisonRows(
        remoteSkillList,
        selectedPlatformList,
      )

      this.renderComparisonTable("技能列表", comparisonRowList)
    }
    finally {
      await RemoteRepositoryService.removeLocalRepositoryDirectory()
    }
  }

  /**
   * 把当前命令注册到 Commander 程序对象。
   *
   * @param program - Commander 程序对象。
   */
  public register(program: Command): void {
    const listCommand = program.command(this.commandName).description(this.commandDescription)

    this.commandOptionList.forEach((commandOption) => {
      listCommand.option(commandOption.commandOptionFlag, commandOption.commandOptionDescription)
    })

    listCommand.action(async (rawOptions: RawListCommandOption) => {
      await this.execute(rawOptions)
    })
  }
}

export { ListCommand }
