import { HttpMethodType } from "@/types";

export interface RequestOptions {
  method: HttpMethodType;
  url: string;
  data?: any;
  params?: any;
  headers?: any;
  typeService?: string;
}
