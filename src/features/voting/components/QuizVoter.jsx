import { useState } from 'react';
import { motion } from 'framer-motion';
import { ref, set, serverTimestamp } from 'firebase/database';
import { Lock, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { getNickname, getParticipantId } from '@/lib/participant';
import { getQuizReward } from '@/lib/quiz';
import { useVotes } from '@/hooks/useVotes';
import VoteConfirm from './VoteConfirm';
import QuizResult from '@/features/quiz/components/QuizResult';

const OPTION_STYLES = [
  { bg: 'bg-indigo-50 hover:bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-600', letter: 'A' },
  { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600', letter: 'B' },
  { bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-600', letter: 'C' },
  { bg: 'bg-violet-50 hover:bg-violet-100', text: 'text-violet-700', badge: 'bg-violet-600', letter: 'D' },
  { bg: 'bg-pink-50 hover:bg-pink-100', text: 'text-pink-700', badge: 'bg-pink-600', letter: 'E' },
];

export default function QuizVoter({ sessionId, questionId, question }) {
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
    const reward = getQuizReward(question, currentVote);
    return (
      <QuizResult
        isCorrect={reward.isCorrect}
        points={reward.points}
        tickets={reward.tickets}
        correctAnswer={question.correctAnswer}
        event={question.event || null}
      />
    );
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
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 flex items-start gap-2">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <span>
          {question?.event
            ? '이번 퀴즈는 이벤트 라운드입니다. 보너스 점수와 티켓이 함께 적용됩니다.'
            : '정답자에게 점수와 이벤트 티켓이 지급됩니다. 빠르게 답할수록 점수가 더 높습니다.'}
        </span>
      </div>

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
                isSelected ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-transparent'
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
