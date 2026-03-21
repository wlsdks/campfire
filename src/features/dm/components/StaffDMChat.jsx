import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2 } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  return `${period} ${h % 12 || 12}:${m}`;
}

const ChatMsg = memo(function ChatMsg({ msg, isOwn }) {
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
    <div className="flex flex-col items-start gap-0.5 max-w-[80%]">
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1">{msg.sender}</span>
      <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm">
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
    </div>
  );
});

export default function StaffDMChat({
  dm, open, onClose, onResolve, onSendMessage, staffName, senderType,
  allActiveDMs, onSwitchDM,
}) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && dm) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dm?.messageList?.length, open]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !dm || sending) return;
    setSending(true);
    const ok = await onSendMessage(dm.id, text, staffName, senderType);
    if (ok) setInputText('');
    setSending(false);
  }

  async function handleResolve() {
    if (!dm) return;
    await onResolve(dm.id);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && dm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] sm:h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                  {(dm.studentName || '학').charAt(0)}
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {dm.studentName || '학생'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResolve}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-lg transition-colors duration-150"
                >
                  <CheckCircle2 size={14} />
                  해결 완료
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  aria-label="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* DM list toggle (if multiple active DMs) */}
            {allActiveDMs?.length > 1 && (
              <div className="flex gap-1 px-4 py-2 border-b border-slate-50 dark:border-slate-700/50 overflow-x-auto scrollbar-hide shrink-0">
                {allActiveDMs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSwitchDM(d)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                      d.id === dm.id
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d.studentName || '학생'}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scrollbar-hide">
              {dm.messageList?.map((msg) => (
                <ChatMsg
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.senderType !== 'student'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
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
                aria-label="도움 응답 메시지"
                maxLength={500}
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0"
                aria-label="보내기"
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
