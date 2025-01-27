import { v4 as uuidv4 } from "uuid";

import { IMessage } from "@/components/chatbot/components/conversations/interfaces";
import { formatDateTime } from "@/lib";
import { updateConversations } from "@/shared/api/conversations";
import { postMessages } from "@/shared/api/messages";
import {
  getConversationNames,
  responseContext,
} from "@/shared/services/chatbot";

const handleResponseChatbot = async (
  conversationId: string,
  messageText: string,
) => {
  try {
    const formattedDateTime = formatDateTime(new Date());

    const getConverName = await getConversationNames({ message: messageText });

    if (!getConverName || !getConverName.conversation_name) {
      throw new Error("Failed to fetch conversation name.");
    }

    await updateConversations(conversationId, {
      data: { conversationName: getConverName.conversation_name },
    });

    const bot = await responseContext({ chatID: "1", message: messageText });

    if (!bot || !bot.response) {
      throw new Error("Failed to fetch bot response.");
    }

    const botResponse: IMessage = {
      id: uuidv4(),
      conversationId,
      clientId: "clienttest",
      context: bot.response,
      sender: "bot",
      createdTime: formattedDateTime,
    };

    const pushHistory = await postMessages(conversationId, botResponse);

    return pushHistory;
  } catch (error: any) {
    console.error("Error in handleResponseChatbot:", error);
    throw new Error(`Failed to handle chatbot response: ${error.message}`);
  }
};

self.onmessage = async (e) => {
  const { conversationId, messageText, requestId } = e.data;

  if (!conversationId || !messageText || !requestId) {
    self.postMessage({
      requestId,
      success: false,
      error: "Missing conversationId, messageText, or requestId",
    });

    return;
  }

  try {
    const result = await handleResponseChatbot(conversationId, messageText);

    self.postMessage({ requestId, success: true, data: result });
  } catch (error: any) {
    self.postMessage({
      requestId,
      success: false,
      error: error.message || "Unknown error",
    });
  }
};
