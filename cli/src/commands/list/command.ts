import type { Command } from "commander"
import type { BaseCommand, CommandOptionDefinition } from "@/types/command"

import type { ListCommandOptions, RawListCommandOptions } from "@/types/command/list"
import type { PlatformName } from "@/types/platform"
import type { SkillComparisonRow } from "@/types/skill"
import boxen from "boxen"
import chalk from "chalk"
import { buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList } from "@/features/platform"
import { buildComparisonRows, ManifestConfigService } from "@/features/skill"

/**
 * list 命令。
 */
class ListCommand implements BaseCommand<ListCommandOptions> {
  /**
   * Commander 命令名。
   */
  public readonly command = "list"

  /**
   * 展示在帮助信息中的命令说明。
   */
  public readonly description = "查看技能列表。"

  /**
   * 技能清单配置服务。
   */
  private readonly manifestConfig: ManifestConfigService

  /**
   * 平台配置服务。
   */
  private readonly platformConfig: PlatformConfigService

  /**
   * 命令支持的选项定义列表。
   */
  public readonly optionList: readonly CommandOptionDefinition[] = [
    {
      flags: "--platform <platforms>",
      description: "逗号分隔的平台列表。",
    },
  ]

  /**
   * 构造函数。
   */
  public constructor() {
    this.manifestConfig = ManifestConfigService.getInstance()
    this.platformConfig = PlatformConfigService.getInstance()
  }

  /**
   * 构建选中的平台名称列表。
   * 若命令行有值则直接使用，无值则提示用户选择。
   *
   * @param availablePlatformNameList - 可用的平台名称列表。
   * @param inputPlatformNameList - 命令行传入的平台名称列表。
   * @returns 选中的平台名称列表。
   */
  private async buildSelectedPlatformNameList(
    availablePlatformNameList: PlatformName[],
    inputPlatformNameList: PlatformName[],
  ): Promise<PlatformName[]> {
    let selectedPlatformNameList: PlatformName[]

    if (inputPlatformNameList.length > 0) {
      selectedPlatformNameList = inputPlatformNameList
    }
    else {
      selectedPlatformNameList = await promptPlatformNameList(availablePlatformNameList)
    }

    return selectedPlatformNameList
  }

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
    const headerCellList = ["平台", "技能", "远端版本", "本地版本", "状态"]
    const dividerCellList = headerCellList.map(() => "---")
    const bodyRowList = comparisonRowList.map(comparisonRow => [
      comparisonRow.platformName,
      comparisonRow.skillName,
      comparisonRow.remoteVersion,
      comparisonRow.localVersion ?? "-",
      comparisonRow.statusMessage,
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
   * 解析参数、加载远端清单并显示技能比较表。
   *
   * @param commandOptions - Commander 解析后的命令选项。
   */
  public async execute(commandOptions: ListCommandOptions): Promise<void> {
    await this.manifestConfig.loadData()

    const selectedPlatformNameList = await this.buildSelectedPlatformNameList(
      this.platformConfig.getPlatformNameList(),
      commandOptions.platformNameList,
    )

    const selectedPlatformList = buildSelectedPlatformList(
      this.platformConfig.getPlatformList(),
      selectedPlatformNameList,
    )
    const comparisonRowList = await buildComparisonRows(
      this.manifestConfig.getSkillList(),
      selectedPlatformList,
    )

    this.renderComparisonTable("技能列表", comparisonRowList)
  }

  /**
   * 把当前命令注册到 Commander 程序对象。
   *
   * @param program - Commander 程序对象。
   */
  public register(program: Command): void {
    const listCommand = program.command(this.command).description(this.description)

    this.optionList.forEach((optionDefinition) => {
      listCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    listCommand.action(async (rawOptions: RawListCommandOptions) => {
      const platformNameList = parsePlatformNameList(rawOptions.platform)

      const commandOptions: ListCommandOptions = {
        platformNameList,
      }

      await this.execute(commandOptions)
    })
  }
}

export { ListCommand }
