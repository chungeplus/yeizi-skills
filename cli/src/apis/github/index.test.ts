import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { describe, expect, test } from "bun:test"

import { createGitHubApi, githubApi } from "./index"

describe("createGitHubApi", () => {
  test("loadJson fetches JSON from api.github.com by default", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    mock.onGet("https://api.github.com/repos/foo/bar/contents/skills?ref=main").reply(200, [{ name: "codex" }])

    const result = await client.loadJson("https://api.github.com/repos/foo/bar/contents/skills?ref=main")
    expect(result).toEqual([{ name: "codex" }])

    mock.restore()
  })

  test("injects User-Agent header", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    let capturedHeaders: Record<string, string> | undefined
    mock.onGet("https://api.github.com/test").reply((config) => {
      capturedHeaders = config.headers as Record<string, string>
      return [200, {}]
    })

    await client.loadJson("https://api.github.com/test")
    expect(capturedHeaders?.["User-Agent"]).toBe("yeizi-skills")

    mock.restore()
  })

  test("loadText returns text body", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    mock.onGet("https://raw.githubusercontent.com/foo/bar/main/skills/codex/SKILL.md").reply(200, "# codex")

    const result = await client.loadText("https://raw.githubusercontent.com/foo/bar/main/skills/codex/SKILL.md")
    expect(result).toBe("# codex")

    mock.restore()
  })

  test("retries 500 like the underlying transport", async () => {
    const client = createGitHubApi()
    const mock = new MockAdapter(axios)
    let calls = 0
    mock.onGet("https://api.github.com/flaky").reply(() => {
      calls++
      return [500, {}]
    })

    // eslint-disable-next-line ts/await-thenable
    await expect(client.loadJson("https://api.github.com/flaky")).rejects.toThrow()
    expect(calls).toBe(3)

    mock.restore()
  })

  test("accepts custom baseURL via options", async () => {
    const client = createGitHubApi({ baseURL: "https://github.test" })
    const mock = new MockAdapter(axios)
    let capturedUrl: string | undefined
    mock.onGet("/repos/foo/bar").reply((config) => {
      capturedUrl = config.url
      return [200, {}]
    })

    await client.loadJson("/repos/foo/bar")
    expect(capturedUrl).toBe("/repos/foo/bar")

    mock.restore()
  })
})

describe("githubApi", () => {
  test("is a usable IGitHubApi instance with default config", () => {
    expect(typeof githubApi.loadJson).toBe("function")
    expect(typeof githubApi.loadText).toBe("function")
  })
})
