import { useState } from 'react';
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getParticipantId, getNickname, setNickname as saveNickname } from '../../lib/participant';
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
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleJoin}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">ShotShot</h1>
          <p className="text-white/50 mt-2">닉네임을 입력하고 참여하세요</p>
        </div>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임 입력"
          maxLength={10}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-white/30 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />

        <button
          type="submit"
          disabled={!nickname.trim() || joining}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg disabled:opacity-40 active:scale-95 transition-transform"
        >
          {joining ? '입장 중...' : '입장하기'}
        </button>
      </motion.form>
    </div>
  );
}
