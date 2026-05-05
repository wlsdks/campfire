import { useEffect, useState, useRef } from 'react';
import { ref, onChildAdded } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

const MAX_VISIBLE = 5;
const DISPLAY_MS = 400;
const BATCH_PAUSE_MS = 300;
const MAX_QUEUE = 50;

export default function JoinToast({ sessionId }) {
  const [visible, setVisible] = useState([]);
  const queueRef = useRef([]);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // 큐에서 5명씩 꺼내서 하나씩 아래로 추가 → 다 차면 클리어 → 반복
  async function drainQueue() {
    if (runningRef.current) return;
    runningRef.current = true;

    while (mountedRef.current && queueRef.current.length > 0) {
      // 5명 한 배치
      const batch = queueRef.current.splice(0, MAX_VISIBLE);
      setVisible([]);
      await sleep(100);

      for (let i = 0; i < batch.length; i++) {
        if (!mountedRef.current) break;
        setVisible(prev => [...prev, { nickname: batch[i], id: Date.now() + Math.random() }]);
        await sleep(DISPLAY_MS);
      }

      // 배치 표시 후 잠깐 유지 → 클리어
      await sleep(BATCH_PAUSE_MS);
      if (!mountedRef.current) break;
      setVisible([]);
      await sleep(150);
    }

    runningRef.current = false;
  }

  useEffect(() => {
    if (!sessionId) return;
    const participantsRef = ref(db, `sessions/${sessionId}/participants`);
    let initial = true;

    const unsub = onChildAdded(participantsRef, (snapshot) => {
      if (initial) return;
      const data = snapshot.val();
      if (!data?.nickname) return;

      if (queueRef.current.length >= MAX_QUEUE) queueRef.current.splice(0, 10);
      queueRef.current.push(data.nickname);
      drainQueue();
    });

    setTimeout(() => { initial = false; }, 2000);
    return () => { unsub(); queueRef.current = []; };
    // drainQueue는 같은 컴포넌트 inline 함수 + ref-based이라 stale closure 영향 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="fixed top-14 right-3 z-40 flex flex-col gap-1" role="log" aria-label="참여자 알림" aria-live="polite">
      <AnimatePresence>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Avatar name={item.nickname} size="xs" />
            <span>{item.nickname}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
