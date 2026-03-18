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
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-600/8 rounded-full blur-3xl animate-float-delay-2" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleJoin}
        className="w-full max-w-sm space-y-8 relative z-10"
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
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Pinggo
          </h1>
          <p className="text-white/40 text-base">닉네임을 정하고 참여해보세요!</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="멋진 닉네임을 입력하세요"
            maxLength={10}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-white/25 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            autoFocus
          />

          <motion.button
            type="submit"
            disabled={!nickname.trim() || joining}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg disabled:opacity-30 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500"
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
