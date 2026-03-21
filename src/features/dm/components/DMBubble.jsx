import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { formatChatTime } from '@/lib/utils';
import { useState } from 'react';

const DMMessage = memo(function DMMessage({ msg, isOwn }) {
  if (isOwn) {
    return (
      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
        className="flex flex-col items-end gap-0.5">
        <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm max-w-[75%]">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatChatTime(msg.timestamp)}</span>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
      className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1">
        {msg.sender}
        {msg.senderType === 'staff' && (
          <span className="ml-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600 px-1 py-0.5 rounded-full">스태프</span>
        )}
      </span>
      <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm max-w-[75%]">
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatChatTime(msg.timestamp)}</span>
    </motion.div>
  );
});

/**
 * DM chat modal for students — opens centered on screen.
 * No floating bubble — triggered by "도움" button in StudentBottomBar.
 */
export default function DMBubble({ activeDM, senderName, onSendMessage, onClose }) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDM?.messageList?.length]);

  if (!activeDM) return null;

  const isWaiting = activeDM.status === 'waiting';

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await onSendMessage(text, senderName);
    if (ok) setInputText('');
    setSending(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] sm:h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare size={16} className="text-slate-400 shrink-0" />
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {isWaiting ? '도움 요청' : activeDM.staffName || '스태프'}
            </span>
            {isWaiting && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">대기중</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scrollbar-hide">
          {isWaiting && (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 dark:text-slate-500">스태프를 기다리는 중</p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          )}
          {activeDM.messageList?.map((msg) => (
            <DMMessage key={msg.id} msg={msg} isOwn={msg.senderType === 'student'} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="메시지를 입력하세요"
            aria-label="도움 요청 메시지"
            maxLength={200}
            autoFocus
            className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150 shrink-0"
            aria-label="보내기"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
