import fs from "fs";
import path from "path";

const { parse } = require("csv-parse");

export const readFileCSV = (nameFile: string): Promise<any[]> => {
  const filePath = path.join(process.cwd(), `storage/app/private/${nameFile}`);
  const records: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ",", from_line: 1 }))
      .on("data", (row: any) => {
        records.push(row);
      })
      .on("error", (error: Error) => {
        reject(error);
      })
      .on("end", () => {
        console.log("File read successful");
        resolve(records);
      });
  });
};
