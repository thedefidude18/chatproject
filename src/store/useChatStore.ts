import create from 'zustand';
import { supabase } from '../lib/supabase';

interface ChatStore {
  currentChat: any | null;
  messages: any[];
  chats: any[];
  loading: boolean;
  typingUsers: Record<string, boolean>;
  setCurrentChat: (chat: any) => void;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (content: string, chatId: string, isImage: boolean, replyTo?: string | null) => Promise<void>;
  fetchChats: () => Promise<void>;
  setTypingStatus: (chatId: string, isTyping: boolean) => void;
  // ... other methods
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentChat: null,
  messages: [],
  chats: [],
  loading: false,
  typingUsers: {},

  setCurrentChat: (chat) => set({ currentChat: chat }),

  fetchMessages: async (chatId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ loading: false });
    }
  },

  // ... rest of your store implementation
}));
