import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { describe, expect, test } from "bun:test"

import { createRequestClient, getRetryDelayMs, HttpRequestError, shouldRetry } from "./request"

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
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(1250)
    }
  })

  test("attempt 2 doubles the base", () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRetryDelayMs(2)
      expect(delay).toBeGreaterThanOrEqual(2000)
      expect(delay).toBeLessThanOrEqual(2500)
    }
  })

  test("delay is capped at MAX_DELAY_MS", () => {
    for (let i = 0; i < 20; i++) {
      const delay = getRetryDelayMs(20)
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

describe("createRequestClient", () => {
  test("loadJson returns parsed JSON body", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    mock.onGet("https://example.test/data").reply(200, { hello: "world" })

    const result = await client.loadJson("https://example.test/data")
    expect(result).toEqual({ hello: "world" })

    mock.restore()
  })

  test("loadText returns response body as string", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    mock.onGet("https://example.test/text").reply(200, "plain text content")

    const result = await client.loadText("https://example.test/text")
    expect(result).toBe("plain text content")

    mock.restore()
  })

  test("injects User-Agent header on every request", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    let capturedHeaders: Record<string, string> | undefined
    mock.onGet("https://example.test/headers").reply((config) => {
      capturedHeaders = config.headers as Record<string, string>
      return [200, {}]
    })

    await client.loadJson("https://example.test/headers")
    expect(capturedHeaders?.["User-Agent"]).toBe("yeizi-skills")

    mock.restore()
  })

  test("retries 500 up to MAX_ATTEMPTS, then throws HttpRequestError", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    let callCount = 0
    mock.onGet("https://example.test/flaky").reply(() => {
      callCount++
      return [500, { error: "boom" }]
    })

    // eslint-disable-next-line ts/await-thenable
    await expect(client.loadJson("https://example.test/flaky")).rejects.toBeInstanceOf(HttpRequestError)
    expect(callCount).toBe(3)

    mock.restore()
  })

  test("does not retry on 404", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    let callCount = 0
    mock.onGet("https://example.test/missing").reply(() => {
      callCount++
      return [404, { error: "not found" }]
    })

    // eslint-disable-next-line ts/await-thenable
    await expect(client.loadJson("https://example.test/missing")).rejects.toBeInstanceOf(HttpRequestError)
    expect(callCount).toBe(1)

    mock.restore()
  })

  test("retries on 429 then succeeds", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    let callCount = 0
    mock.onGet("https://example.test/throttled").reply(() => {
      callCount++
      if (callCount < 2)
        return [429, { error: "slow down" }]
      return [200, { ok: true }]
    })

    const result = await client.loadJson("https://example.test/throttled")
    expect(result).toEqual({ ok: true })
    expect(callCount).toBe(2)

    mock.restore()
  })

  test("HttpRequestError carries status and retryable flag", async () => {
    const client = createRequestClient()
    const mock = new MockAdapter(axios)
    mock.onGet("https://example.test/500").reply(500, { error: "server" })

    try {
      await client.loadJson("https://example.test/500")
      throw new Error("expected to throw")
    }
    catch (error) {
      expect(error).toBeInstanceOf(HttpRequestError)
      const httpError = error as HttpRequestError
      expect(httpError.status).toBe(500)
      expect(httpError.retryable).toBe(true)
    }

    mock.restore()
  })

  test("timeoutMs option is applied per request", async () => {
    const client = createRequestClient({ timeoutMs: 50 })
    const mock = new MockAdapter(axios)
    mock.onGet("https://example.test/slow").timeout()

    // eslint-disable-next-line ts/await-thenable
    await expect(client.loadJson("https://example.test/slow")).rejects.toBeInstanceOf(HttpRequestError)

    mock.restore()
  })
})
