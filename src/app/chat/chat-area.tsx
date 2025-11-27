"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback } from "react";
import ChatMessage from "./chat-message";
import EmptyState from "./empty-state";
import InputBox from "./input-box";
import { useChatHistoryStore, useModelStore } from "@/store/chat";
import { DefaultChatTransport } from "ai";
import { ArrowDown } from "lucide-react"; // 需要引入 ArrowDown 图标
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/custom/spinner";
import { convertFileToUIPart } from "@/lib/utils";

// --- 组件：现代化 Loading 气泡 ---
const TypingIndicator = () => (
  <div className="flex w-fit items-center space-x-1 rounded-2xl bg-gray-100 px-4 py-3 text-gray-500 dark:bg-gray-800">
    <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
    <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
    <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
  </div>
);

export default function ChatArea() {
  const { currentChatId, chatHistorys, setMessages, setChatHistory } =
    useChatHistoryStore();

  // 滚动相关的状态
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // 是否应该自动跟随到底部
  const [showScrollButton, setShowScrollButton] = useState(false); // 是否显示“回到底部”按钮

  const { currentModelId } = useModelStore();

  const { messages, status, sendMessage, error, stop } = useChat({
    id: currentChatId || undefined,
    messages:
      chatHistorys.find((chat) => chat.id === currentChatId)?.messages || [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: ({ messages }) => {
      if (currentChatId) {
        setMessages(currentChatId, messages);
      }
    },
  });

  // --- 核心逻辑：滚动处理 ---

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto",
      });
    }
  }, []);

  // 监听滚动事件，判断用户是否离开了底部
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // 阈值设为 100px，表示如果用户距离底部 100px 以内，我们认为他在“底部”
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    // 如果用户不在底部，停止自动滚动，并显示回底按钮
    setShouldAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom);
  };

  // 当消息更新时（生成文本中），根据状态决定是否滚动
  useEffect(() => {
    if (shouldAutoScroll) {
      // 使用 immediate 效果稍微好一点，或者使用 smooth 配合 requestAnimationFrame
      // 这里为了防止生成时的剧烈抖动，我们在流式传输时通常推荐平滑度较高的滚动
      const container = scrollRef.current;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "instant", // Streaming 时推荐 instant，auto 会在快速输出时产生视觉抖动
          });
        });
      }
    }
  }, [messages, shouldAutoScroll]);

  // 用户发送消息时，强制锁定到底部
  const handleSendMessage = async (inputValue: string, attachments: File[]) => {
    setShouldAutoScroll(true); // 强制开启自动滚动
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

      // 这里的逻辑保持不变
      setChatHistory(
        chatHistorys.map((chat) => {
          if (chat.id === currentChatId && chat.title === "") {
            return { ...chat, title: inputValue, modelId: currentModelId };
          }
          return chat;
        }),
      );
    }
  };

  return (
    <div className="relative flex flex-1 flex-col p-2">
      {/* Chat Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollbarGutter: "stable" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <div className="mx-auto min-h-8 max-w-4xl space-y-6 pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* 现代化的 Loading 状态 */}
            {status === "streaming" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex justify-start duration-300">
                <TypingIndicator />
              </div>
            )}

            {/* 这个空 div 用于辅助布局，确保最后的内容不贴底 */}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* 悬浮的回到底部按钮 */}
      {showScrollButton && (
        <div className="absolute right-0 left-0" style={{ bottom: "180px" }}>
          {/* 调整定位容器 */}
          <div className="mx-auto max-w-4xl text-center">
            <Button
              onClick={() => {
                scrollToBottom();
                setShouldAutoScroll(true);
              }}
              aria-label="Scroll to bottom"
              variant="outline"
              className="rounded-full shadow-md"
            >
              {status === "streaming" ? <Spinner /> : <ArrowDown />}
              查看最新
            </Button>
          </div>
        </div>
      )}

      {/* Input Box */}
      <InputBox onSubmit={handleSendMessage} status={status} stop={stop} />
    </div>
  );
}
