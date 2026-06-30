import inquirer from "inquirer"

import { executePrompt } from "@/tools/terminal"

/**
 * 通过 inquirer 让用户从技能清单条目里勾选要安装的技能。
 *
 * @param skillList - 可供勾选的技能清单条目列表。
 * @returns 用户勾选后的技能名称列表。
 * @throws 非交互终端或用户取消时抛出对应的业务错误。
 *
 * @example
 * ```typescript
 * promptSkillNameList(skillManifestEntryList) // Promise<["yeizi-demo", "yeizi-rules"]>
 * ```
 */
async function promptSkillNameList(skillNameList: string[]): Promise<string[]> {
  const answers = await executePrompt(async () => inquirer.prompt<{ skillList: string[] }>([
    {
      type: "checkbox",
      name: "skillList",
      message: "请选择要安装的技能。",
      choices: [...skillNameList],
      validate: async (selectedSkillList: string[]) => {
        if (selectedSkillList.length > 0) {
          return true
        }

        return "请至少选择一个技能。"
      },
    },
  ]))

  return answers.skillList
}

/**
 * 通过 inquirer 让用户从已有技能名称里勾选要更新的技能。
 *
 * @param skillNameList - 已有技能名称列表。
 * @returns 用户勾选后的技能名称列表。
 * @throws 非交互终端或用户取消时抛出对应的业务错误。
 *
 * @example
 * ```typescript
 * promptSkillNameListToUpdate(["yeizi-demo"]) // Promise<["yeizi-demo"]>
 * ```
 */
async function promptSkillNameListToUpdate(skillNameList: string[]): Promise<string[]> {
  const answers = await executePrompt(async () => inquirer.prompt<{ skillList: string[] }>([
    {
      type: "checkbox",
      name: "skillList",
      message: "请选择要更新的技能。",
      choices: [...skillNameList],
      validate: async (selectedSkillList: string[]) => {
        if (selectedSkillList.length > 0) {
          return true
        }

        return "请至少选择一个技能。"
      },
    },
  ]))

  return answers.skillList
}

export { promptSkillNameList, promptSkillNameListToUpdate }
