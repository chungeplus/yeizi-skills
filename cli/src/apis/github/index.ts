import type { IGitHubApi } from "@/types/source"

import { createRequestClient } from "@/tools/request"

/**
 * Configuration options for {@link createGitHubApi}.
 */
interface CreateGitHubApiOptions {
  /**
   * Override the default GitHub API base URL.
   */
  baseURL?: string

  /**
   * Additional headers to attach to every request.
   */
  headers?: Record<string, string>

  /**
   * Per-request timeout in milliseconds.
   */
  timeoutMs?: number
}

/**
 * Create a configured GitHub HTTP client.
 *
 * @param options - Optional per-source overrides.
 * @returns A GitHub API client.
 */
function createGitHubApi(options: CreateGitHubApiOptions = {}): IGitHubApi {
  return createRequestClient({
    baseURL: options.baseURL ?? "https://api.github.com",
    headers: options.headers,
    timeoutMs: options.timeoutMs ?? 15_000,
  })
}

/**
 * Default GitHub API client used across the project.
 */
const githubApi: IGitHubApi = createGitHubApi()

export {
  createGitHubApi,
  githubApi,
}
export type {
  CreateGitHubApiOptions,
}
