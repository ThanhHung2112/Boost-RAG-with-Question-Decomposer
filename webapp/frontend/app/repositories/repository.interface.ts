export interface IRepository<T> {
  getAll(): Promise<T>;
  insert(attributes: any, dynamic: any): Promise<T>;
  createDataStore(attributes: any): Promise<boolean>;
  update(id: string, attributes: any): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
