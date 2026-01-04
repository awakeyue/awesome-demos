"use client";

import {
  Plus,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useModelStore, useChatStatusStore } from "@/store/chat";
import { deleteChat, getUserChatList } from "@/actions/chat";
import { signOut } from "@/actions/auth";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { useUIStore } from "../store/ui-store";

interface UserInfo {
  id: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface SidebarProps {
  user: UserInfo | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  // Extract chatId from pathname like /chat/xxx
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.slice(6)
    : null;

  const { setCurrentModelId, modelList } = useModelStore();
  const { triggerReset } = useChatStatusStore();

  // Use SWR to fetch chat list
  const { data: chatHistorys, mutate } = useSWR("chat-list", getUserChatList, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const handleCreateChat = () => {
    if (modelList.length > 0) {
      setCurrentModelId(modelList[0].id);
    }
    triggerReset();
    router.push("/chat");
  };

  const handleSelectChat = (chatId: string, modelId: string) => {
    setCurrentModelId(modelId);
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChatHistory = async (chatId: string) => {
    await deleteChat(chatId);
    mutate(); // Refresh the list
    if (chatId === currentChatId) {
      router.push("/chat");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-sidebar-border flex h-full flex-col border-r transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="border-sidebar-border space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
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
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0",
              isSidebarCollapsed ? "w-full justify-center" : "",
            )}
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            {isSidebarCollapsed ? (
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
            isSidebarCollapsed ? "justify-center px-0" : "justify-start",
          )}
          title={isSidebarCollapsed ? "新建聊天" : ""}
        >
          <Plus size={18} />
          {!isSidebarCollapsed && "新建聊天"}
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isSidebarCollapsed && (
          <div className="px-4 py-3">
            <p className="text-sidebar-foreground/70 text-xs font-semibold uppercase">
              历史对话
            </p>
          </div>
        )}
        <ScrollArea className="flex-1 overflow-auto">
          <div
            className={cn("space-y-1", isSidebarCollapsed ? "px-2" : "px-2")}
          >
            {chatHistorys?.map((chatData) => (
              <div
                key={chatData.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all",
                  currentChatId === chatData.id
                    ? "bg-sidebar-primary/20 text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                )}
                title={chatData.title}
                onClick={() => handleSelectChat(chatData.id, chatData.modelId)}
              >
                <div
                  className={cn(
                    "truncate text-left text-sm",
                    isSidebarCollapsed ? "hidden" : "w-0 flex-1",
                  )}
                >
                  {chatData.title || "新对话"}
                </div>
                {isSidebarCollapsed && (
                  <div
                    className="flex w-full items-center justify-center rounded text-sm"
                    title={chatData.title}
                  >
                    <MessageSquareText size={16} />
                  </div>
                )}
                {!isSidebarCollapsed && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 transition-opacity group-hover:opacity-100">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChatHistory(chatData.id);
                        }}
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
      <div className="border-sidebar-border border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg p-2 transition-colors",
                isSidebarCollapsed ? "justify-center" : "",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={user?.avatarUrl || undefined}
                  alt={user?.name || "用户"}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user ? (
                    getInitials(user.name, user.email)
                  ) : (
                    <User size={16} />
                  )}
                </AvatarFallback>
              </Avatar>
              {!isSidebarCollapsed && (
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <span className="text-sidebar-foreground w-full truncate text-left text-sm font-medium">
                    {user?.name || "用户"}
                  </span>
                  <span className="text-sidebar-foreground/60 w-full truncate text-left text-xs">
                    {user?.email}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || "用户"}</p>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut size={16} />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
