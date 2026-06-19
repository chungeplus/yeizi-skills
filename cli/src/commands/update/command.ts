import type { Command } from "commander"
import type { IUpdateCommandOptions } from "./types"
import type { ICommand, ICommandOptionDefinition } from "@/types"

import { homedir } from "node:os"
import process from "node:process"

import { AppError, AppErrorCode } from "@/errors"
import { PlatformResolver } from "@/features/platform"
import { buildSelectedSkillEntries, parseSkillNames, SkillComparator, SkillInstaller } from "@/features/skill"
import { GitHubSkillSource } from "@/features/source"
import { OutputFormatter, PromptService } from "@/tools"
import { SupportedPlatform } from "@/types"

/**
 * 创建 update 命令。
 *
 * @returns update 命令对象。
 */
export function createUpdateCommand(): ICommand<IUpdateCommandOptions> {
  const command = "update"
  const description = "更新已安装技能。"
  const options: readonly ICommandOptionDefinition[] = [
    {
      flags: "--platform <platforms>",
      description: "逗号分隔的平台列表。",
    },
    {
      flags: "--skill <skills>",
      description: "逗号分隔的技能列表。",
    },
  ]
  const platformResolver = new PlatformResolver()
  const gitHubSkillSource = new GitHubSkillSource()
  const skillComparator = new SkillComparator()
  const skillInstaller = new SkillInstaller()
  const promptService = new PromptService()
  const outputFormatter = new OutputFormatter()

  async function execute(commandOptions: IUpdateCommandOptions): Promise<void> {
    const isInteractiveTerminal = promptService.isInteractiveTerminal()
    const requestedPlatformNames = platformResolver.parsePlatforms(commandOptions.platform)
    let selectedPlatformNames = requestedPlatformNames

    if (selectedPlatformNames.length === 0) {
      if (!isInteractiveTerminal) {
        throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
          params: {
            optionName: "--platform",
            actionName: "更新",
            targetName: "平台",
          },
        })
      }

      selectedPlatformNames = await promptService.selectPlatforms(Object.values(SupportedPlatform))
    }

    const requestedSkillNames = parseSkillNames(commandOptions.skill)
    const platformTargets = platformResolver.buildPlatformTargets(homedir(), selectedPlatformNames)

    if (platformTargets.length > 0 && platformTargets.every(platformTarget => !platformTarget.hasSkillsDirectory)) {
      process.stdout.write(`${outputFormatter.renderSummary(["所选平台都没有可用的 skills 目录。"])}\n`)
      return
    }

    if (requestedSkillNames.length === 0 && !isInteractiveTerminal) {
      throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
        params: {
          optionName: "--skill",
          actionName: "更新",
          targetName: "技能",
        },
      })
    }

    const skillIndex = await gitHubSkillSource.loadSkillIndex()
    const comparisonRows = skillComparator.buildComparisonRows(skillIndex.skills, platformTargets)
    const updateRows = skillComparator.buildUpdateRows(comparisonRows)

    if (updateRows.length === 0) {
      process.stdout.write(`${outputFormatter.renderSummary(["当前没有可用的更新。"])}\n`)
      return
    }

    let selectedSkillNames = requestedSkillNames

    if (selectedSkillNames.length === 0) {
      selectedSkillNames = await promptService.selectSkillsToUpdate(
        skillComparator.buildUpdateSkillNames(updateRows),
      )
    }

    const requestedSkillEntries = buildSelectedSkillEntries(skillIndex, selectedSkillNames)
    const selectedRows = skillComparator.buildSelectedRows(updateRows, selectedSkillNames)

    if (selectedRows.length === 0) {
      process.stdout.write(`${outputFormatter.renderSummary(["所选技能当前没有可用更新。"])}\n`)
      return
    }

    const selectedRowSkillNames = skillComparator.buildUpdateSkillNames(selectedRows)
    const selectedSkillNameSet = new Set(selectedRowSkillNames)
    const selectedSkillEntries = requestedSkillEntries.filter(
      requestedSkillEntry => selectedSkillNameSet.has(requestedSkillEntry.name),
    )
    const loadedSkillFilesByName = new Map(
      await Promise.all(selectedSkillEntries.map(async (skillIndexEntry) => {
        const loadedSkillFiles = await gitHubSkillSource.loadSkillFiles(skillIndexEntry.name)

        await gitHubSkillSource.validateRemoteSkillVersion(skillIndexEntry, loadedSkillFiles)

        return [skillIndexEntry.name, loadedSkillFiles] as const
      })),
    )
    const skippedSkillNames = requestedSkillEntries
      .filter(requestedSkillEntry => !selectedSkillNameSet.has(requestedSkillEntry.name))
      .map(requestedSkillEntry => requestedSkillEntry.name)
    const summaryMessages = skippedSkillNames.map(
      skippedSkillName => `已跳过技能“${skippedSkillName}”，因为它当前没有可用更新。`,
    )

    for (const platformTarget of platformTargets) {
      if (!platformTarget.hasSkillsDirectory) {
        summaryMessages.push(`已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`)
        continue
      }

      const matchedRows = selectedRows.filter(
        selectedRow => selectedRow.platformName === platformTarget.platformName,
      )

      for (const matchedRow of matchedRows) {
        const matchedSkillEntry = selectedSkillEntries.find(
          skillIndexEntry => skillIndexEntry.name === matchedRow.skillName,
        )

        if (matchedSkillEntry === undefined) {
          throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
            params: { skillNames: [matchedRow.skillName] },
          })
        }

        const loadedSkillFiles = loadedSkillFilesByName.get(matchedSkillEntry.name)

        if (loadedSkillFiles === undefined) {
          throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
            params: { skillName: matchedSkillEntry.name },
          })
        }

        await skillInstaller.updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          matchedSkillEntry,
          loadedSkillFiles,
        )
        summaryMessages.push(`已为平台“${platformTarget.platformName}”更新技能“${matchedSkillEntry.name}”。`)
      }
    }

    process.stdout.write(`${outputFormatter.renderSummary(summaryMessages)}\n`)
  }

  function register(program: Command): void {
    const updateCommand = program.command(command).description(description)

    options.forEach((optionDefinition) => {
      updateCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    updateCommand.action(async (commandOptions: IUpdateCommandOptions) => {
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
