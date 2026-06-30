import type { Command } from "commander"
import type { BaseCommand, CommandOptionDefinition } from "@/types/command"
import type { InstallCommandOptions, RawInstallCommandOptions } from "@/types/command/install"
import type { PlatformItem, PlatformName } from "@/types/platform"
import type { SkillEntry, SkillInstallResult } from "@/types/skill"

import { AppError, AppErrorCode } from "@/error"
import { renderSummaryDisplay } from "@/features/display"
import { getRepositoryDirectoryPath, scanSkillEntryList } from "@/features/github"
import { buildSelectedPlatformList, parsePlatformNameList, PlatformConfigService, promptPlatformNameList } from "@/features/platform"
import { buildSelectedSkillList, copySkillEntryToPlatformItem, parseSkillNameList, promptSkillNameList } from "@/features/skill"
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
   * 构建选中的技能名称列表。
   * 命令行有值时直接沿用，无值时通过交互提示从远端候选条目中选择。
   *
   * @param remoteSkillEntryList - 远端扫描到的技能条目列表，用于交互式提示展示。
   * @param inputSkillNameList - 命令行传入的技能名称列表。
   * @returns 选中的技能名称列表。
   *
   * @example
   * ```typescript
   * await this.buildSelectedSkillNameList(
   *   [{ name: "yeizi-demo", description: "示例技能" }],
   *   ["yeizi-demo"],
   * ) // ["yeizi-demo"]
   * ```
   *
   * @example
   * ```typescript
   * await this.buildSelectedSkillNameList(
   *   [{ name: "yeizi-demo", description: "示例技能" }],
   *   [],
   * ) // 弹出多选提示，返回用户选择
   * ```
   */
  private async buildSelectedSkillNameList(
    remoteSkillEntryList: SkillEntry[],
    inputSkillNameList: string[],
  ): Promise<string[]> {
    if (inputSkillNameList.length > 0) {
      return inputSkillNameList
    }

    return promptSkillNameList(remoteSkillEntryList)
  }

  /**
   * 把选中的技能批量安装到选中的平台，按技能 × 平台展开。
   *
   * @param skillEntryList - 选中的技能条目列表。
   * @param platformList - 选中的平台目录列表。
   * @param repositoryDirectoryPath - 已下载的仓库根目录路径。
   * @returns 每个技能在每个平台上的安装结果列表。
   *
   * @example
   * ```typescript
   * await this.batchInstallSkillEntryListToPlatformList(
   *   [{ name: "yeizi-demo", description: "示例技能" }],
   *   [{ platformName: "claude-code", platformHomeDirectoryPath: "/Users/demo/.claude", platformSkillDirectoryPath: "/Users/demo/.claude/skills" }],
   *   "/tmp/yeizi-skills-repo-abc",
   * )
   * // [{ platformName: "claude-code", skillName: "yeizi-demo", status: "success" }]
   * ```
   */
  private async batchInstallSkillEntryListToPlatformList(
    skillEntryList: SkillEntry[],
    platformList: PlatformItem[],
    repositoryDirectoryPath: string,
  ): Promise<SkillInstallResult[]> {
    const resultList: SkillInstallResult[] = []

    for (const skillEntryItem of skillEntryList) {
      for (const platformItem of platformList) {
        const resultItem = await copySkillEntryToPlatformItem(
          skillEntryItem,
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
   *   { status: SkillInstallStatus.SUCCESS, skillName: "yeizi-demo", platformName: "claude-code" },
   * ])
   * // ['已为平台"claude-code"安装技能"yeizi-demo"。']
   * ```
   *
   * @example
   * ```typescript
   * this.buildInstallSummaryMessageList([
   *   { status: SkillInstallStatus.NO_CHANGE, skillName: "yeizi-demo", platformName: "claude-code" },
   * ])
   * // ['平台"claude-code"上的技能"yeizi-demo"无变化、已跳过。']
   * ```
   */
  private buildInstallSummaryMessageList(resultList: SkillInstallResult[]): string[] {
    return resultList.map((resultItem) => {
      if (resultItem.status === SkillInstallStatus.SUCCESS) {
        return `已为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"。`
      }

      if (resultItem.status === SkillInstallStatus.NO_CHANGE) {
        return `平台"${resultItem.platformName}"上的技能"${resultItem.skillName}"无变化、已跳过。`
      }

      return `为平台"${resultItem.platformName}"安装技能"${resultItem.skillName}"失败：${resultItem.error.message}`
    })
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
   * 解析参数、拉取远端仓库快照、扫描候选技能并将选中的技能安装到指定平台。
   *
   * 流程顺序：
   * 1. 解析选中平台并校验。
   * 2. 拉取远端仓库到临时目录。
   * 3. 扫描候选技能、收集用户选择、批量安装。
   * 4. 渲染汇总展示。
   * 5. 无论成功或失败，最终清理临时目录。
   *
   * @param commandOptions - 命令选项。
   */
  public async execute(commandOptions: InstallCommandOptions): Promise<void> {
    const selectedPlatformNameList = await this.buildSelectedPlatformNameList(
      this.platformConfig.getPlatformNameList(),
      commandOptions.platformNameList,
    )
    const selectedPlatformList = buildSelectedPlatformList(
      this.platformConfig.getPlatformList(),
      selectedPlatformNameList,
    )

    const repositoryDirectoryPath = await getRepositoryDirectoryPath()

    try {
      const remoteSkillEntryList = await scanSkillEntryList(repositoryDirectoryPath)
      const selectedSkillNameList = await this.buildSelectedSkillNameList(
        remoteSkillEntryList,
        commandOptions.skillNameList,
      )
      const selectedSkillEntryList = buildSelectedSkillList(
        remoteSkillEntryList,
        selectedSkillNameList,
      )

      const installResultList = await this.batchInstallSkillEntryListToPlatformList(
        selectedSkillEntryList,
        selectedPlatformList,
        repositoryDirectoryPath,
      )
      const summaryMessageList = this.buildInstallSummaryMessageList(installResultList)

      renderSummaryDisplay("安装完成", summaryMessageList)
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
