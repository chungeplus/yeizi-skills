# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.0.0] - 2026-06-30

### Removed

- `update` 命令 (安装/重装统一通过 `install`)
- 远端 `manifest.json`（仓库目录即唯一清单）
- `ManifestConfigService` 与整个 `src/service/` HTTP 客户端层
- `axios` 与 `semver` 依赖
- `SKILL.md` frontmatter 的 `version` 字段（被 `name` + `description` 取代；历史版本号经 `.passthrough()` 容忍）

### Changed

- `SKILL.md` frontmatter 字段从 `skillName` / `skillVersion` 重命名为 `name` / `description`（对齐 Anthropic Claude Code 官方约定）
- 远端目录拉取从 `httpClient.get(manifest)`（已废）改为 `giget.downloadTemplate`（git 协议）
- `install` 流程：先拉仓库 → 扫描 `yeizi-*` 子目录 → 解析 frontmatter → inquirer 含 description → 复制
- `list` 流程：扫描 → 4 列表格（平台 / 技能 / 状态 / 介绍 / 含 description 列）
- 复制前增加内容 hash 比对（Merkle 风格）；无变化时跳过写入
- 4 态 status：`INSTALLED` / `NOT_INSTALLED` / `REMOTE_REMOVED` / `MISSING_SKILLS_DIRECTORY`
- 3 态 install 状态：新加 `NO_CHANGE`（hash 比对相同）

### Added

- `SkillEntry` model（对齐 `name` + `description`）
- `runWithSkillRepository` 高阶函数（拉仓库 + 清理临时目录流程封装）
- `compareDirectoryContentHash`（工具层通用函数）

### Fixed

- 字段名不再因 `as AppErrorCodeValues` 掩盖；改用 `AppErrorCode` / `AppErrorCodeType` 各取其名