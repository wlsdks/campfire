import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle } from 'lucide-react';
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
  const initial = (msg.sender || '익명').charAt(0);

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm max-w-[75%]">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
        {initial}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {msg.sender || '익명'}
          {msg.senderType === 'instructor' && (
            <span className="ml-1 text-[10px] font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">강사</span>
          )}
          {msg.senderType === 'staff' && (
            <span className="ml-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">스태프</span>
          )}
        </span>
        <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

export default function ChatPanel({ sessionId, senderName, senderType, open, onClose, onNewMessage }) {
  const { messages, sendMessage, loading, canSend } = useChat(sessionId);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const prevCountRef = useRef(0);
  const isNearBottomRef = useRef(true);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }

  // Auto-scroll on new messages (only if near bottom)
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? 'instant' : 'smooth' });
    }
  }, [messages.length]);

  // Scroll to bottom on open
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        isNearBottomRef.current = true;
      }, 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Notify parent of new messages when panel is closed
  useEffect(() => {
    if (messages.length > prevCountRef.current && !open && onNewMessage) {
      onNewMessage();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open, onNewMessage]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !canSend || sending) return;
    setSending(true);
    const success = await sendMessage(text, senderName, senderType);
    if (success) setInputText('');
    setSending(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] sm:h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">채팅</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                aria-label="채팅 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scrollbar-hide"
            >
              {loading && messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm text-slate-400 dark:text-slate-500">불러오는 중...</span>
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                    아직 메시지가 없습니다<br />
                    <span className="text-xs">
                      {senderType === 'instructor'
                        ? '학생들과 실시간으로 소통하세요'
                        : '강사와 학생들에게 메시지를 보내세요'}
                    </span>
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
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요"
                aria-label="채팅 메시지"
                maxLength={MAX_LENGTH}
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || !canSend || sending}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0"
                aria-label="메시지 보내기"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
