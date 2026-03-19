import { useState } from 'react';
import { motion } from 'framer-motion';
import { ref, set, serverTimestamp } from 'firebase/database';
import { Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { getNickname, getParticipantId } from '@/lib/participant';
import { useVotes } from '@/hooks/useVotes';
import VoteConfirm from './VoteConfirm';

const OPTION_STYLES = [
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-800', letter: 'A' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-700', letter: 'B' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-600', letter: 'C' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-500', letter: 'D' },
  { bg: 'bg-white hover:bg-slate-50', text: 'text-slate-800', badge: 'bg-slate-500', letter: 'E' },
];

/**
 * Quiz voting component. Handles vote submission only.
 * Quiz result display is handled by the parent route (VotePage).
 *
 * @param {Object} props
 * @param {string} props.sessionId
 * @param {string} props.questionId
 * @param {Object} props.question
 * @param {function} [props.renderResult] - Render function called with currentVote when quiz is revealed and user voted
 */
export default function QuizVoter({ sessionId, questionId, question, renderResult }) {
  const participantId = getParticipantId();
  const { votes } = useVotes(sessionId, questionId);
  const currentVote = votes[participantId] || null;
  const [selected, setSelected] = useState(null);

  async function handleVote(option) {
    setSelected(option);
    try {
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${participantId}`), {
        value: option,
        nickname: getNickname(),
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Quiz vote failed:', err);
      setSelected(null);
    }
  }

  if (question?.revealedAt && currentVote) {
    return typeof renderResult === 'function' ? renderResult(currentVote) : null;
  }

  if (currentVote) {
    return (
      <VoteConfirm
        submittedLabel="답안 제출 완료!"
        waitingLabel="정답 공개를 기다리는 중..."
        waitingDescription="강사가 정답과 순위를 공개하면 결과를 확인할 수 있습니다"
      />
    );
  }

  if (question?.revealedAt) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
          <Lock size={24} className="text-slate-400" />
        </div>
        <div className="space-y-1">
          <p className="text-slate-900 font-bold text-lg">정답이 공개되었습니다</p>
          <p className="text-slate-500 text-sm">이번 라운드 응답은 마감되었습니다</p>
          <p className="text-indigo-600 font-medium">정답: {question.correctAnswer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-xs text-slate-400 text-center">
        {question?.event
          ? '이벤트 라운드 — 보너스 점수와 티켓이 함께 적용됩니다'
          : '빠르게 답할수록 더 높은 점수를 받을 수 있습니다'}
      </p>

      <div className="space-y-2.5">
        {(question?.options || []).map((option, index) => {
          const style = OPTION_STYLES[index % OPTION_STYLES.length];
          const isSelected = selected === option;
          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleVote(option)}
              disabled={selected !== null}
              className={`w-full py-3.5 px-4 rounded-xl border font-medium text-base ${style.bg} ${style.text} ${
                isSelected ? 'ring-2 ring-slate-400 border-slate-300 bg-slate-50' : 'border-slate-200'
              } ${selected !== null && !isSelected ? 'opacity-40 cursor-not-allowed' : ''} transition-all flex items-center gap-3`}
            >
              <span className={`w-8 h-8 rounded-lg ${style.badge} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                {style.letter}
              </span>
              <span className="text-left leading-snug">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
