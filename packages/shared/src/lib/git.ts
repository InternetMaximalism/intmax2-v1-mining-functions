import path from "path";
import fs from "fs/promises";
import simpleGit from "simple-git";
import { config } from "../config";
import { logger } from "../lib/logger";

const localPath = path.join(__dirname, "tmp");
const remoteUrl = config.GITHUB_MINING_REPO_URL;

interface FileToUpload {
  folderPath: string;
  filename: string;
  buffer: Buffer;
}

export const gitOperations = async (files: FileToUpload[]) => {
  try {
    const remoteUrlWithAuth = remoteUrl.replace(
      "https://",
      `https://${config.GITHUB_ACCESS_TOKEN}@`,
    );

    await simpleGit().clone(remoteUrlWithAuth, localPath);
    const git = simpleGit(localPath);

    await git.addConfig("user.name", config.GITHUB_CONFIG_NAME);
    await git.addConfig("user.email", config.GITHUB_CONFIG_EMAIL);

    const addedFiles: string[] = [];

    for (const file of files) {
      const fullFolderPath = path.join(localPath, file.folderPath);
      await fs.mkdir(fullFolderPath, { recursive: true });

      const filePath = path.join(fullFolderPath, file.filename);
      await fs.writeFile(filePath, file.buffer);

      const relativeFilePath = path.join(file.folderPath, file.filename);
      await git.add(relativeFilePath);
      addedFiles.push(relativeFilePath);
    }

    const commitMessage = `Add ${addedFiles.join(", ")}`;
    await git.commit(commitMessage);
    await git.push("origin", "main");

    logger.info("Changes pushed to remote repository");
  } catch (error) {
    logger.error(
      `github operations failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  } finally {
    await fs.rm(localPath, { recursive: true, force: true });
    logger.info("Local repository cleaned up");
  }
};
