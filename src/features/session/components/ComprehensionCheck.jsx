import { useState, useEffect, memo } from 'react';
import { ref, set, onValue, remove, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { hapticTap } from '@/lib/haptics';

const LEVELS = [
  { key: 'good', label: '이해됨', icon: Smile, color: 'bg-emerald-500', ring: 'ring-emerald-500/30', chartColor: '#10B981' },
  { key: 'okay', label: '보통', icon: Meh, color: 'bg-amber-500', ring: 'ring-amber-500/30', chartColor: '#F59E0B' },
  { key: 'confused', label: '모르겠음', icon: Frown, color: 'bg-red-500', ring: 'ring-red-500/30', chartColor: '#EF4444' },
];

/** Student voting UI */
function StudentComprehension({ sessionId }) {
  const [voted, setVoted] = useState(null);
  const pid = getParticipantId();

  async function handleVote(level) {
    hapticTap();
    setVoted(level);
    await set(ref(db, `sessions/${sessionId}/comprehension/${pid}`), {
      level,
      timestamp: serverTimestamp(),
    });
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <div className="space-y-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">이해도 체크</p>
          <p className="text-slate-400 text-[15px]">지금까지 내용이 이해되시나요?</p>
        </div>

        <div className="flex gap-4 justify-center">
          {LEVELS.map((level, i) => {
            const Icon = level.icon;
            const isSelected = voted === level.key;
            const hasVoted = voted !== null;
            return (
              <motion.button
                key={level.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: hasVoted && !isSelected ? 0.3 : 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleVote(level.key)}
                disabled={hasVoted}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-150 ${
                  isSelected
                    ? `${level.color} text-white ring-4 ${level.ring} shadow-lg`
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm'
                } ${hasVoted && !isSelected ? 'cursor-not-allowed' : ''}`}
              >
                <Icon size={36} strokeWidth={isSelected ? 2.5 : 1.8} />
                <span className="text-sm font-bold">{level.label}</span>
              </motion.button>
            );
          })}
        </div>

        {voted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm"
          >
            응답이 기록되었습니다
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

/** Donut chart for presenter/admin */
function DonutChart({ counts, total }) {
  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = LEVELS.map(level => {
    const count = counts[level.key] || 0;
    const pct = total > 0 ? count / total : 0;
    const dashLength = pct * circumference;
    const seg = { ...level, count, pct, dashLength, offset };
    offset += dashLength;
    return seg;
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-700" />
        {segments.map(seg => (
          <motion.circle
            key={seg.key}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={seg.chartColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={-seg.offset}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${seg.dashLength} ${circumference - seg.dashLength}` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={total}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight"
        >
          {total}
        </motion.span>
        <span className="text-xs text-slate-400">명 응답</span>
      </div>
    </div>
  );
}

/** Presenter view — donut chart + breakdown */
export function ComprehensionPresenter({ sessionId, onReset }) {
  const [responses, setResponses] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    const compRef = ref(db, `sessions/${sessionId}/comprehension`);
    const unsub = onValue(compRef, snap => setResponses(snap.val() || {}), () => {});
    return () => unsub();
  }, [sessionId]);

  const entries = Object.values(responses);
  const total = entries.length;
  const counts = { good: 0, okay: 0, confused: 0 };
  entries.forEach(e => { if (counts[e.level] !== undefined) counts[e.level]++; });

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">이해도 체크</h3>

      <DonutChart counts={counts} total={total} />

      {/* Breakdown */}
      <div className="flex gap-6">
        {LEVELS.map(level => {
          const count = counts[level.key] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <motion.div
              key={level.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-1"
            >
              <div className={`w-3 h-3 rounded-full mx-auto ${level.color}`} />
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{pct}%</p>
              <p className="text-xs text-slate-400">{level.label} ({count})</p>
            </motion.div>
          );
        })}
      </div>

      {onReset && total > 0 && (
        <Button onClick={async () => { await remove(ref(db, `sessions/${sessionId}/comprehension`)); onReset?.(); }} variant="secondary" size="sm">
          <RotateCcw size={14} /> 초기화
        </Button>
      )}
    </div>
  );
}

export default memo(StudentComprehension);
