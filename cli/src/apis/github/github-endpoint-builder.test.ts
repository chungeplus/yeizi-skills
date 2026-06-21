import { describe, expect, test } from "bun:test"

import {
  buildContentsApiUrl,
  buildRawFileUrl,
  buildSkillsJsonUrl,
} from "./github-endpoint-builder"

describe("buildSkillsJsonUrl", () => {
  test("returns a raw.githubusercontent.com URL pointing at skills.json", () => {
    const url = buildSkillsJsonUrl()
    expect(url).toMatch(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/skills\.json$/)
  })
})

describe("buildContentsApiUrl", () => {
  test("encodes the path under the contents endpoint", () => {
    const url = buildContentsApiUrl("skills/codex")
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/skills\/codex\?ref=/)
  })

  test("handles empty path (root)", () => {
    const url = buildContentsApiUrl("")
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\?ref=/)
  })
})

describe("buildRawFileUrl", () => {
  test("returns a raw.githubusercontent.com URL for the given path", () => {
    const url = buildRawFileUrl("skills/codex/SKILL.md")
    expect(url).toMatch(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/skills\/codex\/SKILL\.md$/)
  })
})
