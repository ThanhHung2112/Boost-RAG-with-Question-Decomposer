import { hyperlinkRepository } from "../repositories";

export class HyperlinkService {
  constructor() {}

  async create(data: {
    id: string;
    conversationId: string;
    context: string;
    sender: string;
    createdTime: string;
  }) {
    console.log("Messages Service", data);

    return await hyperlinkRepository.insert(data);
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
    return await hyperlinkRepository.createDataStore(dynamic);
  }
}
