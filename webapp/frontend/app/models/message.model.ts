import { BaseModel } from "./base.model";

export class MessageModel extends BaseModel {
  protected readonly id: string;
  protected readonly conversationId: string;
  protected readonly context: string;
  protected readonly sender: string;
  protected readonly createdTime: string;

  constructor(
    id: string,
    conversationId: string,
    context: string,
    sender: string,
    createdTime: string,
  ) {
    const dataSource: any = {
      fileName: "rc_messages",
      directory: "storage/database/conversations/ref",
      isRef: true,
      tag: "messages",
    };

    super(dataSource);

    this.id = id;
    this.conversationId = conversationId;
    this.context = context;
    this.sender = sender;
    this.createdTime = createdTime;

    this.initializeDataStore();
  }

  protected getInitialDataStore(): Record<string, any> {
    return {
      id: this.id,
      conversationId: this.conversationId,
      context: this.context,
      sender: this.sender,
      createdTime: this.createdTime,
    };
  }
}
