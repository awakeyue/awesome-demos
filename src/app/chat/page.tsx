"use client";

import Sidebar from "./sidebar";
import ChatArea from "./chat-area";
import { useChatHistoryStore } from "@/store/chat";
import { useEffect } from "react";

export default function Home() {
  const { currentChatId, createNewChat } = useChatHistoryStore();
  useEffect(() => {
    if (!currentChatId) {
      createNewChat();
    }
  }, [currentChatId, createNewChat]);
  return (
    <div className="bg-background flex h-screen">
      <Sidebar />
      <ChatArea key={currentChatId} />
    </div>
  );
}
