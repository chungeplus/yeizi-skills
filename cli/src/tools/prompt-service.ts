import type { SupportedPlatformName } from "@/types/platform"
import type { ISkillIndexEntry } from "@/types/skill"

import process from "node:process"

import inquirer from "inquirer"

import { AppError, AppErrorCode } from "@/errors"

function isInteractiveTerminal(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true
}

async function selectPlatforms(
  platformNames: readonly SupportedPlatformName[],
): Promise<SupportedPlatformName[]> {
  const answers = await runPrompt(async () => inquirer.prompt<{ platformNames: SupportedPlatformName[] }>([
    {
      type: "checkbox",
      name: "platformNames",
      message: "\u8BF7\u9009\u62E9\u5E73\u53F0\u3002",
      choices: [...platformNames],
      validate: async (selectedPlatformNames: SupportedPlatformName[]) => {
        if (selectedPlatformNames.length > 0) {
          return true
        }

        return "\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5E73\u53F0\u3002"
      },
    },
  ]))

  return answers.platformNames
}

async function selectSkills(skillIndexEntries: readonly ISkillIndexEntry[]): Promise<string[]> {
  const answers = await runPrompt(async () => inquirer.prompt<{ skillNames: string[] }>([
    {
      type: "checkbox",
      name: "skillNames",
      message: "\u8BF7\u9009\u62E9\u8981\u5B89\u88C5\u7684\u6280\u80FD\u3002",
      choices: skillIndexEntries.map(skillIndexEntry => skillIndexEntry.name),
      validate: async (selectedSkillNames: string[]) => {
        if (selectedSkillNames.length > 0) {
          return true
        }

        return "\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u6280\u80FD\u3002"
      },
    },
  ]))

  return answers.skillNames
}

async function selectSkillsToUpdate(skillNames: readonly string[]): Promise<string[]> {
  const answers = await runPrompt(async () => inquirer.prompt<{ skillNames: string[] }>([
    {
      type: "checkbox",
      name: "skillNames",
      message: "\u8BF7\u9009\u62E9\u8981\u66F4\u65B0\u7684\u6280\u80FD\u3002",
      choices: [...skillNames],
      validate: async (selectedSkillNames: string[]) => {
        if (selectedSkillNames.length > 0) {
          return true
        }

        return "\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u6280\u80FD\u3002"
      },
    },
  ]))

  return answers.skillNames
}

async function runPrompt<TAnswers>(promptRunner: () => Promise<TAnswers>): Promise<TAnswers> {
  if (!isInteractiveTerminal()) {
    throw new AppError(AppErrorCode.PROMPT_UNAVAILABLE)
  }

  try {
    return await promptRunner()
  }
  catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      throw new AppError(AppErrorCode.PROMPT_CANCELLED, { cause: error })
    }

    throw error
  }
}

export {
  isInteractiveTerminal,
  selectPlatforms,
  selectSkills,
  selectSkillsToUpdate,
}
