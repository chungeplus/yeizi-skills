import type { SkillManifest } from "@/types/skill"

import { parseSkillManifest } from "@/features/skill"
import { loadSkillManifest } from "@/service/apis"

/**
 * 加载远端技能清单。
 *
 * @returns 远端技能清单。
 */
async function loadGitHubSkillManifest(): Promise<SkillManifest> {
  const rawManifest = await loadSkillManifest()
  return parseSkillManifest(rawManifest)
}

export { loadGitHubSkillManifest }
