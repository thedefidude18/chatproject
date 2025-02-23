import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  chat_id: string;
  created_at: string;
  is_image?: boolean;
  replied_to?: string;
}

interface Chat {
  id: string;
  title: string;
  last_message?: string;
  created_at: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  typingUsers: Record<string, boolean>;
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (content: string, chatId: string, isImage?: boolean, replyToId?: string) => Promise<void>;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  createNewChat: (title: string, participantEmail?: string) => Promise<void>;
  createInitialChats: () => Promise<void>;
  setTypingStatus: (chatId: string, isTyping: boolean) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  typingUsers: {},
  setCurrentChat: (chat) => set({ currentChat: chat }),
  sendMessage: async (content, chatId, isImage = false, replyToId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        content,
        chat_id: chatId,
        sender_id: user.id,
        is_image: isImage,
        replied_to: replyToId
      })
      .select()
      .single();

    if (messageError) throw messageError;

    await supabase
      .from('chats')
      .update({ last_message: isImage ? '📷 Image' : content })
      .eq('id', chatId);

    get().fetchMessages(chatId);
  },
  fetchChats: async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      set({ chats: data });
    }
  },
  fetchMessages: async (chatId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (data) {
      set({ messages: data });
    }
  },
  createNewChat: async (title: string, participantEmail?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .insert({ title })
      .select()
      .single();

    if (chatError) throw chatError;

    await supabase.from('messages').insert({
      content: 'Chat created',
      chat_id: chatData.id,
      sender_id: user.id,
    });

    get().fetchChats();
  },
  createInitialChats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teamChat } = await supabase
      .from('chats')
      .insert({ title: '🚀 Project Team' })
      .select()
      .single();

    if (teamChat) {
      await supabase.from('messages').insert([
        {
          content: 'Welcome to the Project Team chat!',
          chat_id: teamChat.id,
          sender_id: user.id,
        },
        {
          content: 'Let\'s discuss our upcoming milestones',
          chat_id: teamChat.id,
          sender_id: user.id,
        }
      ]);
    }

    const { data: designChat } = await supabase
      .from('chats')
      .insert({ title: '🎨 Design Discussion' })
      .select()
      .single();

    if (designChat) {
      await supabase.from('messages').insert([
        {
          content: 'New design mockups are ready for review',
          chat_id: designChat.id,
          sender_id: user.id,
        }
      ]);
    }

    get().fetchChats();
  },
  setTypingStatus: async (chatId: string, isTyping: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: isTyping
      }
    }));
  }
}));