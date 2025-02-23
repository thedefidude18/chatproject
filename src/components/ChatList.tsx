import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

export const ChatList = () => {
  const { user } = useAuthStore();
  const { chats, currentChat, setCurrentChat, createNewChat, createInitialChats } = useChatStore();
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatEmail, setNewChatEmail] = useState('');

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      await createNewChat(newChatTitle, newChatEmail);
      setNewChatTitle('');
      setNewChatEmail('');
      setShowNewChatDialog(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleCreateInitialChats = async () => {
    try {
      await createInitialChats();
    } catch (error) {
      console.error('Error creating initial chats:', error);
    }
  };

  return (
    <div className="w-1/3 bg-white border-r flex flex-col">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chats</h2>
        <div className="flex space-x-2">
          {chats.length === 0 && (
            <button
              onClick={handleCreateInitialChats}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-green-600"
              title="Create sample chats"
            >
              <Users size={24} />
            </button>
          )}
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
      
      {showNewChatDialog && (
        <div className="p-4 border-b bg-white">
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Chat Title</label>
              <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Enter chat title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Participant Email (for direct chat)</label>
              <input
                type="email"
                value={newChatEmail}
                onChange={(e) => setNewChatEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Enter participant email"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewChatDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Create Chat
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
              currentChat?.id === chat.id ? 'bg-gray-100' : ''
            }`}
            onClick={() => setCurrentChat(chat)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{chat.title}</h3>
              <span className="text-xs text-gray-500">
                {format(new Date(chat.created_at), 'HH:mm')}
              </span>
            </div>
            {chat.last_message && (
              <p className="text-sm text-gray-600 truncate">{chat.last_message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};