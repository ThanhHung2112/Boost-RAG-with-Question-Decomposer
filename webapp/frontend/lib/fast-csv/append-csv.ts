import fs from "fs";
import path from "path";

import csv from "fast-csv";

export const appendCsv = (rows: any, fileName: string, directory: string) => {
  if (!rows) {
    throw new Error("data is null or undefined");
  }

  if (!fileName) {
    throw new Error("fileName is null or undefined");
  }

  const csvFilePath = path.join(
    process.cwd(),
    `${directory}`,
    `${fileName}.csv`,
  );

  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`File ${csvFilePath} does not exist`);
  }

  const csvStream = csv.writeToStream(
    fs.createWriteStream(csvFilePath, { flags: "a" }),
    rows,
    { headers: false },
  );

  csvStream.on("error", (err) => {
    throw new Error(`Error writing to file: ${err}`);
  });

  csvStream.write("\n");
};
