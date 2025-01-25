import { Storage } from "@google-cloud/storage";
import { config } from "../config";

const storage = new Storage({
  projectId: config.GOOGLE_CLOUD_PROJECT,
});

export const downloadData = async (bucketName: string, fileName: string) => {
  const [fileContents] = await storage.bucket(bucketName).file(fileName).download();
  return fileContents.toString();
};
