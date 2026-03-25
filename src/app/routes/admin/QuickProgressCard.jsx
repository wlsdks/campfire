import { useState } from 'react';
import { Play, Square, Zap, PartyPopper, Check, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QUIZ_EVENT_PRESETS, isQuizQuestion } from '@/lib/quiz';

function KeyHint({ keys, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
      <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 leading-none">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

export default function QuickProgressCard({
  questionList,
  activeIndex,
  currentEntry,
  nextEntry,
  onActivate,
  onClearActive,
  onReveal,
  onShowLeaderboard,
  onNextEvent,
  speedQuizActive,
  onStartSpeedQuiz,
  onEndSpeedQuiz,
  speedQuizCount,
}) {
  const [nextEvent, setNextEvent] = useState(null);

  function handleActivateNext() {
    if (!nextEntry) return;
    onActivate(nextEntry[0]);
    if (nextEvent) {
      onNextEvent?.(nextEvent);
      setNextEvent(null);
    }
  }

  const currentQ = currentEntry?.[1];
  const isActiveQuiz = currentQ ? isQuizQuestion(currentQ) : false;
  const quizRevealed = isActiveQuiz && currentQ?.revealedAt;
  const quizUnrevealed = isActiveQuiz && !currentQ?.revealedAt;

  /* Determine primary + secondary CTA based on session state */
  let primaryBtn, secondaryBtn;

  if (!currentEntry) {
    /* No active question */
    primaryBtn = (
      <Button onClick={handleActivateNext} variant="primary" size="md"
        disabled={!nextEntry || speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Play size={16} className="sm:w-3.5 sm:h-3.5" />
        {nextEvent && <PartyPopper size={16} className="sm:w-3.5 sm:h-3.5" />}
        첫 질문 시작
      </Button>
    );
    secondaryBtn = (
      <Button onClick={onClearActive} variant="secondary" size="md" disabled
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Square size={16} className="sm:w-3.5 sm:h-3.5" />
        대기 화면
      </Button>
    );
  } else if (quizUnrevealed) {
    /* Active quiz — waiting for reveal */
    primaryBtn = (
      <Button onClick={() => onReveal?.(currentEntry[0])} variant="primary" size="md"
        disabled={speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Check size={16} className="sm:w-3.5 sm:h-3.5" />
        정답 공개
      </Button>
    );
    secondaryBtn = (
      <Button onClick={onClearActive} variant="secondary" size="md" disabled={speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Square size={16} className="sm:w-3.5 sm:h-3.5" />
        대기 화면
      </Button>
    );
  } else if (quizRevealed) {
    /* Quiz revealed — show leaderboard or next */
    primaryBtn = (
      <Button onClick={onShowLeaderboard} variant="primary" size="md"
        disabled={speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Trophy size={16} className="sm:w-3.5 sm:h-3.5" />
        리더보드
      </Button>
    );
    secondaryBtn = (
      <Button onClick={handleActivateNext} variant="secondary" size="md"
        disabled={!nextEntry || speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Play size={16} className="sm:w-3.5 sm:h-3.5" />
        다음 질문
      </Button>
    );
  } else {
    /* Active non-quiz (poll, word cloud, etc.) */
    primaryBtn = (
      <Button onClick={handleActivateNext} variant="primary" size="md"
        disabled={!nextEntry || speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Play size={16} className="sm:w-3.5 sm:h-3.5" />
        다음 질문
        {nextEvent && <PartyPopper size={16} className="sm:w-3.5 sm:h-3.5" />}
      </Button>
    );
    secondaryBtn = (
      <Button onClick={onClearActive} variant="secondary" size="md" disabled={speedQuizActive}
        className="min-h-[52px] sm:min-h-0 sm:py-1.5 sm:text-sm sm:gap-1.5">
        <Square size={16} className="sm:w-3.5 sm:h-3.5" />
        대기 화면
      </Button>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
      <div className="space-y-1.5">
        <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold tracking-tight">빠른 진행</p>
        <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">
          {currentEntry
            ? `${activeIndex + 1}/${questionList.length}번째 질문 진행 중`
            : `질문 ${questionList.length}개 준비됨`}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
          {currentEntry
            ? currentEntry[1].title
            : '아직 활성화된 질문이 없습니다. 첫 질문을 바로 시작할 수 있습니다.'}
        </p>
        {currentQ?.type === 'quiz' && (
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            {quizRevealed
              ? '정답 공개가 완료되었습니다. 리더보드로 이어서 보여줄 수 있습니다.'
              : '정답 공개 전까지 답안을 모으는 중입니다.'}
          </p>
        )}
      </div>

      {/* Event toggle — shown when next question is quiz */}
      {nextEntry && isQuizQuestion(nextEntry[1]) && (
        <div className="flex flex-wrap gap-1.5">
          {QUIZ_EVENT_PRESETS.map((preset) => {
            const isSelected = nextEvent?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setNextEvent(isSelected ? null : preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 active:scale-[0.96] ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Speed Quiz toggle */}
      {speedQuizCount >= 2 && (
        <div>
          {speedQuizActive ? (
            <button
              onClick={onEndSpeedQuiz}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium transition-colors duration-150 active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Zap size={14} />
                스피드 퀴즈 진행 중
              </span>
              <span className="text-xs text-white/50 dark:text-slate-900/50">탭하여 중단</span>
            </button>
          ) : (
            <button
              onClick={onStartSpeedQuiz}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors duration-150 active:scale-[0.97]"
            >
              <span className="flex items-center gap-2">
                <Zap size={14} className="text-slate-500" />
                스피드 퀴즈
              </span>
              <span className="text-xs text-slate-400">{speedQuizCount}문제 · 10초씩</span>
            </button>
          )}
        </div>
      )}

      {/* Context-aware CTA buttons — taller touch targets on mobile */}
      <div className="grid grid-cols-2 gap-2">
        {primaryBtn}
        {secondaryBtn}
      </div>

      {nextEntry && currentEntry && !quizUnrevealed && !quizRevealed && (
        <p className="text-slate-400 text-xs">
          다음 예정: <span className="text-slate-600 dark:text-slate-300">{nextEntry[1].title}</span>
        </p>
      )}

      {/* Keyboard shortcut hints — hidden on mobile (no keyboard) */}
      <div className="flex flex-wrap gap-1.5 pt-1 max-sm:hidden">
        <KeyHint keys="← →" label="질문 이동" />
        <KeyHint keys="Space" label="다음" />
        <KeyHint keys="Esc" label="대기" />
        {currentQ?.type === 'quiz' && !currentQ.revealedAt && (
          <KeyHint keys="R" label="정답 공개" />
        )}
        {currentQ?.type === 'quiz' && currentQ.revealedAt && (
          <KeyHint keys="L" label="리더보드" />
        )}
      </div>
    </div>
  );
}
