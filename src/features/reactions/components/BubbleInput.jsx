import { useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { ref, push, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname } from '@/lib/participant';

const MAX_LEN = 20;
const COOLDOWN_MS = 3000;

/**
 * Compact bubble text input — sits next to reaction icons.
 * Posts to sessions/{sessionId}/chatBubbles.
 */
export default memo(function BubbleInput({ sessionId }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [canSend, setCanSend] = useState(true);
  const inputRef = useRef(null);
  const cooldownRef = useRef(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !canSend || !sessionId) return;
    try {
      await push(ref(db, `sessions/${sessionId}/chatBubbles`), {
        text: trimmed,
        nickname: getNickname() || '익명',
        participantId: getParticipantId(),
        timestamp: serverTimestamp(),
      });
      setText('');
      setOpen(false);
      setCanSend(false);
      cooldownRef.current = setTimeout(() => setCanSend(true), COOLDOWN_MS);
    } catch { /* ignore */ }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-full mb-2 right-0 flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 px-2 py-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') setOpen(false); }}
              placeholder="한마디..."
              maxLength={MAX_LEN}
              className="w-32 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              autoFocus
            />
            <span className="text-[10px] text-slate-300 dark:text-slate-500 tabular-nums shrink-0">{text.length}/{MAX_LEN}</span>
            <button
              onClick={handleSend}
              disabled={!text.trim() || !canSend}
              className="p-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 transition-colors"
            >
              <Send size={12} />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
        disabled={!canSend}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${
          open
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'bg-slate-50 text-slate-500 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:active:bg-slate-700'
        } ${!canSend && !open ? 'opacity-40' : ''}`}
        aria-label="버블 메시지"
      >
        <MessageCircle size={18} />
      </button>
    </div>
  );
});
