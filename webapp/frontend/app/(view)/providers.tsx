"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { QueryClientProvider } from "@tanstack/react-query";

import StoreProvider from "./store-provider";
import { ToastNotifyProvider } from "./toast-notify-provider";

import { reactQueryClient } from "@/services/react-query.service";
import { HyperlinkProvider } from "@/contexts/hyperlink.provider";
import { IndexerPdfProvider } from "@/contexts/indexerPdf.provider";
import { ChatbotProvider } from "@/contexts/chatbot.provider";
import { RagsyConversationProvider } from "@/contexts/ragsy-conversation.provider";
import { DraftMessagesProvider } from "@/contexts/draft-message.provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <QueryClientProvider client={reactQueryClient}>
      <DraftMessagesProvider>
        <RagsyConversationProvider>
          <HyperlinkProvider>
            <IndexerPdfProvider>
              <StoreProvider>
                <ChatbotProvider>
                  <NextUIProvider navigate={router.push}>
                    <NextThemesProvider {...themeProps}>
                      {children}
                      <ToastNotifyProvider />
                    </NextThemesProvider>
                  </NextUIProvider>
                </ChatbotProvider>
              </StoreProvider>
            </IndexerPdfProvider>
          </HyperlinkProvider>
        </RagsyConversationProvider>
      </DraftMessagesProvider>
    </QueryClientProvider>
  );
}
