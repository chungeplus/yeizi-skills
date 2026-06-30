import type { Command } from "commander"
import type { BaseCommand, CommandOptionDefinition } from "@/types/command"

import type { InstallCommandOptions, RawInstallCommandOptions } from "@/types/command/install"
import type { PlatformItem, PlatformName } from "@/types/platform"
import type { SkillInstallResult, SkillItem } from "@/types/skill"
import { AppError, AppErrorCode } from "@/error"
import { renderSummaryDisplay } from "@/features/display"
import { getRepositoryDirectoryPath } from "@/features/github"
import { buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList } from "@/features/platform"
import { buildSelectedSkillList, copySkillItemToPlatformItem, ManifestConfigService, parseSkillNameList, promptSkillNameList } from "@/features/skill"
import { removeDirectory } from "@/tools/filesystem"
import { SkillInstallStatus } from "@/types/skill"

/**
 * install 命令。
 */
class InstallCommand implements BaseCommand<InstallCommandOptions> {
  /**
   * Commander 命令名。
   */
  public readonly command = "install"

  /**
   * 展示在帮助信息中的命令说明。
   */
  public readonly description = "安装技能。"

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
   * 构建选中的技能名称列表。
   * 若命令行有值则直接使用，无值则提示用户选择。
   *
   * @param availableSkillNameList - 可用的技能清单名称列表。
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
    availableSkillNameList: string[],
    inputSkillNameList: string[],
  ): Promise<string[]> {
    let selectedSkillNameList: string[]

    if (inputSkillNameList.length > 0) {
      selectedSkillNameList = inputSkillNameList
    }
    else {
      selectedSkillNameList = await promptSkillNameList(availableSkillNameList)
    }

    return selectedSkillNameList
  }

  /**
   * 构建选中的平台名称列表。
   * 若命令行有值则直接使用，无值则提示用户选择。
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
   * 把选中的技能批量安装到选中的平台，按技能 × 平台展开。
   *
   * @param skillList - 选中的技能清单条目。
   * @param platformList - 选中的平台目录列表。
   * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
   * @returns 每个技能在每个平台上的安装结果列表。
   *
   * @example
   * ```typescript
   * await this.batchInstallSkillListToPlatformList(
   *   [{ skillName: "brainstorming", ... }],
   *   [{ platformName: "claude-code", ... }],
   *   "/tmp/yeizi-skills-repo-abc",
   * )
   * // [{ skillName: "brainstorming", platformName: "claude-code", status: "success" }]
   * ```
   */
  private async batchInstallSkillListToPlatformList(
    skillList: SkillItem[],
    platformList: PlatformItem[],
    repositoryDirectoryPath: string,
  ): Promise<SkillInstallResult[]> {
    const resultList: SkillInstallResult[] = []

    for (const skillItem of skillList) {
      for (const platformItem of platformList) {
        const resultItem = await copySkillItemToPlatformItem(
          skillItem,
          platformItem,
          repositoryDirectoryPath,
        )

        resultList.push(resultItem)
      }
    }

    return resultList
  }

  /**
   * 把批量安装结果转换成展示用的中文汇总消息列表。
   *
   * @param resultList - 批量安装结果列表。
   * @returns 中文汇总消息列表，顺序与 `resultList` 一致。
   *
   * @example
   * ```typescript
   * this.buildInstallSummaryMessageList([
   *   { status: SkillInstallStatus.SUCCESS, skillName: "brainstorming", platformName: "claude-code" },
   * ])
   * // ['已为平台"claude-code"安装技能"brainstorming"。']
   * ```
   *
   * @example
   * ```typescript
   * this.buildInstallSummaryMessageList([
   *   { status: SkillInstallStatus.FAILED, skillName: "x", platformName: "y", error: new Error("没有权限") },
   * ])
   * // ['为平台"y"安装技能"x"失败：没有权限']
   * ```
   */
  private buildInstallSummaryMessageList(resultList: SkillInstallResult[]): string[] {
    return resultList.map((resultItem) => {
      if (resultItem.status === SkillInstallStatus.SUCCESS) {
        return `已为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"。`
      }

      return `为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"失败：${resultItem.error.message}`
    })
  }

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
    }
  }

  /**
   * 解析参数、加载远端清单并安装选中的技能到指定平台。
   *
   * @param commandOptions - 命令选项。
   */
  public async execute(commandOptions: InstallCommandOptions): Promise<void> {
    await this.manifestConfig.loadData()

    const selectedSkillNameList = await this.buildSelectedSkillNameList(
      this.manifestConfig.getSkillNameList(),
      commandOptions.skillNameList,
    )

    const selectedPlatformNameList = await this.buildSelectedPlatformNameList(
      this.platformConfig.getPlatformNameList(),
      commandOptions.platformNameList,
    )

    const selectedSkillList = buildSelectedSkillList(
      this.manifestConfig.getSkillList(),
      selectedSkillNameList,
    )
    const selectedPlatformList = buildSelectedPlatformList(
      this.platformConfig.getPlatformList(),
      selectedPlatformNameList,
    )

    const repositoryDirectoryPath = await getRepositoryDirectoryPath()

    const installResultList = await this.batchInstallSkillListToPlatformList(
      selectedSkillList,
      selectedPlatformList,
      repositoryDirectoryPath,
    )

    try {
      await this.removeRepositoryDirectory(repositoryDirectoryPath)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
          params: { directoryPath: repositoryDirectoryPath },
          cause: error,
        })
      }
    }

    const summaryMessageList = this.buildInstallSummaryMessageList(installResultList)

    renderSummaryDisplay("安装完成", summaryMessageList)
  }

  /**
   * 把当前命令注册到 Commander 程序对象。
   *
   * @param program - Commander 程序对象。
   */
  public register(program: Command): void {
    const installCommand = program.command(this.command).description(this.description)

    this.optionList.forEach((optionDefinition) => {
      installCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    installCommand.action(async (rawOptions: RawInstallCommandOptions) => {
      const platformNameList = parsePlatformNameList(rawOptions.platform)
      const skillNameList = parseSkillNameList(rawOptions.skill)

      const commandOptions: InstallCommandOptions = {
        platformNameList,
        skillNameList,
      }

      await this.execute(commandOptions)
    })
  }
}

export { InstallCommand }
