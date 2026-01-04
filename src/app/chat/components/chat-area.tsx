"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import ChatMessage from "./chat-message";
import EmptyState from "./empty-state";
import InputBox from "./input-box";
import { useModelStore, useChatStatusStore } from "@/store/chat";
import { DefaultChatTransport } from "ai";
import { AlertCircleIcon, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertFileToUIPart } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveChatMessages, createChat, updateChatTitle } from "@/actions/chat";
import { useSWRConfig } from "swr";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";

interface ChatAreaProps {
  initialMessages?: UIMessage[];
  chatId?: string | null;
}

export default function ChatArea({
  initialMessages = [],
  chatId: serverChatId,
}: ChatAreaProps) {
  const { mutate } = useSWRConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { currentModelId } = useModelStore();
  const { createdChatIds, markAsCreated, resetKey } = useChatStatusStore();

  const stableId = useMemo(
    () => (resetKey ? serverChatId || nanoid(10) : serverChatId || nanoid(10)),
    [serverChatId, resetKey],
  );

  // Reset refs when chatId changes
  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [stableId]);

  const {
    messages,
    status,
    sendMessage,
    error,
    stop,
    regenerate,
    setMessages,
  } = useChat({
    id: stableId,
    messages: initialMessages,
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: async ({ messages }) => {
      await saveChatMessages(stableId, messages);
    },
  });

  const handleRetry = useCallback(
    (messageId: string) => {
      regenerate({
        messageId,
        body: { modelId: currentModelId },
      });
    },
    [regenerate, currentModelId],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const targetMessage = messages[index];
      const newMessages = [...messages];

      if (
        targetMessage.role === "user" &&
        newMessages[index + 1]?.role === "assistant"
      ) {
        newMessages.splice(index, 2);
      } else {
        newMessages.splice(index, 1);
      }

      setMessages(newMessages);
      if (stableId) {
        saveChatMessages(stableId, newMessages);
      }
    },
    [messages, setMessages, stableId],
  );

  const generateTitle = async (text: string, targetChatId: string) => {
    try {
      const res = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          await updateChatTitle(targetChatId, data.title);
          mutate("chat-list");
        }
      }
    } catch (e) {
      console.error("Failed to generate title", e);
    }
  };

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

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 30;

    shouldAutoScrollRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      shouldAutoScrollRef.current = false;
    }
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      const container = scrollRef.current;
      if (container) {
        requestAnimationFrame(() => {
          scrollToBottom("instant");
        });
      }
    }
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (inputValue: string, attachments: File[]) => {
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);

    const fileUIParts = await Promise.all(attachments.map(convertFileToUIPart));

    sendMessage(
      {
        text: inputValue,
        files: fileUIParts,
      },
      {
        body: { modelId: currentModelId },
      },
    );

    if (!serverChatId && !createdChatIds[stableId]) {
      markAsCreated(stableId);
      console.log("Creating new chat");
      window.history.replaceState(null, "", `/chat/${stableId}`);
      // Create new chat
      await createChat(currentModelId, stableId);
      mutate("chat-list");
      generateTitle(inputValue, stableId);
    }
  };

  return (
    <div className="relative mx-auto flex h-full max-w-5xl flex-1 flex-col p-2 pt-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
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
            {["submitted", "streaming"].includes(status) && (
              <div className="pl-12">
                <StreamingDots />
              </div>
            )}
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
            <Button
              size={"sm"}
              variant="outline"
              onClick={() => regenerate({ body: { modelId: currentModelId } })}
            >
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

      <InputBox
        onSubmit={handleSendMessage}
        status={status}
        stop={stop}
        currentChatId={stableId}
      />
    </div>
  );
}

export function StreamingDots() {
  return (
    <div
      className={"text-muted-foreground inline-flex items-center gap-2 text-sm"}
    >
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="size-1.5 animate-[fade_1.4s_ease-in-out_infinite] rounded-full bg-current"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes fade {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
