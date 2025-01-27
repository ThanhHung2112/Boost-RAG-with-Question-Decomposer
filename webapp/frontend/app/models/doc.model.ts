import { BaseModel } from "./base.model";

export class DocModel extends BaseModel {
  protected readonly id: string;
  protected readonly conversationId: string;
  protected readonly fileName: string;
  protected readonly originalFileName: string;
  protected readonly pathName: string;
  protected readonly fileSize: string;
  protected readonly fileType: string;
  protected readonly createdTime: string;

  constructor(
    id: string,
    conversationId: string,
    originalFileName: string,
    fileName: string,
    pathName: string,
    fileSize: string,
    fileType: string,
    createdTime: string,
  ) {
    const dataSource = {
      fileName: "rc_docs",
      directory: "storage/database/conversations/ref",
      tag: "docs",
      isRef: false,
    };

    super(dataSource);

    this.id = id;
    this.conversationId = conversationId;
    this.originalFileName = originalFileName;
    this.fileName = fileName;
    this.pathName = pathName;
    this.fileSize = fileSize;
    this.fileType = fileType;
    this.createdTime = createdTime;
  }

  protected getInitialDataStore(): Record<string, any> {
    return {
      id: this.id,
      conversationId: this.conversationId,
      originalFileName: this.originalFileName,
      fileName: this.fileName,
      pathName: this.pathName,
      fileSize: this.fileSize,
      fileType: this.fileType,
      createdTime: this.createdTime,
    };
  }
}
