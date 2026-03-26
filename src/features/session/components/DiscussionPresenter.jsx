import { useState, useEffect } from 'react';
import { ref, set, onValue, remove, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import Button from '@/components/ui/Button';

const PRESETS = [
  { label: '1분', seconds: 60 },
  { label: '2분', seconds: 120 },
  { label: '3분', seconds: 180 },
  { label: '5분', seconds: 300 },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function DiscussionPresenter({ sessionId }) {
  const [discussion, setDiscussion] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [topic, setTopic] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(180);

  useEffect(() => {
    const discRef = ref(db, `sessions/${sessionId}/discussion`);
    const unsub = onValue(discRef, snap => setDiscussion(snap.val()), () => {});
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (!discussion?.endTime) { setRemaining(0); return; }
    function tick() {
      setRemaining(Math.max(0, Math.ceil((discussion.endTime - Date.now()) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [discussion?.endTime]);

  async function startDiscussion() {
    const endTime = Date.now() + selectedDuration * 1000;
    await set(ref(db, `sessions/${sessionId}/discussion`), {
      topic: topic.trim() || null,
      duration: selectedDuration,
      endTime,
      startedAt: serverTimestamp(),
    });
  }

  async function resetDiscussion() {
    await remove(ref(db, `sessions/${sessionId}/discussion`));
  }

  const isFinished = discussion?.endTime && remaining === 0;
  const memos = discussion?.memos ? Object.values(discussion.memos) : [];
  const progress = discussion?.duration > 0 ? remaining / discussion.duration : 0;
  const isUrgent = remaining <= 10 && remaining > 0;

  // Setup view
  if (!discussion?.endTime) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">그룹 토론</h3>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="토론 주제 (선택)"
          maxLength={100}
          className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3.5 text-[16px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-colors"
        />
        <div className="flex gap-3">
          {PRESETS.map(p => (
            <motion.button
              key={p.seconds}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelectedDuration(p.seconds)}
              className={`px-5 py-3 rounded-full font-bold text-base transition-colors duration-150 ${
                selectedDuration === p.seconds
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm'
              }`}
            >
              {p.label}
            </motion.button>
          ))}
        </div>
        <Button onClick={startDiscussion} variant="primary" size="lg" className="w-full">
          <Play size={18} /> 토론 시작
        </Button>
      </div>
    );
  }

  // Active / finished view
  const sortedMemos = [...memos].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
      {discussion.topic && (
        <p className="text-lg text-slate-500 dark:text-slate-400 text-center">{discussion.topic}</p>
      )}

      <motion.div
        animate={isUrgent ? { scale: [1, 1.03, 1] } : {}}
        transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}}
      >
        <p className={`text-7xl md:text-8xl font-bold tabular-nums tracking-tight ${
          isFinished ? 'text-slate-300 dark:text-slate-600' : isUrgent ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'
        }`}>{formatTime(remaining)}</p>
      </motion.div>

      <div className="w-full max-w-sm h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-indigo-500'}`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">토론 종료!</p>
          <p className="text-slate-400">{memos.length}개 메모 수집됨</p>
        </motion.div>
      )}

      {/* Collected memos */}
      {memos.length > 0 && isFinished && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
          {sortedMemos.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{m.text}</p>
              <p className="text-xs text-slate-400 mt-1">{m.nickname}</p>
            </motion.div>
          ))}
        </div>
      )}

      {isFinished && (
        <Button onClick={resetDiscussion} variant="secondary" size="md">새 토론</Button>
      )}
    </div>
  );
}
