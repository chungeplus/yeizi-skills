import type { Command } from "commander"
import type { BaseCommand, CommandOptionDefinition } from "@/types/command"
import type { ListCommandOptions, RawListCommandOptions } from "@/types/command/list"
import type { PlatformName } from "@/types/platform"
import type { SkillComparisonRow } from "@/types/skill"

import boxen from "boxen"
import chalk from "chalk"
import { AppError, AppErrorCode } from "@/error"
import { renderSummaryDisplay } from "@/features/display"
import { getRepositoryDirectoryPath, scanSkillEntryList } from "@/features/github"
import { buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList } from "@/features/platform"
import { buildComparisonRows } from "@/features/skill"
import { removeDirectory } from "@/tools/filesystem"

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
   * 平台配置服务。
   */
  private readonly platformConfig: PlatformConfigService

  /**
   * 技能简介在表格内的最大字符数，超出部分尾部追加省略号。
   */
  private readonly descriptionTruncateLimit = 60

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
    this.platformConfig = PlatformConfigService.getInstance()
  }

  /**
   * 构建选中的平台名称列表。
   * 命令行有值时直接沿用，无值时通过交互提示用户多选。
   *
   * @param availablePlatformNameList - 可用的平台名称列表。
   * @param inputPlatformNameList - 命令行传入的平台名称列表。
   * @returns 选中的平台名称列表。
   *
   * @example
   * ```typescript
   * await this.buildSelectedPlatformNameList(["claude-code", "codex"], ["claude-code"]) // ["claude-code"]
   * ```
   *
   * @example
   * ```typescript
   * await this.buildSelectedPlatformNameList(["claude-code", "codex"], []) // 弹出多选提示，返回用户选择
   * ```
   */
  private async buildSelectedPlatformNameList(
    availablePlatformNameList: PlatformName[],
    inputPlatformNameList: PlatformName[],
  ): Promise<PlatformName[]> {
    if (inputPlatformNameList.length > 0) {
      return inputPlatformNameList
    }

    return promptPlatformNameList(availablePlatformNameList)
  }

  /**
   * 把技能简介按 {@link descriptionTruncateLimit} 截断，超出部分尾部追加省略号。
   *
   * @param description - 原始技能简介。
   * @returns 截断后的展示用文本。
   *
   * @example
   * ```typescript
   * this.truncateDescription("简短简介") // "简短简介"
   * ```
   *
   * @example
   * ```typescript
   * this.truncateDescription("非常长的简介……重复 100 次") // "非常长的简介……重复 100 次的前 60 字符…"
   * ```
   */
  private truncateDescription(description: string): string {
    if (description.length <= this.descriptionTruncateLimit) {
      return description
    }

    return `${description.slice(0, this.descriptionTruncateLimit)}…`
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
    const headerCellList = ["平台", "技能", "状态", "介绍"]
    const dividerCellList = headerCellList.map(() => "---")
    const bodyRowList = comparisonRowList.map(comparisonRowItem => [
      comparisonRowItem.platformName,
      comparisonRowItem.skillName,
      comparisonRowItem.statusMessage,
      this.truncateDescription(comparisonRowItem.description),
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
   * 删除已下载的仓库临时目录，删除失败时统一抛出 {@link AppError}。
   *
   * @param repositoryDirectoryPath - 待删除的仓库临时目录路径。
   * @throws 删除过程中底层抛出 {@link Error} 时，包装为 {@link AppErrorCode.DIRECTORY_REMOVE_FAILED} 错误。
   */
  private async removeRepositoryDirectory(repositoryDirectoryPath: string): Promise<void> {
    try {
      await removeDirectory(repositoryDirectoryPath)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
          params: { directoryPath: repositoryDirectoryPath },
          cause: error,
        })
      }

      throw error
    }
  }

  /**
   * 解析参数、拉取远端仓库快照并显示远端与各平台本地的技能比较表格。
   *
   * 流程顺序：
   * 1. 解析选中平台并校验。
   * 2. 拉取远端仓库到临时目录。
   * 3. 扫描远端候选技能、按 4 态构建比较结果行、渲染表格。
   * 4. 无论成功或失败，最终清理临时目录。
   *
   * @param commandOptions - 命令选项。
   */
  public async execute(commandOptions: ListCommandOptions): Promise<void> {
    const selectedPlatformNameList = await this.buildSelectedPlatformNameList(
      this.platformConfig.getPlatformNameList(),
      commandOptions.platformNameList,
    )
    const selectedPlatformList = buildSelectedPlatformList(
      this.platformConfig.getPlatformList(),
      selectedPlatformNameList,
      true,
    )

    const repositoryDirectoryPath = await getRepositoryDirectoryPath()

    try {
      const { skillEntryList: remoteSkillEntryList, warningList } = await scanSkillEntryList(repositoryDirectoryPath)
      const comparisonRowList = await buildComparisonRows(
        remoteSkillEntryList,
        selectedPlatformList,
      )

      this.renderComparisonTable("技能列表", comparisonRowList)

      if (warningList.length > 0) {
        renderSummaryDisplay("提示", warningList)
      }
    }
    finally {
      await this.removeRepositoryDirectory(repositoryDirectoryPath)
    }
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
