import type { IGitHubClient } from "@/types/source"

import { AppError, AppErrorCode } from "@/errors"

const GITHUB_REQUEST_TIMEOUT_MS = 15_000

/**
 * 基于 fetch 的 GitHub 客户端。
 */
export class FetchGitHubClient implements IGitHubClient {
  /**
   * 加载 JSON 响应。
   *
   * @param url - 请求地址。
   * @returns 解析后的 JSON 数据。
   * @example loadJson<{ ok: boolean }>("https://example.com") => Promise<{ ok: boolean }>
   */
  public async loadJson<T>(url: string): Promise<T> {
    const httpResponse = await this.loadGitHubResponse(url)

    return (await httpResponse.json()) as T
  }

  /**
   * 加载文本响应。
   *
   * @param url - 请求地址。
   * @returns 响应文本。
   * @example loadText("https://example.com") => Promise<string>
   */
  public async loadText(url: string): Promise<string> {
    const httpResponse = await this.loadGitHubResponse(url)

    return httpResponse.text()
  }

  /**
   * 发起 GitHub 请求并校验响应状态。
   *
   * @param url - 请求地址。
   * @returns 成功的 HTTP 响应对象。
   * @example loadGitHubResponse("https://example.com") => Promise<Response>
   */
  private async loadGitHubResponse(url: string): Promise<Response> {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
    }, GITHUB_REQUEST_TIMEOUT_MS)

    try {
      const httpResponse = await fetch(url, {
        headers: {
          "User-Agent": "yeizi-skills",
        },
        signal: abortController.signal,
      })

      if (!httpResponse.ok) {
        throw new AppError(
          AppErrorCode.GITHUB_REQUEST_FAILED,
          "远端请求失败",
          `GitHub 请求失败，状态码为 ${httpResponse.status}。`,
        )
      }

      return httpResponse
    }
    catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          AppErrorCode.GITHUB_REQUEST_TIMEOUT,
          "远端请求超时",
          `GitHub 请求超时，请检查网络后重试（${GITHUB_REQUEST_TIMEOUT_MS / 1000} 秒）。`,
          { cause: error },
        )
      }

      if (error instanceof Error) {
        throw new AppError(
          AppErrorCode.GITHUB_REQUEST_FAILED,
          "远端请求失败",
          "GitHub 请求失败，请检查网络后重试。",
          { cause: error },
        )
      }

      throw new AppError(
        AppErrorCode.GITHUB_REQUEST_FAILED,
        "远端请求失败",
        "GitHub 请求失败。",
        { cause: new Error(String(error)) },
      )
    }
    finally {
      clearTimeout(timeoutId)
    }
  }
}
