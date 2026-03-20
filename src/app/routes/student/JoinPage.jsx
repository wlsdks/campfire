import { useState, useEffect, useRef } from 'react';
import { ref, set, get, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId, getNickname, setNickname as saveNickname } from '@/lib/participant';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Loader2, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 10;

/** Fetch session course name for display (lightweight one-time read). */
function useSessionInfo(sessionId) {
  const [courseName, setCourseName] = useState(null);
  useEffect(() => {
    if (!sessionId) return;
    get(ref(db, `sessions/${sessionId}/courseName`))
      .then((snap) => setCourseName(snap.val() || null))
      .catch(() => {});
  }, [sessionId]);
  return { courseName };
}

export default function JoinPage({ sessionId, onJoin }) {
  const [nickname, setNickname] = useState(getNickname());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const { courseName } = useSessionInfo(sessionId);

  const trimmed = nickname.trim();
  const tooShort = touched && trimmed.length > 0 && trimmed.length < NICKNAME_MIN;
  const isValid = trimmed.length >= NICKNAME_MIN;

  // Reliable autoFocus for mobile browsers
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    if (!isValid) return;
    setJoining(true);
    setError(null);

    try {
      const participantId = getParticipantId();
      saveNickname(trimmed);

      const participantRef = ref(db, `sessions/${sessionId}/participants/${participantId}`);
      await set(participantRef, {
        nickname: trimmed,
        joinedAt: serverTimestamp(),
        online: true,
      });

      const onlineRef = ref(db, `sessions/${sessionId}/participants/${participantId}/online`);
      onDisconnect(onlineRef).set(false);

      onJoin(participantId, trimmed);
    } catch (err) {
      console.error('Join failed:', err);
      setError('참여에 실패했습니다. 다시 시도해주세요.');
      setJoining(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-start px-5 pt-[18vh]">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onSubmit={handleJoin}
        className="w-full max-w-xl"
      >
        <Card className="p-8 space-y-7">
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
              className="flex justify-center mb-1"
            >
              <Radio size={32} className="text-indigo-500" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pinggo</h1>
              <p className={`text-sm mt-1.5 ${courseName ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                {courseName || '닉네임을 정하고 참여하세요'}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-slate-400 border border-slate-200">
              {sessionId}
            </span>
          </div>

          {/* Avatar preview */}
          <AnimatePresence>
            {isValid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="overflow-hidden"
              >
                <div className="flex justify-center pb-1">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700 rounded-full py-1.5 pl-1.5 pr-4"
                  >
                    <Avatar name={trimmed} size="md" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{trimmed}</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input + character count */}
          <div className="space-y-2.5">
            <input
              ref={inputRef}
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (!touched) setTouched(true);
                if (error) setError(null);
              }}
              onBlur={() => setTouched(true)}
              placeholder="닉네임 입력"
              aria-label="닉네임"
              aria-invalid={tooShort || !!error}
              maxLength={NICKNAME_MAX}
              autoComplete="off"
              enterKeyHint="go"
              className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-xl px-4 py-4 text-lg text-slate-900 dark:text-slate-100 text-center font-medium placeholder:text-slate-300 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-600 transition-all ${
                tooShort || error
                  ? 'border-red-300 focus:ring-red-500/15 focus:border-red-400'
                  : 'border-slate-200 dark:border-slate-600 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400'
              }`}
            />
            <div className="flex items-center justify-between px-1">
              <span className={`text-xs text-red-400 transition-opacity ${tooShort ? 'opacity-100' : 'opacity-0'}`}>
                {NICKNAME_MIN}자 이상 입력해주세요
              </span>
              <span className={`text-xs tabular-nums transition-colors ${
                trimmed.length >= NICKNAME_MAX ? 'text-slate-500 font-medium' : 'text-slate-300'
              }`}>
                {trimmed.length}/{NICKNAME_MAX}
              </span>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-red-500 text-sm text-center font-medium -mt-2"
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isValid || joining}
            className="w-full"
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                입장 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                참여하기
                <ArrowRight size={18} />
              </span>
            )}
          </Button>
        </Card>
      </motion.form>
    </div>
  );
}
