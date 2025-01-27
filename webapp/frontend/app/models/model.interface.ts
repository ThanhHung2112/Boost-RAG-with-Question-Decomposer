export interface IModel {
  get(key: string): any;
  set(key: string, value: any): void;
}
