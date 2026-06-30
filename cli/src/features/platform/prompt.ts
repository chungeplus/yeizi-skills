import type { PlatformName } from "@/types/platform"

import inquirer from "inquirer"

import { executePrompt } from "@/tools/terminal"

/**
 * 通过 inquirer 让用户从可选平台里勾选一个或多个平台。
 *
 * @param availablePlatformNameList - 可供勾选的平台名称列表。
 * @returns 用户勾选后的平台列表。
 * @throws 非交互终端或用户取消时抛出对应的业务错误。
 *
 * @example
 * ```typescript
 * promptPlatformNameList(["codex", "claude"]) // Promise<["claude"]>
 * ```
 */
async function promptPlatformNameList(availablePlatformNameList: PlatformName[]): Promise<PlatformName[]> {
  const answers = await executePrompt(async () => inquirer.prompt<{ platformList: PlatformName[] }>([
    {
      type: "checkbox",
      name: "platformList",
      message: "请选择平台。",
      choices: [...availablePlatformNameList],
      validate: async (selectedPlatformList: PlatformName[]) => {
        if (selectedPlatformList.length > 0) {
          return true
        }

        return "请至少选择一个平台。"
      },
    },
  ]))

  return answers.platformList
}

export { promptPlatformNameList }
