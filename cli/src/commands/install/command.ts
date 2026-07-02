import type { Command } from "commander"
import type { CommandOption } from "@/types/commands"
import type { InstallCommandOption, RawInstallCommandOption } from "@/types/commands/install"
import type { PlatformItem } from "@/types/platform"
import type { SkillItem, SkillName } from "@/types/skill"

import { renderSummaryDisplay } from "@/features/display"
import { buildPlatformList, PlatformContentService, promptPlatformNameList } from "@/features/platform"
import { RepositoryContentService } from "@/features/repository"
import { buildSelectedSkillList, copySkillListToPlatformList, parseSkillNameList, promptSkillNameList, SkillContentService } from "@/features/skill"

/**
 * install 命令。
 */
class InstallCommand {
  /**
   * Commander 命令名。
   */
  public readonly commandName = "install"

  /**
   * 展示在帮助信息中的命令说明。
   */
  public readonly commandDescription = "安装技能。"

  /**
   * 命令支持的选项定义列表。
   */
  public readonly commandOptionList: readonly CommandOption[] = [
    {
      commandOptionFlag: "--skill <skills>",
      commandOptionDescription: "逗号分隔的技能列表。",
    },
  ]

  /**
   * 解析参数、拉取远端仓库快照、扫描候选技能并将选中的技能安装到指定平台。
   *
   * @param installCommandOption - 解析后的安装选项。
   */
  public async execute(installCommandOption: InstallCommandOption): Promise<void> {
    await SkillContentService.initSkillContent()

    await RepositoryContentService.initRepositoryContent()

    await PlatformContentService.initPlatformContent()

    const inputSkillNameList = parseSkillNameList(installCommandOption.rawSkillNameText)

    await SkillContentService.validateSkillNameListExistInSkillList(inputSkillNameList)

    let selectedSkillNameList: SkillName[] = inputSkillNameList

    if (inputSkillNameList.length === 0) {
      selectedSkillNameList = await promptSkillNameList()
    }

    const selectedPlatformNameList = await promptPlatformNameList()

    const selectedPlatformList: PlatformItem[] = await buildPlatformList(selectedPlatformNameList)

    const selectedSkillList: SkillItem[] = buildSelectedSkillList(
      await SkillContentService.getRemoteSkillList(),
      selectedSkillNameList,
    )

    await copySkillListToPlatformList(selectedSkillList, selectedPlatformList)

    renderSummaryDisplay("安装完成", ["已安装完成。"])
  }

  /**
   * 把当前命令注册到 Commander 程序对象。
   *
   * @param program - Commander 程序对象。
   */
  public register(program: Command): void {
    const installCommand = program
      .command(this.commandName)
      .description(this.commandDescription)

    this.commandOptionList.forEach((commandOptionItem) => {
      installCommand.option(
        commandOptionItem.commandOptionFlag,
        commandOptionItem.commandOptionDescription,
      )
    })

    installCommand.action(async (rawCommandOption: RawInstallCommandOption) => {
      const commandOption: InstallCommandOption = {
        rawSkillNameText: rawCommandOption.skill,
      }

      await this.execute(commandOption)
    })
  }
}

export { InstallCommand }
