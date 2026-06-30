import { AppError, AppErrorCode } from "@/error"
import { removeDirectory } from "@/tools/filesystem"
import { getRepositoryDirectoryPath } from "./repository"

/**
 * 删除已下载的仓库临时目录，删除失败时统一抛出 {@link AppError}。
 *
 * @param repositoryDirectoryPath - 待删除的仓库临时目录路径。
 * @throws 删除过程中底层抛出 {@link Error} 时，包装为 {@link AppErrorCode.DIRECTORY_REMOVE_FAILED} 错误。
 */
async function removeRepositoryDirectory(repositoryDirectoryPath: string): Promise<void> {
  try {
    await removeDirectory(repositoryDirectoryPath)
  }
  catch (error) {
    if (error instanceof Error) {
      throw new AppError(AppErrorCode.DIRECTORY_REMOVE_FAILED, {
        params: { directoryPath: repositoryDirectoryPath },
        cause: error,
      })
    }

    throw error
  }
}

/**
 * 拉取远端仓库到临时目录、运行 runner、最终清理临时目录的统一包装。
 * install / list 等需要 \"拉一次、用一次\" 仓库内容的命令都应走这个高阶函数、
 * 避免各自写 try/finally 与 removeDirectory 模板。
 *
 * @param runner - 接收临时仓库路径、返回业务结果或抛错的回调。
 * @returns runner 的返回值。
 * @throws runner 抛错透传；cleanup 失败抛 AppError(DIRECTORY_REMOVE_FAILED)。
 */
async function runWithSkillRepository<T>(
  runner: (repositoryDirectoryPath: string) => Promise<T>,
): Promise<T> {
  const repositoryDirectoryPath = await getRepositoryDirectoryPath()

  try {
    return await runner(repositoryDirectoryPath)
  }
  finally {
    await removeRepositoryDirectory(repositoryDirectoryPath)
  }
}

export { runWithSkillRepository }
