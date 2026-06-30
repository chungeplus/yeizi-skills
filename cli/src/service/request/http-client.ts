import type { AxiosInstance } from "axios"

import axios from "axios"

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * 通用 HTTP 客户端。
 */
class HttpRequestClient {
  private readonly axiosClient: AxiosInstance

  public constructor() {
    this.axiosClient = axios.create({
      timeout: DEFAULT_TIMEOUT_MS,
    })
  }

  public async get<T>({ url }: { url: string }): Promise<T> {
    const response = await this.axiosClient.get<T>(url)
    return response.data
  }
}

const httpClient = new HttpRequestClient()

export { httpClient }
