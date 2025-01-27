import { BaseModel } from "./base.model";

export class HyperlinkModel extends BaseModel {
  protected readonly id: string;
  protected readonly conversationId: string;
  protected readonly link: string;
  protected readonly createdTime: string;

  constructor(
    id: string,
    conversationId: string,
    link: string,
    createdTime: string,
  ) {
    const dataSource = {
      fileName: "rc_hyperlinks",
      directory: "storage/database/conversations/ref",
      tag: "hyperlinks",
      isRef: false,
    };

    super(dataSource);

    this.id = id;
    this.conversationId = conversationId;
    this.link = link;
    this.createdTime = createdTime;
  }

  protected getInitialDataStore(): Record<string, any> {
    return {
      id: this.id,
      conversationId: this.conversationId,
      link: this.link,
      createdTime: this.createdTime,
    };
  }
}
