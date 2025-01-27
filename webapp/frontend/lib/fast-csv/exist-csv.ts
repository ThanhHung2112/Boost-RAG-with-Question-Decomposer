import fs from "fs";
import path from "path";

export const fileExists = (fileName: string, directory: string): boolean => {
  const filePath = path.join(process.cwd(), directory, `${fileName}.csv`);

  return fs.existsSync(filePath);
};
