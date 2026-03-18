import { useState } from 'react';
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname, setNickname as saveNickname } from '@/lib/participant';
import { motion } from 'framer-motion';

export default function JoinPage({ sessionId, onJoin }) {
  const [nickname, setNickname] = useState(getNickname());
  const [joining, setJoining] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setJoining(true);

    const participantId = getParticipantId();
    saveNickname(nickname.trim());

    const participantRef = ref(db, `sessions/${sessionId}/participants/${participantId}`);
    await set(participantRef, {
      nickname: nickname.trim(),
      joinedAt: serverTimestamp(),
      online: true,
    });

    const onlineRef = ref(db, `sessions/${sessionId}/participants/${participantId}/online`);
    onDisconnect(onlineRef).set(false);

    onJoin(participantId, nickname.trim());
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleJoin}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="text-6xl"
          >
            🏓
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900">
            Pinggo
          </h1>
          <p className="text-gray-400 text-base">닉네임을 정하고 참여해보세요!</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="멋진 닉네임을 입력하세요"
            maxLength={10}
            className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            autoFocus
          />

          <motion.button
            type="submit"
            disabled={!nickname.trim() || joining}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg disabled:opacity-30 transition-all shadow-sm"
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block"
                >
                  ⏳
                </motion.span>
                입장 중...
              </span>
            ) : '입장하기'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
