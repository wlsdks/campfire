import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useChat } from '@/features/chat/api/useChat';
import { getParticipantId } from '@/lib/participant';

const MAX_LENGTH = 200;

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function ChatMessage({ msg, isMine }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
    >
      {!isMine && (
        <span className="text-xs font-medium text-slate-500 mb-0.5 px-1">
          {msg.nickname || '익명'}
        </span>
      )}
      <div
        className={`px-3.5 py-2 text-sm leading-relaxed ${
          isMine
            ? 'bg-slate-100 text-slate-900 rounded-xl rounded-br-sm'
            : 'bg-white border border-slate-200 rounded-xl rounded-bl-sm'
        }`}
      >
        {msg.text}
      </div>
      <span className="text-xs text-slate-400 mt-0.5 px-1">
        {formatRelativeTime(msg.timestamp)}
      </span>
    </motion.div>
  );
}

export default function ChatPanel({ sessionId, open, onClose, onNewMessage }) {
  const { messages, sendMessage, loading, canSend } = useChat(sessionId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const prevCountRef = useRef(0);
  const pid = getParticipantId();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Notify parent of new messages when panel is closed
  useEffect(() => {
    if (messages.length > prevCountRef.current && !open && prevCountRef.current > 0) {
      onNewMessage?.();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open, onNewMessage]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!inputText.trim() || !canSend) return;
    const success = await sendMessage(inputText);
    if (success) setInputText('');
  }

  return (
    <Modal open={open} onClose={onClose} className="flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 shrink-0">
        <MessageSquare size={18} className="text-slate-700" />
        <span className="font-bold text-slate-900">채팅</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5 min-h-[200px] max-h-[50vh]">
        {loading && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-slate-400">불러오는 중...</span>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-slate-400">아직 메시지가 없습니다</span>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} isMine={msg.participantId === pid} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-slate-100 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={MAX_LENGTH}
          className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          aria-label="채팅 메시지 입력"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !canSend}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shrink-0"
          aria-label="메시지 보내기"
        >
          <Send size={18} />
        </button>
      </form>
    </Modal>
  );
}
