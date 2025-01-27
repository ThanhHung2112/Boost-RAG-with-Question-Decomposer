import { NextResponse } from "next/server";
import { orderBy } from "lodash";

import { readCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";

const getMessagesByConversationId = async (
  conversationId: string | undefined,
): Promise<any[]> => {
  if (!conversationId) {
    return [];
  }

  try {
    const directory = "storage/chat_history";
    const conversationData = await readCsv(conversationId, directory);

    if (!conversationData || conversationData.length === 0) {
      return [];
    }

    return conversationData.slice(1).map((data) => ({
      id: data?.[0],
      conversationId: data?.[1],
      clientId: data?.[2],
      context: data?.[3],
      sender: data?.[4],
      createdTime: data?.[5],
    }));
  } catch (error) {
    console.error("Failed to get messages by conversation ID:", error);

    return [];
  }
};

export async function GET(req: Request) {
  try {
    const directory = "storage/conversations";

    const fileExistsResult = await fileExists("db_conversations", directory);

    if (!fileExistsResult) {
      return NextResponse.json([]);
    }

    const recordConversations = await readCsv("db_conversations", directory);

    if (!recordConversations || recordConversations.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const recordObjectConversations = await Promise.all(
      recordConversations
        .slice(1)
        .filter((data) => data?.[0] !== undefined)
        .map(async (data) => {
          const id = data?.[0];
          const conversationName = data?.[1];
          const createdTime = data?.[2];
          const messages = await getMessagesByConversationId(id);

          return {
            id,
            conversationName,
            createdTime,
            messages,
          };
        }),
    );

    const sortedConversations = orderBy(
      recordObjectConversations,
      [
        (conversation) =>
          new Date(
            conversation.messages[
              conversation.messages.length - 1
            ]?.createdTime,
          ),
      ],
      ["desc"],
    );

    return NextResponse.json({ conversations: sortedConversations });
  } catch (error) {
    console.error("Error getting conversations:", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
