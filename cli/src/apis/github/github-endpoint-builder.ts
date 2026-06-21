import { repositoryConfig } from "@/config"

const RAW_BASE_URL = "https://raw.githubusercontent.com"
const CONTENTS_BASE_URL = "https://api.github.com"

/**
 * Build the URL of the skills.json file on raw.githubusercontent.com.
 *
 * @returns The full URL.
 */
function buildSkillsJsonUrl(): string {
  return `${RAW_BASE_URL}/${repositoryConfig.owner}/${repositoryConfig.repo}/${repositoryConfig.branch}/skills.json`
}

/**
 * Build the URL of the GitHub Contents API for the given path.
 *
 * @param path - Directory path inside the repository. Empty string targets the root.
 * @returns The full URL.
 */
function buildContentsApiUrl(path: string): string {
  const encodedPath = path.length > 0 ? `/${path}` : ""
  return `${CONTENTS_BASE_URL}/repos/${repositoryConfig.owner}/${repositoryConfig.repo}/contents${encodedPath}?ref=${repositoryConfig.branch}`
}

/**
 * Build the URL of a raw file on raw.githubusercontent.com.
 *
 * @param path - File path inside the repository.
 * @returns The full URL.
 */
function buildRawFileUrl(path: string): string {
  return `${RAW_BASE_URL}/${repositoryConfig.owner}/${repositoryConfig.repo}/${repositoryConfig.branch}/${path}`
}

export {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
}
