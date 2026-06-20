import type { Command } from "commander"
import type { IInstallCommandOptions } from "./types"
import type {
  ICommand,
  ICommandOptionDefinition,
  IDownloadedSkillFile,
  IPlatformTarget,
  ISkillIndexEntry,
  SupportedPlatformName,
} from "@/types"

import { homedir } from "node:os"
import process from "node:process"

import { AppError, AppErrorCode } from "@/errors"
import { buildPlatformTargets, parsePlatforms } from "@/features/platform"
import { buildSelectedSkillEntries, parseSkillNames, SkillInstaller } from "@/features/skill"
import { GitHubSkillSource } from "@/features/source"
import { isInteractiveTerminal, OutputFormatter, selectPlatforms, selectSkills } from "@/tools"
import { SupportedPlatform } from "@/types"

async function installSkillsSequentially(
  platformTarget: IPlatformTarget,
  selectedSkillEntries: readonly ISkillIndexEntry[],
  loadedSkillFilesByName: ReadonlyMap<string, readonly IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessages: string[],
  skillIndex = 0,
): Promise<void> {
  const skillIndexEntry = selectedSkillEntries[skillIndex]

  if (skillIndexEntry === undefined) {
    return
  }

  const loadedSkillFiles = loadedSkillFilesByName.get(skillIndexEntry.name)

  if (loadedSkillFiles === undefined) {
    throw new AppError(AppErrorCode.SKILL_FILES_NOT_LOADED, {
      params: { skillName: skillIndexEntry.name },
    })
  }

  await skillInstaller.updateSkillDirectory(
    platformTarget.skillsDirectoryPath,
    skillIndexEntry,
    loadedSkillFiles,
  )
  summaryMessages.push(`已为平台“${platformTarget.platformName}”安装技能“${skillIndexEntry.name}”。`)

  await installSkillsSequentially(
    platformTarget,
    selectedSkillEntries,
    loadedSkillFilesByName,
    skillInstaller,
    summaryMessages,
    skillIndex + 1,
  )
}

async function installToPlatformsSequentially(
  platformTargets: readonly IPlatformTarget[],
  selectedSkillEntries: readonly ISkillIndexEntry[],
  loadedSkillFilesByName: ReadonlyMap<string, readonly IDownloadedSkillFile[]>,
  skillInstaller: SkillInstaller,
  summaryMessages: string[],
  platformIndex = 0,
): Promise<void> {
  const platformTarget = platformTargets[platformIndex]

  if (platformTarget === undefined) {
    return
  }

  if (!platformTarget.hasSkillsDirectory) {
    summaryMessages.push(`已跳过平台“${platformTarget.platformName}”，因为它的 skills 目录不存在。`)
  }
  else {
    await installSkillsSequentially(
      platformTarget,
      selectedSkillEntries,
      loadedSkillFilesByName,
      skillInstaller,
      summaryMessages,
    )
  }

  await installToPlatformsSequentially(
    platformTargets,
    selectedSkillEntries,
    loadedSkillFilesByName,
    skillInstaller,
    summaryMessages,
    platformIndex + 1,
  )
}

/**
 * 创建 install 命令。
 *
 * @returns install 命令对象。
 */
function createInstallCommand(): ICommand<IInstallCommandOptions> {
  const command = "install"
  const description = "安装技能。"
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
  const gitHubSkillSource = new GitHubSkillSource()
  const skillInstaller = new SkillInstaller()
  const outputFormatter = new OutputFormatter()

  async function execute(commandOptions: IInstallCommandOptions): Promise<void> {
    const interactiveTerminal = isInteractiveTerminal()
    let selectedPlatformNames: SupportedPlatformName[] = []

    if (commandOptions.platform !== undefined) {
      const requestedPlatformNames = parsePlatforms(commandOptions.platform)

      selectedPlatformNames = requestedPlatformNames
    }

    if (selectedPlatformNames.length === 0) {
      if (!interactiveTerminal) {
        throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
          params: {
            optionName: "--platform",
            actionName: "安装",
            targetName: "平台",
          },
        })
      }

      selectedPlatformNames = await selectPlatforms(Object.values(SupportedPlatform))
    }

    const requestedSkillNames = parseSkillNames(commandOptions.skill)
    let selectedSkillNames = requestedSkillNames
    let skillIndex

    if (selectedSkillNames.length === 0) {
      if (!interactiveTerminal) {
        throw new AppError(AppErrorCode.NON_INTERACTIVE_OPTION_REQUIRED, {
          params: {
            optionName: "--skill",
            actionName: "安装",
            targetName: "技能",
          },
        })
      }

      skillIndex = await gitHubSkillSource.loadSkillIndex()
      selectedSkillNames = await selectSkills(skillIndex.skills)
    }

    const platformTargets = buildPlatformTargets(homedir(), selectedPlatformNames)
    const resolvedSkillIndex = skillIndex ?? await gitHubSkillSource.loadSkillIndex()
    const selectedSkillEntries = buildSelectedSkillEntries(resolvedSkillIndex, selectedSkillNames)
    const loadedSkillFilesByName = new Map(
      await Promise.all(selectedSkillEntries.map(async (skillIndexEntry) => {
        const loadedSkillFiles = await gitHubSkillSource.loadSkillFiles(skillIndexEntry.name)

        await gitHubSkillSource.validateRemoteSkillVersion(skillIndexEntry, loadedSkillFiles)

        return [skillIndexEntry.name, loadedSkillFiles] as const
      })),
    )
    const summaryMessages: string[] = []

    await installToPlatformsSequentially(
      platformTargets,
      selectedSkillEntries,
      loadedSkillFilesByName,
      skillInstaller,
      summaryMessages,
    )

    process.stdout.write(`${outputFormatter.renderSummary(summaryMessages)}\n`)
  }

  function register(program: Command): void {
    const installCommand = program.command(command).description(description)

    options.forEach((optionDefinition) => {
      installCommand.option(optionDefinition.flags, optionDefinition.description)
    })

    installCommand.action(async (commandOptions: IInstallCommandOptions) => {
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

export { createInstallCommand }
