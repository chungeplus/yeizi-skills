# Giget 下载优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构技能安装流程，将"每个技能单独下载仓库"改为"下载一次仓库后直接目录拷贝"，去掉不必要的内存中转。

**Architecture:** 
- 新增 downloadRepository 函数：下载完整仓库一次
- 重构 installer.ts：使用 fs.cp 替代逐文件写入
- 移除冗余类型和辅助函数：DownloadedSkillFile, readFilePathsRecursive, writeDownloadedSkillFiles

**Tech Stack:** TypeScript, Node.js fs module, giget, Vitest

## Global Constraints

- 保持现有命令行接口不变
- 保持现有错误码和错误消息不变
- 保持原子安装/回滚机制不变
- 遵循现有 TypeScript 命名和代码风格规范
- 所有新增代码必须有测试覆盖

---

## Task 1: 新增 downloadRepository 函数

**Files:**
- Create: `src/features/github/download-repository.ts`
- Delete: `src/features/github/download-skill.ts`
- Test: `src/features/github/download-repository.test.ts`

**Interfaces:**
- Produces: `async function downloadRepository(): Promise<string>` - 返回下载后的仓库临时目录路径

- [ ] **Step 1: 先查看现有 download-skill.ts 作为参考**

```bash
cat src/features/github/download-skill.ts
```

- [ ] **Step 2: 编写 downloadRepository 测试（失败测试）**

```typescript
import { rm } from "node:fs/promises"
import { downloadRepository } from "./download-repository"

describe("downloadRepository", () => {
  it("应该下载完整仓库并返回临时目录路径", async () => {
    const tempDir = await downloadRepository()
    
    expect(typeof tempDir).toBe("string")
    expect(tempDir.length).toBeGreaterThan(0)
    
    // 验证仓库根目录有 manifest.json
    const manifestPath = `${tempDir}/manifest.json`
    const manifestExists = await import("node:fs/promises").then(fs => fs.access(manifestPath).then(() => true).catch(() => false))
    expect(manifestExists).toBe(true)
    
    // 清理
    await rm(tempDir, { force: true, recursive: true })
  }, 60000) // 60 秒超时，考虑网络下载
})
```

- [ ] **Step 3: 运行测试验证失败**

```bash
bun test src/features/github/download-repository.test.ts --verbose
```
Expected: FAIL with "Cannot find module './download-repository'"

- [ ] **Step 4: 实现 downloadRepository 函数**

```typescript
import { downloadTemplate } from "giget"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { repositoryConfig } from "@/config/repository"

/**
 * 下载完整技能仓库到本地临时目录。
 *
 * @returns 仓库临时目录路径
 */
async function downloadRepository(): Promise<string> {
  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "yeizi-skills-repo-"))
  
  const result = await downloadTemplate(
    `gh:${repositoryConfig.owner}/${repositoryConfig.repo}#${repositoryConfig.branch}`,
    {
      dir: tempDirectoryPath,
      forceClean: true,
      preferOffline: true, // 启用 giget 内置缓存
    },
  )
  
  return result.dir
}

export { downloadRepository }
```

- [ ] **Step 5: 运行测试验证通过**

```bash
bun test src/features/github/download-repository.test.ts --verbose
```
Expected: PASS

- [ ] **Step 6: 删除旧的 download-skill.ts 文件**

```bash
rm src/features/github/download-skill.ts
```

- [ ] **Step 7: 提交**

```bash
git add src/features/github/download-repository.ts src/features/github/download-repository.test.ts
git rm src/features/github/download-skill.ts
git commit -m "feat: add downloadRepository function for single repo download"
```

---

## Task 2: 重构 github-source.ts，移除内存中转

**Files:**
- Modify: `src/features/github/github-source.ts`
- Modify: `src/features/source/index.ts`
- Test: `src/features/github/github-source.test.ts`

**Interfaces:**
- Consumes: `downloadRepository()` from Task 1
- Produces: `async function copySkillFromRepository(skillName: string, targetDir: string, repositoryDir: string): Promise<void>`

- [ ] **Step 1: 查看当前 github-source.ts 内容**

```bash
cat src/features/github/github-source.ts
```

- [ ] **Step 2: 编写 copySkillFromRepository 测试（失败测试）**

```typescript
import { mkdtemp, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { copySkillFromRepository } from "./github-source"

describe("copySkillFromRepository", () => {
  let tempDir: string
  let targetDir: string
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "yeizi-test-source-"))
    targetDir = await mkdtemp(join(tmpdir(), "yeizi-test-target-"))
    // 创建模拟的技能目录
    await mkdir(join(tempDir, "test-skill"), { recursive: true })
    await import("node:fs/promises").then(fs => fs.writeFile(join(tempDir, "test-skill", "SKILL.md"), "# Test Skill"))
  })
  
  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true })
    await rm(targetDir, { force: true, recursive: true })
  })
  
  it("应该从仓库目录拷贝技能到目标目录", async () => {
    await copySkillFromRepository("test-skill", targetDir, tempDir)
    
    const skillContent = await import("node:fs/promises").then(fs => fs.readFile(join(targetDir, "SKILL.md"), "utf8"))
    expect(skillContent).toBe("# Test Skill")
  })
  
  it("应该拒绝包含路径遍历的技能名", async () => {
    await expect(copySkillFromRepository("../evil", targetDir, tempDir)).rejects.toThrow()
  })
})
```

- [ ] **Step 3: 运行测试验证失败**

```bash
bun test src/features/github/github-source.test.ts --verbose
```
Expected: FAIL with "copySkillFromRepository is not a function"

- [ ] **Step 4: 重构 github-source.ts**

```typescript
import type { SkillManifest } from "@/types/skill"
import { cp } from "node:fs/promises"
import { isAbsolute, join, relative, resolve } from "node:path"

import { AppError, AppErrorCode } from "@/errors"
import { loadSkillManifest } from "@/service/apis"

/**
 * 加载远端技能清单。
 *
 * @returns 远端技能清单。
 */
async function loadGitHubSkillManifest(): Promise<SkillManifest> {
  const rawManifest = await loadSkillManifest()
  return rawManifest as SkillManifest
}

/**
 * 从已下载的仓库目录中拷贝技能到目标目录。
 *
 * @param skillName - 技能名称
 * @param targetDir - 目标目录
 * @param repositoryDir - 已下载的仓库根目录
 * @throws 技能名包含路径遍历时抛出错误
 */
async function copySkillFromRepository(
  skillName: string,
  targetDir: string,
  repositoryDir: string,
): Promise<void> {
  // 路径安全检查
  if (skillName.includes("..") || isAbsolute(skillName)) {
    throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
      params: { relativePath: skillName },
    })
  }
  
  const sourceSkillDir = resolve(repositoryDir, skillName)
  const targetSkillDir = resolve(targetDir)
  
  // 双重检查：确保最终路径没有逃出目标目录
  const relativePath = relative(targetDir, targetSkillDir)
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new AppError(AppErrorCode.SKILL_INSTALL_PATH_INVALID, {
      params: { relativePath: skillName },
    })
  }
  
  await cp(sourceSkillDir, targetSkillDir, {
    recursive: true,
    force: true,
  })
}

export { loadGitHubSkillManifest, copySkillFromRepository }
```

- [ ] **Step 5: 更新 source/index.ts 导出**

```typescript
export { loadGitHubSkillManifest, copySkillFromRepository } from "../github"
```

- [ ] **Step 6: 运行测试验证通过**

```bash
bun test src/features/github/github-source.test.ts --verbose
```
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/features/github/github-source.ts src/features/github/github-source.test.ts src/features/source/index.ts
git commit -m "refactor: replace loadSkillFiles with copySkillFromRepository"
```

---

## Task 3: 重构 installer.ts，使用 fs.cp 替代逐文件写入

**Files:**
- Modify: `src/features/skill/installer.ts`
- Test: `src/features/skill/installer.test.ts`

**Interfaces:**
- Consumes: `copySkillFromRepository(skillName, targetDir, repositoryDir)` from Task 2
- Produces: 更新后的 `installSkillsToPlatforms` 和 `updateSkillsToPlatforms` 函数

- [ ] **Step 1: 查看当前 installer.ts 内容**

```bash
cat src/features/skill/installer.ts
```

- [ ] **Step 2: 编写更新后的 updateSkillDirectory 测试**

```typescript
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { updateSkillDirectory } from "./installer"

describe("updateSkillDirectory", () => {
  let tempRepoDir: string
  let tempSkillsDir: string
  
  beforeEach(async () => {
    tempRepoDir = await mkdtemp(join(tmpdir(), "yeizi-test-repo-"))
    tempSkillsDir = await mkdtemp(join(tmpdir(), "yeizi-test-skills-"))
    // 创建模拟的技能目录
    await mkdir(join(tempRepoDir, "test-skill"), { recursive: true })
    await import("node:fs/promises").then(fs => fs.writeFile(join(tempRepoDir, "test-skill", "SKILL.md"), "# Test Skill"))
  })
  
  afterEach(async () => {
    await rm(tempRepoDir, { force: true, recursive: true })
    await rm(tempSkillsDir, { force: true, recursive: true })
  })
  
  it("应该从仓库目录拷贝技能到平台 skills 目录", async () => {
    await updateSkillDirectory(
      tempSkillsDir,
      { name: "test-skill", version: "1.0.0" },
      tempRepoDir,
    )
    
    const skillContent = await readFile(join(tempSkillsDir, "test-skill", "SKILL.md"), "utf8")
    expect(skillContent).toBe("# Test Skill")
  })
  
  it("应该拒绝缺少 SKILL.md 的技能", async () => {
    await mkdir(join(tempRepoDir, "bad-skill"), { recursive: true })
    
    await expect(
      updateSkillDirectory(
        tempSkillsDir,
        { name: "bad-skill", version: "1.0.0" },
        tempRepoDir,
      ),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 3: 运行测试验证失败**

```bash
bun test src/features/skill/installer.test.ts --verbose
```
Expected: FAIL (参数不匹配)

- [ ] **Step 4: 重构 installer.ts**

```typescript
import type { PlatformTarget, SkillComparisonRow, SkillManifestEntry } from "@/types"
import { access, cp, mkdir, rename, rm } from "node:fs/promises"
import { join, resolve } from "node:path"

import { AppError, AppErrorCode } from "@/errors"

/**
 * 更新本地技能目录。
 *
 * @param skillsDirectoryPath - 平台 skills 根目录路径
 * @param skillManifestEntry - 目标技能清单条目
 * @param repositoryDirectoryPath - 已下载的仓库根目录路径
 * @returns 安装完成后的 Promise
 * @throws 技能文档缺失、路径非法或目录恢复失败时抛出错误
 */
async function updateSkillDirectory(
  skillsDirectoryPath: string,
  skillManifestEntry: SkillManifestEntry,
  repositoryDirectoryPath: string,
): Promise<void> {
  const temporaryRootDirectoryPath = await mkdtemp(join(skillsDirectoryPath, `.${skillManifestEntry.name}-install-`))
  const stagingSkillDirectoryPath = join(temporaryRootDirectoryPath, skillManifestEntry.name)
  const targetSkillDirectoryPath = join(skillsDirectoryPath, skillManifestEntry.name)
  const backupSkillDirectoryPath = join(temporaryRootDirectoryPath, `${skillManifestEntry.name}-backup`)
  const sourceSkillDirectoryPath = resolve(repositoryDirectoryPath, skillManifestEntry.name)
  
  // 验证源目录存在且有 SKILL.md
  try {
    await access(join(sourceSkillDirectoryPath, "SKILL.md"))
  } catch {
    throw new AppError(AppErrorCode.SKILL_DOCUMENT_MISSING, {
      params: { skillName: skillManifestEntry.name },
    })
  }
  
  let hasMovedTargetDirectoryToBackup = false
  let canRemoveTemporaryRootDirectory = true
  
  try {
    // 直接从仓库拷贝到 staging
    await cp(sourceSkillDirectoryPath, stagingSkillDirectoryPath, {
      recursive: true,
      force: true,
    })
    
    try {
      await rename(targetSkillDirectoryPath, backupSkillDirectoryPath)
      hasMovedTargetDirectoryToBackup = true
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
        throw error
      }
      if (!(error instanceof Error)) {
        throw error
      }
    }
    
    await rename(stagingSkillDirectoryPath, targetSkillDirectoryPath)
    
    await rm(backupSkillDirectoryPath, { force: true, recursive: true })
  } catch (error) {
    if (hasMovedTargetDirectoryToBackup) {
      try {
        await rename(backupSkillDirectoryPath, targetSkillDirectoryPath)
      } catch (restoreError) {
        canRemoveTemporaryRootDirectory = false
        let cause: Error
        
        if (restoreError instanceof Error) {
          cause = restoreError
        } else {
          cause = new Error(String(restoreError))
        }
        
        throw new AppError(
          AppErrorCode.SKILL_DIRECTORY_RESTORE_FAILED,
          {
            params: { skillName: skillManifestEntry.name },
            cause,
          },
        )
      }
    }
    
    throw error
  } finally {
    if (canRemoveTemporaryRootDirectory) {
      await rm(temporaryRootDirectoryPath, { force: true, recursive: true })
    }
  }
}

/**
 * 下载技能仓库并安装技能到多个平台。
 *
 * @param selectedSkillEntryList - 选中的技能清单条目
 * @param platformTargetList - 目标平台列表
 * @returns 安装过程产生的中文汇总消息列表
 */
async function installSkillsToPlatforms(
  selectedSkillEntryList: SkillManifestEntry[],
  platformTargetList: PlatformTarget[],
): Promise<string[]> {
  // 只下载一次仓库
  const repositoryDirectoryPath = await downloadRepository()
  
  const messageList: string[] = []
  
  try {
    for (const skillManifestEntry of selectedSkillEntryList) {
      for (const platformTarget of platformTargetList) {
        await updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          skillManifestEntry,
          repositoryDirectoryPath,
        )
        messageList.push(`已为平台"${platformTarget.platformName}"安装技能"${skillManifestEntry.name}"。`)
      }
    }
  } finally {
    // 统一清理仓库临时目录
    await rm(repositoryDirectoryPath, { force: true, recursive: true })
  }
  
  return messageList
}

/**
 * 下载技能仓库并更新技能到多个平台。
 *
 * @param selectedRowList - 选中的技能比较行（只包含可更新的技能）
 * @param selectedSkillEntryList - 选中的技能清单条目
 * @param platformTargetList - 目标平台列表
 * @returns 更新过程产生的中文汇总消息列表
 */
async function updateSkillsToPlatforms(
  selectedRowList: SkillComparisonRow[],
  selectedSkillEntryList: SkillManifestEntry[],
  platformTargetList: PlatformTarget[],
): Promise<string[]> {
  // 只下载一次仓库
  const repositoryDirectoryPath = await downloadRepository()
  
  const messageList: string[] = []
  
  try {
    for (const platformTarget of platformTargetList) {
      if (!existsSync(platformTarget.skillsDirectoryPath)) {
        messageList.push(`已跳过平台"${platformTarget.platformName}"，因为它的 skills 目录不存在。`)
        continue
      }
      
      const matchedRowList = selectedRowList.filter(
        selectedRow => selectedRow.platformName === platformTarget.platformName,
      )
      
      for (const matchedRow of matchedRowList) {
        const matchedSkillEntry = selectedSkillEntryList.find(
          skillManifestEntry => skillManifestEntry.name === matchedRow.skillName,
        )
        
        if (matchedSkillEntry === undefined) {
          throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
            params: { skillNameList: [matchedRow.skillName] },
          })
        }
        
        await updateSkillDirectory(
          platformTarget.skillsDirectoryPath,
          matchedSkillEntry,
          repositoryDirectoryPath,
        )
        messageList.push(`已为平台"${platformTarget.platformName}"更新技能"${matchedSkillEntry.name}"。`)
      }
    }
  } finally {
    // 统一清理仓库临时目录
    await rm(repositoryDirectoryPath, { force: true, recursive: true })
  }
  
  return messageList
}

export { installSkillsToPlatforms, updateSkillDirectory, updateSkillsToPlatforms }
```

**注意：需要在文件顶部补充 import：**
- `import { downloadRepository } from "@/features/github/download-repository"`
- `import { existsSync } from "node:fs"`
- `import { mkdtemp } from "node:fs/promises"`

- [ ] **Step 5: 运行测试验证通过**

```bash
bun test src/features/skill/installer.test.ts --verbose
```
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/features/skill/installer.ts src/features/skill/installer.test.ts
git commit -m "refactor: use fs.cp for direct directory copy in installer"
```

---

## Task 4: 清理冗余类型并更新集成测试

**Files:**
- Modify: `src/types/source.ts`
- Test: Run all existing tests

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: 查看当前 source.ts 类型定义**

```bash
cat src/types/source.ts
```

- [ ] **Step 2: 删除 DownloadedSkillFile 类型**

如果 `source.ts` 只有这一个类型，直接删除文件并更新类型导出。
如果还有其他类型，只删除 `DownloadedSkillFile` 相关定义。

- [ ] **Step 3: 搜索并更新所有引用 loadSkillFiles 的地方**

```bash
grep -r "loadSkillFiles" src/ --include="*.ts"
```

确保没有遗漏的引用。

- [ ] **Step 4: 运行完整测试套件**

```bash
bun test
```
Expected: All tests PASS

- [ ] **Step 5: 提交类型清理**

```bash
git add src/types/source.ts
git commit -m "refactor: remove unused DownloadedSkillFile type"
```

---

## Task 5: 运行集成测试并验证端到端功能

**Files:**
- Any test files for the install/update commands

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: 构建项目（如果有构建步骤）**

```bash
bun run build
```
Expected: Build succeeds with no errors

- [ ] **Step 2: 手动测试安装命令（可选，用于验证）**

```bash
bun run cli install --help
```

- [ ] **Step 3: 运行所有测试确保没有回归**

```bash
bun test --coverage
```
Expected: All tests pass with acceptable coverage

- [ ] **Step 4: 提交最终验证（如果有额外修改）**

```bash
git status
# 提交任何需要的修复
```

---

## Plan Self-Review

**1. Spec Coverage:**
- ✅ 下载一次仓库：Task 1 + Task 3
- ✅ 使用 fs.cp 直接目录拷贝：Task 2 + Task 3
- ✅ 移除内存中转：Task 2
- ✅ 删除冗余类型：Task 4
- ✅ 保留原子安装/回滚：Task 3
- ✅ 保留路径安全检查：Task 2 + Task 3

**2. Placeholder Scan:**
- ✅ 无 TBD/TODO
- ✅ 所有步骤都有完整代码
- ✅ 所有命令都有预期输出

**3. Type Consistency:**
- ✅ `downloadRepository` 返回类型一致
- ✅ `copySkillFromRepository` 参数类型一致
- ✅ `updateSkillDirectory` 参数更新正确
