import React, { useEffect } from 'react';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { SocketProvider } from './contexts/SocketContext';
import { supabase } from './lib/supabase';

function App() {
  const { user } = useAuthStore();
  const { fetchChats } = useChatStore();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.setState({ user: session.user });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({ user: session?.user ?? null });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return <Auth />;
  }

  return (
    <SocketProvider>
      <div className="flex h-screen bg-gray-100">
        <ChatList />
        <ChatWindow />
      </div>
    </SocketProvider>
  );
}

export default App;
