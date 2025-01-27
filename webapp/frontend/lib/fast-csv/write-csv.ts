import path from "path";
import fs from "fs";

import * as csv from "fast-csv";

export const createCsv = (data: any, fileName: string, directory: string) => {
  if (!data || !fileName) {
    throw new Error("data and fileName are required");
  }

  const directoryPath = path.join(process.cwd(), directory);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  const csvFile = path.join(directoryPath, `${fileName}.csv`);

  const csvStream = csv.format({ headers: true });

  try {
    csvStream.write(data);
    csvStream.pipe(fs.createWriteStream(csvFile, { encoding: "utf8" }));
    csvStream.end();
  } catch (error) {
    throw new Error(`Error writing to file: ${error}`);
  }
};
