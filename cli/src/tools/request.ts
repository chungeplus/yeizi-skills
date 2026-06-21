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

export {
  getRetryDelayMs,
  MAX_ATTEMPTS,
  shouldRetry,
}
