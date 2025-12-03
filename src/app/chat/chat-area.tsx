"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import ChatMessage from "./chat-message";
import EmptyState from "./empty-state";
import InputBox from "./input-box";
import { useChatHistoryStore, useModelStore } from "@/store/chat";
import { DefaultChatTransport } from "ai";
import { AlertCircleIcon, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertFileToUIPart } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChatArea() {
  const { currentChatId, chatHistorys, setChatMessages, setChatHistory } =
    useChatHistoryStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // [优化 1] 使用 useRef 替换 shouldAutoScroll 的 useState，解决高频更新下的状态冲突
  const shouldAutoScrollRef = useRef(true);

  // 仅保留 showScrollButton 作为 State，用于 UI 显示
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { currentModelId } = useModelStore();

  const currentChat = useMemo(() => {
    return chatHistorys.find((chat) => chat.id === currentChatId);
  }, [chatHistorys, currentChatId]);

  const {
    messages,
    status,
    sendMessage,
    error,
    stop,
    regenerate,
    setMessages,
  } = useChat({
    id: currentChatId || undefined,
    messages:
      chatHistorys.find((chat) => chat.id === currentChatId)?.messages || [],
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ messages }) => {
      if (currentChatId) {
        setChatMessages(currentChatId, messages);
      }
    },
  });

  // --- 处理重试逻辑 ---
  const handleRetry = useCallback(
    (messageId: string) => {
      regenerate({
        messageId,
        body: { modelId: currentModelId },
      });
    },
    [regenerate, currentModelId],
  );

  // --- 处理删除逻辑 ---
  const handleDelete = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const targetMessage = messages[index];
      const newMessages = [...messages];

      // 如果是用户消息，且下一条是 AI 回复，则连带删除下一条
      if (
        targetMessage.role === "user" &&
        newMessages[index + 1]?.role === "assistant"
      ) {
        newMessages.splice(index, 2);
      } else {
        // 否则只删除这一条
        newMessages.splice(index, 1);
      }

      // 更新 SDK 状态
      setMessages(newMessages);
      // 同步更新全局 Store (保持数据一致性)
      if (currentChatId) {
        setChatMessages(currentChatId, newMessages);
      }
    },
    [messages, setChatMessages, currentChatId, setMessages],
  );

  // 独立的滚动到底部函数
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "instant" = "instant") => {
      const container = scrollRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: behavior,
        });
      }
    },
    [],
  );

  // [优化 2] 滚动处理逻辑：缩小阈值 + 同步更新 Ref
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 距离底部的距离
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 阈值从 100px 缩小到 30px，让用户更容易“逃离”自动滚动
    const isAtBottom = distanceFromBottom <= 30;

    // 同步更新 Ref 逻辑
    shouldAutoScrollRef.current = isAtBottom;

    // 更新 UI State
    setShowScrollButton(!isAtBottom);
  };

  // [优化 3] 监听滚轮事件：如果用户主动向上滚动，强制打断自动滚动
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      // deltaY < 0 表示向上滚动
      shouldAutoScrollRef.current = false;
    }
  };

  // [优化 4] useEffect 依赖 Ref 进行判断，消除冲突
  useEffect(() => {
    // 只有当 Ref 为 true 时才滚动
    if (shouldAutoScrollRef.current) {
      const container = scrollRef.current;
      if (container) {
        requestAnimationFrame(() => {
          // 自动跟随模式下使用 instant
          scrollToBottom("instant");
        });
      }
    }
  }, [messages, scrollToBottom]);

  const setChatTitle = async (text: string) => {
    const res = await fetch("/api/chat/title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to generate title");
    }

    const data = await res.json();
    if (data.title) {
      setChatHistory(
        chatHistorys.map((chat) => {
          if (chat.id === currentChatId) {
            return { ...chat, title: data.title };
          }
          return chat;
        }),
      );
    }
  };

  const handleSendMessage = async (inputValue: string, attachments: File[]) => {
    // 发送新消息时，强制开启自动滚动
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);

    if (currentChatId) {
      const fileUIParts = await Promise.all(
        attachments.map(convertFileToUIPart),
      );
      sendMessage(
        {
          text: inputValue,
          files: fileUIParts,
        },
        {
          body: { modelId: currentModelId },
        },
      );
      if (currentChat?.title === "") {
        setChatTitle(inputValue);
      }
    }
  };

  return (
    <div className="relative mx-auto flex max-w-4xl flex-1 flex-col p-2 pt-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel} // 绑定滚轮事件
        className="scrollbar-hide flex-1 overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="min-h-8 space-y-6 pb-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={handleRetry}
                onDelete={handleDelete}
                isLoading={status === "streaming"}
                isLatest={index === messages.length - 1}
              />
            ))}
            <div className="h-4" />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>
            <p>{error.message || "未知错误"}</p>
            <Button size={"sm"} variant="outline" onClick={() => regenerate()}>
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showScrollButton && (
        <div className="absolute right-0 left-0" style={{ bottom: "180px" }}>
          <div className="mx-auto max-w-4xl text-center">
            <Button
              onClick={() => {
                // 点击按钮时，使用 smooth 滚动，并重新开启自动锁定
                scrollToBottom("smooth");
                shouldAutoScrollRef.current = true;
                setShowScrollButton(false);
              }}
              aria-label="Scroll to bottom"
              variant="outline"
              className="rounded-full shadow-md"
            >
              <ArrowDown />
              {status === "streaming" ? "生成中" : ""}
            </Button>
          </div>
        </div>
      )}

      <InputBox onSubmit={handleSendMessage} status={status} stop={stop} />
    </div>
  );
}
