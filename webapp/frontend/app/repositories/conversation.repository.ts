import { ConversationModel } from "../models";

import { BaseRepository } from "./base.repository";

class ConversationRepository extends BaseRepository<ConversationModel> {
  constructor() {
    super(ConversationModel);
  }
}

export const conversationRepository = new ConversationRepository();
