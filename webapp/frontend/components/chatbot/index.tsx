"use client";

import { useEffect, useState } from "react";

import { Conversations } from "./components/conversations";

const getHashFromUrl = () => {
  const currentUrl = window.location.href;
  const hashFragment = currentUrl.split("#")[1];

  return hashFragment;
};

const getConversationIdFromUrl = (): string => {
  const urlParts = window.location.href.split("/");
  const conversationId = urlParts[4];

  return conversationId;
};

export const ChatBot = () => {
  const [hash, setHash] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const hashFragment = getHashFromUrl();
    const conversationIdFromUrl = getConversationIdFromUrl();

    if (hashFragment) {
      setHash(hashFragment);
    }

    if (conversationIdFromUrl) {
      setConversationId(conversationIdFromUrl);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = getHashFromUrl();
      const newConversationId = getConversationIdFromUrl();

      if (newHash !== hash) {
        setHash(newHash);
      }
      if (newConversationId !== conversationId) {
        setConversationId(newConversationId);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [hash, conversationId]);

  if (!hash && !conversationId) {
    return null;
  }

  return (
    <div className="flex">
      {conversationId && <Conversations conversationId={conversationId} />}
    </div>
  );
};
