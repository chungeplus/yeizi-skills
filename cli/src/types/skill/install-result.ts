import type { PlatformName } from "../platform"
import type { AppError } from "@/error"
import { SkillInstallStatus } from "@/constants/skill/install-status"

/**
 * 技能安装结果状态值类型。
 */
type SkillInstallStatusValue = (typeof SkillInstallStatus)[keyof typeof SkillInstallStatus]

/**
 * 单个技能在单个平台上安装成功的结果。
 */
interface SuccessSkillInstallResult {
  /**
   * 平台名称。
   */
  platformName: PlatformName

  /**
   * 技能名称。
   */
  skillName: string

  /**
   * 安装状态。
   */
  status: typeof SkillInstallStatus.SUCCESS
}

/**
 * 单个技能在单个平台上已是最新、未发生变化的结果。
 */
interface NoChangeSkillInstallResult {
  /**
   * 平台名称。
   */
  platformName: PlatformName

  /**
   * 技能名称。
   */
  skillName: string

  /**
   * 安装状态。
   */
  status: typeof SkillInstallStatus.NO_CHANGE
}

/**
 * 单个技能在单个平台上安装失败的结果。
 */
interface FailedSkillInstallResult {
  /**
   * 平台名称。
   */
  platformName: PlatformName

  /**
   * 技能名称。
   */
  skillName: string

  /**
   * 安装状态。
   */
  status: typeof SkillInstallStatus.FAILED

  /**
   * 失败原因。
   */
  error: AppError
}

/**
 * 单个技能在单个平台上的安装结果。
 */
type SkillInstallResult = SuccessSkillInstallResult | NoChangeSkillInstallResult | FailedSkillInstallResult

export type { SkillInstallResult, SkillInstallStatusValue }
