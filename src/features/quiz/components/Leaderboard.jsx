import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

const PODIUM_STYLES = [
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-slate-50 text-slate-600 border-slate-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

export default function Leaderboard({ entries, maxShow = 10 }) {
  const visible = entries.slice(0, maxShow);

  if (visible.length === 0) {
    return (
      <div className="text-center py-8 text-slate-300 text-sm">
        아직 점수가 없습니다
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-amber-500" />
        <h3 className="text-lg font-bold text-slate-900">리더보드</h3>
      </div>

      {visible.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          layout
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            i < 3 ? PODIUM_STYLES[i] : 'bg-white border-slate-100'
          }`}
        >
          <span className={`w-6 text-center font-bold text-sm ${i < 3 ? '' : 'text-slate-400'}`}>
            {i === 0 ? <Medal size={16} className="text-amber-500 mx-auto" /> : i + 1}
          </span>
          <Avatar name={entry.nickname} size="sm" />
          <span className="flex-1 font-medium text-sm truncate">{entry.nickname}</span>
          <span className="font-bold text-indigo-600">{entry.total}점</span>
          {entry.lastPoints > 0 && (
            <span className="text-xs text-emerald-500 font-medium">+{entry.lastPoints}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
