/**
 * Maximum total attempts (initial + retries) for a single request.
 */
const MAX_ATTEMPTS = 3

/**
 * Base delay in milliseconds before the first retry.
 */
const BASE_DELAY_MS = 500

/**
 * Exponential backoff multiplier applied per retry attempt.
 */
const BACKOFF_MULTIPLIER = 2

/**
 * Upper cap on the backoff delay in milliseconds.
 */
const MAX_DELAY_MS = 5_000

/**
 * Maximum jitter as a fraction of the computed delay.
 */
const JITTER_RATIO = 0.25

/**
 * Predicate: whether the given retryable error should be retried at the
 * given attempt number.
 *
 * @param retryable - Whether the underlying error is marked retryable.
 * @param attempt - The attempt number being evaluated (1 = first retry).
 * @returns true if the request should be retried, false otherwise.
 */
function shouldRetry(retryable: boolean, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS) {
    return false
  }
  return retryable
}

/**
 * Compute the backoff delay (with jitter) before the given retry attempt.
 *
 * @param attempt - The retry attempt number (1 = first retry).
 * @returns Delay in milliseconds.
 */
function getRetryDelayMs(attempt: number): number {
  const baseDelay = Math.min(
    BASE_DELAY_MS * BACKOFF_MULTIPLIER ** attempt,
    MAX_DELAY_MS,
  )
  const jitter = baseDelay * JITTER_RATIO * Math.random()
  return Math.round(baseDelay + jitter)
}

/**
 * Normalised HTTP error. Carries the response status and a retryability flag
 * so the caller can decide how to surface or map the error.
 */
class HttpRequestError extends Error {
  /**
   * HTTP status code, or null for network-level failures.
   */
  public readonly status: number | null

  /**
   * Whether this error is considered safe to retry.
   */
  public readonly retryable: boolean

  constructor(
    message: string,
    status: number | null,
    retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = "HttpRequestError"
    this.status = status
    this.retryable = retryable
  }
}

export {
  getRetryDelayMs,
  HttpRequestError,
  MAX_ATTEMPTS,
  shouldRetry,
}
