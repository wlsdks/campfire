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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || '입력해주세요'}
        maxLength={maxLength}
        className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg disabled:opacity-40"
      >
        제출
      </button>
    </motion.form>
  );
}
