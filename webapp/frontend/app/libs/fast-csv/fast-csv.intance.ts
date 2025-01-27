import path from "path";
import fs from "fs";

import * as csv from "fast-csv";

import { IFastCsvService } from "./fast-csv.interface";

export class FastCsvIntsance implements IFastCsvService {
  constructor() {}

  async createFolder(directory: string): Promise<boolean> {
    if (!directory) {
      throw new Error("Directory name is required");
    }

    const rootManagerDataset = "storage";
    const directoryPath = path.join(
      process.cwd(),
      rootManagerDataset,
      directory,
    );

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });

      return true;
    }

    return false;
  }

  async updateRowsCsv(
    directory: string,
    fileName: string,
    rowCallBack: (row: any, updatedRows: string[]) => void,
  ): Promise<any> {
    const csvFilePath = path.join(process.cwd(), directory, `${fileName}.csv`);

    const fileStream = fs.createReadStream(csvFilePath);
    const csvParser = csv.parse({ headers: false });
    let updatedRows: string[] = [];

    fileStream
      .pipe(csvParser)
      .on("data", (row) => {
        rowCallBack(row, updatedRows);
      })
      .on("error", (error: any) => {
        throw error;
      });

    await new Promise((resolve, reject) => {
      fileStream.on("end", resolve).on("error", reject);
    });

    await new Promise<void>((resolve, reject) => {
      fs.writeFile(csvFilePath, updatedRows.join("\n") + "\n", (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async createCsv(
    headers: string[],
    fileName: string,
    directory: string,
    isReference: boolean = false,
    tag: string = "",
    dynamicConfig: any,
  ) {
    if (!fileName) {
      throw new Error("File name is required");
    }

    if (!headers) {
      return Promise.reject(new Error("Headers are null or undefined"));
    }

    let dirPath = path.join(process.cwd(), directory);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (dynamicConfig.isActive) {
      const dynamicDirPath = path.join(dirPath, dynamicConfig.name);

      fs.mkdirSync(dynamicDirPath, { recursive: true });
      dirPath = dynamicDirPath;
      directory = `${directory}/${dynamicConfig.name}`;
    }

    if (isReference && !fs.existsSync(path.join(dirPath, "ref"))) {
      const refDirPath = path.join(dirPath, "ref");

      fs.mkdirSync(refDirPath, { recursive: true });
      if (!isReference) directory = `${directory}/ref`;
    }

    if (!isReference && tag) {
      if (isReference) {
        dirPath = path.join(dirPath, "ref");
      }

      const tagDirPath = path.join(dirPath, tag);

      fs.mkdirSync(tagDirPath, { recursive: true });
      dirPath = tagDirPath;
      directory = `${directory}/${tag}`;
    }

    console.log(directory);

    const csvFilePath = path.join(dirPath, `${fileName}.csv`);
    const writeStream = fs.createWriteStream(csvFilePath);

    return new Promise<void>((resolve, reject) => {
      const csvStream = csv.format({ headers });

      writeStream.on("finish", resolve);
      writeStream.on("error", reject);

      csvStream.pipe(writeStream);
      csvStream.write({});
      csvStream.end();
    }).then(async () => {
      await this.updateRowsCsv(
        directory,
        fileName,
        (row: any, updatedRows: string[]) => {
          if (!row || !Array.isArray(row)) {
            throw new Error("Row is null, undefined, or not an array");
          }

          if (row[0]) {
            updatedRows.push(Object.values(row).join(","));
          }
        },
      );

      return true;
    });
  }

  writeRowsCsv(data: any, fileName: string, directory: string) {
    console.log(data);

    if (!data || !fileName) {
      throw new Error("data and fileName are required");
    }

    const directoryPath = path.join(process.cwd(), directory);
    const csvFile = path.join(directoryPath, `${fileName}.csv`);

    if (!fs.existsSync(csvFile)) {
      return Promise.reject(new Error(`File ${csvFile} does not exist`));
    }

    const csvStream = csv.format({ headers: false });

    try {
      csvStream.write(data);
      csvStream.pipe(fs.createWriteStream(csvFile, { encoding: "utf8" }));
      csvStream.end();
    } catch (error) {
      throw new Error(`Error writing to file: ${error}`);
    }
  }

  getRowsCsv(fileName: string, directory: string) {
    const directoryPath = path.join(process.cwd(), directory);
    const csvFile = path.join(directoryPath, `${fileName}.csv`);

    if (!fs.existsSync(csvFile)) {
      return Promise.reject(new Error(`File ${csvFile} does not exist`));
    }

    const rows: any[] = [];

    return new Promise((resolve, reject) => {
      csv
        .parseFile(csvFile)
        .on("error", (error) => reject(error))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows));
    });
  }

  async deleteRowsCsv(
    fileName: string,
    directory: string,
    rowCallback: (rows: string[]) => void,
  ): Promise<boolean> {
    const filePath = path.join(process.cwd(), directory, `${fileName}.csv`);

    if (!fs.existsSync(filePath)) {
      return Promise.reject(new Error(`File ${filePath} does not exist`));
    }

    const fileStream = fs.createReadStream(filePath);
    const csvParser = csv.parse({ headers: false });
    const updatedRows: string[] = [];

    fileStream
      .pipe(csvParser)
      .on("data", (row) => {
        if (!row || !Array.isArray(row)) {
          throw new Error("Row is null, undefined, or not an array");
        }
        rowCallback(updatedRows);
      })
      .on("error", (error) => {
        throw error;
      });

    await new Promise((resolve, reject) => {
      fileStream.on("end", resolve).on("error", reject);
    });

    await new Promise<void>((resolve, reject) => {
      fs.writeFile(filePath, updatedRows.join("\n") + "\n", (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return true;
  }

  insertDataCsv = async (
    rows: any,
    fileName: string,
    directory: string,
    isReference: boolean = false,
    tag: string = "",
    dynamicConfig: any,
  ) => {
    console.log("rows: ", rows);

    if (!rows) {
      throw new Error("data is null or undefined");
    }

    console.log("step 1: ", directory);

    if (!fileName) {
      throw new Error("fileName is null or undefined");
    }

    console.log("step 2: ", directory);

    if (dynamicConfig.isActive) {
      directory = `${directory}/${dynamicConfig.name}`;
    }

    console.log("step 3: ", directory);

    if (!isReference) {
      directory = `${directory}/ref`;
    }

    console.log("step 4: ", directory);

    if (isReference && tag) {
      directory = `${directory}/${tag}`;
    }

    console.log("step 5: ", directory);

    const csvFilePath = path.join(process.cwd(), directory, `${fileName}.csv`);

    console.log(csvFilePath);

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File ${csvFilePath} does not exist`);
    }

    let records = [rows];

    const csvStream = csv.writeToStream(
      fs.createWriteStream(csvFilePath, { flags: "a" }),
      records,
      { headers: false },
    );

    csvStream.on("error", (err) => {
      throw new Error(`Error writing to file: ${err}`);
    });

    csvStream.write("\n");

    await this.updateRowsCsv(
      directory,
      fileName,
      (row: any, updatedRows: string[]) => {
        if (!row || !Array.isArray(row)) {
          throw new Error("Row is null, undefined, or not an array");
        }

        if (row[0] !== "" && row[0] !== undefined && row[0] !== null) {
          updatedRows.push(Object.values(row).join(","));
        }

        console.log(updatedRows[0], updatedRows[1]);
      },
    );
  };
}
