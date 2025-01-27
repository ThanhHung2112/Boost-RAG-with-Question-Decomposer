import fs from "fs";
import path from "path";

export const getFilesInDirectory = async (
  directory: string,
): Promise<any[]> => {
  const directoryPath = path.join(process.cwd(), `storage/${directory}`);
  const fileList = fs.readdirSync(directoryPath);

  return fileList;
};
