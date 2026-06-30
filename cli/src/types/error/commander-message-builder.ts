import type { CommanderError } from "commander"

/**
 * Commander 错误到中文提示消息的构建函数。
 */
type CommanderMessageBuilder = (error: CommanderError) => string

/**
 * Commander 错误码到消息构建函数的映射。
 */
type CommanderMessageBuilderMap = Record<string, CommanderMessageBuilder>

export type { CommanderMessageBuilderMap }
