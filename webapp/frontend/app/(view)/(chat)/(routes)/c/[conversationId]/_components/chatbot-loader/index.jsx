"use client";

import dynamic from "next/dynamic";
import { LazyLoading } from "@/components/lazyloading";

const ChatBotLoader = dynamic(
    () => import("@/components/chatbot").then((mod) => mod.ChatBot),
    {
        loading: () => <LazyLoading />,
    }
);

export default ChatBotLoader;
