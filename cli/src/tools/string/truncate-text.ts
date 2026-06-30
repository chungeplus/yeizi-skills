/**
 * 把文本按 {@link truncateLimit} 字符数截断，超出部分尾部追加省略号。
 *
 * @param text - 原始文本。
 * @param truncateLimit - 最大字符数。文本长度超过该值时会被截断。
 * @returns 截断后的展示文本；未超过时原样返回。
 *
 * @example
 * ```typescript
 * truncateText("简短", 60) // "简短"
 * ```
 *
 * @example
 * ```typescript
 * truncateText("非常长".repeat(100), 5) // "非常长非…"
 * ```
 */
function truncateText(text: string, truncateLimit: number): string {
  if (text.length <= truncateLimit) {
    return text
  }

  return `${text.slice(0, truncateLimit)}…`
}

export { truncateText }
