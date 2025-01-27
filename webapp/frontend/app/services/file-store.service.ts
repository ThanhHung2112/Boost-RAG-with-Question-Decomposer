import fs from "fs";
import path from "path";

import { parseFile } from "fast-csv";

export class FileStoreService {
  public readFile = (_dirname: string, fileName: string): Promise<any[]> => {
    const filePath = path.join(
      process.cwd(),
      `storage/history_files/${fileName}.csv`,
    );

    if (!fs.existsSync(filePath)) {
      return Promise.reject(new Error(`File ${filePath} does not exist`));
    }

    const rows: any[] = [];

    return new Promise((resolve, reject) => {
      parseFile(filePath)
        .on("error", (error) => reject(error))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows));
    });
  };

  public findById = (fileId: string, fileName: string) => {
    const filePath = path.join(
      process.cwd(),
      `storage/chat_history/${fileName}.csv`,
    );

    if (!fs.existsSync(filePath)) {
      return Promise.reject(new Error(`File ${filePath} does not exist`));
    }

    const rows: any[] = [];

    return new Promise((resolve, reject) => {
      parseFile(filePath)
        .on("error", (error) => reject(error))
        .on("data", (row) => {
          if (row[0] === fileId)
            rows.push({
              id: row[0],
              conversationId: row[1],
              clientId: row[2],
              context: row[3],
              sender: row[4],
              createdTime: row[5],
              pathName: row[6],
              fileName: row[7],
              refLink: row[8],
            });
        })
        .on("end", () => resolve(rows));
    });
  };

  public removeFile = async (fileName: string, directory: string) => {
    try {
      const filePath = path.join(process.cwd(), `${directory}`, `${fileName}`);

      if (!fs.existsSync(filePath)) {
        return Promise.reject(new Error(`File ${filePath} does not exist`));
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error removing file: ${err}`);
        }

        console.log(`File ${filePath} has been successfully removed.`);
      });

      return true;
    } catch (err) {
      console.error(`Error removing file: ${err}`);
      throw err;
    }
  };

  public removeMutipleFile = async (files: any[], directory: string) => {
    try {
      files.forEach(async (file: any) => {
        await this.removeFile(file.pathName, directory);
      });

      return true;
    } catch (err) {
      console.error(`Error removing file: ${err}`);
      throw err;
    }
  };
}
