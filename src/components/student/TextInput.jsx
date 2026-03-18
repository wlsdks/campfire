import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getParticipantId } from '../../lib/participant';
import { useState } from 'react';
import { motion } from 'framer-motion';
import VoteConfirm from './VoteConfirm';

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || '입력해주세요'}
          maxLength={maxLength}
          className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          autoFocus
        />
        {maxLength && (
          <span className="absolute right-4 bottom-3 text-xs text-gray-300">
            {text.length}/{maxLength}
          </span>
        )}
      </div>
      <motion.button
        type="submit"
        disabled={!text.trim()}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg disabled:opacity-30 shadow-sm transition-all"
      >
        제출
      </motion.button>
    </motion.form>
  );
}
