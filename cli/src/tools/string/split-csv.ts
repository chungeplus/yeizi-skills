/**
 * 把逗号分隔字符串拆成去重后的非空项目列表。
 *
 * @param csvString - 逗号分隔字符串；未做非空校验，全部为空白时返回空列表。
 * @returns 去重后的非空项目列表；全部分隔结果都为空白时返回空列表。
 *
 * @example
 * ```typescript
 * splitCsvString("codex,claude") // ["codex", "claude"]
 * splitCsvString("codex, codex ,claude") // ["codex", "claude"]
 * ```
 */
function splitCsvString(csvString: string): string[] {
  return Array.from(new Set(
    csvString
      .split(",")
      .map(optionItem => optionItem.trim())
      .filter(optionItem => optionItem.length > 0),
  ))
}

export { splitCsvString }
