import fs from "fs";
import path from "path";

import { parse } from "fast-csv";

export class FastCsvService {
  constructor() {}

  public isChangeData = (dataChange: any, oldData: any) => {
    const objOldData = {
      id: oldData[0],
      conversationName: oldData[1],
      createdTime: oldData[2],
    };

    const objDataChange = Object.assign(objOldData, dataChange);
    const isChange = Object.is(objOldData, objDataChange);

    return {
      objDataChange,
      isChange,
    };
  };

  public async updateRowInCsv(
    conversationId: string,
    dataUpdate: any,
  ): Promise<void> {
    const csvFilePath = path.join(
      process.cwd(),
      `storage/conversations/db_conversations.csv`,
    );

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File ${conversationId}.csv does not exist`);
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const csvParser = parse({ headers: false });
    const updatedRows: string[] = [];

    fileStream
      .pipe(csvParser)
      .on("data", (row) => {
        if (!row) {
          throw new Error("Row is null or undefined");
        }

        if (conversationId === row[0]) {
          const { objDataChange, isChange } = this.isChangeData(
            dataUpdate,
            row,
          );

          if (isChange) {
            updatedRows.push(Object.values(objDataChange).join(","));
          }
        } else {
          updatedRows.push(Object.values(row).join(","));
        }
      })
      .on("error", (error) => {
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

  public async removeLineInCsv(
    conversationId: string,
    id: string,
    directory: string,
  ): Promise<boolean> {
    const csvFilePath = path.join(
      process.cwd(),
      `${directory}`,
      `${conversationId}.csv`,
    );

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File ${conversationId}.csv does not exist`);
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const csvParser = parse({ headers: false });
    const updatedRows: string[] = [];

    fileStream
      .pipe(csvParser)
      .on("data", (row) => {
        if (!row || !Array.isArray(row)) {
          throw new Error("Row is null, undefined, or not an array");
        }

        if (id !== row[0]) {
          updatedRows.push(Object.values(row).join(","));
        }
      })
      .on("error", (error) => {
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

    return true;
  }
}
