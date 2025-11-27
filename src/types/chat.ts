import { UIMessage } from "ai";

export interface Chatdata {
  id: string;
  title: string;
  timestamp: number;
  modelId: string;
  messages: UIMessage[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  baseURL: string;
}
