import { create } from 'zustand';
import { ChatMessage } from '@/types';

interface ChatState {
  // Messages
  messages: ChatMessage[];
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Convenience methods
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, sources?: ChatMessage['sources']) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  setMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  addUserMessage: (content) => {
    const message: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(message);
  },

  addAssistantMessage: (content, sources) => {
    const message: ChatMessage = {
      role: 'assistant',
      content,
      sources,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(message);
  },
}));

