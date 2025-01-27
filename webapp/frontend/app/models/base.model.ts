import { FastCsvIntsance } from "../libs/fast-csv/fast-csv.intance";

import { IModel } from "./model.interface";

export abstract class BaseModel implements IModel {
  private dataStore: Record<string, any> = {};
  private readonly fastService: FastCsvIntsance;
  private readonly dataSource: any;

  constructor(dataSoure: any) {
    this.fastService = new FastCsvIntsance();
    this.dataSource = dataSoure;
    this.dataStore = this.getInitialDataStore();
  }

  protected abstract getInitialDataStore(): Record<string, any>;

  protected initializeDataStore(): void {
    this.dataStore = this.getInitialDataStore();
  }

  public get(key: string): any {
    return this.dataStore[key];
  }

  public set(key: string, value: any): void {
    this.dataStore[key] = value;
  }

  public async save(
    data: any,
    dynamic: {
      isActive: boolean;
      name: string;
    } = {
      isActive: false,
      name: "",
    },
  ) {
    console.log("BaseModel", data);

    return await this.fastService.insertDataCsv(
      data,
      this.dataSource.fileName,
      this.dataSource.directory,
      this.dataSource.isRef,
      this.dataSource.tag,
      dynamic,
    );
  }

  public createDataStore(
    dynamic: {
      isActive: boolean;
      name: string;
    } = {
      isActive: false,
      name: "",
    },
  ) {
    const columns = Object.keys(this.dataStore);

    return this.fastService.createCsv(
      columns,
      this.dataSource.fileName,
      this.dataSource.directory,
      this.dataSource.isRef,
      this.dataSource.tag,
      dynamic,
    );
  }
}
