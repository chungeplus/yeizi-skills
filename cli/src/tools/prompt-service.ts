import type { SupportedPlatformName } from "@/types/platform"
import type { ISkillIndexEntry } from "@/types/skill"

import process from "node:process"

import inquirer from "inquirer"

import { AppError, AppErrorCode } from "@/errors"

/**
 * 交互式提示服务。
 */
export class PromptService {
  /**
   * 当前终端是否支持交互提示。
   */
  public isInteractiveTerminal(): boolean {
    return process.stdin.isTTY === true && process.stdout.isTTY === true
  }

  /**
   * 让用户选择平台。
   *
   * @param platformNames - 可选平台名称列表。
   * @returns 用户选中的平台名称列表。
   * @example selectPlatforms(["codex", "claude"]) => Promise<["codex"]>
   */
  public async selectPlatforms(
    platformNames: readonly SupportedPlatformName[],
  ): Promise<SupportedPlatformName[]> {
    const answers = await this.runPrompt(async () => inquirer.prompt<{ platformNames: SupportedPlatformName[] }>([
      {
        type: "checkbox",
        name: "platformNames",
        message: "请选择平台。",
        choices: [...platformNames],
        validate: async (selectedPlatformNames: SupportedPlatformName[]) => {
          if (selectedPlatformNames.length > 0) {
            return true
          }

          return "请至少选择一个平台。"
        },
      },
    ]))

    return answers.platformNames
  }

  /**
   * 让用户选择要安装的技能。
   *
   * @param skillIndexEntries - 可选技能索引条目列表。
   * @returns 用户选中的技能名称列表。
   * @example selectSkills([{ name: "yeizi-demo", version: "1.0.0" }]) => Promise<["yeizi-demo"]>
   */
  public async selectSkills(skillIndexEntries: readonly ISkillIndexEntry[]): Promise<string[]> {
    const answers = await this.runPrompt(async () => inquirer.prompt<{ skillNames: string[] }>([
      {
        type: "checkbox",
        name: "skillNames",
        message: "请选择要安装的技能。",
        choices: skillIndexEntries.map(skillIndexEntry => skillIndexEntry.name),
        validate: async (selectedSkillNames: string[]) => {
          if (selectedSkillNames.length > 0) {
            return true
          }

          return "请至少选择一个技能。"
        },
      },
    ]))

    return answers.skillNames
  }

  /**
   * 让用户选择要更新的技能。
   *
   * @param skillNames - 可更新的技能名称列表。
   * @returns 用户选中的技能名称列表。
   * @example selectSkillsToUpdate(["yeizi-demo"]) => Promise<["yeizi-demo"]>
   */
  public async selectSkillsToUpdate(skillNames: readonly string[]): Promise<string[]> {
    const answers = await this.runPrompt(async () => inquirer.prompt<{ skillNames: string[] }>([
      {
        type: "checkbox",
        name: "skillNames",
        message: "请选择要更新的技能。",
        choices: [...skillNames],
        validate: async (selectedSkillNames: string[]) => {
          if (selectedSkillNames.length > 0) {
            return true
          }

          return "请至少选择一个技能。"
        },
      },
    ]))

    return answers.skillNames
  }

  /**
   * 统一执行交互式提示，并把终端环境或取消行为映射成业务错误。
   */
  private async runPrompt<TAnswers>(promptRunner: () => Promise<TAnswers>): Promise<TAnswers> {
    if (!this.isInteractiveTerminal()) {
      throw new AppError(
        AppErrorCode.PROMPT_UNAVAILABLE,
        "交互不可用",
        "当前环境不支持交互提示，请显式传入命令所需参数后重试。",
      )
    }

    try {
      return await promptRunner()
    }
    catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        throw new AppError(
          AppErrorCode.PROMPT_CANCELLED,
          "已取消操作",
          "已取消本次操作。",
          { cause: error },
        )
      }

      throw error
    }
  }
}
