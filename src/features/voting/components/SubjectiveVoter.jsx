import { useState, useEffect, memo } from 'react';
import { ref, onValue } from 'firebase/database';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { getParticipantId } from '@/lib/participant';
import TextInput from './TextInput';

// 하우스 스타일(AnswerRevealCard 준거): 긍정=emerald, 나머지=slate. 신호등 색상 미사용.
function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-slate-700 dark:text-slate-200';
}

function GradeCard({ grade }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full rounded-xl bg-white dark:bg-slate-800 px-5 py-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm font-medium text-slate-400">AI 채점 결과</p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="flex items-baseline gap-1"
        >
          <span className={`text-5xl font-bold tracking-tight ${scoreColor(grade.score)}`}>{grade.score}</span>
          <span className="text-xl font-semibold text-slate-300 dark:text-slate-600">/ 100</span>
        </motion.div>
        {grade.feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 px-4 py-3 text-center w-full"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{grade.feedback}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(function SubjectiveVoter({ sessionId, questionId, disabled }) {
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    if (!sessionId || !questionId) return;
    const pid = getParticipantId();
    const gradeRef = ref(db, `sessions/${sessionId}/questions/${questionId}/aiGrades/${pid}`);
    const unsub = onValue(gradeRef, (snap) => setGrade(snap.val()));
    return () => unsub();
  }, [sessionId, questionId]);

  if (grade && typeof grade.score === 'number') return <GradeCard grade={grade} />;

  return (
    <TextInput
      sessionId={sessionId}
      questionId={questionId}
      type="subjective"
      placeholder="답변을 자유롭게 작성해주세요"
      maxLength={500}
      multiline
      disabled={disabled}
    />
  );
});
