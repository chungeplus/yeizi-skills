import { describe, expect, test } from "bun:test"

import { getRetryDelayMs, HttpRequestError, shouldRetry } from "./request"

describe("shouldRetry", () => {
  test("returns true when retryable and under max attempts", () => {
    expect(shouldRetry(true, 1)).toBe(true)
    expect(shouldRetry(true, 2)).toBe(true)
  })

  test("returns false when not retryable", () => {
    expect(shouldRetry(false, 1)).toBe(false)
    expect(shouldRetry(false, 2)).toBe(false)
  })

  test("returns false when attempt reaches MAX_ATTEMPTS", () => {
    expect(shouldRetry(true, 3)).toBe(false)
    expect(shouldRetry(true, 100)).toBe(false)
  })
})

describe("getRetryDelayMs", () => {
  test("attempt 1 returns BASE_DELAY_MS * BACKOFF_MULTIPLIER plus jitter", () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRetryDelayMs(1)
      // BASE=500, MULT=2 → base = 1000; jitter up to 25% → 1000..1250
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(1250)
    }
  })

  test("attempt 2 doubles the base", () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRetryDelayMs(2)
      // base = 2000; jitter up to 25% → 2000..2500
      expect(delay).toBeGreaterThanOrEqual(2000)
      expect(delay).toBeLessThanOrEqual(2500)
    }
  })

  test("delay is capped at MAX_DELAY_MS", () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRetryDelayMs(20)
      // base would be huge; capped at 5000 + 25% jitter → 5000..6250
      expect(delay).toBeGreaterThanOrEqual(5000)
      expect(delay).toBeLessThanOrEqual(6250)
    }
  })
})

describe("HttpRequestError", () => {
  test("constructs with status, retryable, and message", () => {
    const error = new HttpRequestError("boom", 500, true)
    expect(error.message).toBe("boom")
    expect(error.status).toBe(500)
    expect(error.retryable).toBe(true)
    expect(error.name).toBe("HttpRequestError")
  })

  test("accepts null status for network-level failures", () => {
    const error = new HttpRequestError("network down", null, true)
    expect(error.status).toBeNull()
    expect(error.retryable).toBe(true)
  })

  test("is an instance of Error", () => {
    const error = new HttpRequestError("x", 404, false)
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(HttpRequestError)
  })

  test("preserves cause when provided", () => {
    const cause = new Error("original")
    const error = new HttpRequestError("wrapped", 500, true, { cause })
    expect(error.cause).toBe(cause)
  })
})
