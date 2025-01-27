import fs from "fs";
import path from "path";

import { parseFile } from "fast-csv";

export const readCsv = (
  fileName: string,
  directory: string,
): Promise<any[]> => {
  const filePath = path.join(process.cwd(), `${directory}`, `${fileName}.csv`);

  if (!fs.existsSync(filePath)) {
    return Promise.reject(new Error(`File ${filePath} does not exist`));
  }

  var rows: any[] = [];

  return new Promise((resolve, reject) => {
    parseFile(filePath)
      .on("error", (error) => reject(error))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
};
