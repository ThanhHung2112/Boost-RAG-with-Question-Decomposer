export interface IFastCsvService {
  writeRowsCsv(data: any, fileName: string, directory: string): any;
  getRowsCsv(fileName: string, directory: string): any;
  deleteRowsCsv(fileName: string, directory: string, callback: any): any;
}
