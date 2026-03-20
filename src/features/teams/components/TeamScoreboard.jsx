import { memo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Trophy, Users, Crown } from 'lucide-react';

/** Animated counter for team scores. */
function AnimatedNumber({ value }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString());
  const displayRef = useRef(null);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = v;
    });
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded]);

  return <span ref={displayRef}>{value.toLocaleString()}</span>;
}

/** Score bar for a single team. */
function TeamBar({ team, rank, maxScore, isLeading }) {
  const widthPct = maxScore > 0 ? Math.max(8, (team.totalScore / maxScore) * 100) : 8;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLeading && rank === 0 && team.totalScore > 0 && (
            <Crown size={16} className="text-slate-600" />
          )}
          <span className={`text-sm font-bold ${isLeading && rank === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
            {team.name}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Users size={12} /> {team.memberCount}명
          </span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold tabular-nums ${isLeading && rank === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
            <AnimatedNumber value={team.totalScore} />
          </span>
          <span className="text-xs text-slate-400 ml-1">점</span>
        </div>
      </div>
      <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden">
        <motion.div
          className={`h-full rounded-lg ${team.colors.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: rank * 0.08 + 0.15 }}
        />
      </div>
      <p className="text-xs text-slate-400">
        평균 {team.avgScore}점/인
      </p>
    </motion.div>
  );
}

export default memo(function TeamScoreboard({ teamScores, title = '팀 대항전' }) {
  if (!teamScores || teamScores.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Trophy size={32} className="text-slate-200 mx-auto" />
        <p className="text-slate-400 text-sm">팀 점수가 없습니다</p>
      </div>
    );
  }

  const maxScore = Math.max(...teamScores.map((t) => t.totalScore), 1);
  const hasScores = teamScores.some((t) => t.totalScore > 0);

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex items-center gap-2"
        >
          <Trophy size={20} className="text-slate-500" />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </motion.div>
      )}

      <div className="space-y-5">
        {teamScores.map((team, idx) => (
          <TeamBar
            key={team.key}
            team={team}
            rank={idx}
            maxScore={maxScore}
            isLeading={hasScores && idx === 0}
          />
        ))}
      </div>

      {hasScores && teamScores.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-2"
        >
          <p className="text-sm text-slate-500">
            {teamScores[0].totalScore === teamScores[1].totalScore
              ? '동점! 치열한 접전 중'
              : `${teamScores[0].name} 팀이 ${(teamScores[0].totalScore - teamScores[1].totalScore).toLocaleString()}점 앞서고 있습니다`}
          </p>
        </motion.div>
      )}
    </div>
  );
});
