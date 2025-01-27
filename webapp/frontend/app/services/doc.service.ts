import { docRepository } from "../repositories";

export class DocService {
  constructor() {}

  async create(data: {
    id: string;
    conversationId: string;
    originalFileName: string;
    fileName: string;
    pathName: string;
    fileSize: string;
    fileType: string;
    createdTime: string;
  }) {
    console.log("Messages Service", data);

    return await docRepository.insert(data);
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
    return await docRepository.createDataStore(dynamic);
  }
}
