import path from "path";
import fs from "fs";

import { format } from "@fast-csv/format";

export const createCsvHeader = (
  headerNames: string[] | null | undefined,
  filename: string,
  directory: string,
): Promise<void> => {
  if (!headerNames) {
    return Promise.reject(new Error("headerNames is null or undefined"));
  }

  const csvFilePath = path.join(process.cwd(), directory, `${filename}.csv`);

  const writeStream = fs.createWriteStream(csvFilePath);

  return new Promise((resolve, reject) => {
    const csvStream = format({ headers: headerNames });

    writeStream.on("finish", resolve);
    writeStream.on("error", reject);

    csvStream.pipe(writeStream);
    csvStream.write({});
    csvStream.end();
  });
};
