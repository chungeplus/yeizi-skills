import type { Command } from "commander"
import type { BaseCommand, CommandOptionDefinition } from "@/types/command"

import type { RawUpdateCommandOptions, UpdateCommandOptions } from "@/types/command/update"
import type { PlatformItem, PlatformName } from "@/types/platform"
import type { SkillComparisonRow, SkillInstallResult, SkillItem } from "@/types/skill"
import { AppError, AppErrorCode } from "@/error"
import { renderSummaryDisplay } from "@/features/display"
import { getRepositoryDirectoryPath } from "@/features/github"
import { buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList } from "@/features/platform"
import { buildComparisonRows, buildSelectedRows, buildSelectedSkillList, buildUpdateRows, buildUpdateSkillNameList, copySkillItemToPlatformItem, ManifestConfigService, parseSkillNameList, promptSkillNameListToUpdate } from "@/features/skill"
import { removeDirectory } from "@/tools/filesystem"
import { SkillInstallStatus } from "@/types/skill"

/**
 * update 命令。
 */
class UpdateCommand implements BaseCommand<UpdateCommandOptions> {
  /**
   * Commander 命令名。
   */
  public readonly command = "update"

  /**
   * 展示在帮助信息中的命令说明。
   */
  public readonly description = "更新已安装技能。"

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
    {
      flags: "--skill <skills>",
      description: "逗号分隔的技能列表。",
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
   * 构建选中的技能名称列表。
   * 若命令行有值则直接使用，无值则提示用户从可更新列表中选择。
   *
   * @param updatableSkillNameList - 可更新的技能名称列表。
   * @param inputSkillNameList - 命令行传入的技能名称列表。
   * @returns 选中的技能名称列表。
   *
   * @example
   * ```typescript
   * await this.buildSelectedSkillNameList(["a", "b"], ["a"]) // ["a"]
   * ```
   *
   * @example
   * ```typescript
   * await this.buildSelectedSkillNameList(["a", "b"], []) // 弹出多选提示，返回用户选择
   * ```
   */
  private async buildSelectedSkillNameList(
    updatableSkillNameList: string[],
    inputSkillNameList: string[],
  ): Promise<string[]> {
    let selectedSkillNameList: string[]

    if (inputSkillNameList.length > 0) {
      selectedSkillNameList = inputSkillNameList
    }
    else {
      selectedSkillNameList = await promptSkillNameListToUpdate(updatableSkillNameList)
    }

    return selectedSkillNameList
  }

  /**
   * 按平台 × 选中行展开，把选中的技能批量更新到指定平台。
   *
   * @param selectedRowList - 选中的技能比较行（只包含可更新的技能）。
   * @param skillList - 选中的技能清单条目。
   * @param platformList - 目标平台列表。
   * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
   * @returns 每个技能在每个平台上的更新结果列表。
   *
   * @example
   * ```typescript
   * await this.batchUpdateSkillListToPlatformList(
   *   [{ skillName: "brainstorming", platformName: "claude-code", ... }],
   *   [{ skillName: "brainstorming", ... }],
   *   [{ platformName: "claude-code", ... }],
   *   "/tmp/yeizi-skills-repo-abc",
   * )
   * // [{ skillName: "brainstorming", platformName: "claude-code", status: "success" }]
   * ```
   */
  private async batchUpdateSkillListToPlatformList(
    selectedRowList: SkillComparisonRow[],
    skillList: SkillItem[],
    platformList: PlatformItem[],
    repositoryDirectoryPath: string,
  ): Promise<SkillInstallResult[]> {
    const resultList: SkillInstallResult[] = []

    for (const platformItem of platformList) {
      const matchedRowList = selectedRowList.filter(
        selectedRow => selectedRow.platformName === platformItem.platformName,
      )

      for (const matchedRow of matchedRowList) {
        const matchedSkillItem = skillList.find(
          skillItem => skillItem.skillName === matchedRow.skillName,
        )

        if (matchedSkillItem === undefined) {
          resultList.push({
            platformName: platformItem.platformName,
            skillName: matchedRow.skillName,
            status: SkillInstallStatus.FAILED,
            error: new AppError(AppErrorCode.SKILL_NOT_FOUND, {
              params: { skillNameList: [matchedRow.skillName] },
            }),
          })
          continue
        }

        const resultItem = await copySkillItemToPlatformItem(
          matchedSkillItem,
          platformItem,
          repositoryDirectoryPath,
        )

        resultList.push(resultItem)
      }
    }

    return resultList
  }

  /**
   * 把批量更新结果转换成展示用的中文汇总消息列表。
   *
   * @param resultList - 批量更新结果列表。
   * @returns 中文汇总消息列表，顺序与 `resultList` 一致。
   *
   * @example
   * ```typescript
   * this.buildUpdateSummaryMessageList([
   *   { status: SkillInstallStatus.SUCCESS, skillName: "brainstorming", platformName: "claude-code" },
   * ])
   * // ['已为平台"claude-code"更新技能"brainstorming"。']
   * ```
   *
   * @example
   * ```typescript
   * this.buildUpdateSummaryMessageList([
   *   { status: SkillInstallStatus.FAILED, skillName: "x", platformName: "y", error: new Error("没有权限") },
   * ])
   * // ['为平台"y"更新技能"x"失败：没有权限']
   * ```
   */
  private buildUpdateSummaryMessageList(resultList: SkillInstallResult[]): string[] {
    return resultList.map((resultItem) => {
      if (resultItem.status === SkillInstallStatus.SUCCESS) {
        return `已为平台"${resultItem.platformName}"更新技能"${resultItem.skillName}"。`
      }

      return `为平台"${resultItem.platformName}"更新技能"${resultItem.skillName}"失败：${resultItem.error.message}`
    })
  }

  /**
   * 解析参数、加载远端清单并更新已安装的技能到指定平台。
   *
   * @param commandOptions - Commander 解析后的命令选项。
   */
  public async execute(commandOptions: UpdateCommandOptions): Promise<void> {
    await this.manifestConfig.loadData()

    const selectedPlatformNameList = await this.buildSelectedPlatformNameList(
      this.platformConfig.getPlatformNameList(),
      commandOptions.platformNameList,
    )

    const selectedPlatformList = buildSelectedPlatformList(
      this.platformConfig.getPlatformList(),
      selectedPlatformNameList,
    )

    if (selectedPlatformList.length === 0) {
      renderSummaryDisplay("提示", ["所选平台都没有可用的 skills 目录。"])
      return
    }

    const comparisonRowList = await buildComparisonRows(this.manifestConfig.getSkillList(), selectedPlatformList)
    const updateRowList = buildUpdateRows(comparisonRowList)

    if (updateRowList.length === 0) {
      renderSummaryDisplay("提示", ["当前没有可用的更新。"])
      return
    }

    const selectedSkillNameList = await this.buildSelectedSkillNameList(
      buildUpdateSkillNameList(updateRowList),
      commandOptions.skillNameList,
    )

    const requestedSkillList = buildSelectedSkillList(this.manifestConfig.getSkillList(), selectedSkillNameList)
    const selectedRowList = buildSelectedRows(updateRowList, selectedSkillNameList)

    if (selectedRowList.length === 0) {
      renderSummaryDisplay("提示", ["所选技能当前没有可用更新。"])
      return
    }

    const selectedRowSkillNameList = buildUpdateSkillNameList(selectedRowList)
    const selectedSkillNameSet = new Set(selectedRowSkillNameList)
    const selectedSkillList = requestedSkillList.filter(
      requestedSkill => selectedSkillNameSet.has(requestedSkill.skillName),
    )

    if (selectedSkillList.length === 0) {
      renderSummaryDisplay("提示", ["所选技能当前没有可用更新。"])
      return
    }

    const skippedSkillNameList = requestedSkillList
      .filter(requestedSkill => !selectedSkillNameSet.has(requestedSkill.skillName))
      .map(requestedSkill => requestedSkill.skillName)
    const skippedMessageList = skippedSkillNameList.map(
      skippedSkillName => `已跳过技能"${skippedSkillName}"，因为它当前没有可用更新。`,
    )

    const repositoryDirectoryPath = await getRepositoryDirectoryPath()

    try {
      const updateResultList = await this.batchUpdateSkillListToPlatformList(
        selectedRowList,
        selectedSkillList,
        selectedPlatformList,
        repositoryDirectoryPath,
      )

      const summaryMessageList = this.buildUpdateSummaryMessageList(updateResultList)

      renderSummaryDisplay("更新完成", [...skippedMessageList, ...summaryMessageList])
    }
    finally {
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

        throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
          params: { directoryPath: repositoryDirectoryPath },
        })
      }
    }
  }

  /**
   * 把当前命令注册到 Commander 程序对象。
   *
   * @param program - Commander 程序对象。
   */
  public register(program: Command): void {
    const updateCommand = program.command(this.command).description(this.description)

    this.optionList.forEach((optionDefinition) => {
      updateCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    updateCommand.action(async (rawOptions: RawUpdateCommandOptions) => {
      const platformNameList = parsePlatformNameList(rawOptions.platform)
      const skillNameList = parseSkillNameList(rawOptions.skill)

      const commandOptions: UpdateCommandOptions = {
        platformNameList,
        skillNameList,
      }

      await this.execute(commandOptions)
    })
  }
}

export { UpdateCommand }
