import type { AppErrorCodeName } from "./error-code"

import { APP_ERROR_TITLE_BY_CODE } from "./error-title"

interface IAppErrorOptions {
  cause?: unknown
}

class AppError extends Error {
  public readonly code: AppErrorCodeName

  public readonly title: string

  public constructor(
    code: AppErrorCodeName,
    message: string,
    options?: IAppErrorOptions,
  )
  public constructor(
    code: AppErrorCodeName,
    title: string,
    message: string,
    options?: IAppErrorOptions,
  )
  public constructor(
    code: AppErrorCodeName,
    titleOrMessage: string,
    messageOrOptions?: string | IAppErrorOptions,
    options?: IAppErrorOptions,
  ) {
    const hasExplicitTitle = typeof messageOrOptions === "string"
    const title = hasExplicitTitle ? titleOrMessage : APP_ERROR_TITLE_BY_CODE[code]
    const message = hasExplicitTitle ? messageOrOptions : titleOrMessage
    const resolvedOptions = hasExplicitTitle ? options : messageOrOptions

    super(message, { cause: resolvedOptions?.cause })

    this.name = new.target.name
    this.code = code
    this.title = title
  }
}

export { AppError }
