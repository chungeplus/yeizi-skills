import { rm } from "node:fs/promises"
import { downloadRepository } from "./download-repository"

describe("downloadRepository", () => {
  it("应该下载完整仓库并返回临时目录路径", async () => {
    const tempDir = await downloadRepository()

    expect(typeof tempDir).toBe("string")
    expect(tempDir.length).toBeGreaterThan(0)

    // 验证仓库根目录有 skills.json
    const skillsPath = `${tempDir}/skills.json`
    const skillsExists = await import("node:fs/promises").then(fs => fs.access(skillsPath).then(() => true).catch(() => false))
    expect(skillsExists).toBe(true)

    // 清理
    await rm(tempDir, { force: true, recursive: true })
  }, 60000)
})
