import type { PlatformConfig, PlatformItem } from "@/types/platform"

import { platformConfig } from "@/config"

/**
 * 平台配置服务。
 * 封装 {@link platformConfig} 的查询逻辑，集中管理平台元数据。
 */
class PlatformContentService {
  private static platformConfig: PlatformConfig

  public async loadContent() {
    this.platformConfig = platformConfig
  }

  /**
   * 获取所有支持的平台配置条目列表。
   *
   * @returns 平台配置条目列表。
   *
   * @example
   * ```typescript
   * PlatformContentService.getPlatformList()
   * // [{ platformName: "claude-code", ... }, ...]
   * ```
   */
  public static getPlatformList(): PlatformItem[] {
    return [...this.platformConfig.platformList]
  }
}

export { PlatformContentService }
