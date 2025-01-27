import { conversationRepository } from "../repositories";

export class ConversationService {
  constructor() {}

  async insertData(data: any, dynamic: any): Promise<any> {
    try {
      return await conversationRepository.insert(data, dynamic);
    } catch (error) {
      throw new Error("Failed to insert conversation data");
    }
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
    return await conversationRepository.createDataStore(dynamic);
  }
}
