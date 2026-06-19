# AppError Redesign

## Status

Approved design draft for review before implementation planning.

## Background

The current CLI error API is:

```ts
new AppError(AppErrorCode.UNEXPECTED_ERROR, "程序异常", "发生了未知错误。")
```

This design already centralizes `code`, but still lets each call site supply `title` and `message`. Over time, that creates drift risk:

- the same `code` can end up with different `title` values
- the same `code` can end up with different message tone or scope
- the stable error identifier and the displayed content are maintained in different places

The CLI is built around Commander, so the `src/errors/*` area is intentionally allowed to include:

- project error model
- Commander adaptation
- CLI error rendering

This redesign keeps that directory boundary, but tightens the API inside it.

## Constraints

- The project does not allow `unknown` or `any`.
- Commander-specific handling stays inside `src/errors/*`.
- CLI rendering may stay inside `src/errors/*`.
- Error-only shared types should stay inside the error domain.
- `src/errors/types/*` is not needed at the current project size.

## Goals

- Make `code` the single source of truth for error identity.
- Prevent call sites from freely inventing `title` and `message`.
- Keep dynamic, user-facing context available where needed.
- Keep the error system easy to maintain from within `src/errors/*`.
- Preserve a clear path for Commander errors to become project `AppError` instances.

## Non-Goals

- Introducing a large exception hierarchy.
- Moving error rendering to a different top-level domain.
- Generalizing this error system beyond the CLI.
- Adding a new `src/errors/types/*` subtree now.

## External References

- Node.js errors: stable identification should rely on `error.code`, not display text.
  - https://nodejs.org/api/errors.html
- tRPC error handling: code-centered error modeling with `cause` preserved.
  - https://trpc.io/docs/server/error-handling
  - https://raw.githubusercontent.com/trpc/trpc/main/packages/server/src/unstable-core-do-not-import/error/TRPCError.ts
- Prisma error reference: stable error codes with structured error meaning.
  - https://www.prisma.io/docs/orm/reference/error-reference
- Commander source: `CommanderError` exposes `code`, `exitCode`, and `message`.
  - https://raw.githubusercontent.com/tj/commander.js/master/lib/error.js
  - https://raw.githubusercontent.com/tj/commander.js/master/lib/command.js

## Decision Summary

The new error API will be:

```ts
throw new AppError(AppErrorCode.UNEXPECTED_ERROR)

throw new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillName },
})

throw new AppError(AppErrorCode.GITHUB_REQUEST_FAILED, {
  params: { statusCode: 404 },
  cause: error,
})
```

Call sites may provide:

- `code`
- optional `params`
- optional `cause`

Call sites may not provide:

- raw `title`
- raw `message`

`title` and `message` are derived from a central error-definition table keyed by `code`.

## Core Design

### 1. Code-Centered Error Definitions

`AppErrorCode` remains the stable identifier set.

Each code maps to one definition:

- `title`
- `buildMessage(params)`
- optional future metadata such as `exitCode`

Example shape:

```ts
export const APP_ERROR_DEFINITIONS = {
  [AppErrorCode.UNEXPECTED_ERROR]: {
    title: "程序异常",
    buildMessage: () => "程序执行失败，请稍后重试。",
  },
  [AppErrorCode.SKILL_NOT_FOUND]: {
    title: "技能不存在",
    buildMessage: (params: { skillName: string }) => `未找到技能“${params.skillName}”。`,
  },
} as const
```

This makes `code` the single source of truth for:

- what error this is
- how it is titled
- how its message is constructed

### 2. AppError Constructor Contract

`AppError` will no longer accept free-form `title` or `message`.

Target shape:

```ts
new AppError(code)
new AppError(code, { params, cause })
```

This is intentionally stricter than the current constructor. It prevents semantic drift and forces call sites to either:

- use the existing code and its allowed params
- or introduce a new code when the error meaning is different

### 3. Params Instead of Free Message Overrides

Dynamic content should be passed through typed params rather than free text.

Good:

```ts
new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  params: { skillName },
})
```

Not allowed:

```ts
new AppError(AppErrorCode.SKILL_NOT_FOUND, {
  message: `未找到技能“${skillName}”`,
})
```

This is the main difference between the proposed design and the current design. Without this restriction, centralizing only `title` would not be a meaningful improvement.

### 4. When to Reuse a Code vs Add a New One

Reuse an existing code when both statements are true:

- it is the same user-facing error category
- the recommended user action is the same

Add a new code when either statement is false:

- the user is facing a meaningfully different kind of error
- the guidance or recovery path should differ

Examples:

- `SKILL_NOT_FOUND` with different skill names should reuse one code.
- `PACKAGE_CONFIG_INVALID` and `PACKAGE_BIN_CONFIG_MISSING` should remain separate codes.
- GitHub timeout, GitHub auth failure, and GitHub generic failure may be separate codes if they need different guidance.

## Type Design

The project forbids `unknown` and `any`, so the error types stay explicit.

Recommended principles:

- `cause?: Error`
- `handleFatalError(error: Error): void`
- boundary normalization of non-`Error` values remains at the CLI entry point

Shared error-domain types should live in:

- local file scope when used once
- `src/errors/error.types.ts` when shared across multiple error files

Do not create `src/errors/types/*` now.

## File Layout

Recommended target layout:

- `src/errors/app-error.ts`
  - `AppError`
- `src/errors/error-code.ts`
  - `AppErrorCode`
  - `AppErrorCodeName`
  - `APP_ERROR_DEFINITIONS`
  - related helper types if still small
- `src/errors/error.types.ts`
  - only shared error-domain types if needed
- `src/errors/commander-error-adapter.ts`
  - `buildCommanderAppError`
  - `buildCommanderErrorMessage`
  - `isCommanderNonFailure`
- `src/errors/fatal-error-handler.ts`
  - top-level orchestration only
- `src/errors/error-display.ts`
  - CLI rendering
- `src/errors/index.ts`
  - barrel exports

This keeps all error work in one domain while avoiding one oversized file.

## Fatal Error Flow

Target orchestration:

```ts
function handleFatalError(error: Error): void {
  if (isCommanderNonFailure(error)) {
    process.exitCode = error.exitCode
    return
  }

  const appError = normalizeFatalError(error)

  renderFatalError(appError)
  process.exitCode = 1
}
```

Recommended internal split:

- `isCommanderNonFailure(error)`
- `normalizeFatalError(error)`
- `buildCommanderAppError(error)`
- `renderFatalError(appError)`

Important rule:

- prefer `CommanderError.exitCode` for success-or-failure semantics
- do not rely only on a hard-coded `"commander.help"` string check

## Commander Adaptation

Commander adaptation remains inside `src/errors/*` by design.

The adapter should:

- map `CommanderError.code` to project `AppErrorCode`
- build localized messages in one contained place
- keep any parsing of Commander English `message` strings isolated

This parsing is a controlled weak point because Commander does not expose richer structured fields for all cases. The weakness should stay in one adapter module instead of leaking across the codebase.

## Migration Plan

1. Introduce the new error definition table and constructor shape.
2. Reorganize `src/errors/*` without changing every call site at once.
3. Migrate high-frequency errors first:
   - `UNEXPECTED_ERROR`
   - `PROMPT_CANCELLED`
   - `NON_INTERACTIVE_OPTION_REQUIRED`
   - `SKILL_NOT_FOUND`
   - `GITHUB_REQUEST_FAILED`
4. Remove the old `new AppError(code, title, message)` constructor path.

Small-step migration is preferred over a single risky rewrite.

## Testing Strategy

Priority tests:

1. `AppError` construction
   - code is preserved
   - title comes from definitions
   - message is built from params
   - cause is preserved

2. Commander adaptation
   - unknown option
   - missing mandatory option
   - option missing argument
   - excess arguments

3. Fatal error handling
   - `AppError` passes through unchanged
   - `CommanderError` is normalized correctly
   - prompt cancel becomes the correct app error
   - help flows do not render as fatal failures

## Trade-Offs

### Benefits

- stronger consistency across all call sites
- cleaner long-term localization and copy control
- clearer code-review standard for new error cases
- better alignment with code-centered error models used in mature projects

### Costs

- adding a new error may require touching the definition table
- some dynamic messages need typed params designed up front
- migration requires updating existing constructor call sites

These costs are intentional. They trade a small amount of convenience for much stronger consistency.

## Final Recommendation

Adopt a strict `code + params + cause` error API inside `src/errors/*`.

Keep error model, Commander adaptation, and CLI rendering in the same domain directory, but split them into focused files. Do not create `src/errors/types/*` at the current scale. Use typed params instead of free-form messages, and treat new error codes as the correct tool whenever the user-facing meaning or guidance changes.
