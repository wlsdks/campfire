import { useState } from 'react';
import { ref, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname, setNickname as saveNickname } from '@/lib/participant';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

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
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onSubmit={handleJoin}
        className="w-full max-w-sm"
      >
        <Card className="p-8 space-y-7">
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto"
            >
              <Sparkles size={28} className="text-indigo-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pinggo</h1>
              <p className="text-slate-400 text-sm mt-1">닉네임을 정하고 참여하세요</p>
            </div>
            <Badge variant="neutral">{sessionId}</Badge>
          </div>

          {/* Avatar preview + Input */}
          <div className="space-y-4">
            {nickname.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-full py-1.5 pl-1.5 pr-4">
                  <Avatar name={nickname} size="md" />
                  <span className="text-sm font-medium text-slate-700">{nickname.trim()}</span>
                </div>
              </motion.div>
            )}

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              maxLength={10}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base text-center placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              autoFocus
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!nickname.trim() || joining}
            className="w-full"
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                입장 중...
              </span>
            ) : '참여하기'}
          </Button>
        </Card>
      </motion.form>
    </div>
  );
}
