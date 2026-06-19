import type { Command } from "commander"
import type { IListCommandOptions } from "./types"
import type { ICommand, ICommandOptionDefinition } from "@/types"

import { homedir } from "node:os"
import process from "node:process"

import { AppError, AppErrorCode } from "@/errors"
import { buildPlatformTargets, parsePlatforms } from "@/features/platform"
import { buildComparisonRows } from "@/features/skill"
import { GitHubSkillSource } from "@/features/source"
import { isInteractiveTerminal, OutputFormatter, selectPlatforms } from "@/tools"
import { SupportedPlatform } from "@/types"

/**
 * 创建 list 命令。
 *
 * @returns list 命令对象。
 */
function createListCommand(): ICommand<IListCommandOptions> {
  const command = "list"
  const description = "查看技能列表。"
  const options: readonly ICommandOptionDefinition[] = [
    {
      flags: "--platform <platforms>",
      description: "逗号分隔的平台列表。",
    },
  ]
  const gitHubSkillSource = new GitHubSkillSource()
  const outputFormatter = new OutputFormatter()

  async function execute(commandOptions: IListCommandOptions): Promise<void> {
    const interactiveTerminal = isInteractiveTerminal()
    const requestedPlatformNames = parsePlatforms(commandOptions.platform)
    let selectedPlatformNames = requestedPlatformNames

    if (selectedPlatformNames.length === 0) {
      if (!interactiveTerminal) {
        throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
          params: {
            optionName: "--platform",
            actionName: "查看",
            targetName: "平台",
          },
        })
      }

      selectedPlatformNames = await selectPlatforms(Object.values(SupportedPlatform))
    }

    const skillIndex = await gitHubSkillSource.loadSkillIndex()
    const platformTargets = buildPlatformTargets(homedir(), selectedPlatformNames)
    const comparisonRows = buildComparisonRows(skillIndex.skills, platformTargets)

    process.stdout.write(`${outputFormatter.renderComparisonTable(comparisonRows)}\n`)
  }

  function register(program: Command): void {
    const listCommand = program.command(command).description(description)

    options.forEach((optionDefinition) => {
      listCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    listCommand.action(async (commandOptions: IListCommandOptions) => {
      await execute(commandOptions)
    })
  }

  return {
    command,
    description,
    options,
    execute,
    register,
  }
}

export { createListCommand }
