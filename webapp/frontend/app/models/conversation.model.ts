import { BaseModel } from "./base.model";

export class ConversationModel extends BaseModel {
  protected readonly id: string;
  protected readonly conversationName: string;
  protected readonly createdTime: string;

  constructor(id: string, conversationName: string, createdTime: string) {
    const dataSource: any = {
      fileName: "rc_conversations",
      directory: "storage/database/conversations",
      isRef: true,
    };

    super(dataSource);

    this.id = id;
    this.conversationName = conversationName;
    this.createdTime = createdTime;

    this.initializeDataStore();
  }

  protected getInitialDataStore(): Record<string, any> {
    return {
      id: this.id,
      conversationName: this.conversationName,
      createdTime: this.createdTime,
    };
  }
}
