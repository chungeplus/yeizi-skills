import type { PlatformConfig, PlatformItem, PlatformName } from "@/types/platform"

import { platformConfig } from "@/config"

/**
 * 平台配置服务。
 * 封装 {@link platformConfig} 的查询逻辑，集中管理平台元数据。
 */
class PlatformConfigService {
  /**
   * 单例实例。
   */
  private static instance: PlatformConfigService | null = null

  /**
   * 配置对象。
   */
  private readonly platformConfig: PlatformConfig

  /**
   * 获取单例实例。
   *
   * @returns PlatformConfigService 实例。
   */
  public static getInstance(): PlatformConfigService {
    if (PlatformConfigService.instance === null) {
      PlatformConfigService.instance = new PlatformConfigService()
    }

    return PlatformConfigService.instance
  }

  /**
   * 私有构造函数。
   */
  private constructor() {
    this.platformConfig = platformConfig
  }

  /**
   * 获取所有支持的平台配置条目列表。
   *
   * @returns 平台配置条目列表。
   *
   * @example
   * ```typescript
   * PlatformConfigService.getInstance().getPlatformList()
   * // [{ platformName: "claude-code", ... }, ...]
   * ```
   */
  public getPlatformList(): PlatformItem[] {
    return [...this.platformConfig.platformList]
  }

  /**
   * 获取所有支持的平台名称列表。
   *
   * @returns 平台名称列表。
   *
   * @example
   * ```typescript
   * PlatformConfigService.getInstance().getPlatformNameList()
   * // ["claude-code", "codex", ...]
   * ```
   */
  public getPlatformNameList(): PlatformName[] {
    return this.platformConfig.platformList.map(platformItem => platformItem.platformName)
  }
}

export { PlatformConfigService }
