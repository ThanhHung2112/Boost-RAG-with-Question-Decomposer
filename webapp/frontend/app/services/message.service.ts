import { messageRepository } from "../repositories";

export class MessageService {
  constructor() {}

  async sendMessage(
    data: {
      id: string;
      conversationId: string;
      context: string;
      sender: string;
      createdTime: string;
    },
    dynamic: any,
  ) {
    console.log("Messages Service", data);

    return await messageRepository.insert(data, dynamic);
  }

  async createDataStore(
    dynamic: {
      isActive: boolean;
      name: string;
    } = {
      isActive: false,
      name: "",
    },
  ) {
    return await messageRepository.createDataStore(dynamic);
  }
}
