import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, ChevronDown } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  return `${period} ${h % 12 || 12}:${m}`;
}

const DMMessage = memo(function DMMessage({ msg, isOwn }) {
  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="px-3 py-2 text-sm leading-relaxed bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm max-w-[80%]">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1">
        {msg.sender}
        {msg.senderType === 'staff' && (
          <span className="ml-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600 px-1 py-0.5 rounded-full">스태프</span>
        )}
      </span>
      <div className="px-3 py-2 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm max-w-[80%]">
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
    </div>
  );
});

export default function DMBubble({ activeDM, senderName, onSendMessage }) {
  const [expanded, setExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeDM?.messageList?.length, expanded]);

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
      {!expanded ? (
        <motion.button
          key="bubble"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={() => setExpanded(true)}
          className="fixed bottom-28 right-4 z-40 w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150"
          aria-label="도움 요청 채팅 열기"
        >
          <MessageSquare size={20} />
          {isWaiting && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          )}
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-28 right-4 left-4 sm:left-auto sm:w-[340px] z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[50vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={16} className="text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {isWaiting ? '도움 요청' : activeDM.staffName || '스태프'}
              </span>
              {isWaiting && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">대기중</span>
              )}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              aria-label="최소화"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 scrollbar-hide">
            {isWaiting && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 dark:text-slate-500">스태프를 기다리는 중</p>
                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
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
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 shrink-0">
            <input
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
              aria-label="도움 요청 메시지"
              maxLength={200}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0"
              aria-label="보내기"
            >
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
