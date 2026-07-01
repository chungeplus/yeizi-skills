/**
 * 按 "," 拆分字符串为去重非空字符串列表。
 *
 * v2 把 csv option 的 Zod schema 校验替换为纯字符串拆分。
 * 理由：平台名 / 技能名长度极短、选项集合小，纯字符串校验已足够。
 * 如未来选项可能含复杂字符再加 zod schema。
 *
 * @param csvString - 逗号分隔字符串；全部为空白时返回空列表。
 * @returns 去重后的非空项目列表；全部分隔结果都为空白时返回空列表。
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
