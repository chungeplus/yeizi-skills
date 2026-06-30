import type { ManifestConfigPayload } from "@/types/skill"

import { repositoryConfig } from "@/config/repository"
import { httpClient } from "@/service/request"

/**
 * GitHub raw 内容服务的 base URL。
 */
const RAW_BASE_URL = "https://raw.githubusercontent.com"

/**
 * 加载远端 manifest.json 配置。
 *
 * @returns 未经解析的配置 JSON。
 *
 * @example
 * ```typescript
 * await loadManifestConfig() // { ... }
 * ```
 */
async function loadManifestConfig(): Promise<ManifestConfigPayload> {
  return httpClient.get<ManifestConfigPayload>({
    url: `${RAW_BASE_URL}/${repositoryConfig.repositoryOwner}/${repositoryConfig.repositoryName}/${repositoryConfig.repositoryBranch}/manifest.json`,
  })
}

export { loadManifestConfig }
