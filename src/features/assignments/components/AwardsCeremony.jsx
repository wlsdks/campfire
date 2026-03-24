import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trophy } from 'lucide-react';
import { useAwards } from '@/features/assignments/api/useAwards';
import { useAssignment } from '@/features/assignments/api/useAssignments';
import { getAwardById } from '@/features/assignments/api/judges';
import AwardReveal from './AwardReveal';
import Button from '@/components/ui/Button';

// Ceremony order: special awards first, then rank awards (ascending drama)
const CEREMONY_ORDER = ['planning', 'creative', 'design', 'practical', 'outstanding', 'excellence', 'grand'];

/**
 * AwardsCeremony — 프레젠터/전자칠판용 시상식 연출 화면.
 * 강사가 "다음 발표" 버튼으로 순서대로 공개.
 */
export default function AwardsCeremony({ assignmentId, readOnly = false }) {
  const { assignment } = useAssignment(assignmentId);
  const { awards, loading } = useAwards(assignmentId);
  const [revealIndex, setRevealIndex] = useState(-1); // -1 = not started

  // Build ordered award list from available awards
  const orderedAwards = useMemo(() => {
    if (!awards) return [];
    return CEREMONY_ORDER
      .filter(id => awards[id])
      .map(id => ({ id, ...awards[id] }));
  }, [awards]);

  const isStarted = revealIndex >= 0;
  const isComplete = revealIndex >= orderedAwards.length - 1;
  const currentAward = isStarted ? orderedAwards[revealIndex] : null;

  function handleNext() {
    if (revealIndex < orderedAwards.length - 1) {
      setRevealIndex(prev => prev + 1);
    }
  }

  function handleReset() {
    setRevealIndex(-1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">불러오는 중...</p>
      </div>
    );
  }

  if (!awards || orderedAwards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Trophy size={32} className="text-slate-500" />
        <p className="text-slate-400 text-lg">시상 데이터가 없습니다</p>
        <p className="text-slate-500 text-sm">먼저 과제 심사를 완료해주세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-8" onClick={e => e.stopPropagation()}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <Trophy size={28} className="mx-auto text-white/60" />
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">시상식</h2>
        {assignment && (
          <p className="text-white/40 text-sm">{assignment.title}</p>
        )}
      </motion.div>

      {/* Current reveal */}
      <div className="min-h-[250px] flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {!isStarted ? (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <p className="text-white/50 text-lg">{orderedAwards.length}개 수상 발표 예정</p>
              {!readOnly && (
                <Button onClick={handleNext} size="lg" className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20">
                  시상 시작 <ChevronRight size={18} />
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`award-${revealIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AwardReveal
                awardId={currentAward.id}
                winner={currentAward}
                revealed={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {isStarted && !readOnly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          {!isComplete ? (
            <Button onClick={handleNext} size="lg" className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20">
              다음 발표 <ChevronRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleReset} size="lg" className="bg-white/10 text-white/60 hover:bg-white/20 border border-white/10">
              처음부터
            </Button>
          )}
        </motion.div>
      )}

      {/* Progress + revealed list */}
      {isStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full space-y-3"
        >
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {orderedAwards.map((a, i) => {
              return (
                <motion.div
                  key={a.id}
                  animate={{
                    scale: i === revealIndex ? 1.3 : 1,
                    opacity: i <= revealIndex ? 1 : 0.3,
                  }}
                  className={`w-2 h-2 rounded-full ${i <= revealIndex ? 'bg-white' : 'bg-white/20'}`}
                />
              );
            })}
          </div>

          {/* Previously announced */}
          {revealIndex > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {orderedAwards.slice(0, revealIndex).map((a) => {
                const info = getAwardById(a.id);
                return (
                  <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-white/50">
                    {info?.name}: <span className="text-white/80 font-medium">{a.name}</span>
                  </span>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
