import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Plus, ArrowLeft } from 'lucide-react';
import { formatChatTime } from '@/lib/utils';

const DMMessage = memo(function DMMessage({ msg, isOwn }) {
  return (
    <motion.div initial={{ opacity: 0, x: isOwn ? 8 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5`}>
      {!isOwn && (
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1">
          {msg.sender}
          {msg.senderType === 'staff' && (
            <span className="ml-1 text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600 px-1 py-0.5 rounded-full">스태프</span>
          )}
        </span>
      )}
      <div className={`px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl max-w-[75%] ${
        isOwn
          ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-br-sm'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
      }`}>
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatChatTime(msg.timestamp)}</span>
    </motion.div>
  );
});

/** DM thread list item */
const DMListItem = memo(function DMListItem({ dm, onClick }) {
  const lastMsg = dm.messageList?.[dm.messageList.length - 1];
  const isWaiting = dm.status === 'waiting';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 text-left"
    >
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
        {(dm.staffName || '스').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {isWaiting ? '도움 요청' : dm.staffName || '스태프'}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${
            isWaiting
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          }`}>
            {isWaiting ? '대기중' : '진행중'}
          </span>
        </div>
        {lastMsg && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{lastMsg.text}</p>
        )}
      </div>
    </motion.button>
  );
});

/**
 * Student DM modal — shows DM list + new request + active chat.
 * Opens centered on screen via "도움" button.
 */
export default function DMBubble({ activeDMs, activeDM, senderName, onSendMessage, onClose, onRequestHelp }) {
  const [selectedDM, setSelectedDM] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-select if only one DM
  const currentDM = selectedDM
    ? (activeDMs || []).find((d) => d.id === selectedDM.id) || selectedDM
    : activeDM;

  const showList = !currentDM || (activeDMs && activeDMs.length > 1 && !selectedDM);

  useEffect(() => {
    if (currentDM && !showList) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentDM?.messageList?.length, showList]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending || !currentDM) return;
    setSending(true);
    const ok = await onSendMessage(text, senderName);
    if (ok) setInputText('');
    setSending(false);
  }

  const isWaiting = currentDM?.status === 'waiting';
  const allDMs = activeDMs || (activeDM ? [activeDM] : []);

  return (
    <>
      <motion.div
        key="dm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        key="dm-panel"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] sm:h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {showList ? (
          <>
            {/* Header — DM list */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">도움 요청</span>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                aria-label="닫기">
                <X size={16} />
              </button>
            </div>

            {/* DM list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
              {allDMs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <MessageSquare size={24} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">도움 요청 내역이 없습니다</p>
                </div>
              ) : (
                allDMs.map((dm) => (
                  <DMListItem key={dm.id} dm={dm} onClick={() => setSelectedDM(dm)} />
                ))
              )}
            </div>

            {/* New request button */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <button
                onClick={onRequestHelp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150"
              >
                <Plus size={16} />
                새 도움 요청
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header — chat */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {allDMs.length > 1 && (
                  <button onClick={() => setSelectedDM(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 shrink-0"
                    aria-label="목록으로">
                    <ArrowLeft size={16} />
                  </button>
                )}
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {isWaiting ? '도움 요청' : currentDM?.staffName || '스태프'}
                </span>
                {isWaiting && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">대기중</span>
                )}
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
                aria-label="닫기">
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
              {currentDM?.messageList?.map((msg) => (
                <DMMessage key={msg.id} msg={msg} isOwn={msg.senderType === 'student'} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <input type="text" value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="메시지를 입력하세요" aria-label="도움 요청 메시지" maxLength={200} autoFocus
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
              />
              <button onClick={handleSend} disabled={!inputText.trim() || sending}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150 shrink-0"
                aria-label="보내기">
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
