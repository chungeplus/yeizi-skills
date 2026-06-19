import type { AppErrorCodeName, AppErrorOptions, AppErrorParamsMap } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

interface LegacyAppErrorOptions {
  cause?: Error
}

export class AppError<TCode extends AppErrorCodeName = AppErrorCodeName> extends Error {
  public readonly code: TCode

  public readonly title: string

  public constructor(
    code: TCode,
    options?: AppErrorOptions<TCode>,
  )
  public constructor(
    code: TCode,
    title: string,
    message: string,
    options?: LegacyAppErrorOptions,
  )
  public constructor(
    code: TCode,
    titleOrOptions?: string | AppErrorOptions<TCode>,
    message?: string,
    legacyOptions?: LegacyAppErrorOptions,
  ) {
    if (typeof titleOrOptions === "string") {
      super(message ?? "", { cause: legacyOptions?.cause })

      this.name = new.target.name
      this.code = code
      this.title = titleOrOptions

      return
    }

    const definition = getAppErrorDefinition(code)
    const params = titleOrOptions?.params as AppErrorParamsMap[TCode]

    super(definition.buildMessage(params), {
      cause: titleOrOptions?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}
