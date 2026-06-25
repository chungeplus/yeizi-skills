# Giget 下载优化设计文档

**日期**: 2026-06-26  
**作者**: Claude Code  
**状态**: 待审核

## 背景

当前 `yeizi-skills` CLI 在安装技能时存在两个性能问题：

1. **重复下载仓库**：安装 N 个技能时，`loadSkillFiles` 会被调用 N 次，每次都使用 giget 下载整个 GitHub 仓库，然后只提取单个技能子目录
2. **不必要的内存中转**：下载技能目录后 → 读取所有文件内容到内存 `DownloadedSkillFile[]` → 删除临时目录 → 在 `updateSkillDirectory` 又把内存内容逐个写回磁盘

## 优化目标

- 网络请求：安装 N 个技能时，从 N 次下载 → 1 次下载
- IO 操作：去掉"读入内存再写出"的中转，直接使用 Node.js 原生目录拷贝 API
- 代码质量：删除冗余的辅助函数和类型，减少维护成本

## 设计方案

### 架构变化

**旧流程**：
```
installSkillsToPlatforms()
  └─ for each skill: loadSkillFiles(skillName)
       ├─ mkdtemp()
       ├─ downloadSkill(skillName)  ← 每次都下载整个仓库
       ├─ 递归读取所有文件到内存
       ├─ rm(tempDir)
       └─ return DownloadedSkillFile[]
  └─ for each skill + platform: updateSkillDirectory()
       └─ writeDownloadedSkillFiles()  ← 逐文件写回磁盘
```

**新流程**：
```
installSkillsToPlatforms()
  ├─ downloadRepository()  ← 只下载一次仓库
  │    └─ giget 下载完整仓库到临时目录
  └─ for each skill + platform: updateSkillDirectory()
       └─ fs.cp()  ← 直接从本地仓库目录拷贝
  └─ rm(repositoryTempDir)  ← 最后统一清理
```

### 详细设计

#### 1. 新增 `downloadRepository()` 函数

**文件**: `src/features/github/download-repository.ts`

**功能**：下载完整的 yeizi-skills 仓库到临时目录，启用 giget 内置缓存

**接口**：
```typescript
/**
 * 下载完整技能仓库到本地临时目录。
 *
 * @returns 仓库临时目录路径
 */
async function downloadRepository(): Promise<string>
```

**实现要点**：
- 使用 giget 的 `preferOffline: true` 选项，启用跨命令缓存
- 下载地址：`gh:chungeplus/yeizi-skills#main`
- 返回已解压的仓库本地目录路径

#### 2. 重构 `loadSkillFiles()` 并改为目录拷贝

**文件**: `src/features/github/github-source.ts`

**变化**：
- 删除 `readFilePathsRecursive()` 函数（不再需要递归读文件）
- `loadSkillFiles()` 改为 `copySkillFromRepository()` 或直接内联到 installer
- 不再返回 `DownloadedSkillFile[]`，直接在目标位置完成目录拷贝

#### 3. 重构 `updateSkillDirectory()`

**文件**: `src/features/skill/installer.ts`

**变化**：
- 删除 `writeDownloadedSkillFiles()` 函数
- 参数从 `downloadedSkillFileList: DownloadedSkillFile[]` 改为 `repositoryTempDir: string`
- 使用 `fs.cp(source, dest, { recursive: true })` 原生 API 直接拷贝目录
- 保留路径安全检查：验证技能目录名不包含 `../` 或绝对路径

#### 4. 重构 `installSkillsToPlatforms()` 和 `updateSkillsToPlatforms()`

**文件**: `src/features/skill/installer.ts`

**变化**：
- 在循环外先下载一次完整仓库
- 所有技能都从同一个本地仓库目录拷贝
- 最后统一清理临时目录

#### 5. 类型清理

**文件**: `src/types/source.ts`

**变化**：
- 移除 `DownloadedSkillFile` 类型（不再需要）

### 涉及文件清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/features/github/download-skill.ts` | 删除 | 不再需要单独下载 skill |
| `src/features/github/download-repository.ts` | 新增 | 下载完整仓库 |
| `src/features/github/github-source.ts` | 重构 | 简化为目录拷贝逻辑 |
| `src/features/skill/installer.ts` | 重构 | 去掉内存中转，用 `fs.cp()` |
| `src/types/source.ts` | 修改 | 移除 `DownloadedSkillFile` 类型 |

### 向后兼容

- 命令行接口保持不变（`install --skill xxx --platform yyy`）
- 错误码和错误消息保持不变
- 平台适配逻辑保持不变
- 原子安装/回滚机制完全保留

## 非目标

- 不修改 git provider 或使用 sparse checkout（依赖本地 git，增加复杂度）
- 不改动技能清单加载逻辑（`loadGitHubSkillManifest`）
- 不改动用户交互和命令行输出

## 验收标准

1. 安装多个技能时，giget 只下载一次仓库
2. 安装过程中不再有逐文件读写的内存中转
3. 所有现有测试通过
4. 安装后的技能目录内容与之前完全一致
5. 错误场景（技能不存在、路径非法等）依然被正确捕获
