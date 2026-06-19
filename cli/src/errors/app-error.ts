import type { AppErrorCodeName, IAppErrorParamsMap } from "./error-code"

import { getAppErrorDefinition } from "./error-code"

interface IAppErrorOptions {
  cause?: Error
  params?: IAppErrorParamsMap[AppErrorCodeName]
}

class AppError extends Error {
  public readonly code: AppErrorCodeName

  public readonly title: string

  public constructor(code: AppErrorCodeName, options?: IAppErrorOptions) {
    const definition = getAppErrorDefinition(code)
    const params = options?.params

    super(definition.buildMessage(params), {
      cause: options?.cause,
    })

    this.name = new.target.name
    this.code = code
    this.title = definition.title
  }
}

export { AppError }
