import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { useChat } from '@/features/chat/api/useChat';

const MAX_LENGTH = 500;

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 || 12;
  return `${period} ${hour12}:${m}`;
}

function ChatMessage({ msg, isOwn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex flex-col max-w-[80%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
    >
      {!isOwn && (
        <span className="text-[11px] font-medium text-slate-400 mb-0.5 px-1">
          {msg.sender || '익명'}
          {msg.senderType === 'instructor' && (
            <span className="ml-1 text-[10px] font-semibold text-slate-500">강사</span>
          )}
        </span>
      )}
      <div
        className={`px-3.5 py-2 text-sm leading-relaxed ${
          isOwn
            ? 'bg-slate-900 text-white rounded-2xl rounded-br-md'
            : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
        }`}
      >
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-300 mt-0.5 px-1">
        {formatTime(msg.timestamp)}
      </span>
    </motion.div>
  );
}

export default function ChatPanel({ sessionId, senderName, senderType, open, onClose }) {
  const { messages, sendMessage, loading, canSend } = useChat(sessionId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!inputText.trim() || !canSend) return;
    const success = await sendMessage(inputText, senderName, senderType);
    if (success) setInputText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">채팅</span>
                {messages.length > 0 && (
                  <span className="text-xs text-slate-400">{messages.length}</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                aria-label="채팅 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 scrollbar-hide">
              {loading && messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm text-slate-300">불러오는 중...</span>
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-slate-300 text-center leading-relaxed">
                    아직 메시지가 없습니다
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.sender === senderName && msg.senderType === senderType}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 shrink-0 bg-white"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요"
                maxLength={MAX_LENGTH}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all"
                aria-label="채팅 메시지 입력"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !canSend}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white disabled:opacity-30 hover:bg-slate-800 transition-colors shrink-0"
                aria-label="메시지 보내기"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
