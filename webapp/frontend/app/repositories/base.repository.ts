import { BaseModel } from "../models/base.model";

import { IRepository } from "./repository.interface";

export class BaseRepository<T extends BaseModel> implements IRepository<T> {
  protected readonly model: new (...args: any[]) => T;

  constructor(model: new (...args: any[]) => T) {
    this.model = model;
  }

  async insert(attributes: any, dynamic: any): Promise<T> {
    try {
      const instance = new this.model();

      await instance.save(attributes, dynamic);

      return instance;
    } catch (error) {
      throw new Error("Failed to insert data");
    }
  }

  async createDataStore(
    config: { isActive: boolean; name: string } = { isActive: false, name: "" },
  ): Promise<boolean> {
    const modelInstance = new this.model();

    await modelInstance.createDataStore(config);

    return true;
  }

  async getAll(): Promise<T> {
    return new this.model();
  }

  async update(id: string, attributes: any): Promise<boolean> {
    return false;
  }

  async delete(id: string): Promise<boolean> {
    return false;
  }
}
