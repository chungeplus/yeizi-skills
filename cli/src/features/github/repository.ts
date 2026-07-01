import type { SkillEntry } from "@/types/skill"

import { existsSync } from "node:fs"
import { mkdtemp, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { downloadTemplate } from "giget"
import matter from "gray-matter"
import { z } from "zod"

import { repositoryConfig } from "@/config/repository"
import { AppError, AppErrorCode } from "@/error"
import { skillFrontmatterSchema } from "@/schemas/skill/frontmatter"

/**
 * 获取技能仓库本地目录路径（下载到临时目录）。
 *
 * 每次调用都会联网请求 giget 下载最新仓库快照，不使用离线缓存，保证拉到的是最新内容。
 *
 * @returns 仓库临时目录路径。
 *
 * @example
 * ```typescript
 * await getRepositoryDirectoryPath() // "/tmp/yeizi-skills-repo-abc123"
 * ```
 */
async function getRepositoryDirectoryPath(): Promise<string> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))

  const downloadResult = await downloadTemplate(
    `gh:${repositoryConfig.repositoryOwner}/${repositoryConfig.repositoryName}#${repositoryConfig.repositoryBranch}`,
    {
      dir: tempDirectoryPath,
      forceClean: true,
    },
  )

  return downloadResult.dir
}

/**
 * 扫描本地已下载仓库目录，收集所有 `yeizi-` 前缀子目录里的技能条目。
 *
 * 每个候选子目录读取根目录下的 `SKILL.md`，按 gray-matter + Zod schema 解析 frontmatter，得到 `{ name, description }`。
 * 单个 `SKILL.md` 缺失或 frontmatter 解析失败会跳过该候选目录，并以中文 warning 字符串汇报，避免一个坏文档阻塞整次扫描。
 * 扫描结果按 name 升序返回。
 *
 * @param repositoryDirectoryPath - 已下载到本地的仓库根目录路径。
 * @returns 仓库扫描结果，包含技能条目列表（按 name 升序）和被跳过候选目录的 warning 字符串列表。
 * @throws 仓库根目录下没有任何 `yeizi-` 前缀子目录时抛出 {@link AppError}（错误码 `REMOTE_REPOSITORY_EMPTY`）。
 *
 * @example
 * ```typescript
 * await scanSkillEntryList("/tmp/yeizi-skills-repo-abc123")
 * // {
 * //   skillEntryList: [{ name: "yeizi-demo", description: "示例技能" }],
 * //   warningList: ['跳过技能候选目录"yeizi-broken"：name 字段 技能名不能为空。'],
 * // }
 * ```
 */
async function scanSkillEntryList(
  repositoryDirectoryPath: string,
): Promise<{ skillEntryList: SkillEntry[], warningList: string[] }> {
  const directoryEntryList = await readdir(repositoryDirectoryPath, { withFileTypes: true })
  const candidateEntryList = directoryEntryList.filter(
    directoryEntryItem => directoryEntryItem.isDirectory() && directoryEntryItem.name.startsWith("yeizi-"),
  )

  if (candidateEntryList.length === 0) {
    throw new AppError(AppErrorCode.REMOTE_REPOSITORY_EMPTY)
  }

  const skillEntryList: SkillEntry[] = []
  const warningList: string[] = []

  for (const candidateEntryItem of candidateEntryList) {
    const skillDocumentPath = join(repositoryDirectoryPath, candidateEntryItem.name, "SKILL.md")

    if (!existsSync(skillDocumentPath)) {
      warningList.push(`跳过技能候选目录“${candidateEntryItem.name}”：缺少 SKILL.md。`)
      continue
    }

    try {
      const skillDocumentText = await readFile(skillDocumentPath, "utf-8")
      const frontmatterResult = matter(skillDocumentText)
      const skillFrontmatter = skillFrontmatterSchema.parse(frontmatterResult.data)

      skillEntryList.push({
        name: skillFrontmatter.name,
        description: skillFrontmatter.description,
      })
    }
    catch (error) {
      let warningMessage: string

      if (error instanceof z.ZodError) {
        const firstIssue = error.issues[0]
        const fieldPath = firstIssue?.path.join(".") ?? ""
        const issueMessage = firstIssue?.message ?? "格式不符"

        warningMessage = fieldPath.length > 0
          ? `跳过技能候选目录“${candidateEntryItem.name}”：${fieldPath} 字段 ${issueMessage}。`
          : `跳过技能候选目录“${candidateEntryItem.name}”：frontmatter ${issueMessage}。`
      }
      else {
        warningMessage = `跳过技能候选目录“${candidateEntryItem.name}”：frontmatter 解析失败。`
      }

      warningList.push(warningMessage)
      continue
    }
  }

  skillEntryList.sort((leftSkillEntryItem, rightSkillEntryItem) =>
    leftSkillEntryItem.name.localeCompare(rightSkillEntryItem.name),
  )

  return { skillEntryList, warningList }
}

export { getRepositoryDirectoryPath, scanSkillEntryList }
