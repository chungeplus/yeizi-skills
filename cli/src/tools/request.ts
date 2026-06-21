import type { AxiosInstance } from "axios"
import axios from "axios"

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 500
const BACKOFF_MULTIPLIER = 2
const MAX_DELAY_MS = 5_000
const JITTER_RATIO = 0.25
const USER_AGENT = "yeizi-skills"

class HttpRequestError extends Error {
  public readonly status: number | null
  public readonly retryable: boolean
  constructor(message: string, status: number | null, retryable: boolean, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "HttpRequestError"
    this.status = status
    this.retryable = retryable
  }
}

function shouldRetry(retryable: boolean, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS)
    return false
  return retryable
}

function getRetryDelayMs(attempt: number): number {
  const baseDelay = Math.min(BASE_DELAY_MS * BACKOFF_MULTIPLIER ** attempt, MAX_DELAY_MS)
  const jitter = baseDelay * JITTER_RATIO * Math.random()
  return Math.round(baseDelay + jitter)
}

function isRetryableStatus(status: number | null): boolean {
  if (status === null)
    return true
  if (status >= 500 && status < 600)
    return true
  if (status === 408 || status === 429)
    return true
  return false
}

function hasResponseWithStatus(error: Error): error is Error & { response: { status: number } } {
  if (!("response" in error))
    return false
  const response = (error as Record<string, unknown>).response
  if (typeof response !== "object" || response === null)
    return false
  const status = (response as Record<string, unknown>).status
  return typeof status === "number"
}

function wrapError(error: unknown): HttpRequestError {
  if (error instanceof HttpRequestError)
    return error
  if (axios.isAxiosError(error)) {
    const axiosError = error
    const status = axiosError.response?.status ?? null
    const message = axiosError.message
    return new HttpRequestError(message, status, isRetryableStatus(status), { cause: axiosError })
  }
  if (error instanceof Error) {
    const message = error.message
    const status = hasResponseWithStatus(error) ? error.response.status : null
    return new HttpRequestError(message, status, isRetryableStatus(status), { cause: error })
  }
  return new HttpRequestError(String(error), null, false)
}

async function executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await operation()
    }
    catch (error) {
      const wrapped = wrapError(error)
      if (!shouldRetry(wrapped.retryable, attempt + 1))
        throw wrapped
      attempt++
      await new Promise(resolve => setTimeout(resolve, getRetryDelayMs(attempt)))
    }
  }
}

interface CreateRequestClientOptions {
  baseURL?: string
  headers?: Record<string, string>
  timeoutMs?: number
}

interface RequestClient {
  loadJson: <T = unknown>(url: string) => Promise<T>
  loadText: (url: string) => Promise<string>
}

function createRequestClient(options: CreateRequestClientOptions = {}): RequestClient {
  const axiosClient: AxiosInstance = axios.create({
    baseURL: options.baseURL,
    headers: options.headers,
    timeout: options.timeoutMs,
  })

  axiosClient.interceptors.request.use((config) => {
    config.headers.set("User-Agent", USER_AGENT)
    return config
  })

  async function loadJson<T = unknown>(url: string): Promise<T> {
    return executeWithRetry(async () => {
      const response = await axiosClient.get<T>(url, { adapter: axios.defaults.adapter })
      return response.data
    })
  }

  async function loadText(url: string): Promise<string> {
    return executeWithRetry(async () => {
      const response = await axiosClient.get<string>(url, { responseType: "text", adapter: axios.defaults.adapter })
      return response.data
    })
  }

  return { loadJson, loadText }
}

export {
  createRequestClient,
  getRetryDelayMs,
  HttpRequestError,
  MAX_ATTEMPTS,
  shouldRetry,
}
export type {
  CreateRequestClientOptions,
  RequestClient,
}
