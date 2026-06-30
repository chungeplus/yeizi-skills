import type { ManifestConfig, SkillItem } from "@/types/skill"

import { AppError, AppErrorCode } from "@/error"
import { loadManifestConfig } from "@/features/github"
import { manifestConfigSchema } from "@/schemas/skill/manifest-config"

/**
 * 技能清单配置服务。
 * 封装远端 manifest.json 的加载、校验和查询逻辑。
 */
class ManifestConfigService {
  /**
   * 单例实例。
   */
  private static instance: ManifestConfigService | null = null

  /**
   * 配置对象。
   */
  private manifestConfig: ManifestConfig | null = null

  /**
   * 是否已加载。
   */
  private isLoaded = false

  /**
   * 获取单例实例。
   *
   * @returns ManifestConfigService 实例。
   */
  public static getInstance(): ManifestConfigService {
    if (ManifestConfigService.instance === null) {
      ManifestConfigService.instance = new ManifestConfigService()
    }

    return ManifestConfigService.instance
  }

  /**
   * 私有构造函数，禁止外部直接实例化。
   */
  private constructor() {}

  /**
   * 从远端加载并校验 manifest.json 配置。
   * 已加载过的数据不会重复加载。
   *
   * @throws 配置格式不正确时抛出 {@link AppError}。
   */
  public async loadData(): Promise<void> {
    if (this.isLoaded) {
      return
    }

    const rawManifestConfig = await loadManifestConfig()

    try {
      const manifestConfig = manifestConfigSchema.parse(rawManifestConfig)
      this.manifestConfig = manifestConfig
      this.isLoaded = true
    }
    catch (error) {
      if (error instanceof Error) {
        throw new AppError(AppErrorCode.REMOTE_SKILL_CATALOG_INVALID, { cause: error })
      }
      throw new AppError(AppErrorCode.REMOTE_SKILL_CATALOG_INVALID)
    }
  }

  /**
   * 获取技能列表。
   *
   * @returns 技能列表。
   *
   * @example
   * ```typescript
   * ManifestConfigService.getInstance().getSkillList()
   * // [{ skillName: "brainstorming", ... }, ...]
   * ```
   */
  public getSkillList(): SkillItem[] {
    if (!this.manifestConfig) {
      return []
    }

    return this.manifestConfig.skillList
  }

  /**
   * 获取技能名称列表。
   *
   * @returns 技能名称列表。
   *
   * @example
   * ```typescript
   * ManifestConfigService.getInstance().getSkillNameList()
   * // ["brainstorming", "code-review", ...]
   * ```
   */
  public getSkillNameList(): string[] {
    return this.getSkillList().map(skillItem => skillItem.skillName)
  }
}

export { ManifestConfigService }
