import type { SkillItem, SkillName } from "@/types/skill"

import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import matter from "gray-matter"

import { AppError, AppErrorCode } from "@/error"
import { RemoteRepositoryService } from "@/features/repository"
import { skillEntryFileObjectSchema } from "@/schemas/skill/entry-file-data"

const SKILL_ENTRY_FILE_NAME = "SKILL.md"

class SkillContentService {
  private static remoteSkillList: SkillItem[] | undefined

  private static initSkillContentPromise: Promise<[void]> | undefined

  public static async initSkillContent(): Promise<[void]> {
    if (SkillContentService.initSkillContentPromise === undefined) {
      SkillContentService.initSkillContentPromise = Promise.all([
        SkillContentService.createLoadRemoteSkillListPromise(),
      ])
    }

    return SkillContentService.initSkillContentPromise
  }

  private static async createLoadRemoteSkillListPromise(): Promise<void> {
    const remoteSkillList = await SkillContentService.loadRemoteSkillList()
    SkillContentService.remoteSkillList = remoteSkillList
  }

  private static async loadRemoteSkillList(): Promise<SkillItem[]> {
    const remoteSkillDirectoryPath = await RemoteRepositoryService.getLocalRepositorySkillDirectoryPath()
    const remoteSkillDirectoryEntryList = await readdir(remoteSkillDirectoryPath, { withFileTypes: true })

    const remoteSkillList: SkillItem[] = await Promise.all(
      remoteSkillDirectoryEntryList.map(async (remoteSkillDirectoryEntryItem) => {
        const skillEntryFilePath = join(remoteSkillDirectoryPath, remoteSkillDirectoryEntryItem.name, SKILL_ENTRY_FILE_NAME)
        const rawSkillEntryFileText = await readFile(skillEntryFilePath, "utf-8")
        const rawSkillEntryFileObject = skillEntryFileObjectSchema.parse(matter(rawSkillEntryFileText).data)
        return {
          skillName: rawSkillEntryFileObject.name,
          skillDescription: rawSkillEntryFileObject.description,
        }
      }),
    )

    remoteSkillList.sort((leftSkillItem, rightSkillItem) =>
      leftSkillItem.skillName.localeCompare(rightSkillItem.skillName),
    )

    return remoteSkillList
  }

  public static async validateSkillNameListExistInSkillList(skillNameList: SkillName[]): Promise<void> {
    await SkillContentService.initSkillContent()

    const notExistSkillNameList = skillNameList.filter(skillName =>
      !SkillContentService.remoteSkillList!.some(skillItem => skillItem.skillName === skillName),
    )

    if (notExistSkillNameList.length > 0) {
      throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
        params: { skillNameList: notExistSkillNameList },
      })
    }
  }

  public static async getRemoteSkillList(): Promise<SkillItem[]> {
    await SkillContentService.initSkillContent()

    return SkillContentService.remoteSkillList!
  }
}

export { SkillContentService }
