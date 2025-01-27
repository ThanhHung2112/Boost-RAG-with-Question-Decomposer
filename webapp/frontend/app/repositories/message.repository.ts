import { MessageModel } from "../models";

import { BaseRepository } from "./base.repository";

class MessageRepository extends BaseRepository<MessageModel> {
  constructor() {
    super(MessageModel);
  }
}

export const messageRepository = new MessageRepository();
