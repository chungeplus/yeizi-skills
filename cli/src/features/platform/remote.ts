import type { PlatformConfig, PlatformItem } from "@/types/platform"

import { platformConfig } from "@/config"

class PlatformContentService {
  private static platformConfig: PlatformConfig = platformConfig

  private static platformList: PlatformItem[] | undefined

  private static initPlatformContentPromise: Promise<[void]> | undefined

  public static async initPlatformContent(): Promise<[void]> {
    if (PlatformContentService.initPlatformContentPromise === undefined) {
      PlatformContentService.initPlatformContentPromise = Promise.all([
        PlatformContentService.createLoadPlatformListPromise(),
      ])
    }

    return PlatformContentService.initPlatformContentPromise
  }

  private static async createLoadPlatformListPromise(): Promise<void> {
    const platformList: PlatformItem[] = [...PlatformContentService.platformConfig.platformList]

    platformList.sort((leftPlatformItem, rightPlatformItem) =>
      leftPlatformItem.platformName.localeCompare(rightPlatformItem.platformName),
    )

    PlatformContentService.platformList = platformList
  }

  public static async getRemotePlatformList(): Promise<PlatformItem[]> {
    await PlatformContentService.initPlatformContent()

    return PlatformContentService.platformList!
  }
}

export { PlatformContentService }