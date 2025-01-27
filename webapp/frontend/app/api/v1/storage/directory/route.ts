import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json("Hello, Next.js!");
}

// export async function POST(req: Request): Promise<NextResponse> {
//     const { directory } = await req.json();

//     // if (!id || !conversationName || !createdTime) {
//     //   return new NextResponse("Bad request", { status: 400 });
//     // }

//     const conversationService = new ConversationService();

//     try {
//         const isCreated = await conversationService.createFolder(directory);

//         return NextResponse.json({ status: isCreated });
//     } catch (error) {
//         return new NextResponse("Internal error", { status: 500 });
//     }
// };
