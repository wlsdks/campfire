import { useEffect, useRef, useState, memo } from 'react';
import { onChildAdded, query, ref, limitToLast } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';

const MAX_BUBBLES = 18;
const MAX_TEXT_LEN = 15;
const BUBBLE_LIFETIME_MS = 3400;
const WARMUP_MS = 500;
const STAGGER_MS = 80;

/** Deterministic seed from string key. */
function hashSeed(value) {
  return String(value).split('').reduce((s, c, i) => (s * 33 + c.charCodeAt(0) + i) % 2147483647, 7);
}

/** 버블이 떠오르는 질문 유형 (투표가 있는 모든 유형). */
const BUBBLE_TYPES = ['mysteryBox', 'hintQuiz', 'wordcloud', 'fillinblank', 'choice', 'quiz', 'ox', 'scale', 'debate', 'ranking', 'check'];

/**
 * AnswerBubbleOverlay — 학생 답변이 화면에 떠오르는 버블.
 * 미스터리 박스, 힌트 퀴즈, 워드클라우드, 빈칸 채우기에서 활성화.
 *
 * @param {string} sessionId
 * @param {string|null} questionId — current active question
 * @param {string|null} questionType — type of current question
 */
export default memo(function AnswerBubbleOverlay({ sessionId, questionId, questionType }) {
  const [bubbles, setBubbles] = useState([]);
  const mountedRef = useRef(true);
  const warmupRef = useRef(null);
  const timersRef = useRef([]);
  const queueRef = useRef([]);
  const flushRef = useRef(null);

  const active = sessionId && questionId && BUBBLE_TYPES.includes(questionType);

  // Mount/unmount lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (warmupRef.current) clearTimeout(warmupRef.current);
      if (flushRef.current) clearInterval(flushRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Stagger flush — drains queued bubbles at STAGGER_MS intervals
  useEffect(() => {
    if (!active) {
      if (flushRef.current) clearInterval(flushRef.current);
      return;
    }
    flushRef.current = setInterval(() => {
      if (!mountedRef.current || queueRef.current.length === 0) return;
      const bubble = queueRef.current.shift();
      setBubbles(prev => [...prev.slice(-(MAX_BUBBLES - 1)), bubble]);
      const removeTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      }, bubble.duration * 1000);
      timersRef.current.push(removeTimer);
    }, STAGGER_MS);

    return () => {
      if (flushRef.current) clearInterval(flushRef.current);
    };
  }, [active]);

  // Firebase listener for new votes
  useEffect(() => {
    if (!active) {
      queueRef.current = [];
      return;
    }

    let ready = false;
    warmupRef.current = setTimeout(() => { ready = true; }, WARMUP_MS);

    const votesRef = query(
      ref(db, `sessions/${sessionId}/questions/${questionId}/votes`),
      limitToLast(20)
    );

    const unsubscribe = onChildAdded(votesRef, (snapshot) => {
      if (!ready || !mountedRef.current) return;
      const vote = snapshot.val();
      if (!vote?.value) return;

      const text = String(vote.value).trim();
      if (!text) return;

      const seed = hashSeed(snapshot.key);
      const displayText = text.length > MAX_TEXT_LEN ? text.slice(0, MAX_TEXT_LEN) + '…' : text;

      // 큐 오버플로우 방지 (300명 동시 투표 대응)
      if (queueRef.current.length > 100) queueRef.current.shift();
      queueRef.current.push({
        id: `${snapshot.key}-${Date.now()}`,
        text: displayText,
        left: 8 + (seed % 75),
        drift: ((Math.floor(seed / 7) % 30) - 15) * 2,
        duration: (BUBBLE_LIFETIME_MS + (seed % 600)) / 1000,
        rotate: (Math.floor(seed / 13) % 8) - 4,
        nickname: vote.nickname || '',
      });
    });

    return () => {
      ready = false;
      unsubscribe();
      if (warmupRef.current) clearTimeout(warmupRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      queueRef.current = [];
      setBubbles([]);
    };
  }, [active, sessionId, questionId]);

  if (!active || bubbles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.95, 0.9, 0.7, 0],
              y: [0, -50, -180, -350, -550],
              x: [0, bubble.drift * 0.3, -bubble.drift * 0.4, bubble.drift * 0.6, 0],
              scale: [0.5, 1, 0.95, 0.85, 0.6],
              rotate: [0, bubble.rotate, -bubble.rotate * 0.5, bubble.rotate * 0.3, 0],
            }}
            exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.1 } }}
            transition={{
              duration: bubble.duration,
              ease: [0.15, 0.7, 0.25, 0.95],
              times: [0, 0.1, 0.4, 0.7, 1],
            }}
            className="absolute bottom-24"
            style={{ left: `${bubble.left}%` }}
          >
            <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-600/60 shadow-lg backdrop-blur-sm max-w-[220px]">
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">
                {bubble.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
