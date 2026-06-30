import type { SkillEntry } from "@/types/skill"

import inquirer from "inquirer"

import { executePrompt } from "@/tools/terminal"

/**
 * 通过 inquirer 让用户从远端技能条目里勾选要安装的技能。
 *
 * 每个 choice 的展示形态：
 * - 有 description 时：`<name>\n    └ <description>`
 * - description 为空时：仅展示 name，不带换行。
 *
 * @param skillEntryList - 远端技能条目列表。
 * @returns 用户勾选后的技能名称列表。
 * @throws 非交互终端或用户取消时抛出对应的业务错误。
 *
 * @example
 * ```typescript
 * promptSkillNameList([
 *   { name: "yeizi-demo", description: "示例技能" },
 * ]) // Promise<["yeizi-demo"]>
 * ```
 */
async function promptSkillNameList(skillEntryList: SkillEntry[]): Promise<string[]> {
  const choiceList = skillEntryList.map((skillEntryItem) => {
    let choiceName = skillEntryItem.name
    if (skillEntryItem.description.length > 0) {
      choiceName = `${skillEntryItem.name}\n    └ ${skillEntryItem.description}`
    }

    return {
      name: choiceName,
      value: skillEntryItem.name,
      short: skillEntryItem.name,
    }
  })

  const answers = await executePrompt(async () => inquirer.prompt<{ skillList: string[] }>([
    {
      type: "checkbox",
      name: "skillList",
      message: "请选择要安装的技能。",
      choices: choiceList,
      validate: async (selectedSkillList: string[]) => {
        if (selectedSkillList.length === 0) {
          return "请至少选择一个技能。"
        }

        return true
      },
    },
  ]))

  return answers.skillList
}

export { promptSkillNameList }
