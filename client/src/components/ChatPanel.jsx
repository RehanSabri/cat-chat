import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import socket from '../utils/socket';
import MessageBubble from './MessageBubble';

export default function ChatPanel() {
  const { messages, addMessage, chatStatus } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatting
  useEffect(() => {
    if (chatStatus === 'chatting') {
      inputRef.current?.focus();
    }
  }, [chatStatus]);

  function handleSend(e) {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || chatStatus !== 'chatting') return;

    socket.emit('send_message', { text });
    addMessage({ sender: 'me', text });
    setInputText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark rounded-2xl border border-dark-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-border bg-dark-lighter/50 backdrop-blur-sm">
        {chatStatus === 'chatting' && <div className="pulse-dot"></div>}
        <h2 className="text-sm font-semibold text-white">
          {chatStatus === 'chatting'
            ? 'Chatting with a stranger'
            : chatStatus === 'disconnected'
            ? 'Stranger disconnected'
            : 'Chat'}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && chatStatus === 'chatting' && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">Say hi to your new stranger!</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-dark-border bg-dark-lighter/50"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            chatStatus === 'chatting'
              ? 'Type a message...'
              : 'Waiting for connection...'
          }
          disabled={chatStatus !== 'chatting'}
          className="flex-1 bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          id="chat-input"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || chatStatus !== 'chatting'}
          className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          id="send-btn"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
