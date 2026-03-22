import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';
import { ref, set, serverTimestamp } from 'firebase/database';
import { Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { getNickname, getParticipantId } from '@/lib/participant';
import { useVotes } from '@/hooks/useVotes';
import VoteConfirm from './VoteConfirm';
import BetSelector from './BetSelector';
import ConfidenceMeter from './ConfidenceMeter';

const OPTION_STYLES = [
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-800', letter: 'A' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-700', letter: 'B' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-600', letter: 'C' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-500', letter: 'D' },
  { bg: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-500', letter: 'E' },
];

const BET_LABELS = { 1: '1x 안전', 2: '2x 자신', 3: '3x 올인' };

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
export default memo(function QuizVoter({ sessionId, questionId, question, renderResult, disabled = false }) {
  const participantId = getParticipantId();
  const { votes } = useVotes(sessionId, questionId);
  const currentVote = votes[participantId] || null;
  const [selected, setSelected] = useState(null);
  const [betMultiplier, setBetMultiplier] = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [showConfidence, setShowConfidence] = useState(false);

  const bettingEnabled = question?.betting === true;
  const needsBet = bettingEnabled && betMultiplier === null;

  async function submitVote(option, confidence) {
    setSelected(option);
    setShowConfidence(false);
    try {
      const voteData = {
        value: option,
        nickname: getNickname(),
        timestamp: serverTimestamp(),
      };
      if (bettingEnabled && betMultiplier) {
        voteData.bet = String(betMultiplier);
      }
      if (confidence) {
        voteData.confidence = confidence;
      }
      await set(ref(db, `sessions/${sessionId}/questions/${questionId}/votes/${participantId}`), voteData);
    } catch (err) {
      console.error('Quiz vote failed:', err);
      setSelected(null);
      setPendingAnswer(null);
    }
  }

  function handleVote(option) {
    if (disabled || selected !== null) return;
    // If user taps quickly while confidence is already showing, skip it
    if (showConfidence) {
      submitVote(option, null);
      return;
    }
    setPendingAnswer(option);
    setShowConfidence(true);
  }

  function handleConfidence(level) {
    if (pendingAnswer) {
      submitVote(pendingAnswer, level);
    }
  }

  if (question?.revealedAt && currentVote) {
    return typeof renderResult === 'function' ? renderResult(currentVote) : null;
  }

  if (currentVote) {
    const votedValue = currentVote.value;
    const optIdx = (question?.options || []).indexOf(votedValue);
    const ansLetter = optIdx >= 0 ? OPTION_STYLES[optIdx % OPTION_STYLES.length].letter : '';
    const betLabel = currentVote.bet ? BET_LABELS[parseInt(currentVote.bet, 10)] : null;
    return (
      <VoteConfirm
        submittedLabel="답안 제출 완료!"
        waitingLabel="정답 공개를 기다리는 중..."
        waitingDescription="강사가 정답과 순위를 공개하면 결과를 확인할 수 있습니다"
        selectedAnswer={ansLetter ? `${ansLetter}. ${votedValue}` : votedValue}
        selectedAnswerLabel={betLabel ? `내 답안 (${betLabel})` : '내 답안'}
      />
    );
  }

  if (question?.revealedAt) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 text-center space-y-3">
        <Lock size={32} className="text-slate-400 mx-auto" />
        <div className="space-y-1">
          <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">정답이 공개되었습니다</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">이번 라운드 응답은 마감되었습니다</p>
          <p className="text-slate-700 dark:text-slate-200 font-medium">정답: {question.correctAnswer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <AnimatePresence mode="wait">
        {needsBet ? (
          <BetSelector key="bet" onSelect={setBetMultiplier} />
        ) : (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-4"
          >
            <p className="text-xs text-slate-400 text-center">
              {bettingEnabled && betMultiplier
                ? `${betMultiplier}x 베팅 — ${betMultiplier > 1 ? '높은 위험, 높은 보상!' : '안전하게 참여'}`
                : question?.event
                  ? '이벤트 라운드 — 보너스 점수와 티켓이 함께 적용됩니다'
                  : '빠르게 답할수록 더 높은 점수를 받을 수 있습니다'}
            </p>

            <div className="space-y-2.5">
              {(question?.options || []).map((option, index) => {
                const style = OPTION_STYLES[index % OPTION_STYLES.length];
                const isSelected = selected === option || pendingAnswer === option;
                const isLocked = selected !== null || showConfidence;
                return (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: isLocked && !isSelected ? 0.4 : 1,
                      y: 0,
                      scale: isSelected ? 0.98 : 1,
                    }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { hapticTap(); handleVote(option); }}
                    disabled={isLocked || disabled}
                    className={`w-full py-3.5 px-4 rounded-xl border font-medium text-base ${style.bg} ${style.text} ${
                      isSelected ? 'ring-2 ring-slate-400 dark:ring-slate-500 border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-700'
                    } ${(isLocked && !isSelected) || disabled ? 'cursor-not-allowed' : ''} transition-colors duration-150 flex items-center gap-3`}
                  >
                    <span className={`w-8 h-8 rounded-lg ${style.badge} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                      {style.letter}
                    </span>
                    <span className="text-left leading-snug">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {showConfidence && (
                <ConfidenceMeter onConfirm={handleConfidence} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
})
