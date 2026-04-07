import { useEffect, useRef, useState, memo } from 'react';
import { onValue, ref } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';

const MAX_BUBBLES = 18;
const MAX_TEXT_LEN = 15;
const BUBBLE_LIFETIME_MS = 3400;
const STAGGER_MS = 80;

function hashSeed(value) {
  return String(value).split('').reduce((s, c, i) => (s * 33 + c.charCodeAt(0) + i) % 2147483647, 7);
}

/**
 * AnswerBubbleOverlay — 학생 답변이 화면에 떠오르는 버블.
 * onValue로 전체 votes 감시, 이전 스냅샷과 비교해서 새로 추가된 것만 표시.
 */
export default memo(function AnswerBubbleOverlay({ sessionId, questionId }) {
  const [bubbles, setBubbles] = useState([]);
  const mountedRef = useRef(true);
  const timersRef = useRef([]);
  const queueRef = useRef([]);
  const flushRef = useRef(null);
  const prevKeysRef = useRef(new Set());

  const active = !!(sessionId && questionId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Stagger flush
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

  // Firebase listener — onValue로 전체 감시, diff로 새 항목만 버블
  useEffect(() => {
    if (!active) {
      prevKeysRef.current = new Set();
      queueRef.current = [];
      setBubbles([]);
      return;
    }

    const votesRef = ref(db, `sessions/${sessionId}/questions/${questionId}/votes`);
    const isFirstRef = { current: true };

    const unsubscribe = onValue(votesRef, (snapshot) => {
      if (!mountedRef.current) return;
      const data = snapshot.val() || {};
      const currentKeys = new Set(Object.keys(data));

      if (isFirstRef.current) {
        prevKeysRef.current = currentKeys;
        isFirstRef.current = false;
        return;
      }

      // 새로 추가된 키만 찾기
      const newKeys = [];
      for (const key of currentKeys) {
        if (!prevKeysRef.current.has(key)) newKeys.push(key);
      }
      prevKeysRef.current = currentKeys;

      // 새 투표를 버블로 직접 추가
      for (const key of newKeys) {
        const vote = data[key];
        if (!vote?.value) continue;

        const text = String(vote.value).trim();
        if (!text) continue;

        const seed = hashSeed(key);
        const displayText = text.length > MAX_TEXT_LEN ? text.slice(0, MAX_TEXT_LEN) + '…' : text;

        const bubble = {
          id: `${key}-${Date.now()}`,
          text: displayText,
          left: 8 + (seed % 75),
          drift: ((Math.floor(seed / 7) % 30) - 15) * 2,
          duration: (BUBBLE_LIFETIME_MS + (seed % 600)) / 1000,
          rotate: (Math.floor(seed / 13) % 8) - 4,
        };

        setBubbles(prev => [...prev.slice(-(MAX_BUBBLES - 1)), bubble]);

        // 자동 제거
        const removeTimer = setTimeout(() => {
          if (!mountedRef.current) return;
          setBubbles(prev => prev.filter(b => b.id !== bubble.id));
        }, bubble.duration * 1000);
        timersRef.current.push(removeTimer);
      }
    });

    return () => {
      unsubscribe();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      queueRef.current = [];
      prevKeysRef.current = new Set();
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
