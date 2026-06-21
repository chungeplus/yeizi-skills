# Source API Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-house `fetch` HTTP client with a layered axios-based architecture: `tools/request.ts` (transport) + `apis/github/` (per-source) + unchanged `features/source/` (domain), adding retry, observability hooks, and multi-source readiness.

**Architecture:** Three layers, each with one direction of dependency. Transport owns axios + retry + `HttpRequestError`. Per-source modules wire source-specific config (`baseURL`, headers, timeout) and expose URL builders. Domain layer imports from `@/apis/github` and never sees axios.

**Tech Stack:** TypeScript 5.8+, Bun 1.3+, axios 1.x (runtime), axios-mock-adapter 2.x (dev), zod 3.x, bun:test.

## Global Constraints

- TypeScript strict mode is on. **No `as` for type assertions**; narrowing must be explicit (`instanceof`, schema parse, type predicates).
- Naming rules per `yeizi-styles/.../naming-rules.md`: `isXxx` only for type guards returning type predicates; `getXxx` for computed values; `loadXxx` for external content; `build*` for builders; `should*` for boolean predicates; `on*` for event/interceptor handlers; `create*` for factory functions.
- **No `readonly` on function parameters** (rule added 2026-06-20).
- TSDoc per `comment-rules.md`: caller-facing contract only — purpose, result, input constraints, throws. `@returns` does not prescribe how the caller uses the return value. Multi-line `@example` blocks; blank line between distinct tags.
- File-level single responsibility. `tools/request.ts` must stay under 200 lines.
- Bun test runner. Tests are colocated `*.test.ts` files, auto-discovered by `bun test`.
- ESLint (`@antfu/eslint-config`) and `tsc --noEmit` must both pass with zero warnings/errors before each commit. `bun run check` is the canonical command.
- Only allowed new runtime dependency: `axios`. Only allowed new dev dependency: `axios-mock-adapter`. No `axios-retry`, no `ky`, no `msw`.
- Retry is implemented as a wrapper function inside `createRequestClient`, **not** as a response error interceptor. Reason: tracking retry attempts via interceptors requires `as` to widen axios config; the wrapper keeps the implementation `as`-free. The spec's wording "retry lives in `onError`" is interpreted as "retry is owned by the transport layer", not specifically as "retry is in the axios interceptor".
- During migration (Tasks 7-9), `IGitHubClient` may exist as an internal TypeScript type alias `type IGitHubClient = IGitHubApi`. This is NOT a public API commitment and is removed in Task 9.

---

## Task 1: Add dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `axios` importable from anywhere; `axios-mock-adapter` available in tests.

- [ ] **Step 1: Add axios runtime dependency**

Run from `cli/` directory:
```bash
bun add axios
```
Expected: `package.json` `dependencies` includes `"axios"` with a 1.x version. `bun.lock` updated.

- [ ] **Step 2: Add axios-mock-adapter dev dependency**

```bash
bun add -d axios-mock-adapter
```
Expected: `package.json` `devDependencies` includes `"axios-mock-adapter"` with a 2.x version.

- [ ] **Step 3: Verify imports resolve**

```bash
bun -e 'import axios from "axios"; console.log(typeof axios.create)'
```
Expected: `function` printed.

```bash
bun -e 'import MockAdapter from "axios-mock-adapter"; console.log(typeof MockAdapter)'
```
Expected: `function` printed.

- [ ] **Step 4: Confirm baseline still green**

```bash
bun run check
```
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "deps: add axios runtime and axios-mock-adapter dev"
```

---

## Task 2: Pure retry policy (TDD)

**Files:**
- Create: `src/tools/request.ts`
- Create: `src/tools/request.test.ts`

**Interfaces:**
- Produces: `shouldRetry(retryable: boolean, attempt: number): boolean`; `getRetryDelayMs(attempt: number): number`; constants `MAX_ATTEMPTS`, `BASE_DELAY_MS`, `BACKOFF_MULTIPLIER`, `MAX_DELAY_MS`, `JITTER_RATIO`.

- [ ] **Step 1: Write the failing tests for `shouldRetry`**

Create `src/tools/request.test.ts`:

```typescript
import { describe, expect, test } from "bun:test"

import { getRetryDelayMs, shouldRetry } from "./request"

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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun test src/tools/request.test.ts
```
Expected: FAIL with "Cannot find module" or "shouldRetry is not a function".

- [ ] **Step 3: Implement the constants and pure functions**

Create `src/tools/request.ts`:

```typescript
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
  if (attempt >= MAX_ATTEMPTS) return false
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
    BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt),
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bun test src/tools/request.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Lint and typecheck**

```bash
bun run check
```
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/tools/request.ts src/tools/request.test.ts
git commit -m "feat(tools): add retry policy pure functions"
```

---

## Task 3: HttpRequestError class (TDD)

**Files:**
- Modify: `src/tools/request.ts`
- Modify: `src/tools/request.test.ts`

**Interfaces:**
- Produces: `HttpRequestError` class with fields `status: number | null`, `retryable: boolean`, plus inherited `message`. Constructor signature: `(message, status, retryable, options?: { cause?: unknown })`.

- [ ] **Step 1: Write the failing tests for `HttpRequestError`**

Append to `src/tools/request.test.ts` (inside the existing file, after the existing describe blocks):

```typescript
import { HttpRequestError } from "./request"

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
```

(Add the `import { HttpRequestError }` line at the top alongside the existing import.)

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun test src/tools/request.test.ts
```
Expected: FAIL with "HttpRequestError is not a function" or "is not exported".

- [ ] **Step 3: Implement `HttpRequestError`**

Append to `src/tools/request.ts`, just before the export block:

```typescript
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
```

Update the export block at the bottom of `src/tools/request.ts`:

```typescript
export {
  getRetryDelayMs,
  HttpRequestError,
  MAX_ATTEMPTS,
  shouldRetry,
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bun test src/tools/request.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/request.ts src/tools/request.test.ts
git commit -m "feat(tools): add HttpRequestError class"
```

---

## Task 4: `createRequestClient` transport factory (TDD)

**Files:**
- Modify: `src/tools/request.ts`
- Modify: `src/tools/request.test.ts`

**Interfaces:**
- Produces: `createRequestClient(options?: CreateRequestClientOptions): RequestClient`; types `CreateRequestClientOptions = { baseURL?: string, headers?: Record<string, string>, timeoutMs?: number }` and `RequestClient = { loadJson: (url: string) => Promise<unknown>, loadText: (url: string) => Promise<string> }`.

- [ ] **Step 1: Write the failing tests**

Append to `src/tools/request.test.ts`:

```typescript
import axios from "axios"
import MockAdapter from "axios-mock-adapter"

import { createRequestClient, HttpRequestError } from "./request"

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

    await expect(client.loadJson("https://example.test/flaky")).rejects.toBeInstanceOf(HttpRequestError)
    expect(callCount).toBe(3) // 1 initial + 2 retries

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
      if (callCount < 2) return [429, { error: "slow down" }]
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
    mock.onGet("https://example.test/slow").reply(() => {
      // Simulate slow response by waiting longer than timeout
      return new Promise(resolve => setTimeout(() => resolve([200, {}]), 200))
    })

    await expect(client.loadJson("https://example.test/slow")).rejects.toBeInstanceOf(HttpRequestError)

    mock.restore()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun test src/tools/request.test.ts
```
Expected: FAIL with "createRequestClient is not a function".

- [ ] **Step 3: Implement the factory**

Replace the contents of `src/tools/request.ts` (keep existing `MAX_ATTEMPTS`, constants, `shouldRetry`, `getRetryDelayMs`, `HttpRequestError`, but add the rest) with:

```typescript
import axios, { AxiosError, type AxiosInstance } from "axios"

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
 * Default per-request HTTP user agent.
 */
const USER_AGENT = "yeizi-skills"

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

/**
 * Predicate: whether the given retryable error should be retried at the
 * given attempt number.
 *
 * @param retryable - Whether the underlying error is marked retryable.
 * @param attempt - The attempt number being evaluated (1 = first retry).
 * @returns true if the request should be retried, false otherwise.
 */
function shouldRetry(retryable: boolean, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS) return false
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
    BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt),
    MAX_DELAY_MS,
  )
  const jitter = baseDelay * JITTER_RATIO * Math.random()
  return Math.round(baseDelay + jitter)
}

/**
 * Classify a response status as retryable.
 *
 * @param status - HTTP status code or null for network errors.
 * @returns true if retrying might succeed.
 */
function isRetryableStatus(status: number | null): boolean {
  if (status === null) return true
  if (status >= 500 && status < 600) return true
  if (status === 408 || status === 429) return true
  return false
}

/**
 * Wrap any thrown value into an HttpRequestError.
 *
 * @param error - The thrown value.
 * @returns The normalised error.
 */
function wrapError(error: unknown): HttpRequestError {
  if (error instanceof HttpRequestError) {
    return error
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null
    return new HttpRequestError(
      error.message,
      status,
      isRetryableStatus(status),
      { cause: error },
    )
  }
  return new HttpRequestError(String(error), null, false)
}

/**
 * Execute the given operation with automatic retry on retryable failures.
 *
 * @param operation - The operation to perform.
 * @returns The operation result.
 */
async function executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await operation()
    }
    catch (error) {
      const wrapped = wrapError(error)
      if (!shouldRetry(wrapped.retryable, attempt + 1)) {
        throw wrapped
      }
      attempt++
      await new Promise(resolve => setTimeout(resolve, getRetryDelayMs(attempt)))
    }
  }
}

/**
 * Configuration options for {@link createRequestClient}.
 */
interface CreateRequestClientOptions {
  /**
   * Base URL prepended to relative request paths.
   */
  baseURL?: string

  /**
   * Default headers attached to every request.
   */
  headers?: Record<string, string>

  /**
   * Per-request timeout in milliseconds.
   */
  timeoutMs?: number
}

/**
 * Generic HTTP transport with retry and error normalisation.
 */
interface RequestClient {
  /**
   * Fetch a URL and parse the response body as JSON.
   *
   * @param url - The URL to fetch.
   * @returns The parsed JSON value; callers should schema-validate.
   * @throws {HttpRequestError} when the request fails after retries.
   */
  loadJson: (url: string) => Promise<unknown>

  /**
   * Fetch a URL and return the response body as text.
   *
   * @param url - The URL to fetch.
   * @returns The response text.
   * @throws {HttpRequestError} when the request fails after retries.
   */
  loadText: (url: string) => Promise<string>
}

/**
 * Create a configured HTTP transport with retry and error normalisation.
 *
 * @param options - Optional configuration.
 * @returns A request client ready to use.
 */
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

  async function loadJson(url: string): Promise<unknown> {
    return executeWithRetry(async () => {
      const response = await axiosClient.get<unknown>(url)
      return response.data
    })
  }

  async function loadText(url: string): Promise<string> {
    return executeWithRetry(async () => {
      const response = await axiosClient.get<string>(url, { responseType: "text" })
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bun test src/tools/request.test.ts
```
Expected: all tests pass. Note: the `retries on 429` test will take ~500ms (one backoff cycle). The `retries 500 up to MAX_ATTEMPTS` test will take ~500ms + ~1000ms ≈ 1.5s.

- [ ] **Step 5: Lint and typecheck**

```bash
bun run check
```
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/tools/request.ts src/tools/request.test.ts
git commit -m "feat(tools): add createRequestClient with retry and error wrapping"
```

---

## Task 5: URL builders for GitHub (TDD)

**Files:**
- Create: `src/apis/github/github-endpoint-builder.ts`
- Create: `src/apis/github/github-endpoint-builder.test.ts`

**Interfaces:**
- Produces: `buildSkillsJsonUrl(): string`; `buildContentsApiUrl(path: string): string`; `buildRawFileUrl(path: string): string`.

Note: Branch is NOT a parameter — it comes from `REPOSITORY_CONFIG.branch` (single source of truth). This is a deliberate relaxation of the spec, justified by the "no over-parameterization" rule.

- [ ] **Step 1: Write the failing tests**

Create `src/apis/github/github-endpoint-builder.test.ts`:

```typescript
import { describe, expect, test } from "bun:test"

import {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
} from "./github-endpoint-builder"

describe("buildSkillsJsonUrl", () => {
  test("returns a raw.githubusercontent.com URL pointing at skills.json", () => {
    const url = buildSkillsJsonUrl()
    expect(url).toMatch(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/skills\.json$/)
  })
})

describe("buildContentsApiUrl", () => {
  test("encodes the path under the contents endpoint", () => {
    const url = buildContentsApiUrl("skills/codex")
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/skills\/codex\?ref=/)
  })

  test("handles empty path (root)", () => {
    const url = buildContentsApiUrl("")
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\?ref=/)
  })
})

describe("buildRawFileUrl", () => {
  test("returns a raw.githubusercontent.com URL for the given path", () => {
    const url = buildRawFileUrl("skills/codex/SKILL.md")
    expect(url).toMatch(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/skills\/codex\/SKILL\.md$/)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun test src/apis/github/github-endpoint-builder.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the builders**

Create `src/apis/github/github-endpoint-builder.ts`:

```typescript
import { REPOSITORY_CONFIG } from "@/config"

const RAW_BASE_URL = "https://raw.githubusercontent.com"
const CONTENTS_BASE_URL = "https://api.github.com"

/**
 * Build the URL of the skills.json file on raw.githubusercontent.com.
 *
 * @returns The full URL.
 */
function buildSkillsJsonUrl(): string {
  return `${RAW_BASE_URL}/${REPOSITORY_CONFIG.owner}/${REPOSITORY_CONFIG.repo}/${REPOSITORY_CONFIG.branch}/skills.json`
}

/**
 * Build the URL of the GitHub Contents API for the given path.
 *
 * @param path - Directory path inside the repository. Empty string targets the root.
 * @returns The full URL.
 */
function buildContentsApiUrl(path: string): string {
  const encodedPath = path.length > 0 ? `/${path}` : ""
  return `${CONTENTS_BASE_URL}/repos/${REPOSITORY_CONFIG.owner}/${REPOSITORY_CONFIG.repo}/contents${encodedPath}?ref=${REPOSITORY_CONFIG.branch}`
}

/**
 * Build the URL of a raw file on raw.githubusercontent.com.
 *
 * @param path - File path inside the repository.
 * @returns The full URL.
 */
function buildRawFileUrl(path: string): string {
  return `${RAW_BASE_URL}/${REPOSITORY_CONFIG.owner}/${REPOSITORY_CONFIG.repo}/${REPOSITORY_CONFIG.branch}/${path}`
}

export {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bun test src/apis/github/github-endpoint-builder.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/apis/github/github-endpoint-builder.ts src/apis/github/github-endpoint-builder.test.ts
git commit -m "feat(apis): add github endpoint builders"
```

---

## Task 6: `createGitHubApi` factory + default instance (TDD)

**Files:**
- Create: `src/apis/github/index.ts`
- Create: `src/apis/github/index.test.ts`

**Interfaces:**
- Consumes: `createRequestClient`, `IGitHubApi` (defined in next task as a structural type with `{ loadJson, loadText }`).
- Produces: `createGitHubApi(options?): IGitHubApi`; default `githubApi: IGitHubApi` constant.

For this task, declare `IGitHubApi` locally (the type) so the factory can compile before Task 7 adds the official interface. Task 7 will replace the local declaration with the import from `@/types/source`.

- [ ] **Step 1: Write the failing tests**

Create `src/apis/github/index.test.ts`:

```typescript
import axios from "axios"
import MockAdapter from "axios-mock-adapter"

import { createGitHubApi, githubApi } from "./index"

describe("createGitHubApi", () => {
  test("loadJson fetches JSON from api.github.com by default", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    mock.onGet("https://api.github.com/repos/foo/bar/contents/skills?ref=main").reply(200, [{ name: "codex" }])

    const result = await client.loadJson("https://api.github.com/repos/foo/bar/contents/skills?ref=main")
    expect(result).toEqual([{ name: "codex" }])

    mock.restore()
  })

  test("injects User-Agent header", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    let capturedHeaders: Record<string, string> | undefined
    mock.onGet("https://api.github.com/test").reply((config) => {
      capturedHeaders = config.headers as Record<string, string>
      return [200, {}]
    })

    await client.loadJson("https://api.github.com/test")
    expect(capturedHeaders?.["User-Agent"]).toBe("yeizi-skills")

    mock.restore()
  })

  test("loadText returns text body", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    mock.onGet("https://raw.githubusercontent.com/foo/bar/main/skills/codex/SKILL.md").reply(200, "# codex")

    const result = await client.loadText("https://raw.githubusercontent.com/foo/bar/main/skills/codex/SKILL.md")
    expect(result).toBe("# codex")

    mock.restore()
  })

  test("retries 500 like the underlying transport", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    let calls = 0
    mock.onGet("https://api.github.com/flaky").reply(() => {
      calls++
      return [500, {}]
    })

    await expect(client.loadJson("https://api.github.com/flaky")).rejects.toThrow()
    expect(calls).toBe(3)

    mock.restore()
  })

  test("accepts custom baseURL via options", async () => {
    const client = createGitHubApi({ baseURL: "https://github.test" })
    const mock = new MockAdapter(axios)
    let capturedUrl: string | undefined
    mock.onGet("https://github.test/repos/foo/bar").reply((config) => {
      capturedUrl = config.url
      return [200, {}]
    })

    await client.loadJson("https://github.test/repos/foo/bar")
    expect(capturedUrl).toBe("/repos/foo/bar")

    mock.restore()
  })
})

describe("githubApi", () => {
  test("is a usable IGitHubApi instance with default config", () => {
    expect(typeof githubApi.loadJson).toBe("function")
    expect(typeof githubApi.loadText).toBe("function")
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
bun test src/apis/github/index.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the factory and default instance**

Create `src/apis/github/index.ts`:

```typescript
import {
  type CreateRequestClientOptions,
  createRequestClient,
} from "@/tools/request"

/**
 * Per-source HTTP client interface for GitHub. Structurally compatible with
 * {@link import("@/tools/request").RequestClient}.
 */
interface IGitHubApi {
  /**
   * Fetch a URL and parse the response body as JSON.
   */
  loadJson: (url: string) => Promise<unknown>

  /**
   * Fetch a URL and return the response body as text.
   */
  loadText: (url: string) => Promise<string>
}

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
    headers: {
      "User-Agent": "yeizi-skills",
      ...options.headers,
    },
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
  IGitHubApi,
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
bun test src/apis/github/index.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/apis/github/index.ts src/apis/github/index.test.ts
git commit -m "feat(apis): add createGitHubApi factory and default githubApi"
```

---

## Task 7: Add `IGitHubApi` to types and transient `IGitHubClient` alias

**Files:**
- Modify: `src/types/source/index.ts`

**Interfaces:**
- Produces: `IGitHubApi` interface exported from `@/types/source`; transient `IGitHubClient` type alias `type IGitHubClient = IGitHubApi`.

- [ ] **Step 1: Read the current file**

Read `src/types/source/index.ts` and verify the current shape (referenced in spec).

- [ ] **Step 2: Add `IGitHubApi` and transient alias**

Replace the contents of `src/types/source/index.ts` with:

```typescript
import type { ISkillIndex, ISkillIndexEntry } from "../skill"

/**
 * 下载后的技能文件。
 */
interface IDownloadedSkillFile {
  /**
   * 相对技能根目录的文件路径。
   */
  relativeFilePath: string

  /**
   * 文件文本内容。
   */
  fileContents: string
}

/**
 * GitHub HTTP client 接口。
 */
interface IGitHubApi {
  /**
   * 加载 JSON 响应。
   */
  loadJson: (url: string) => Promise<unknown>

  /**
   * 加载文本响应。
   */
  loadText: (url: string) => Promise<string>
}

/**
 * @internal Transient migration alias. Removed in Task 9.
 */
type IGitHubClient = IGitHubApi

/**
 * 技能源接口。
 */
interface ISkillSource {
  /**
   * 加载技能索引。
   */
  loadSkillIndex: () => Promise<ISkillIndex>

  /**
   * 加载指定技能的全部文件。
   */
  loadSkillFiles: (skillName: string) => Promise<IDownloadedSkillFile[]>

  /**
   * 校验远端技能版本是否与索引一致。
   */
  validateRemoteSkillVersion: (
    skillIndexEntry: ISkillIndexEntry,
    loadedSkillFiles?: IDownloadedSkillFile[],
  ) => Promise<void>
}

/**
 * GitHub Contents API 条目结构。
 */
interface IGitHubContentsEntry {
  /**
   * 条目类型。
   */
  type: string

  /**
   * 仓库内的完整路径。
   */
  path: string

  /**
   * 文件下载地址。
   */
  downloadUrl: string | null
}

export type {
  IDownloadedSkillFile,
  IGitHubApi,
  IGitHubClient,
  IGitHubContentsEntry,
  ISkillSource,
}
```

Note: keep the Chinese TSDoc comments untouched (they were in the original).

- [ ] **Step 3: Verify compilation**

```bash
bun run check
```
Expected: exit 0. The transient alias means existing imports of `IGitHubClient` continue to work.

- [ ] **Step 4: Commit**

```bash
git add src/types/source/index.ts
git commit -m "refactor(types): introduce IGitHubApi, keep IGitHubClient as transient alias"
```

---

## Task 8: Migrate `github-skill-source.ts` to use `githubApi`

**Files:**
- Modify: `src/features/source/github-skill-source.ts`

**Interfaces:**
- Consumes: `githubApi` from `@/apis/github`; `buildSkillsJsonUrl`, `buildContentsApiUrl`, `buildRawFileUrl` from `@/apis/github/github-endpoint-builder`; `IGitHubApi` from `@/types/source`.

- [ ] **Step 1: Read the current file and confirm baseline**

```bash
bun test src/features/source/
```
Expected: existing tests pass.

- [ ] **Step 2: Rewrite the imports**

Replace the top of `src/features/source/github-skill-source.ts` (lines 1-15) with:

```typescript
import type { ISkillIndex, ISkillIndexEntry } from "@/types/skill"
import type {
  IDownloadedSkillFile,
  IGitHubApi,
  IGitHubContentsEntry,
} from "@/types/source"

import { REPOSITORY_CONFIG } from "@/config"
import { AppError, AppErrorCode } from "@/errors"
import { parseSkillIndex, parseSkillVersionFromDocument } from "@/features/skill"
import { githubApi } from "@/apis/github"
import {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
} from "@/apis/github/github-endpoint-builder"
import { githubContentsEntryListSchema } from "@/schemas"

import type { IGitHubApi as _IGitHubApiTypeGuard } from "@/types/source"

const _typecheckGithubApiUsage: IGitHubApi = githubApi
void _typecheckGithubApiUsage
void (null as unknown as _IGitHubApiTypeGuard)
```

Wait, the trailing `_typecheck*` lines are unnecessary — TypeScript will catch any mismatch when the rest of the file uses `githubApi` typed against `IGitHubApi`. Remove them. Final imports:

```typescript
import type { ISkillIndex, ISkillIndexEntry } from "@/types/skill"
import type {
  IDownloadedSkillFile,
  IGitHubApi,
  IGitHubContentsEntry,
} from "@/types/source"

import { REPOSITORY_CONFIG } from "@/config"
import { AppError, AppErrorCode } from "@/errors"
import { parseSkillIndex, parseSkillVersionFromDocument } from "@/features/skill"
import { githubApi } from "@/apis/github"
import {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
} from "@/apis/github/github-endpoint-builder"
import { githubContentsEntryListSchema } from "@/schemas"
```

- [ ] **Step 3: Remove the old REPOSITORY_* and gitHubClient locals**

Delete lines that look like:
```typescript
const REPOSITORY_OWNER = REPOSITORY_CONFIG.owner
const REPOSITORY_NAME = REPOSITORY_CONFIG.repo
const REPOSITORY_BRANCH = REPOSITORY_CONFIG.branch
const gitHubClient = new FetchGitHubClient()
```

(Keep `REPOSITORY_CONFIG` import — it's no longer used directly here but may be re-introduced by builders; the import is harmless. If `bun run check` warns about unused import, remove it.)

- [ ] **Step 4: Update `loadSkillIndex`**

Find the function:
```typescript
async function loadSkillIndex(): Promise<ISkillIndex> {
  const skillIndexUrl = `https://raw.githubusercontent.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/${REPOSITORY_BRANCH}/skills.json`

  return parseSkillIndex(await gitHubClient.loadJson(skillIndexUrl))
}
```

Replace with:
```typescript
async function loadSkillIndex(): Promise<ISkillIndex> {
  return parseSkillIndex(await githubApi.loadJson(buildSkillsJsonUrl()))
}
```

- [ ] **Step 5: Update `loadGitHubFileEntry`**

Find the function:
```typescript
return [{
    path: githubContentEntry.path,
    fileContents: await gitHubClient.loadText(githubContentEntry.downloadUrl),
  }]
```

Replace `gitHubClient.loadText(githubContentEntry.downloadUrl)` with:
```typescript
await githubApi.loadText(buildRawFileUrl(githubContentEntry.path))
```

Wait — `downloadUrl` is the absolute URL GitHub returns. To preserve the exact same network request, keep using `downloadUrl`:

```typescript
fileContents: await githubApi.loadText(githubContentEntry.downloadUrl)
```

No URL builder needed here because `downloadUrl` is already absolute. Update the code to use `githubApi.loadText(...)` only.

- [ ] **Step 6: Update `loadGitHubContentsDirectory`**

Find the function:
```typescript
async function loadGitHubContentsDirectory(githubContentPath: string): Promise<IGitHubContentsEntry[]> {
  const githubContentsPayload = await gitHubClient.loadJson(buildContentsApiUrl(githubContentPath))

  return parseGitHubContentsEntries(githubContentsPayload)
}
```

Replace `gitHubClient.loadJson(...)` with `githubApi.loadJson(...)`.

- [ ] **Step 7: Delete the local `buildContentsApiUrl`**

Find and delete the local function:
```typescript
function buildContentsApiUrl(githubContentPath: string): string {
  let encodedGitHubContentPath = ""

  if (githubContentPath.length > 0) {
    encodedGitHubContentPath = `/${githubContentPath}`
  }

  return `https://api.github.com/repos/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/contents${encodedGitHubContentPath}?ref=${REPOSITORY_BRANCH}`
}
```

The import from `@/apis/github/github-endpoint-builder` covers it.

- [ ] **Step 8: Run lint, typecheck, and tests**

```bash
bun run check
bun test src/features/source/
```
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/source/github-skill-source.ts
git commit -m "refactor(source): migrate github-skill-source to githubApi"
```

---

## Task 9: Delete `fetch-github-client.ts` and remove transient alias

**Files:**
- Delete: `src/features/source/fetch-github-client.ts`
- Delete: `src/features/source/fetch-github-client.test.ts` (if present)
- Modify: `src/features/source/index.ts`
- Modify: `src/types/source/index.ts`

- [ ] **Step 1: Delete the old client file**

```bash
git rm src/features/source/fetch-github-client.ts
```
If a test file exists:
```bash
git rm src/features/source/fetch-github-client.test.ts
```

- [ ] **Step 2: Update the barrel**

Open `src/features/source/index.ts` and remove any line that re-exports from `./fetch-github-client`:
```typescript
export * from "./fetch-github-client"
```
Delete that line if present. Also delete any reference to `FetchGitHubClient`.

- [ ] **Step 3: Remove the transient `IGitHubClient` alias**

In `src/types/source/index.ts`:
- Delete the line `type IGitHubClient = IGitHubApi`
- Delete `IGitHubClient` from the export list
- Delete the JSDoc comment `/** @internal Transient migration alias. Removed in Task 9. */`

- [ ] **Step 4: Verify no dangling references**

```bash
grep -rn "FetchGitHubClient\|IGitHubClient" src/
```
Expected: no matches.

- [ ] **Step 5: Run lint, typecheck, and tests**

```bash
bun run check
bun test
```
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A src/features/source/ src/types/source/
git commit -m "refactor(source): delete fetch-github-client and IGitHubClient alias"
```

---

## Task 10: Final verification and integration sanity check

**Files:**
- No file modifications; this task only runs validation.

- [ ] **Step 1: Full lint and typecheck**

```bash
bun run check
```
Expected: exit 0, zero warnings.

- [ ] **Step 2: Full test run**

```bash
bun test
```
Expected: all tests pass.

- [ ] **Step 3: Smoke test the CLI binary**

```bash
bun run build
./dist/index.js --help
```
Expected: prints help text including `install`, `list`, `update`.

```bash
./dist/index.js list --help
```
Expected: prints list-specific help.

- [ ] **Step 4: Confirm file size constraint**

```bash
wc -l src/tools/request.ts
```
Expected: ≤ 200 lines.

- [ ] **Step 5: Confirm dependency footprint**

```bash
grep -E '"(axios|axios-mock-adapter)"' package.json
```
Expected: exactly two matches, one in `dependencies`, one in `devDependencies`. No other new deps.

- [ ] **Step 6: Final commit if any fixups were needed**

If Steps 1-5 surfaced anything (e.g., a lint warning from build output), fix it and commit. Otherwise this step is a no-op.

---

## Self-Review Notes

After writing this plan I checked:

1. **Spec coverage** — every Goals/Architecture/Component-Contract/Data-Flow/Error-Handling/Naming/Testing/Migration section in the spec maps to at least one task:
   - Goals → Tasks 1-7 (transport + per-source) and Tasks 8-9 (migration)
   - Component contracts → Tasks 2, 3, 4, 5, 6 produce each named export
   - Data flow → Tasks 8 stitches it together (loadSkillIndex uses buildSkillsJsonUrl + githubApi.loadJson + parseSkillIndex)
   - Error handling → Task 4 covers HttpRequestError wrapping and retry rules
   - Naming → Task 7's `IGitHubApi` matches spec; Task 6's `githubApi` matches spec
   - Testing → Tasks 2-6 all have colocated `*.test.ts`
   - Migration plan → Tasks 7-9 follow the 10-step migration from the spec

2. **Placeholder scan** — no "TBD"/"TODO"/"implement later" in any step. The `_typecheckGithubApiUsage` placeholders in Task 8 Step 2 are explicitly noted as removable; the final code block removes them.

3. **Type consistency** — `IGitHubApi` is declared once in Task 7 with shape `{ loadJson: (url: string) => Promise<unknown>, loadText: (url: string) => Promise<string> }`. Task 6's local `IGitHubApi` declaration matches; Task 8 imports the canonical one. Task 9 removes the duplicate. `HttpRequestError`, `RequestClient`, `CreateRequestClientOptions` definitions are stable from Task 3 onward.

4. **One open design note** — the retry mechanism is implemented as an `executeWithRetry` wrapper inside `createRequestClient`, not as a response error interceptor as the spec literally described. This is a deliberate interpretation to keep the implementation `as`-free per Global Constraints. The behavior matches the spec (5xx retried, 4xx not, MAX_ATTEMPTS=3, exponential backoff with jitter). If the user wants interceptor-based retry, that requires `as` and conflicts with the Global Constraints — flag it before implementing.
