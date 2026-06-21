# Source API Layer Redesign

## Status

Approved design draft for review before implementation planning.

## Background

The CLI currently makes HTTP calls in one place: `src/features/source/fetch-github-client.ts`. The architecture looks like:

```
src/features/source/
  fetch-github-client.ts     # native fetch + AbortController timeout + AppError mapping
  github-skill-source.ts     # domain: load skill index, files, version check
  index.ts                   # barrel
```

A single class `FetchGitHubClient` implements `IGitHubClient` and is consumed as a module-level instance `gitHubClient` inside `github-skill-source.ts`. The class already does timeout handling, error code mapping (`GITHUB_REQUEST_FAILED_*`), and a single `User-Agent` header — so it is not unencapsulated.

However, the user raised four converging motivations:

1. **Reliability / fault tolerance** — no retry, no rate-limit awareness, no jittered backoff. A single network blip fails the whole command.
2. **Future multi-source** — the project may eventually add sources beyond GitHub (e.g., npm registry, a private mirror). Today's `IGitHubClient` interface and `FetchGitHubClient` class are GitHub-shaped; a second source would either fork the class or refactor.
3. **Best-practice alignment** — common frontend and CLI patterns centralise HTTP transport behind a factory + interceptors + per-source modules. The current project predates that pattern.
4. **Testability / observability** — there is no seam to inject mocks for non-trivial network conditions, and no hook to attach logging or metrics without editing the client itself.

The current code already proves the "interface + concrete impl + module-level instance" shape works. This redesign layers on top of that shape rather than replacing it: introduce a transport layer that owns axios + retry + error normalisation, expose per-source modules that wire source-specific config on top, and keep the domain layer (`features/source/`) unchanged in spirit but reduced in scope.

## Constraints

- The project does not allow `unknown` or `any` at type positions. `Promise<unknown>` is acceptable because `unknown` here means "data not yet validated", not "anything goes".
- TypeScript strict mode is on. No `as` for type assertions; narrowing must be explicit (`instanceof`, schema parse, etc.).
- All naming must follow the existing project rules (see `naming-rules.md`): boolean values `isXxx`, computed values `getXxx`, external content `loadXxx`, builders `build*`, no `readonly` on parameters.
- TSDoc must follow `comment-rules.md`: only caller-facing contract — purpose, result, input constraints, throws. `@returns` does not prescribe how the caller should use the return value.
- The project's dependency policy stays minimal: add `axios` only. No `axios-retry`, no `ky`, no `msw`. Custom interceptors cover retry; `axios-mock-adapter` covers test mocking.
- Type-only interfaces continue to live under `src/types/<domain>/index.ts`. Do not introduce a separate `src/types/api/` subtree at this scope.
- File-level single responsibility: each file holds one concept. No mixing of "transport" with "source wiring" with "domain logic".

## Goals

- Centralise all HTTP transport code (`axios`, retry policy, error type, interceptors) in a single file: `src/tools/request.ts`.
- Expose per-source modules under `src/apis/<source>/`, each with its own factory and a default instance.
- Keep the existing domain layer in `src/features/source/` but reduce its HTTP knowledge: it imports from `@/apis/github`, not from a transport class.
- Provide a clean retry story with a pure-function `shouldRetry` policy and a `getRetryDelayMs` backoff.
- Provide a normalised error type `HttpRequestError` that carries `status`, `response`, and a `retryable` flag, so the domain layer can map it to `AppErrorCode` deterministically.
- Make test seams explicit: a factory takes options and returns a fresh client; pure-function modules (`retry-policy`, `endpoint-builder`) need no mocks.

## Non-Goals

- Introducing a full plugin system (octokit-style `octokit.hook.wrap(...)`).
- GraphQL support — REST only.
- Browser compatibility — Node + Bun only.
- A new `src/apis/<source>/types/` subtree; types stay in `src/types/source/index.ts`.
- Replacing the existing `AppError` model. `HttpRequestError` lives at the transport layer; `AppError` lives at the domain layer. They are different kinds of errors with different lifetimes.
- Adding new dependency management beyond `axios`. No `axios-retry`, no `axios-mock-adapter` as a runtime dep — only as a dev dep.
- Backwards compatibility with `IGitHubClient` / `FetchGitHubClient`. The rename to `IGitHubApi` is a clean break; the old names disappear.

## External References

Naming and structural choices are grounded in the following real-world projects, not invented in isolation.

- `https://github.com/PanJiaChen/vue-element-admin` — `utils/request.js` default-exports an axios instance `service`; per-resource modules in `api/<resource>.js`. Source for: file naming `request.ts`, default-instance export pattern, per-source subdirectory with `index.ts`.
- `https://github.com/ant-design/ant-design-pro` — `services/request.ts` default-exports `request`; resources in `services/api/`. Source for: same patterns, confirms the Chinese frontend convention.
- `https://github.com/vbenjs/vue-vben-admin` — `utils/http/axios.ts` exports `VAxios` class + `createAxios()` factory. Source for: factory function naming `createXxxClient` / `createXxxApi`.
- `https://github.com/octokit/octokit.js` — `Octokit` main class, `@octokit/request` pure function, `@octokit/endpoint` URL builder, `RequestError` normalised error, plugin-based hooks. Source for: separating endpoint (pure) from request (side effect); `HttpRequestError` carries status; hooks are arrays not single middlewares.
- `https://github.com/sindresorhus/ky` — `ky.create(defaultOptions)` factory, `HTTPError` error class, hook arrays (`beforeRequest` / `afterResponse` / `beforeRetry` / `beforeError`). Source for: hook-as-array pattern, factory-derived instance.
- `https://github.com/oclif/core` — `Command` with `init/run/catch`, named `Hook` events, `Config` aggregation. Source for: confirming the layered command → domain → transport shape, even though oclif's Plugin loading is not adopted here.

## Architecture Overview

```
                ┌──────────────────────────────────────┐
                │ commands/install|list|update         │
                └──────────────┬───────────────────────┘
                               │
                ┌──────────────▼───────────────────────┐
                │ features/source/github-skill-source │  domain
                └──────────────┬───────────────────────┘
                               │  loadJson / loadText
                ┌──────────────▼───────────────────────┐
                │ apis/github/                         │  per-source HTTP
                │   index.ts: createGitHubApi          │
                │   endpoint-builder.ts: build*Url     │
                └──────────────┬───────────────────────┘
                               │  AxiosInstance.get(...)
                ┌──────────────▼───────────────────────┐
                │ tools/request.ts                     │  transport
                │   createRequestClient                │
                │   HttpRequestError                   │
                │   shouldRetry / getRetryDelayMs      │
                │   onBeforeRequest / onAfterResponse  │
                │           / onError                  │
                └──────────────────────────────────────┘
                               │
                          network
```

Three layers, each with one direction of dependency:

- `commands/` → `features/source/`
- `features/source/` → `apis/github/`
- `apis/github/` → `tools/request/`

No layer skips. No layer reaches back up.

## Directory Structure

```
src/
  tools/
    request.ts                        # ALL network transport: axios + retry + error
                                      # (the only file with `fetch` / axios calls)
  apis/
    github/
      index.ts                        # createGitHubApi() + default githubApi
      github-endpoint-builder.ts      # pure URL builders
    # future sources follow the same shape:
    # apis/npm/index.ts, apis/private/index.ts, ...
  features/
    source/
      github-skill-source.ts          # domain, depends on @/apis/github
      index.ts                        # barrel (unchanged shape)
  types/
    source/
      index.ts                        # IGitHubApi (replaces IGitHubClient)
                                      # ISkillSource (unchanged)
  schemas/
    github-contents-entry-schema.ts   # unchanged
    skill-index-schema.ts             # unchanged
```

Files that are removed:

- `src/features/source/fetch-github-client.ts` — its responsibilities split into `tools/request.ts` (transport) and `apis/github/index.ts` (source wiring).

Files that are unchanged:

- `src/errors/app-error.ts`, `src/errors/error-code.ts`, `src/errors/*` — `AppError` and `AppErrorCode` stay as the domain-side error model.
- `src/commands/**`, `src/features/platform/**`, `src/features/skill/**` — out of scope.

## Component Contracts

### `src/tools/request.ts`

One file, one concept: HTTP transport. Estimated 120–150 lines.

Exports:

| Name | Kind | Purpose |
|---|---|---|
| `createRequestClient(options?)` | function | Factory. Returns an `AxiosInstance` with all interceptors pre-installed. Pure factory: each call returns a fresh instance. |
| `HttpRequestError` | class | Normalised error. Fields: `status: number \| null`, `originalResponse: Response \| null`, `retryable: boolean`, plus inherited `message`. |
| `RETRY_POLICY` | const object | `MAX_ATTEMPTS`, `BASE_DELAY_MS`, `BACKOFF_MULTIPLIER`, `MAX_DELAY_MS`. |
| `shouldRetry(error, attempt)` | function (predicate) | Pure. Given a `HttpRequestError` and current attempt number, returns `boolean`. Encodes the retry rules. |
| `getRetryDelayMs(attempt)` | function | Pure. Computes backoff with jitter for the given attempt. |
| `onBeforeRequest(config)` | function | Interceptor. Injects `User-Agent`, request id, any per-call headers. Returns the (possibly augmented) config. |
| `onAfterResponse(response)` | function | Interceptor. Returns response unchanged. Placeholder for future metrics. |
| `onError(error)` | function | Interceptor. Wraps `AxiosError` into `HttpRequestError`. The retry loop lives here: it calls `shouldRetry` and either rethrows or replays the request. |
| `CreateRequestClientOptions` | type | `baseURL?: string`, `headers?: Record<string, string>`, `timeoutMs?: number`. |

Non-responsibilities:

- Does not know about GitHub URLs, headers, or schemas.
- Does not import from `src/features/` or `src/apis/`.
- Does not throw `AppError`. Only `HttpRequestError`.

### `src/apis/github/index.ts`

Per-source wiring. Estimated 40–60 lines.

Exports:

| Name | Kind | Purpose |
|---|---|---|
| `IGitHubApi` | interface | `{ loadJson: (url: string) => Promise<unknown>, loadText: (url: string) => Promise<string> }`. Replaces the old `IGitHubClient`. |
| `createGitHubApi(options?)` | function | Factory. Internally calls `createRequestClient(...)` with GitHub-specific config (`baseURL`, `User-Agent`, timeout). Returns an `IGitHubApi`. |
| `githubApi` | const | Default instance: `createGitHubApi()`. For the common case where no customisation is needed. |

Non-responsibilities:

- Does not build URLs (that is `endpoint-builder`'s job).
- Does not validate responses (that is `features/source/`'s job, via schemas).
- Does not throw `AppError`. Only propagates `HttpRequestError`.

### `src/apis/github/github-endpoint-builder.ts`

Pure URL builders. Estimated 30–50 lines.

Exports:

| Name | Kind | Purpose |
|---|---|---|
| `buildSkillsJsonUrl(branch)` | function | URL for `skills.json` on `raw.githubusercontent.com`. |
| `buildContentsApiUrl(path, branch)` | function | URL for `api.github.com/repos/.../contents`. |
| `buildRawFileUrl(path, branch)` | function | URL for a raw file on `raw.githubusercontent.com`. |

Naming aligns with the project's existing `build*` convention (`buildPlatformTargets`, `buildSelectedSkillEntries`, `buildComparisonRows`).

Non-responsibilities:

- Pure functions. No I/O, no `await`, no axios. Trivially testable.

### `src/features/source/github-skill-source.ts`

Reduced scope. The HTTP-related code disappears; only domain logic remains.

Functions unchanged in behaviour but trimmed in imports:

- `loadSkillIndex()` — calls `githubApi.loadJson(buildSkillsJsonUrl(...))`, then schema validates.
- `loadSkillFiles(name)` — calls `githubApi.loadJson(buildContentsApiUrl(...))` for the directory, recurses, calls `githubApi.loadText(buildRawFileUrl(...))` for files.
- `validateRemoteSkillVersion(...)` — unchanged.

Imports replaced:

- Removes `import { FetchGitHubClient } from "./fetch-github-client"`
- Removes `import type { IGitHubClient } from "@/types/source"`
- Adds `import { githubApi } from "@/apis/github"`
- Adds `import type { IGitHubApi } from "@/types/source"`

### `src/types/source/index.ts`

- Remove `IGitHubClient`.
- Add `IGitHubApi` with the same `loadJson` / `loadText` shape.
- Keep `ISkillSource`, `IDownloadedSkillFile`, `IGitHubContentsEntry` unchanged.

## Data Flow

### Successful path: `yeizi install codex`

1. `commands/install/command.ts:execute` parses `--skill codex`, calls into the install flow.
2. `loadSkillIndex()` in `features/source/github-skill-source.ts` is invoked.
3. Inside `loadSkillIndex`:
   - `buildSkillsJsonUrl(branch)` returns a URL string. Pure.
   - `githubApi.loadJson(url)` is called.
4. `githubApi.loadJson` calls `requestClient.get(url)` on the underlying axios instance.
5. The axios request passes through `onBeforeRequest` (injects `User-Agent`).
6. Network responds with 200 + JSON body.
7. `onAfterResponse` passes through.
8. `requestClient.get` resolves with `{ data, status, headers }`. `githubApi.loadJson` returns `data` typed as `unknown`.
9. Back in `loadSkillIndex`, `skillIndexSchema.parse(unknownData)` validates and narrows.
10. Domain `ISkillIndex` flows up to the command.

### Failure path: GitHub returns 500

1. Steps 1–5 same as above.
2. Network responds with 500.
3. axios throws `AxiosError`.
4. `onError` interceptor catches it:
   - Wraps as `HttpRequestError` with `status: 500`, `retryable: true`.
   - Calls `shouldRetry(error, 1)` → `true` (5xx is retryable).
   - Awaits `getRetryDelayMs(1)` (e.g., ~500ms + jitter).
   - Replays the request by calling the underlying axios instance again with the same config — implemented as an in-place loop in `onError`, no `axios-retry` library.
5. If the retry succeeds, return the response (steps 7–10).
6. If all `MAX_ATTEMPTS` retries fail, the final `HttpRequestError` propagates out of `githubApi.loadJson`.
7. `features/source/github-skill-source.ts` catches it and throws `new AppError(AppErrorCode.GITHUB_REQUEST_FAILED_STATUS_CODE, { params: { statusCode: 500 }, cause: error })`.
8. `commands/...` does not catch; `fatal-error-handler` renders and exits.

### Failure path: schema validation fails

1. Steps 1–10 of success path, but the JSON body is malformed.
2. `skillIndexSchema.parse(unknownData)` throws `ZodError`.
3. `features/source/github-skill-source.ts` catches and throws `new AppError(AppErrorCode.SKILL_INDEX_INVALID, { cause: error })`.
4. Rendered and exited.

## Error Handling

Error lifetime:

```
AxiosError
   │ (onError interceptor)
   ▼
HttpRequestError      ← transport layer; carries status/retryable
   │ (re-thrown by githubApi.loadJson)
   ▼
AppError              ← domain layer; carries AppErrorCode + cause
   │ (rendered by fatal-error-handler)
   ▼
user-visible message
```

Layer-by-layer error rules:

| Layer | Throws | Catches | Maps to |
|---|---|---|---|
| `tools/request.ts` | `HttpRequestError` | `AxiosError` | (none — error type only) |
| `apis/github/index.ts` | (re-throws `HttpRequestError`) | (none) | (none — passthrough) |
| `features/source/github-skill-source.ts` | `AppError` | `HttpRequestError` (status → `AppErrorCode.GITHUB_REQUEST_FAILED_STATUS_CODE` or `_NETWORK_RETRY` or `_TIMEOUT`), `ZodError` (`AppErrorCode.GITHUB_CONTENTS_INVALID` or `SKILL_INDEX_INVALID`) | `AppErrorCode` |
| `commands/*` | (re-throws `AppError`) | (none) | (passthrough to `fatal-error-handler`) |

Retry rules encoded in `shouldRetry`:

| Condition | Retryable |
|---|---|
| `status === null` (network error) | yes |
| `500 <= status < 600` | yes |
| `status === 408` (request timeout) | yes |
| `status === 429` (rate limited) | yes |
| `400 <= status < 500` (other) | no |
| `status >= 600` (non-standard) | no |
| `attempt >= MAX_ATTEMPTS` | no |

Backoff (`getRetryDelayMs`):

- `delay = min(BASE_DELAY_MS * BACKOFF_MULTIPLIER^attempt, MAX_DELAY_MS)`
- `delay = delay + random(0, delay * 0.25)` (25% jitter)

Defaults:

- `MAX_ATTEMPTS = 3`
- `BASE_DELAY_MS = 500`
- `BACKOFF_MULTIPLIER = 2`
- `MAX_DELAY_MS = 5_000`
- `GITHUB_REQUEST_TIMEOUT_MS = 15_000` (kept from current code)

## Naming Decisions

| Name | Decision | Evidence |
|---|---|---|
| `request.ts` (file) | match user-stated preference; matches `utils/request.{js,ts}` convention in `vue-element-admin`, `ant-design-pro` | user statement; `PanJiaChen/vue-element-admin`; `ant-design/ant-design-pro` |
| `createRequestClient` (factory) | `create` + `Request` (file) + `Client` (suffix) | `vbenjs/vue-vben-admin` `createAxios`; `sindresorhus/ky` `ky.create` |
| `HttpRequestError` (class) | `Http` + `Request` + `Error` | `octokit/octokit.js` `RequestError` + `sindresorhus/ky` `HTTPError` combined |
| `shouldRetry` (predicate) | verb predicate, no `is` prefix | `axios-retry` source; octokit `plugin-retry` internal name; rule: `isXxx` is for type guards, not predicates |
| `getRetryDelayMs` (getter) | `get` for computed value | project rule: `getXxx` for values |
| `onBeforeRequest` / `onAfterResponse` / `onError` (interceptors) | `on` prefix to distinguish from domain functions | axios interceptor terminology; ky hook naming |
| `apis/github/` (directory) | top-level `apis/` per user-stated preference; per-source subdirectory | user statement; `vbenjs/vue-vben-admin` per-source layout |
| `IGitHubApi` (interface) | rename from `IGitHubClient` to match `apis/` directory | consistency: directory name → interface suffix |
| `createGitHubApi` (factory) | mirrors `createRequestClient` | symmetry with transport layer |
| `loadJson` / `loadText` (methods) | kept from existing `IGitHubClient` | avoid breaking call sites; project rule: `loadXxx` for external content |
| `githubApi` (default instance) | lowercase camelCase const, default export | `vue-element-admin` `service`; `ant-design-pro` `request` |
| `buildSkillsJsonUrl` / `buildContentsApiUrl` / `buildRawFileUrl` (builders) | `build*` matches project convention | existing `buildPlatformTargets`, `buildSelectedSkillEntries`, `buildComparisonRows`, `buildUpdateRows` |

## Testing Strategy

Per-file test approach, with `bun test` runner:

| File | Test type | Tooling |
|---|---|---|
| `tools/request.ts` retry logic | unit | pure `shouldRetry` / `getRetryDelayMs` tests, no axios |
| `tools/request.ts` interceptor wiring | integration | `axios-mock-adapter` (dev dep) intercepts and verifies retry count, error wrapping |
| `apis/github/github-endpoint-builder.ts` | unit | pure function tests, no mocking |
| `apis/github/index.ts` | integration | `axios-mock-adapter` to verify baseURL, headers, retry behaviour |
| `features/source/github-skill-source.ts` | integration | mock `githubApi` at module boundary; verify schema failure paths map to `AppErrorCode` |

Test files colocated as `*.test.ts`. Bun discovers automatically.

Coverage targets (informal):

- `shouldRetry` — every branch of the retryable table.
- `getRetryDelayMs` — jitter range, cap at `MAX_DELAY_MS`.
- `endpoint-builder` — empty path, deep path, special characters (encoding).
- `request.ts` retry — 5xx retries up to `MAX_ATTEMPTS`; 4xx (except 408/429) does not retry; final failure surfaces as `HttpRequestError` with correct `status` and `retryable`.
- `github-skill-source` — `AppError` thrown with the correct `AppErrorCode` for each error class.

## Migration Plan

Sequenced so the build is green at every step.

1. **Add `axios` dependency.** `bun add axios`. Update `package.json`.
2. **Create `src/tools/request.ts`** with all transport code. No consumers yet — only unit tests on `shouldRetry` and `getRetryDelayMs`.
3. **Create `src/apis/github/github-endpoint-builder.ts`** with pure URL builders. No consumers yet — only unit tests.
4. **Create `src/apis/github/index.ts`** with `createGitHubApi` and default `githubApi`. Internal tests with `axios-mock-adapter`.
5. **Update `src/types/source/index.ts`** — replace `IGitHubClient` with `IGitHubApi`. At this step, internally export `IGitHubClient` as a TypeScript type alias `type IGitHubClient = IGitHubApi` so the rename is atomic across the type files (steps 5→6). This alias is **not a public API commitment** — it exists only so step 6 can swap files in one commit, and step 8 removes it.
6. **Update `src/features/source/github-skill-source.ts`** — replace `gitHubClient` (from `FetchGitHubClient`) with `githubApi` (from `@/apis/github`). Replace `loadGitHubResponse` direct fetch with `githubApi.loadJson` / `loadText`. Replace inline URL strings with calls to `endpoint-builder`.
7. **Run lint, typecheck, tests.** All green.
8. **Delete `src/features/source/fetch-github-client.ts`**. Remove `IGitHubClient` type alias.
9. **Remove temporary type alias** in `types/source/index.ts`. `IGitHubApi` is now the sole interface.
10. **Final pass:** verify no remaining `import` references to `FetchGitHubClient` or `IGitHubClient`. Re-run lint, typecheck, tests.

Each step is independently committable; the build stays green.

## Open Questions

- **GitHub rate-limit handling beyond HTTP 429.** Should we read the `X-RateLimit-Remaining` / `X-RateLimit-Reset` response headers and proactively throttle? Deferred — not in scope of this redesign; can be added later as a source-specific interceptor in `apis/github/index.ts`.
- **Authentication.** Currently no GitHub token. When added, the token source (env var, `gh auth token`) and how it threads into `createGitHubApi(options)` need a separate design. Deferred.
- **Caching of `skills.json`.** A separate concern; would belong in `features/source/` as a wrapper around `loadSkillIndex`. Not part of this redesign.
