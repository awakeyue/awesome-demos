"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChatHistoryStore, useModelStore } from "@/store/chat";
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { chatHistorys, currentChatId, setCurrentChatId, setChatHistory } =
    useChatHistoryStore();

  const { setCurrentModelId, modelList } = useModelStore();
  const sortedChatHistorys = chatHistorys.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleCreateChat = () => {
    setCurrentChatId(null);
    setCurrentModelId(modelList[0].id);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chatHistorys.find((chat) => chat.id === chatId);
    if (chat) {
      setCurrentModelId(chat.modelId);
    }
  };

  const handleDeleteChatHistory = (chatId: string) => {
    if (chatId === currentChatId) {
      setCurrentChatId(null);
    }
    setChatHistory(chatHistorys.filter((chat) => chat.id !== chatId));
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-sidebar-border flex h-full flex-col border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header with logo and collapse button */}
      <div className="border-sidebar-border space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
                AI
              </div>
              <span className="text-sidebar-foreground flex-1 font-semibold">
                Chat
              </span>
            </div>
          )}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0",
              isCollapsed ? "w-full justify-center" : "",
            )}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </Button>
        </div>

        {/* New Chat button */}
        <Button
          onClick={handleCreateChat}
          variant="outline"
          size="sm"
          className={cn(
            "w-full gap-2",
            isCollapsed ? "justify-center px-0" : "justify-start",
          )}
          title={isCollapsed ? "新建聊天" : ""}
        >
          <Plus size={18} />
          {!isCollapsed && "新建聊天"}
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isCollapsed && (
          <div className="px-4 py-3">
            <p className="text-sidebar-foreground/70 text-xs font-semibold uppercase">
              历史对话
            </p>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className={cn("space-y-1", isCollapsed ? "px-2" : "px-2")}>
            {sortedChatHistorys
              .filter((item) => item.title)
              .map((chatData) => (
                <div
                  key={chatData.id}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all",
                    currentChatId === chatData.id
                      ? "bg-sidebar-primary/20 text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                  )}
                  title={chatData.title}
                  onClick={() => handleSelectChat(chatData.id)}
                >
                  <div
                    className={cn(
                      "truncate text-left text-sm",
                      isCollapsed ? "hidden" : "w-0 flex-1",
                    )}
                  >
                    {chatData.title}
                  </div>
                  {isCollapsed && (
                    <div
                      className="flex w-full items-center justify-center rounded text-sm"
                      title={chatData.title}
                    >
                      <MessageSquareText size={16} />
                    </div>
                  )}
                  {!isCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 transition-opacity group-hover:opacity-100">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleDeleteChatHistory(chatData.id)}
                          className="flex cursor-pointer items-center gap-2 text-red-600"
                        >
                          <Trash2 size={16} />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      {/* {!isCollapsed && (
        <div className="border-sidebar-border space-y-2 border-t p-4">
          <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full rounded-lg px-3 py-2 text-left text-sm transition-all">
            ⚙️ Settings
          </button>
          <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full rounded-lg px-3 py-2 text-left text-sm transition-all">
            💡 Help & Feedback
          </button>
        </div>
      )} */}
    </div>
  );
}
