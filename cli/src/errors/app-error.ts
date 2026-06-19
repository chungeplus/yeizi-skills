import type { AppErrorCodeName, AppErrorOptions, AppErrorParamsMap } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

export class AppError<TCode extends AppErrorCodeName = AppErrorCodeName> extends Error {
  public readonly code: TCode

  public readonly title: string

  public constructor(code: TCode, options?: AppErrorOptions<TCode>) {
    const definition = getAppErrorDefinition(code)
    const params = options?.params as AppErrorParamsMap[TCode]

    super(definition.buildMessage(params), {
      cause: options?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}
