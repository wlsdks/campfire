import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import VoteConfirm from './VoteConfirm';
import Button from '@/components/ui/Button';

export default function TextInput({ sessionId, questionId, placeholder, maxLength = 50 }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const pid = getParticipantId();
    await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${pid}`), {
      value: text.trim(),
      timestamp: serverTimestamp(),
    });
    setSubmitted(true);
  }

  if (submitted) return <VoteConfirm />;

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      className="w-full space-y-3"
    >
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || '입력해주세요'}
          maxLength={maxLength}
          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3.5 pr-16 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          autoFocus
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-300 font-medium">
          {text.length}/{maxLength}
        </span>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!text.trim()}
        className="w-full"
      >
        <Send size={18} />
        제출하기
      </Button>
    </motion.form>
  );
}
