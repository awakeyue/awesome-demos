import { Chatdata, ModelInfo } from "@/types/chat";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ChatHistoryStoreProps {
  chatHistorys: Chatdata[];
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  setChatHistory: (history: Chatdata[]) => void;
  setChatMessages: (chatId: string, messages: Chatdata["messages"]) => void;
  createNewChat: () => void;
}

export const useChatHistoryStore = create<ChatHistoryStoreProps>()(
  persist(
    (set) => ({
      chatHistorys: [],
      currentChatId: null,

      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

      setChatHistory: (historys) => set({ chatHistorys: historys }),

      setChatMessages: (chatId, messages) =>
        set((state) => ({
          chatHistorys: state.chatHistorys.map((history) =>
            history.id === chatId ? { ...history, messages } : history,
          ),
        })),

      createNewChat: () =>
        set((state) => {
          const chatId = `chat-${Date.now()}`;
          const newChat = {
            id: chatId,
            title: "",
            timestamp: Date.now(),
            modelId: "ep-20251203173341-sztlm",
            messages: [],
          };
          return {
            currentChatId: chatId,
            chatHistorys: [...state.chatHistorys, newChat],
          };
        }),
    }),
    {
      name: "chat-history-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chatHistorys: state.chatHistorys.filter((chat) => chat.title !== ""),
      }),
    },
  ),
);

interface ModelStoreProps {
  currentModelId: string;
  modelList: ModelInfo[];
  setCurrentModelId: (modelId: string) => void;
  setModelList: (modelList: ModelInfo[]) => void;
}

export const useModelStore = create<ModelStoreProps>()(
  persist(
    (set) => ({
      currentModelId: "ep-20251203173341-sztlm",
      modelList: [
        {
          id: "ep-20251203173341-sztlm",
          name: "Kimi-K2",
          description: "Kimi-K2",
          apiKey: process.env.AI_GATEWAY_API_KEY as string,
          baseURL: "https://ark.cn-beijing.volces.com/api/v3",
        },
        {
          id: "ep-20251124145531-b7dkr",
          name: "Doubao-Seed-1.6(深度思考)",
          description: "豆包大模型",
          apiKey: process.env.AI_GATEWAY_API_KEY as string,
          baseURL: "https://ark.cn-beijing.volces.com/api/v3",
        },
        {
          id: "ep-20251120155412-jmc8q",
          name: "Doubao-lite-32k",
          description: "豆包大模型",
          apiKey: process.env.AI_GATEWAY_API_KEY as string,
          baseURL: "https://ark.cn-beijing.volces.com/api/v3",
        },
      ],
      setCurrentModelId: (modelId) => set({ currentModelId: modelId }),
      setModelList: (modelList) => set({ modelList }),
    }),
    {
      name: "model-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentModelId: state.currentModelId,
      }),
    },
  ),
);
