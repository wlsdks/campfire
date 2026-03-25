import { useState, useEffect, useRef } from 'react';
import { ref, set, get, serverTimestamp, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { getParticipantId, getNickname, setNickname as saveNickname } from '@/lib/participant';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 10;
const FORM_ID = 'join-form';

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

/**
 * Detects keyboard open state via visualViewport API.
 * Returns true when virtual keyboard is likely visible (viewport shrinks > 100px).
 */
function useKeyboardDetect() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Capture baseline after initial render (avoids false positive on load)
    let baseline = null;
    const t = setTimeout(() => { baseline = vv.height; }, 300);
    function handleResize() {
      if (baseline === null) return;
      setKeyboardOpen(baseline - vv.height > 120);
    }
    vv.addEventListener('resize', handleResize);
    return () => { clearTimeout(t); vv.removeEventListener('resize', handleResize); };
  }, []);
  return keyboardOpen;
}

export default function JoinPage({ sessionId, onJoin }) {
  const [nickname, setNickname] = useState(getNickname());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const inputWrapRef = useRef(null);
  const { courseName } = useSessionInfo(sessionId);
  const keyboardOpen = useKeyboardDetect();

  const trimmed = nickname.trim();
  const tooShort = touched && trimmed.length > 0 && trimmed.length < NICKNAME_MIN;
  const isValid = trimmed.length >= NICKNAME_MIN;

  // Reliable autoFocus for mobile browsers (slight delay for page transition)
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // When keyboard opens, scroll input into view
  function handleInputFocus() {
    setTimeout(() => {
      inputWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }

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
      logger.error('Join failed:', err);
      setError('참여에 실패했습니다. 다시 시도해주세요.');
      setJoining(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 pt-[14vh] pb-32">
        <div className="w-full max-w-sm">
          {/* Header — collapses when keyboard is open to maximize input visibility */}
          <motion.div
            animate={keyboardOpen
              ? { opacity: 0, height: 0, marginBottom: 0 }
              : { opacity: 1, height: 'auto', marginBottom: 32 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="text-center space-y-3 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
              transition={{
                scale: { type: 'spring', stiffness: 300, damping: 25, delay: 0.1 },
                opacity: { duration: 0.3, delay: 0.1 },
                y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 },
              }}
              className="flex justify-center mb-1"
            >
              <PickMascot size="md" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</h1>
              <p className={`text-sm mt-1.5 ${courseName ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                {courseName || '닉네임을 정하고 참여하세요'}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              {sessionId}
            </span>
          </motion.div>

          {/* Compact header shown when keyboard is open */}
          <motion.div
            animate={keyboardOpen
              ? { opacity: 1, height: 'auto', marginBottom: 20 }
              : { opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</span>
              {courseName && (
                <span className="text-sm text-slate-400 dark:text-slate-500 truncate">{courseName}</span>
              )}
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">{sessionId}</span>
            </div>
          </motion.div>

          {/* Form */}
          <form id={FORM_ID} onSubmit={handleJoin}>
            {/* Input with inline avatar preview */}
            <div ref={inputWrapRef} className="space-y-3">
              <div className="relative">
                {/* Avatar floats left when nickname is valid */}
                <AnimatePresence>
                  {isValid && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                    >
                      <Avatar name={trimmed} size="sm" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.input
                  ref={inputRef}
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (!touched) setTouched(true);
                    if (error) setError(null);
                  }}
                  onFocus={handleInputFocus}
                  onBlur={() => setTouched(true)}
                  placeholder="닉네임 입력"
                  aria-label="닉네임"
                  aria-invalid={tooShort || !!error}
                  maxLength={NICKNAME_MAX}
                  autoComplete="off"
                  enterKeyHint="go"
                  animate={isValid ? { paddingLeft: '3rem' } : { paddingLeft: '1rem' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-2xl pr-4 py-4 text-lg text-center text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-700 transition-colors duration-150 ${
                    tooShort || error
                      ? 'border-red-300 focus:ring-red-500/15 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-500 dark:focus:border-indigo-400'
                  }`}
                />
              </div>

              {/* Helper row: hint/error + char count */}
              <div className="flex items-center justify-between px-1 min-h-[18px]">
                <AnimatePresence mode="wait">
                  {tooShort || error ? (
                    <motion.span
                      key="error"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-red-400"
                      role="alert"
                    >
                      {error || `${NICKNAME_MIN}자 이상 입력해주세요`}
                    </motion.span>
                  ) : (
                    <motion.span
                      key={isValid ? 'ready' : 'hint'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`text-xs ${isValid ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      {isValid ? '참여 준비 완료' : '2~10자로 입력해주세요'}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className={`text-xs tabular-nums transition-colors duration-150 ${
                  trimmed.length >= NICKNAME_MAX ? 'text-amber-500 font-medium' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  {trimmed.length}/{NICKNAME_MAX}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sticky bottom CTA — always in thumb zone, respects safe-area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
        className="sticky bottom-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <Button
          type="submit"
          form={FORM_ID}
          variant="primary"
          size="lg"
          disabled={!isValid || joining}
          className="w-full"
        >
          {joining ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              입장 중...
            </>
          ) : (
            <>
              참여하기
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
