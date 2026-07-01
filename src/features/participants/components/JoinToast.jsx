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

    const initTimer = setTimeout(() => { initial = false; }, 2000);
    return () => { unsub(); clearTimeout(initTimer); queueRef.current = []; };
    // drainQueue는 같은 컴포넌트 inline 함수 + ref-based이라 stale closure 영향 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="fixed top-20 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none" role="log" aria-label="참여자 알림" aria-live="polite">
      <AnimatePresence>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 44, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 44, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="flex items-center gap-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 pl-2 pr-4 py-2 rounded-full whitespace-nowrap"
          >
            <div className="relative shrink-0">
              <Avatar name={item.nickname} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.nickname}</span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">입장했어요</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
