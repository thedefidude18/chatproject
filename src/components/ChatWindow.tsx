import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Reply } from 'lucide-react';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import LoadingSpinner from './LoadingSpinner';

export const ChatWindow = () => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { 
    currentChat, 
    messages, 
    sendMessage, 
    fetchMessages, 
    setTypingStatus, 
    typingUsers,
    loading 
  } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat.id);
    }
  }, [currentChat, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat) return;

    await sendMessage(message, currentChat.id, false, replyingTo);
    setMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target?.result as string;
      await sendMessage(base64Image, currentChat.id, true);
    };
    reader.readAsDataURL(file);
  };

  const handleTyping = () => {
    if (!currentChat) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTypingStatus(currentChat.id, true);

    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(currentChat.id, false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold">{currentChat.title}</h2>
        {typingUsers[currentChat.id] && (
          <p className="text-sm text-gray-500">Someone is typing...</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {msg.replied_to && (
                <div className="mb-2 p-2 bg-black bg-opacity-10 rounded">
                  <p className="text-sm">
                    {messages.find(m => m.id === msg.replied_to)?.content || 'Message not found'}
                  </p>
                </div>
              )}
              {msg.is_image ? (
                <img src={msg.content} alt="Shared" className="max-w-full rounded" />
              ) : (
                <p>{msg.content}</p>
              )}
              <div className="text-xs mt-1 opacity-70">
                {format(new Date(msg.created_at), 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Replying to: {messages.find(m => m.id === replyingTo)?.content}
            </p>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setMessage((prev) => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message"
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Smile size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Image size={20} />
          </button>
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
